#!/usr/bin/env node

/**
 * Regression coverage for the growth media requested for the two static home
 * pages.  The test is intentionally driven through HTTP and reads the
 * source-side asset manifest instead of treating the attached screenshots as
 * executable instructions or as a source of truth for filenames.
 *
 * Contract exercised here:
 *   - overseas-ad-carousel: every manifest image is present in a 3-up carousel
 *   - seo-sem-card: the manifest search screenshot is present and decodes
 *   - social-content-seeding-card: every manifest image is present in a carousel
 *   - dots are clickable, keyboard-usable, and keep aria-selected in sync
 *   - reduced motion disables automatic rotation; normal motion rotates once
 *   - the cards and their media stay inside the viewport at representative CSS
 *     widths (including narrow/mobile widths)
 *
 * The product implementation is expected to mark these containers with
 * data-growth-card.  The value is classified from either the attribute or
 * the card copy so small naming differences between zh/en builds do not make
 * the test brittle.  This file is deliberately standalone and does not edit
 * product HTML, assets, package.json, or the other regression tests.
 */

const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

let chromium;
try {
  // Playwright is supplied by the bundled Codex runtime.  It is not a
  // production dependency of this static site.
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("无法加载 Playwright。请先设置 bundled NODE_PATH 后再运行此测试。");
  console.error(error && error.message ? error.message : error);
  process.exitCode = 2;
  return;
}

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_ROOT = path.join(PROJECT_ROOT, "dist");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "assets", "generated", "home-growth", "manifest.json");
const ARTIFACT_ROOT = path.join(PROJECT_ROOT, ".sites-artifacts", "growth-media");
const SERVER_SCRIPT = path.join(PROJECT_ROOT, "scripts", "serve-static-site.js");
const ASSET_URL_PREFIX = "/assets/generated/home-growth/";
const VIEWPORT_HEIGHT = Number(process.env.HOME_GROWTH_HEIGHT || 900);
const DEFAULT_WIDTHS = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920, 2560, 2880, 3840];
const ROUTES = [
  { id: "zh", path: "/", label: "中文首页" },
  { id: "en", path: "/en/", label: "English homepage" },
];

const GROUP_DEFINITIONS = [
  {
    key: "ads",
    usage: "overseas-ad-carousel",
    label: "海外广告轮播",
    carousel: true,
    aliases: ["ads", "ad", "advert", "advertising", "overseas-ad", "overseas-ads", "overseas-ad-carousel"],
  },
  {
    key: "seo",
    usage: "seo-sem-card",
    label: "SEO/SEM 搜索图",
    carousel: false,
    aliases: ["seo", "sem", "seo-sem", "seo-sem-card", "search", "search-card"],
  },
  {
    key: "social",
    usage: "social-content-seeding-card",
    label: "社媒内容种草轮播",
    carousel: true,
    aliases: ["social", "social-media", "social-content", "social-content-seeding", "social-content-seeding-card", "facebook"],
  },
];

const CONTROL_SELECTORS = [
  "[data-growth-dot]",
  "[data-growth-control]",
  "[data-growth-slide-to]",
  "[data-slide-to]",
  "[role=tab]",
  ".growth-dot",
  ".growth-carousel-dot",
  ".carousel-dot",
  ".growth-dots > *",
  ".carousel-dots > *",
  ".growth-pagination > *",
  ".carousel-pagination > *",
];

const SLIDE_SELECTORS = [
  "[data-growth-slide]",
  "[data-growth-pane]",
  "[data-slide]",
  "[data-slide-index]",
  "[role=tabpanel]",
  ".growth-slide",
  ".growth-carousel-slide",
  ".carousel-slide",
  ".growth-pane",
];

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

async function main() {
  assert(fs.existsSync(DIST_ROOT), `dist directory is missing: ${DIST_ROOT}`);
  const manifest = loadManifest();
  const groups = groupManifest(manifest);
  fs.mkdirSync(ARTIFACT_ROOT, { recursive: true });

  const widths = parseWidths(process.env.HOME_GROWTH_WIDTHS);
  const baseUrlOverride = process.env.HOME_GROWTH_BASE_URL || process.env.BASE_URL || process.env.SITE_URL;
  const server = baseUrlOverride
    ? { baseUrl: stripTrailingSlash(baseUrlOverride), child: null, owned: false }
    : await startRepositoryServer();

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: server.baseUrl,
    distRoot: DIST_ROOT,
    manifestPath: MANIFEST_PATH,
    assetUrlPrefix: ASSET_URL_PREFIX,
    viewportHeight: VIEWPORT_HEIGHT,
    widths,
    routes: ROUTES,
    manifestGroups: Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, {
      usage: value.definition.usage,
      files: value.files,
      count: value.files.length,
    }])),
    cases: [],
    motionCases: [],
    failures: [],
    screenshots: [],
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
    for (const route of ROUTES) {
      for (const width of widths) {
        await runViewportCase({ browser, route, width, groups, report });
      }
      // Motion timing is deliberately tested once per language at a stable
      // desktop viewport.  The viewport matrix above remains deterministic
      // under reduced motion and does not wait for a 4–6 second timer.
      await runMotionCase({ browser, route, groups, report, reduced: true });
      await runMotionCase({ browser, route, groups, report, reduced: false });
    }
  } finally {
    if (browser) await browser.close();
    if (server.child) await stopChild(server.child);
  }

  report.summary = summarize(report);
  const resultPath = path.join(ARTIFACT_ROOT, "results.json");
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Growth media regression: ${report.summary.passedCases}/${report.summary.totalCases} viewport cases passed`);
  console.log(`Motion cases: ${report.summary.passedMotionCases}/${report.summary.totalMotionCases} passed`);
  console.log(`Artifacts: ${resultPath}`);
  if (report.failures.length) {
    console.error(`FAIL ${report.failures.length} assertions; first failures:`);
    for (const failure of report.failures.slice(0, 20)) {
      const mode = failure.mode ? ` ${failure.mode}` : "";
      console.error(`- ${failure.route} ${failure.width || ""} ${failure.group || ""}${mode} [${failure.code}] ${failure.message}`);
    }
    if (report.failures.length > 20) console.error(`- ... ${report.failures.length - 20} more (see JSON)`);
    process.exitCode = 1;
  } else {
    console.log("PASS: growth media assets, carousel controls, motion preferences, and responsive card geometry");
  }
}

function loadManifest() {
  assert(fs.existsSync(MANIFEST_PATH), `growth media manifest is missing: ${MANIFEST_PATH}`);
  const value = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  assert(Array.isArray(value), "growth media manifest must be an array");
  for (const item of value) {
    assert(item && typeof item.filename === "string" && item.filename, "manifest item must have a filename");
    assert(typeof item.usage === "string" && item.usage, `manifest item ${item.filename} must have usage`);
    const assetPath = path.join(PROJECT_ROOT, "assets", "generated", "home-growth", item.filename);
    assert(fs.existsSync(assetPath), `manifest asset is missing: ${assetPath}`);
  }
  return value;
}

function groupManifest(manifest) {
  const groups = {};
  for (const definition of GROUP_DEFINITIONS) {
    const files = manifest.filter((item) => item.usage === definition.usage).map((item) => item.filename);
    assert(files.length > 0, `manifest has no ${definition.usage} assets`);
    groups[definition.key] = { definition, files };
  }
  return groups;
}

async function runViewportCase({ browser, route, width, groups, report }) {
  const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(6000);
  await configurePage(page, report.baseUrl);
  await page.emulateMedia({ reducedMotion: "reduce" });

  const result = {
    route: route.id,
    routePath: route.path,
    width,
    dpr: 1,
    mode: "reduced-motion-matrix",
    url: joinUrl(report.baseUrl, route.path),
    status: "passed",
    cards: {},
    pageErrors: [],
  };
  report.cases.push(result);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error && error.message ? error.message : error)));

  try {
    const response = await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || !response.ok()) {
      fail(report, result, "http-status", `${route.path} returned ${response ? response.status() : "no response"}`);
      return;
    }
    await page.waitForTimeout(180);
    for (const group of Object.values(groups)) {
      const card = await findGrowthCard(page, group.definition, group.files);
      if (!card) {
        fail(report, result, "missing-growth-card", `cannot find ${group.definition.label} [data-growth-card]`, undefined, group.definition.key);
        continue;
      }
      const cardResult = await inspectGrowthCard({ page, card, group, width, report, result });
      result.cards[group.definition.key] = cardResult;
    }
  } catch (error) {
    fail(report, result, "case-error", error && error.message ? error.message : String(error));
  } finally {
    result.pageErrors = pageErrors;
    for (const message of pageErrors) fail(report, result, "page-error", message);
    await page.close();
  }
}

async function inspectGrowthCard({ page, card, group, width, report, result }) {
  const cardResult = {
    usage: group.definition.usage,
    expectedFiles: group.files,
    matchedFiles: [],
    resourceChecks: [],
    decoded: [],
    geometry: null,
    carousel: null,
  };

  await card.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(100);

  const info = await readCardInfo(card);
  cardResult.geometry = info.geometry;
  cardResult.media = info.media;
  if (!info.geometry || info.geometry.width <= 0 || info.geometry.height <= 0) {
    fail(report, result, "growth-card-hidden", `${group.definition.label} card has no visible geometry`, { geometry: info.geometry }, group.definition.key);
  }

  const matched = [];
  for (const filename of group.files) {
    const images = info.media.filter((item) => item.tag === "IMG" && item.src.includes(filename));
    if (!images.length) {
      fail(report, result, "missing-manifest-media", `${group.definition.label} does not contain ${filename}`, { media: info.media }, group.definition.key);
    } else {
      matched.push(filename);
      if (images.every((image) => image.naturalWidth <= 0)) {
        // Carousel images may be lazy until their dot is activated.  The
        // carousel pass below gets each slide into the active state; static
        // cards must already have a decoded image here.
        if (!group.definition.carousel) {
          fail(report, result, "image-not-decoded", `${filename} has no decoded DOM image (naturalWidth=0)`, { images }, group.definition.key);
        }
      }
    }
  }
  cardResult.matchedFiles = matched;
  if (width <= 390 && info.visibleMediaCount < 1) {
    fail(report, result, "mobile-media-hidden", `${group.definition.label} has no visible media at ${width}px`, { media: info.media }, group.definition.key);
  }

  checkCardGeometry({ info, width, report, result, groupKey: group.definition.key, label: group.definition.label });

  const urls = group.files.map((filename) => new URL(`${ASSET_URL_PREFIX}${encodeURIComponent(filename)}`, report.baseUrl).toString());
  const resources = await verifyResources(page, urls);
  cardResult.resourceChecks = resources.http;
  cardResult.decoded = resources.decoded;
  for (const item of resources.http) {
    if (!item.ok || item.status !== 200) {
      fail(report, result, "asset-http-status", `${item.url} returned HTTP ${item.status}`, item, group.definition.key);
    }
  }
  for (const item of resources.decoded) {
    if (!item.ok || item.naturalWidth <= 0 || item.naturalHeight <= 0) {
      fail(report, result, "asset-decode", `${item.url} did not decode to a non-zero image`, item, group.definition.key);
    }
  }

  if (group.definition.carousel) {
    cardResult.carousel = await inspectCarousel({ page, card, group, report, result });
  }
  return cardResult;
}

async function inspectCarousel({ page, card, group, report, result }) {
  const expectedCount = group.files.length;
  const carousel = {
    expectedSlides: expectedCount,
    controls: 0,
    uniqueControlIndices: [],
    clicks: 0,
    keyboard: null,
    selectedHistory: [],
    failures: [],
  };
  const initial = await readCarouselState(card);
  carousel.controls = initial.controls.length;
  const uniqueIndices = [...new Set(initial.controls.map((item, index) => item.index == null ? index : item.index))];
  carousel.uniqueControlIndices = uniqueIndices;
  if (uniqueIndices.length < expectedCount) {
    const message = `${group.definition.label} exposes ${uniqueIndices.length} unique carousel controls; expected at least ${expectedCount}`;
    carousel.failures.push(message);
    fail(report, result, "carousel-control-count", message, { controls: initial.controls }, group.definition.key);
    return carousel;
  }
  for (const control of initial.controls) {
    if (!control.hasAriaSelected) {
      const message = "carousel control is missing aria-selected";
      carousel.failures.push(message);
      fail(report, result, "carousel-aria-selected-missing", `${group.definition.label} ${message}`, { control }, group.definition.key);
      break;
    }
  }

  // Click every logical slide.  The first click also normalizes the starting
  // state after page load; subsequent clicks must switch the corresponding
  // selected control and active slide.
  for (let index = 0; index < expectedCount; index += 1) {
    const controls = card.locator(controlSelectorExpression());
    const count = await controls.count();
    if (index >= count) break;
    const before = await readCarouselState(card);
    try {
      await controls.nth(index).scrollIntoViewIfNeeded().catch(() => {});
      await controls.nth(index).click({ timeout: 5000 });
      await page.waitForTimeout(160);
      const after = await readCarouselState(card);
      const selectedAt = after.controls.findIndex((item) => item.ariaSelected === true);
      const switched = before.activeIdentity !== after.activeIdentity || before.activeIndices.join(",") !== after.activeIndices.join(",");
      carousel.selectedHistory.push({ index, selectedAt, before, after, switched });
      if (selectedAt !== index) {
        const message = `clicking carousel control ${index} selected ${selectedAt}`;
        carousel.failures.push(message);
        fail(report, result, "carousel-aria-sync", `${group.definition.label} ${message}`, { index, after }, group.definition.key);
      }
      if (index > 0 && !switched && !after.activeIndices.includes(index)) {
        const message = `clicking carousel control ${index} did not switch the active slide`;
        carousel.failures.push(message);
        fail(report, result, "carousel-slide-switch", `${group.definition.label} ${message}`, { index, before, after }, group.definition.key);
      }
      const activeImages = after.visibleImages.filter((item) => item.naturalWidth > 0);
      if (!activeImages.length) {
        const message = `carousel slide ${index} has no decoded visible image`;
        carousel.failures.push(message);
        fail(report, result, "carousel-image-decode", `${group.definition.label} ${message}`, { after }, group.definition.key);
      }
      carousel.clicks += 1;
    } catch (error) {
      const message = `carousel control ${index} click failed: ${error && error.message ? error.message : String(error)}`;
      carousel.failures.push(message);
      fail(report, result, "carousel-click", `${group.definition.label} ${message}`, undefined, group.definition.key);
    }
  }

  // Native buttons should activate from the keyboard; the fallback Space key
  // also covers custom button-like controls with a keydown handler.
  const controls = card.locator(controlSelectorExpression());
  if (await controls.count() > 1) {
    const target = controls.nth(1);
    const keyboardBefore = await readCarouselState(card);
    let keyboardMode = "Enter";
    try {
      await target.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(140);
      let keyboardAfter = await readCarouselState(card);
      let selectedAt = keyboardAfter.controls.findIndex((item) => item.ariaSelected === true);
      if (selectedAt !== 1) {
        keyboardMode = "Space";
        await target.focus();
        await page.keyboard.press("Space");
        await page.waitForTimeout(140);
        keyboardAfter = await readCarouselState(card);
        selectedAt = keyboardAfter.controls.findIndex((item) => item.ariaSelected === true);
      }
      carousel.keyboard = { mode: keyboardMode, selectedAt, before: keyboardBefore, after: keyboardAfter };
      if (selectedAt !== 1) {
        const message = `keyboard ${keyboardMode} did not select carousel control 1`;
        carousel.failures.push(message);
        fail(report, result, "carousel-keyboard", `${group.definition.label} ${message}`, carousel.keyboard, group.definition.key);
      }
    } catch (error) {
      const message = `keyboard carousel operation failed: ${error && error.message ? error.message : String(error)}`;
      carousel.failures.push(message);
      fail(report, result, "carousel-keyboard", `${group.definition.label} ${message}`, undefined, group.definition.key);
    }
  } else {
    const message = "carousel has no second control for keyboard testing";
    carousel.failures.push(message);
    fail(report, result, "carousel-keyboard", `${group.definition.label} ${message}`, undefined, group.definition.key);
  }
  return carousel;
}

async function runMotionCase({ browser, route, groups, report, reduced }) {
  const width = 1440;
  const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(6000);
  await configurePage(page, report.baseUrl);
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  const result = {
    route: route.id,
    routePath: route.path,
    width,
    dpr: 1,
    mode: reduced ? "reduced-motion" : "normal-motion",
    url: joinUrl(report.baseUrl, route.path),
    status: "passed",
    cards: {},
    pageErrors: [],
  };
  report.motionCases.push(result);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error && error.message ? error.message : error)));

  try {
    const response = await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || !response.ok()) {
      fail(report, result, "http-status", `${route.path} returned ${response ? response.status() : "no response"}`);
      return;
    }
    await page.waitForTimeout(180);
    for (const group of Object.values(groups).filter((item) => item.definition.carousel)) {
      const card = await findGrowthCard(page, group.definition, group.files);
      if (!card) {
        fail(report, result, "missing-growth-card", `cannot find ${group.definition.label} for ${result.mode}`, undefined, group.definition.key);
        continue;
      }
      await card.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(140);
      const stateBefore = await readCarouselState(card);
      const controls = card.locator(controlSelectorExpression());
      if (!(await controls.count())) {
        fail(report, result, "motion-controls-missing", `${group.definition.label} has no carousel controls`, undefined, group.definition.key);
        continue;
      }
      // Do not click a dot before timing assertions: some implementations
      // intentionally restart or pause their timer on manual interaction.
      // The observable state immediately after the card enters the viewport
      // is the authoritative starting point for both preferences.
      const timing = await readCardTiming(card);
      const intervalMs = readRotationInterval({ ...stateBefore, ...timing }, group.definition.key);
      const waitMs = Math.min(7000, Math.max(1100, intervalMs + 700));
      const before = stateBefore;
      await page.waitForTimeout(waitMs);
      const after = await readCarouselState(card);
      const changed = before.activeIdentity !== after.activeIdentity || before.activeIndices.join(",") !== after.activeIndices.join(",") || before.controls.map((item) => item.ariaSelected).join(",") !== after.controls.map((item) => item.ariaSelected).join(",");
      result.cards[group.definition.key] = {
        intervalMs,
        waitMs,
        initialPageState: stateBefore,
        before,
        after,
        changed,
      };
      if (reduced && changed) {
        fail(report, result, "reduced-motion-autoplay", `${group.definition.label} rotated while prefers-reduced-motion was enabled`, { before, after, waitMs }, group.definition.key);
      }
      if (!reduced && !changed) {
        fail(report, result, "normal-motion-no-autoplay", `${group.definition.label} did not rotate after ${waitMs}ms`, { before, after, waitMs }, group.definition.key);
      }
    }
  } catch (error) {
    fail(report, result, "motion-case-error", error && error.message ? error.message : String(error));
  } finally {
    result.pageErrors = pageErrors;
    for (const message of pageErrors) fail(report, result, "page-error", message);
    await page.close();
  }
}

async function configurePage(page, baseUrl) {
  const baseOrigin = new URL(baseUrl).origin;
  await page.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    try {
      const parsed = new URL(requestUrl);
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin !== baseOrigin) {
        await route.abort();
      } else {
        await route.continue();
      }
    } catch {
      await route.continue();
    }
  });
}

async function findGrowthCard(page, definition, expectedFiles) {
  const candidates = page.locator("[data-growth-card]");
  const count = await candidates.count();
  let best = null;
  let bestScore = -1;
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const metadata = await candidate.evaluate((element) => ({
      value: element.getAttribute("data-growth-card") || "",
      usage: element.getAttribute("data-growth-usage") || "",
      kind: element.getAttribute("data-growth-kind") || "",
      text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 900),
      sources: [...element.querySelectorAll("img")].map((image) => image.currentSrc || image.src || image.dataset.src || image.getAttribute("data-src") || ""),
      visible: (() => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0;
      })(),
    }));
    if (!matchesDefinition(metadata, definition)) continue;
    const score = expectedFiles.filter((filename) => metadata.sources.some((source) => source.includes(filename))).length * 10 + metadata.sources.length + (metadata.visible ? 100 : 0);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function matchesDefinition(metadata, definition) {
  const text = normalizeKey(`${metadata.value} ${metadata.usage} ${metadata.kind} ${metadata.text}`);
  if (definition.key === "ads") return /(overseas|advert|ads?|投放|广告|获客)/.test(text);
  if (definition.key === "seo") return /(seo|sem|search|搜索|截流)/.test(text);
  if (definition.key === "social") return /(social|facebook|instagram|tiktok|content|seeding|社媒|种草|短视频)/.test(text);
  return false;
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[_/]+/g, "-").replace(/\s+/g, "-");
}

async function readCardInfo(card) {
  return card.evaluate((element) => {
    const round = (value) => Number(Number(value).toFixed(3));
    const rectInfo = (node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        x: round(rect.x),
        y: round(rect.y),
        width: round(rect.width),
        height: round(rect.height),
        right: round(rect.right),
        bottom: round(rect.bottom),
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity),
        overflow: style.overflow,
      };
    };
    const visible = (node, rect) => {
      const style = getComputedStyle(node);
      return Boolean(rect && rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0);
    };
    const cardRect = element.getBoundingClientRect();
    const cardStyle = getComputedStyle(element);
    const media = [...element.querySelectorAll("img, video")].map((node, index) => {
      const rect = node.getBoundingClientRect();
      const src = node.currentSrc || node.src || node.dataset.src || node.getAttribute("data-src") || node.getAttribute("poster") || "";
      return {
        index,
        tag: node.tagName,
        src,
        alt: node.getAttribute("alt") || "",
        box: rectInfo(node),
        visible: visible(node, rect),
        complete: node.tagName === "IMG" ? Boolean(node.complete) : true,
        naturalWidth: node.tagName === "IMG" ? node.naturalWidth : node.videoWidth || 0,
        naturalHeight: node.tagName === "IMG" ? node.naturalHeight : node.videoHeight || 0,
      };
    });
    return {
      geometry: rectInfo(element),
      media,
      visibleMediaCount: media.filter((item) => item.visible).length,
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
      cardRect: { x: round(cardRect.x), right: round(cardRect.right) },
      clipsMedia: ["hidden", "clip"].includes(cardStyle.overflowX) && ["hidden", "clip"].includes(cardStyle.overflowY),
    };
  });
}

function checkCardGeometry({ info, width, report, result, groupKey, label }) {
  if (!info || !info.geometry) return;
  const viewportOverflow = Math.max(0, info.viewport.scrollWidth - info.viewport.width);
  if (viewportOverflow > 1.5) {
    fail(report, result, "growth-horizontal-overflow", `${label} causes ${round(viewportOverflow)}px document overflow at ${width}px`, { viewport: info.viewport }, groupKey);
  }
  const card = info.geometry;
  const cardWidthShare = card.width / info.viewport.width;
  if (width <= 860 && cardWidthShare < 0.62) {
    fail(report, result, "growth-card-too-small", `${label} uses only ${round(cardWidthShare * 100)}% of the viewport at ${width}px`, {
      card,
      viewport: info.viewport,
      cardWidthShare: round(cardWidthShare),
    }, groupKey);
  }
  if (width >= 1600 && cardWidthShare < 0.24) {
    fail(report, result, "growth-card-too-small", `${label} stays visually undersized at ${width}px`, {
      card,
      viewport: info.viewport,
      cardWidthShare: round(cardWidthShare),
    }, groupKey);
  }
  for (const media of info.media.filter((item) => item.visible && item.box)) {
    const outsideCard = Math.max(0, card.x - media.box.x, media.box.right - card.right);
    // The incumbent card design deliberately lets the tilted media plane extend
    // beyond the card, then clips it with overflow:hidden. Test the painted area,
    // not the pre-clip transform bounds, so that restoring that shape is safe.
    const paintedLeft = info.clipsMedia ? Math.max(media.box.x, card.x) : media.box.x;
    const paintedRight = info.clipsMedia ? Math.min(media.box.right, card.right) : media.box.right;
    const paintedWidth = Math.max(0, paintedRight - paintedLeft);
    const mediaWidthShare = paintedWidth / card.width;
    const outsideViewport = Math.max(0, -paintedLeft, paintedRight - info.viewport.width);
    const unsafeCardOverflow = !info.clipsMedia && outsideCard > 1.5;
    if (unsafeCardOverflow || outsideViewport > 1.5) {
      fail(report, result, "growth-media-overflow", `${label} media ${media.index} escapes its card or viewport at ${width}px`, {
        media,
        card,
        viewport: info.viewport,
        outsideCard: round(outsideCard),
        outsideViewport: round(outsideViewport),
      }, groupKey);
    }
    if (mediaWidthShare < 0.46) {
      fail(report, result, "growth-media-too-small", `${label} media becomes a thumbnail at ${width}px`, {
        media,
        card,
        paintedWidth: round(paintedWidth),
        mediaWidthShare: round(mediaWidthShare),
      }, groupKey);
    }
  }
}

function controlSelectorExpression() {
  return CONTROL_SELECTORS.join(",");
}

async function readCarouselState(card) {
  return card.evaluate((element, selectors) => {
    const uniqueNodes = (selectorList) => {
      const seen = new Set();
      const result = [];
      for (const selector of selectorList) {
        for (const node of element.querySelectorAll(selector)) {
          if (seen.has(node)) continue;
          seen.add(node);
          result.push(node);
        }
      }
      return result;
    };
    const isVisible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0;
    };
    const getIndex = (node, fallback) => {
      const values = [
        node.getAttribute("data-index"),
        node.getAttribute("data-slide"),
        node.getAttribute("data-slide-index"),
        node.getAttribute("data-growth-index"),
        node.getAttribute("data-growth-slide"),
        node.getAttribute("data-growth-slide-to"),
        node.getAttribute("data-slide-to"),
      ];
      for (const value of values) {
        if (value == null || value === "") continue;
        const match = String(value).match(/\d+/);
        if (match) return Number(match[0]);
      }
      return fallback;
    };
    const controlSelectors = selectors.controls;
    const slideSelectors = selectors.slides;
    const allControls = uniqueNodes(controlSelectors).filter((node) => {
      const role = node.getAttribute("role");
      const tag = node.tagName;
      const cls = typeof node.className === "string" ? node.className : "";
      return tag === "BUTTON" || role === "tab" || role === "button" || node.hasAttribute("data-growth-dot") || node.hasAttribute("data-growth-control") || node.hasAttribute("data-growth-slide-to") || node.hasAttribute("data-slide-to") || /dot|pagination|indicator/i.test(cls);
    });
    // A few implementations use a bare button list without a dot class.  It
    // is safe to use this fallback only when the card has no semantic control
    // candidates, avoiding CTA buttons being mistaken for pagination.
    const controls = allControls.length ? allControls : [...element.querySelectorAll("button")].filter((node) => !node.closest("a"));
    const slides = uniqueNodes(slideSelectors);
    const controlStates = controls.map((node, index) => {
      const aria = node.getAttribute("aria-selected");
      const cls = typeof node.className === "string" ? node.className : "";
      return {
        index: getIndex(node, index),
        ariaSelected: aria === "true",
        hasAriaSelected: aria != null,
        active: /\b(active|selected|current|is-active)\b/i.test(cls) || aria === "true",
        text: (node.textContent || "").replace(/\s+/g, " ").trim(),
      };
    });
    const slideStates = slides.map((node, index) => {
      const ariaHidden = node.getAttribute("aria-hidden");
      const cls = typeof node.className === "string" ? node.className : "";
      const images = [...node.querySelectorAll("img")].map((image) => image.currentSrc || image.src || image.dataset.src || image.getAttribute("data-src") || "");
      return {
        index: getIndex(node, index),
        visible: isVisible(node),
        active: /\b(active|selected|current|is-active)\b/i.test(cls) || ariaHidden === "false",
        ariaHidden,
        images,
      };
    });
    const allImages = [...element.querySelectorAll("img")].map((image, index) => {
      const src = image.currentSrc || image.src || image.dataset.src || image.getAttribute("data-src") || "";
      return {
        index,
        src,
        visible: isVisible(image),
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    });
    const selectedPositions = controlStates.map((item, index) => item.ariaSelected ? index : -1).filter((index) => index >= 0);
    const activeIndices = slideStates.filter((item) => item.active).map((item) => item.index);
    const activeIdentity = JSON.stringify({
      selectedPositions,
      activeSlides: slideStates.filter((item) => item.active || (item.visible && slideStates.length > 1 && !slideStates.some((candidate) => candidate.active))).map((item) => ({ index: item.index, images: item.images })),
      visibleImages: allImages.filter((item) => item.visible).map((item) => item.src),
    });
    return {
      controls: controlStates,
      slides: slideStates,
      selectedPositions,
      activeIndices,
      activeIdentity,
      visibleImages: allImages.filter((item) => item.visible),
    };
  }, { controls: CONTROL_SELECTORS, slides: SLIDE_SELECTORS });
}

function readRotationInterval(state, groupKey) {
  // The runtime exposes the interval on the card or slides when available;
  // this value is only used to bound the wait, never to decide pass/fail.
  const values = [];
  const sources = [state.cardInterval, state.interval, state.duration, state.slides && state.slides[0] && state.slides[0].duration, ...(state.timingIntervals || [])];
  for (const value of sources) {
    const number = Number.parseFloat(String(value || ""));
    if (Number.isFinite(number) && number > 0) values.push(number);
  }
  // Current implementations commonly use a 4–6 second timer.  Keep the
  // maximum below ten seconds as requested by the task.
  return Math.min(6000, Math.max(700, values[0] || (groupKey === "social" ? 5000 : 4500)));
}

async function readCardTiming(card) {
  return card.evaluate((element) => {
    const values = [
      element.getAttribute("data-interval"),
      element.getAttribute("data-rotation-interval"),
      element.getAttribute("data-autoplay-interval"),
      element.dataset.interval,
      element.dataset.rotationInterval,
      element.dataset.autoplayInterval,
      ...[...element.querySelectorAll("[data-duration], [data-interval], [data-rotation-interval]")].map((node) =>
        node.getAttribute("data-duration") || node.getAttribute("data-interval") || node.getAttribute("data-rotation-interval")),
    ].map((value) => Number.parseFloat(String(value || ""))).filter((value) => Number.isFinite(value) && value > 0);
    return { timingIntervals: values };
  });
}

async function verifyResources(page, urls) {
  return page.evaluate(async (assetUrls) => {
    const http = [];
    const decoded = [];
    for (const url of assetUrls) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        http.push({ url, status: response.status, ok: response.ok });
      } catch (error) {
        http.push({ url, status: 0, ok: false, error: String(error && error.message ? error.message : error) });
      }
    }
    for (const url of assetUrls) {
      const result = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ url, ok: true, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
        image.onerror = () => resolve({ url, ok: false, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
        image.src = url;
      });
      decoded.push(result);
    }
    return { http, decoded };
  }, urls);
}

function fail(report, result, code, message, details = undefined, group = undefined) {
  result.status = "failed";
  const failure = {
    route: result.route,
    routePath: result.routePath,
    width: result.width,
    dpr: result.dpr,
    mode: result.mode,
    group,
    code,
    message,
  };
  if (details !== undefined) failure.details = details;
  report.failures.push(failure);
}

function summarize(report) {
  const byCode = {};
  for (const failure of report.failures) byCode[failure.code] = (byCode[failure.code] || 0) + 1;
  return {
    totalCases: report.cases.length,
    passedCases: report.cases.filter((item) => item.status === "passed").length,
    failedCases: report.cases.filter((item) => item.status !== "passed").length,
    totalMotionCases: report.motionCases.length,
    passedMotionCases: report.motionCases.filter((item) => item.status === "passed").length,
    failedMotionCases: report.motionCases.filter((item) => item.status !== "passed").length,
    failures: report.failures.length,
    failuresByCode: byCode,
  };
}

function parseWidths(value) {
  if (!value) return DEFAULT_WIDTHS;
  const widths = String(value).split(",").map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
  if (!widths.length) throw new Error("HOME_GROWTH_WIDTHS must contain comma-separated positive integers");
  return [...new Set(widths)];
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

function joinUrl(base, route) {
  return new URL(route.replace(/^\//, ""), `${stripTrailingSlash(base)}/`).toString();
}

function round(value) {
  return Number(Number(value).toFixed(3));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function startRepositoryServer() {
  const port = await getFreePort();
  const child = spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/`, child);
  } catch (error) {
    await stopChild(child);
    throw error;
  }
  return { baseUrl, child, owned: true };
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const address = socket.address();
      const port = typeof address === "object" && address ? address.port : null;
      socket.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function waitForHttp(url, child) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    let finished = false;
    const onExit = (code, signal) => {
      if (!finished) {
        finished = true;
        reject(new Error(`static server exited before becoming ready (code=${code}, signal=${signal || ""})`));
      }
    };
    child.once("exit", onExit);
    const poll = () => {
      if (finished) return;
      attempts += 1;
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          finished = true;
          child.removeListener("exit", onExit);
          resolve();
        } else retry();
      });
      request.on("error", retry);
      request.setTimeout(500, () => request.destroy());
    };
    const retry = () => {
      if (finished) return;
      if (attempts >= 80) {
        finished = true;
        child.removeListener("exit", onExit);
        reject(new Error(`timed out waiting for static server at ${url}`));
        return;
      }
      setTimeout(poll, 50);
    };
    poll();
  });
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    const timer = setTimeout(resolve, 1500);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill();
  });
}
