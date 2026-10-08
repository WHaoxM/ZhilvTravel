#!/usr/bin/env node

/**
 * Browser regression coverage for the two static homepages.
 *
 * This deliberately drives the files in dist through HTTP instead of using
 * file://.  That keeps relative URLs, lazy media, and the same-origin code
 * path close to what the hosted site uses.  The test starts the repository's
 * static server when HOME_RESPONSIVE_BASE_URL (or BASE_URL) is not supplied.
 *
 * Viewport width is a CSS viewport width.  deviceScaleFactor only exercises
 * device-pixel-ratio rendering; it is not browser zoom.  If a zoom-like case
 * is needed, pass an explicitly larger CSS viewport through
 * HOME_RESPONSIVE_WIDTHS (for example, 2880), rather than labelling a DPR or
 * a CSS transform as browser zoom.
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const net = require("node:net");

let chromium;
try {
  // Playwright is provided by the bundled NODE_PATH in the Codex runtime.
  // It is intentionally not added to package.json as a production dependency.
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("无法加载 Playwright。请先设置 bundled NODE_PATH 后再运行此测试。");
  console.error(error && error.message ? error.message : error);
  process.exitCode = 2;
  return;
}

const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_ROOT = path.join(PROJECT_ROOT, "dist");
const ARTIFACT_ROOT = path.join(PROJECT_ROOT, ".sites-artifacts", "zoom-regression");
const SERVER_SCRIPT = path.join(PROJECT_ROOT, "scripts", "serve-static-site.js");

const DEFAULT_WIDTHS = [320, 390, 768, 860, 861, 1024, 1440, 1519, 1520, 1920, 2880, 5760];
// Large DPR=2 surfaces can be expensive in headless Chromium.  This still
// covers both DPRs at small, medium, and wide CSS viewports.
const DEFAULT_DPRS = new Map([
  [320, [1, 2]],
  [390, [1, 2]],
  [768, [1, 2]],
  [860, [1]],
  [861, [1]],
  [1024, [1]],
  [1440, [1, 2]],
  [1519, [1]],
  [1520, [1]],
  [1920, [1]],
  [2880, [1, 2]],
  [5760, [1]],
]);

// The known reference capture is 1440x764.  Keeping a fixed CSS height makes
// the layout comparison independent of the host monitor's physical size.
const VIEWPORT_HEIGHT = Number(process.env.HOME_RESPONSIVE_HEIGHT || 764);
const ROUTES = [
  { id: "zh", path: "/", label: "中文首页" },
  { id: "en", path: "/en/", label: "English homepage" },
];

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

async function main() {
  assert(fs.existsSync(DIST_ROOT), `dist directory is missing: ${DIST_ROOT}`);
  fs.mkdirSync(ARTIFACT_ROOT, { recursive: true });

  const widths = parseWidths(process.env.HOME_RESPONSIVE_WIDTHS);
  const matrix = widths.flatMap((width) => {
    const dprs = DEFAULT_DPRS.get(width) || [1];
    return dprs.map((dpr) => ({ width, dpr }));
  });
  const baseUrlOverride = process.env.HOME_RESPONSIVE_BASE_URL || process.env.BASE_URL || process.env.SITE_URL;
  const server = baseUrlOverride
    ? { baseUrl: stripTrailingSlash(baseUrlOverride), child: null, owned: false }
    : await startRepositoryServer();

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseUrl: server.baseUrl,
    distRoot: DIST_ROOT,
    viewportHeight: VIEWPORT_HEIGHT,
    viewportWidthNote: "width is a CSS viewport in pixels; it is not a browser zoom percentage",
    dprNote: "deviceScaleFactor exercises device-pixel-ratio only; it is not browser zoom",
    widths,
    dprsByWidth: Object.fromEntries(widths.map((width) => [String(width), DEFAULT_DPRS.get(width) || [1]])),
    routes: ROUTES,
    cases: [],
    failures: [],
    screenshots: [],
    baselineReplay: process.env.HOME_RESPONSIVE_BASELINE_DIR || null,
  };

  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
    for (const route of ROUTES) {
      for (const { width, dpr } of matrix) {
        await runCase({ browser, route, width, dpr, report });
      }
    }
    checkBreakpointContinuity(report);
  } finally {
    if (browser) await browser.close();
    if (server.child) await stopChild(server.child);
  }

  report.summary = summarize(report);
  const resultPath = path.join(ARTIFACT_ROOT, process.env.HOME_RESPONSIVE_ARTIFACT || "results.json");
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Responsive home regression: ${report.summary.passedCases}/${report.summary.totalCases} cases passed`);
  console.log(`Artifacts: ${resultPath}`);
  if (report.failures.length) {
    console.error(`FAIL ${report.failures.length} assertions; first failures:`);
    for (const failure of report.failures.slice(0, 12)) {
      console.error(`- ${failure.route} ${failure.width}px DPR${failure.dpr} [${failure.code}] ${failure.message}`);
    }
    if (report.failures.length > 12) console.error(`- ... ${report.failures.length - 12} more (see JSON)`);
    process.exitCode = 1;
  } else {
    console.log("PASS: no horizontal overflow, responsive hero geometry, adaptive media fit, and tab interactions");
  }
}

async function runCase({ browser, route, width, dpr, report }) {
  const page = await browser.newPage({
    viewport: { width, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: dpr,
  });
  page.setDefaultTimeout(5000);

  // The site is a static artifact; external fonts/analytics/chat endpoints
  // are not part of this regression and can otherwise make a case wait on
  // network activity.  Abort only cross-origin HTTP(S) requests so local
  // assets and the supplied base URL remain real.
  const baseOrigin = new URL(report.baseUrl).origin;
  const baselineDir = process.env.HOME_RESPONSIVE_BASELINE_DIR
    ? path.resolve(PROJECT_ROOT, process.env.HOME_RESPONSIVE_BASELINE_DIR)
    : null;
  await page.route("**/*", async (requestRoute) => {
    if (baselineDir && requestRoute.request().resourceType() === "document") {
      const baselineFile = route.id === "en" ? "baseline-en-index.html" : "baseline-index.html";
      const baselinePath = path.join(baselineDir, baselineFile);
      if (fs.existsSync(baselinePath)) {
        await requestRoute.fulfill({
          status: 200,
          contentType: "text/html; charset=utf-8",
          body: fs.readFileSync(baselinePath),
        });
        return;
      }
    }
    const requestUrl = requestRoute.request().url();
    try {
      const parsed = new URL(requestUrl);
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin !== baseOrigin) {
        await requestRoute.abort();
      } else {
        await requestRoute.continue();
      }
    } catch {
      await requestRoute.continue();
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error && error.message ? error.message : error)));

  const context = { route: route.id, routePath: route.path, width, dpr };
  const result = {
    ...context,
    url: joinUrl(report.baseUrl, route.path),
    status: "passed",
    layout: null,
    tabInteraction: null,
    pageErrors,
    screenshot: null,
  };
  report.cases.push(result);

  try {
    const response = await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || !response.ok()) {
      fail(report, result, "http-status", `${route.path} returned ${response ? response.status() : "no response"}`);
      return;
    }
    // Avoid awaiting document.fonts.ready: a blocked/slow external font must
    // never turn a static layout regression into an unbounded wait.
    await page.waitForTimeout(120);
    // The eager product screenshot is part of the contract.  Wait briefly
    // for a real decoded image, but keep a bounded timeout for 404s.
    await page.waitForFunction(
      () => [...document.querySelectorAll(".hero-screen img")].some((image) => image.complete && image.naturalWidth > 0),
      { timeout: 3000 },
    ).catch(() => {});

    result.layout = await readLayout(page);
    checkLayout(report, result);

    // Keep a small, deterministic top-of-page capture for the reference
    // width.  This is a viewport clip, not a full-page screenshot and is not
    // repeated for every width/DPR combination.
    if (width === 1440 && dpr === 1 && !process.env.HOME_RESPONSIVE_NO_SCREENSHOTS) {
      const screenshotName = `home-${route.id}-w1440-dpr1.png`;
      const screenshotPath = path.join(ARTIFACT_ROOT, screenshotName);
      const heroLocator = page.locator(".hero-screen");
      await heroLocator.screenshot({
        path: screenshotPath,
        type: "png",
        animations: "disabled",
      });
      result.screenshot = path.relative(PROJECT_ROOT, screenshotPath);
      report.screenshots.push(result.screenshot);
    }

    result.tabInteraction = await checkTabs(page, report, result);
  } catch (error) {
    fail(report, result, "case-error", error && error.message ? error.message : String(error));
  } finally {
    if (pageErrors.length) {
      for (const message of pageErrors) fail(report, result, "page-error", message);
    }
    await page.close();
  }
}

async function readLayout(page) {
  return page.evaluate(() => {
    const round = (value) => Number(Number(value).toFixed(3));
    const box = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
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
        objectFit: style.objectFit || null,
        pointerEvents: style.pointerEvents,
      };
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const hero = document.querySelector(".hero-screen");
    const card = hero && (hero.querySelector(".screen-card") || hero);
    const screenBody = hero && hero.querySelector(".screen-body");
    const tabRail = hero && hero.querySelector(".screen-tabs");
    const media = hero ? [...hero.querySelectorAll("img, video")].map((element) => ({
      tag: element.tagName,
      className: typeof element.className === "string" ? element.className : "",
      box: box(element),
      visible: visible(element),
      objectFit: getComputedStyle(element).objectFit || null,
      naturalWidth: element.tagName === "IMG" ? element.naturalWidth : element.videoWidth || 0,
      naturalHeight: element.tagName === "IMG" ? element.naturalHeight : element.videoHeight || 0,
      src: element.currentSrc || element.src || element.dataset.src || "",
    })) : [];
    const tabs = hero ? [...hero.querySelectorAll(".stab")].map((element) => ({
      box: box(element),
      text: (element.textContent || "").replace(/\s+/g, " ").trim(),
      role: element.getAttribute("role"),
      ariaSelected: element.getAttribute("aria-selected"),
      active: element.classList.contains("active"),
      disabled: Boolean(element.disabled),
    })) : [];

    const html = document.documentElement;
    const body = document.body;
    return {
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      document: {
        clientWidth: html.clientWidth,
        scrollWidth: html.scrollWidth,
        bodyClientWidth: body ? body.clientWidth : null,
        bodyScrollWidth: body ? body.scrollWidth : null,
      },
      hero: box(hero),
      card: box(card),
      screenBody: box(screenBody),
      tabRail: {
        box: box(tabRail),
        inCard: Boolean(card && tabRail && card.contains(tabRail)),
        position: tabRail ? getComputedStyle(tabRail).position : null,
      },
      media,
      tabs,
      screenshotImages: hero ? [...hero.querySelectorAll("img")].length : 0,
    };
  });
}

function checkLayout(report, result) {
  const layout = result.layout;
  if (!layout.hero) {
    fail(report, result, "missing-hero", "cannot find .hero-screen");
    return;
  }

  const width = result.width;
  const hero = layout.hero;
  const isWideStage = width >= 1520;
  const expectedHeroWidth = width <= 860 ? width - 32 : isWideStage ? width : Math.min(width, 1519);
  result.heroReference = {
    expectedOuterWidth: expectedHeroWidth,
    observedOuterWidth: hero.width,
    delta: round(hero.width - expectedHeroWidth),
    note: "mobile side padding, bounded desktop stage, or wide zoom-stage; width is a CSS viewport, not a zoom percentage",
  };

  // Normal viewports preserve the 2549x1352 product ratio. Browser zoom-out
  // produces a >=1520px CSS viewport; there the stage deliberately becomes
  // full-width and holds a stable 684px height, matching the reference site's
  // wide cinematic rhythm instead of shrinking into a small centered card.
  if (!isWideStage && hero.width > 1519 + 1.5) {
    fail(report, result, "hero-width-cap", `bounded hero width ${hero.width}px exceeds 1519px`, { hero });
  }
  if (isWideStage && Math.abs(hero.width - width) > 1.5) {
    fail(report, result, "hero-wide-width", `wide hero width ${hero.width}px does not fill the ${width}px CSS viewport`, { hero });
  }
  if (layout.screenBody) {
    const ratio = layout.screenBody.width / layout.screenBody.height;
    result.mediaFrameAspectRatio = round(ratio);
    const expectedRatio = 2549 / 1352;
    if (!isWideStage && Math.abs(ratio - expectedRatio) > 0.10) {
      fail(report, result, "media-frame-ratio", `screen-body ratio ${ratio.toFixed(3)} is not close to 2549/1352 (${expectedRatio.toFixed(3)})`, {
        screenBody: layout.screenBody,
        expectedRatio,
      });
    }
    if (isWideStage && Math.abs(layout.screenBody.height - 684) > 1.5) {
      fail(report, result, "media-wide-height", `wide screen-body height ${layout.screenBody.height}px is not the stable 684px stage`, {
        screenBody: layout.screenBody,
      });
    }
  } else {
    fail(report, result, "missing-media-frame", "cannot find .screen-body media frame");
  }

  const rail = layout.tabRail && layout.tabRail.box;
  if (!rail || !layout.screenBody || !layout.card ||
      rail.y < layout.screenBody.bottom - 1.5 || rail.bottom > layout.card.bottom + 1.5) {
    fail(report, result, "tab-rail-placement", "tab rail must start at/after the media frame and remain inside the card", {
      tabRail: layout.tabRail,
      screenBody: layout.screenBody,
      card: layout.card,
    });
  }

  // scrollWidth alone is insufficient because the site intentionally uses
  // body overflow-x:hidden.  Check both scroll metrics and the actual key
  // boxes so a visually clipped card/tab is still reported.
  const documentOverflow = Math.max(
    layout.document.scrollWidth - layout.viewport.width,
    (layout.document.bodyScrollWidth || 0) - layout.viewport.width,
  );
  if (documentOverflow > 1.5) {
    fail(report, result, "horizontal-overflow", `document scroll width exceeds viewport by ${round(documentOverflow)}px`, {
      document: layout.document,
    });
  }

  const keyBoxes = [
    ["hero", hero],
    ["card", layout.card],
    ...layout.tabs.map((tab, index) => [`tab-${index}`, tab.box]),
    ...layout.media.map((item, index) => [`media-${index}`, item.box]),
  ];
  for (const [name, box] of keyBoxes) {
    if (!box || box.width <= 0 || box.height <= 0) continue;
    const outside = Math.max(0, -box.x, box.right - layout.viewport.width);
    if (outside > 1.5) {
      fail(report, result, "visual-horizontal-overflow", `${name} extends ${round(outside)}px outside the CSS viewport`, { box });
    }
  }

  const mediaWidths = layout.media.filter((item) => item.visible && item.box).map((item) => item.box.width);
  result.mediaMaxWidth = mediaWidths.length ? Math.max(...mediaWidths) : 0;
  const expectedMediaMax = isWideStage ? width - 224 : 1295;
  if (result.mediaMaxWidth > expectedMediaMax + 1.5) {
    fail(report, result, "media-width-cap", `hero media width ${result.mediaMaxWidth}px exceeds ${expectedMediaMax}px`, {
      mediaWidths,
    });
  }
  if (width >= 861 && (!layout.tabRail.box || !layout.tabRail.inCard)) {
    fail(report, result, "tab-rail-placement", "desktop screen-card must contain the independent tab rail", {
      tabRail: layout.tabRail,
    });
  }

  if (!Number.isFinite(hero.width) || !Number.isFinite(hero.height) || hero.width <= 0 || hero.height <= 0) {
    fail(report, result, "hero-invalid-size", "hero width/height must be finite and positive", { hero });
  } else {
    const ratio = hero.width / hero.height;
    result.heroAspectRatio = round(ratio);
    // The outer hero may include the independent tab rail, so do not impose
    // a fixed desktop aspect ratio on it.  Only reject an obviously collapsed
    // surface; the media-frame ratio above is the stable visual invariant.
    if (ratio < 0.25 || ratio > 12) {
      fail(report, result, "hero-aspect-ratio", `hero ratio ${ratio.toFixed(3)} is implausible`, { hero, ratio });
    }
  }

  if (!layout.screenshotImages) {
    fail(report, result, "missing-key-media", "hero must contain at least one screenshot image");
  }
  const intrinsicImages = layout.media.filter((item) => item.tag === "IMG" && item.naturalWidth > 0 && item.naturalHeight > 0);
  const sourceImage = intrinsicImages.find((item) => item.naturalWidth === 2549 && item.naturalHeight === 1352);
  result.heroImageIntrinsic = intrinsicImages.map((item) => ({
    src: item.src,
    width: item.naturalWidth,
    height: item.naturalHeight,
  }));
  if (!sourceImage) {
    fail(report, result, "hero-image-intrinsic", "hero screenshot must decode the 2549x1352 source image", {
      decodedImages: intrinsicImages.map((item) => ({ src: item.src, width: item.naturalWidth, height: item.naturalHeight })),
    });
  }
  // Wide still images may crop for visual weight; video keeps the entire
  // workbench visible so captions and interface text are never cut off.
  for (const [index, item] of layout.media.entries()) {
    if (!item.visible) continue;
    const expectedObjectFit = item.tag === "VIDEO" ? "contain" : (isWideStage ? "cover" : "contain");
    if (item.objectFit !== expectedObjectFit) {
      fail(report, result, "media-object-fit", `hero media ${index} (${item.tag}) uses object-fit:${item.objectFit || "unset"}; expected ${expectedObjectFit}`, {
        media: item,
      });
    }
  }
}

async function checkTabs(page, report, result) {
  const summary = { count: 0, visible: 0, clicked: 0, selected: [], failures: [] };
  const hero = page.locator(".hero-screen");
  if (!(await hero.count())) {
    summary.failures.push("missing hero");
    fail(report, result, "tabs-missing-hero", "cannot test tabs without .hero-screen");
    return summary;
  }

  await hero.scrollIntoViewIfNeeded();
  const tabs = page.locator(".hero-screen .stab");
  summary.count = await tabs.count();
  if (summary.count !== 3) {
    summary.failures.push(`expected 3 tabs, found ${summary.count}`);
    fail(report, result, "tab-count", `expected 3 .stab elements, found ${summary.count}`);
    return summary;
  }

  for (let index = 0; index < summary.count; index += 1) {
    const tab = tabs.nth(index);
    await tab.scrollIntoViewIfNeeded();
    const state = await tab.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity),
        pointerEvents: style.pointerEvents,
        disabled: Boolean(element.disabled),
      };
    });
    const inViewport = state.width > 0 && state.height > 0 && state.x >= -1 && state.right <= result.width + 1 &&
      state.y >= -1 && state.bottom <= VIEWPORT_HEIGHT + 1 && state.display !== "none" &&
      state.visibility !== "hidden" && state.opacity > 0 && !state.disabled && state.pointerEvents !== "none";
    if (inViewport) summary.visible += 1;
    else {
      const message = `tab ${index} is not fully visible/clickable in the CSS viewport`;
      summary.failures.push(message);
      fail(report, result, "tab-not-visible", message, { state });
      continue;
    }

    try {
      await tab.click();
      await page.waitForTimeout(90);
      const selected = await page.evaluate((tabIndex) => {
        const tabs = [...document.querySelectorAll(".hero-screen .stab")];
        const panes = [...document.querySelectorAll(".hero-screen .demo-pane")];
        const activeTab = tabs[tabIndex];
        const activePane = panes.find((pane) => pane.classList.contains("active"));
        return {
          tabActive: Boolean(activeTab && activeTab.classList.contains("active")),
          ariaSelected: activeTab && activeTab.getAttribute("aria-selected"),
          paneIndex: activePane ? Number(activePane.dataset.pane) : null,
        };
      }, index);
      summary.selected.push(selected);
      if (!selected.tabActive || selected.ariaSelected !== "true" || selected.paneIndex !== index) {
        const message = `tab ${index} click did not activate matching pane`;
        summary.failures.push(message);
        fail(report, result, "tab-switch", message, { selected });
      } else {
        summary.clicked += 1;
      }
    } catch (error) {
      const message = `tab ${index} click failed: ${error && error.message ? error.message : String(error)}`;
      summary.failures.push(message);
      fail(report, result, "tab-click", message, { state });
    }
  }
  return summary;
}

function fail(report, result, code, message, details = undefined) {
  result.status = "failed";
  const failure = {
    route: result.route,
    routePath: result.routePath,
    width: result.width,
    dpr: result.dpr,
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
    failures: report.failures.length,
    failuresByCode: byCode,
  };
}

function checkBreakpointContinuity(report) {
  for (const route of ROUTES) {
    for (const [lowerViewport, upperViewport] of [[860, 861], [1519, 1520]]) {
      const lower = report.cases.find((item) => item.route === route.id && item.width === lowerViewport && item.dpr === 1);
      const upper = report.cases.find((item) => item.route === route.id && item.width === upperViewport && item.dpr === 1);
      if (!lower || !upper || !lower.layout || !upper.layout) continue;
      const lowerWidth = lower.mediaMaxWidth || lower.layout.screenBody?.width || 0;
      const upperWidth = upper.mediaMaxWidth || upper.layout.screenBody?.width || 0;
      if (!lowerWidth || !upperWidth) continue;
      const delta = Math.abs(upperWidth - lowerWidth);
      const allowed = Math.max(48, Math.min(lowerWidth, upperWidth) * 0.18);
      if (delta > allowed) {
        fail(report, upper, "breakpoint-media-jump", `hero media width jumps ${round(delta)}px between ${lowerViewport}px and ${upperViewport}px (allowed ${round(allowed)}px)`, {
          lowerViewport,
          upperViewport,
          lowerWidth,
          upperWidth,
          delta: round(delta),
          allowed: round(allowed),
        });
      }
    }
  }
}

function parseWidths(value) {
  if (!value) return DEFAULT_WIDTHS;
  const widths = value.split(",").map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
  if (!widths.length) throw new Error("HOME_RESPONSIVE_WIDTHS must contain comma-separated positive integers");
  return [...new Set(widths)];
}

function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

function joinUrl(base, route) {
  return new URL(route.replace(/^\//, ""), `${stripTrailingSlash(base)}/`).toString();
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
      socket.close((error) => error ? reject(error) : resolve(port));
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

function round(value) {
  return Number(Number(value).toFixed(3));
}

