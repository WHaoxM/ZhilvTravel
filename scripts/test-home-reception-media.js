#!/usr/bin/env node

/**
 * End-to-end regression for the AI reception cards on both generated homepages.
 * The final dist is served over HTTP; source HTML is never used as the runtime.
 *
 * Override the matrix with HOME_RECEPTION_WIDTHS=390,768,1440 while iterating.
 */

const fs = require("node:fs");
const crypto = require("node:crypto");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (error) {
  console.error("无法加载 Playwright。请设置 Codex bundled NODE_PATH 后重试。");
  console.error(error && error.message ? error.message : error);
  process.exit(2);
}

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const MANIFEST = path.join(ROOT, "assets", "generated", "home-reception", "manifest.json");
const ARTIFACTS = path.join(ROOT, ".sites-artifacts", "reception-media");
const SERVER = path.join(ROOT, "scripts", "serve-static-site.js");
const HEIGHT = Number(process.env.HOME_RECEPTION_HEIGHT || 900);
const DEFAULT_WIDTHS = [320, 390, 768, 1024, 1440, 1920, 2560, 3840];
const ROUTES = [{ id: "zh", path: "/" }, { id: "en", path: "/en/" }];

const EXPECTED = [
  {
    filename: "intent-tags-malaysia-family-trip.png", card: "intent-mining", width: 820, height: 469,
    sha256: "913ddc4fc5a7f6cb6b1af281175b8a8c1b2592236fba878ccbf031bb750a4d1f",
    focus: "center center", carousel: true,
  },
  {
    filename: "intent-tags-multicity-preferences.png", card: "intent-mining", width: 844, height: 609,
    sha256: "9c396b361bc61f6cb939a05b63573fbe55e2706ae06a0b181bd9203ad4443b6c",
    focus: "center 31%", carousel: true,
  },
  {
    filename: "lead-groups-workspace.png", card: "lead-scoring", width: 647, height: 693,
    sha256: "8cca571a7edab759f8e77d684409610a04299e9409522f1ee00f53fd5c3d0eca",
    focus: "left 72%", carousel: false,
  },
];

const PRESERVED = [
  { filename: "gen-chatdesk.jpg", card: "inquiry-hub" },
  { filename: "home-sol-ai-service-workbench.webp", card: "service-workbench" },
];

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});

async function main() {
  assert(fs.existsSync(DIST), `dist is missing: ${DIST}`);
  const manifest = validateManifest();
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const widths = parseWidths(process.env.HOME_RECEPTION_WIDTHS);
  const override = process.env.HOME_RECEPTION_BASE_URL || process.env.BASE_URL || process.env.SITE_URL;
  const server = override ? { baseUrl: stripSlash(override), child: null } : await startServer();
  const report = {
    schemaVersion: 1, generatedAt: new Date().toISOString(), baseUrl: server.baseUrl,
    distRoot: DIST, manifestPath: MANIFEST, widths, routes: ROUTES,
    manifest, cases: [], motionCases: [], failures: [], screenshots: [],
  };
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
    for (const route of ROUTES) {
      for (const width of widths) await runViewport(browser, route, width, report);
      await runMotion(browser, route, true, report);
      await runMotion(browser, route, false, report);
    }
  } finally {
    if (browser) await browser.close();
    if (server.child) await stopChild(server.child);
  }
  report.summary = summarize(report);
  const output = path.join(ARTIFACTS, "results.json");
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`AI reception media: ${report.summary.passedCases}/${report.summary.totalCases} viewport cases passed`);
  console.log(`Motion: ${report.summary.passedMotionCases}/${report.summary.totalMotionCases} passed`);
  console.log(`Artifacts: ${output}`);
  if (report.failures.length) {
    for (const item of report.failures.slice(0, 24))
      console.error(`- ${item.route} ${item.width || ""} [${item.code}] ${item.message}`);
    if (report.failures.length > 24) console.error(`- ... ${report.failures.length - 24} more; see results.json`);
    process.exitCode = 1;
  } else {
    console.log("PASS: bilingual dist, provenance, four cards, carousel accessibility, focus, motion, and responsive media");
  }
}

function validateManifest() {
  assert(fs.existsSync(MANIFEST), `reception manifest is missing: ${MANIFEST}`);
  const raw = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  assert(Array.isArray(raw), "reception manifest must be an array");
  const hashes = [];
  for (const expected of EXPECTED) {
    const item = raw.find((entry) => entry && entry.filename === expected.filename);
    assert(item, `manifest does not list ${expected.filename}`);
    assert(item.width === expected.width && item.height === expected.height,
      `${expected.filename} manifest dimensions must be ${expected.width}x${expected.height}`);
    assert(item.focusPosition === expected.focus,
      `${expected.filename} focusPosition must be ${expected.focus}`);
    const file = path.join(ROOT, "assets", "generated", "home-reception", expected.filename);
    assert(fs.existsSync(file), `source asset is missing: ${file}`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    assert(hash === expected.sha256, `${expected.filename} no longer matches the supplied screenshot`);
    assert(String(item.sha256 || "").toLowerCase() === expected.sha256, `${expected.filename} manifest sha256 is wrong`);
    hashes.push(hash);
  }
  assert(new Set(hashes).size === EXPECTED.length,
    "manifest contains duplicate binary assets; duplicate attachment 3/5 must be represented once");
  const intent = raw.filter((item) => item && item.usage === "intent-mining-carousel");
  assert(intent.length === 2, `intent-mining-carousel must contain exactly two unique screenshots; got ${intent.length}`);
  assert(raw.some((item) => Array.isArray(item.duplicateSourceFilenames) && item.duplicateSourceFilenames.some((name) => name.includes("26bcc7bb"))),
    "manifest must record the deduplicated duplicate attachment provenance");
  return raw;
}

async function runViewport(browser, route, width, report) {
  const page = await browser.newPage({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(7000);
  await configure(page, report.baseUrl);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const result = { route: route.id, routePath: route.path, width, mode: "responsive-reduced", status: "passed", cards: {}, assets: [], carousel: null, pageErrors: [] };
  report.cases.push(result);
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error && error.message ? error.message : error)));
  try {
    const response = await page.goto(joinUrl(report.baseUrl, route.path), { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || !response.ok()) return fail(report, result, "http-status", `${route.path} returned ${response ? response.status() : "no response"}`);
    await activateReception(page);
    const panel = page.locator('.sol-panel[data-panel="1"]');
    if (await panel.count() !== 1) return fail(report, result, "panel-count", "data-panel=1 must exist exactly once");
    await panel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(160);

    const cardCount = await panel.locator("[data-reception-card]").count();
    if (cardCount !== 4) fail(report, result, "card-count", `expected four reception cards; got ${cardCount}`);
    for (const key of ["inquiry-hub", "service-workbench", "intent-mining", "lead-scoring"])
      if (await panel.locator(`[data-reception-card="${key}"]`).count() !== 1)
        fail(report, result, "card-contract", `missing unique data-reception-card=${key}`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    result.horizontalOverflow = round(overflow);
    if (overflow > 1.5) fail(report, result, "horizontal-overflow", `${round(overflow)}px horizontal overflow at ${width}px`);

    result.assets = await verifyAssets(page, report.baseUrl);
    for (const asset of result.assets) {
      if (!asset.httpOk || asset.status !== 200) fail(report, result, "asset-http", `${asset.filename} returned HTTP ${asset.status}`);
      if (!asset.decoded || asset.naturalWidth <= 0 || asset.naturalHeight <= 0) fail(report, result, "asset-decode", `${asset.filename} did not decode`);
      const expected = EXPECTED.find((item) => item.filename === asset.filename);
      if (expected && (asset.naturalWidth !== expected.width || asset.naturalHeight !== expected.height))
        fail(report, result, "asset-dimensions", `${asset.filename} decoded ${asset.naturalWidth}x${asset.naturalHeight}; expected ${expected.width}x${expected.height}`);
    }

    for (const asset of [...EXPECTED, ...PRESERVED]) {
      const card = panel.locator(`[data-reception-card="${asset.card}"]`);
      const image = card.locator(`img[src*="${asset.filename}"]`);
      if (await image.count() !== 1) {
        fail(report, result, "asset-placement", `${asset.filename} must appear once in ${asset.card}`);
        continue;
      }
      if (asset.carousel) continue;
      const info = await inspectMedia(card, image);
      result.cards[asset.card] = info;
      checkMediaGeometry(report, result, asset.card, info);
      if (asset.focus) checkFocus(report, result, asset, info.image);
    }

    result.carousel = await checkCarousel(page, panel.locator('[data-reception-card="intent-mining"]'), report, result);
    if ([390, 1440].includes(width) && !process.env.HOME_RECEPTION_NO_SCREENSHOTS) {
      const file = path.join(ARTIFACTS, `reception-${route.id}-${width}.png`);
      await panel.screenshot({ path: file, type: "png", animations: "disabled" });
      result.screenshot = path.relative(ROOT, file);
      report.screenshots.push(result.screenshot);
    }
  } catch (error) {
    fail(report, result, "case-error", error && error.message ? error.message : String(error));
  } finally {
    result.pageErrors = errors;
    for (const message of errors) fail(report, result, "page-error", message);
    await page.close();
  }
}

async function activateReception(page) {
  await page.waitForFunction(() => document.querySelector('#solTabsM [data-panel="1"]'));
  await page.evaluate(() => document.querySelector('#solTabsM [data-panel="1"]').click());
  await page.waitForFunction(() => document.querySelector('.sol-panel[data-panel="1"]')?.classList.contains("active"));
}

async function verifyAssets(page, baseUrl) {
  const files = [
    ...EXPECTED.map((item) => ({ filename: item.filename, url: `/assets/generated/home-reception/${item.filename}` })),
    ...PRESERVED.map((item) => ({ filename: item.filename, url: `/assets/generated/${item.filename}` })),
  ].map((item) => ({ ...item, url: new URL(item.url, baseUrl).toString() }));
  return page.evaluate(async (items) => {
    const output = [];
    for (const item of items) {
      let status = 0, httpOk = false, contentType = "";
      try {
        const response = await fetch(item.url, { cache: "no-store" });
        status = response.status; httpOk = response.ok; contentType = response.headers.get("content-type") || "";
      } catch {}
      const decoded = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ decoded: true, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
        image.onerror = () => resolve({ decoded: false, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
        image.src = item.url;
      });
      output.push({ ...item, status, httpOk, contentType, ...decoded });
    }
    return output;
  }, files);
}

async function inspectMedia(card, image) {
  return card.evaluate((element, target) => {
    const rect = (node) => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    };
    const cardBox = rect(element), imageBox = rect(target), style = getComputedStyle(target);
    const paintedWidth = Math.max(0, Math.min(cardBox.right, imageBox.right) - Math.max(cardBox.x, imageBox.x));
    const paintedHeight = Math.max(0, Math.min(cardBox.bottom, imageBox.bottom) - Math.max(cardBox.y, imageBox.y));
    return {
      viewportWidth: innerWidth, card: cardBox,
      image: {
        box: imageBox, complete: target.complete, naturalWidth: target.naturalWidth, naturalHeight: target.naturalHeight,
        display: style.display, visibility: style.visibility, opacity: Number(style.opacity), objectFit: style.objectFit,
        objectPosition: style.objectPosition, focus: target.getAttribute("data-focus") || "",
      },
      paintedWidth, paintedHeight, widthShare: paintedWidth / cardBox.width, heightShare: paintedHeight / cardBox.height,
    };
  }, await image.elementHandle());
}

function checkMediaGeometry(report, result, key, info) {
  if (!info.card || info.card.width <= 0 || info.card.height <= 0) return fail(report, result, "card-hidden", `${key} has no geometry`);
  if (info.image.display === "none" || info.image.visibility === "hidden" || info.image.opacity <= 0 || info.paintedWidth <= 0)
    fail(report, result, "media-hidden", `${key} media is hidden at ${result.width}px`);
  if (!info.image.complete || info.image.naturalWidth <= 0) fail(report, result, "dom-image-decode", `${key} DOM image did not decode`);
  if (info.widthShare < 0.42 || info.heightShare < 0.28)
    fail(report, result, "media-thumbnail", `${key} media shrank to ${round(info.widthShare * 100)}% x ${round(info.heightShare * 100)}% of its card`, info);
  if (result.width <= 768 && info.card.width / result.width < 0.72)
    fail(report, result, "mobile-card-too-small", `${key} uses only ${round(info.card.width / result.width * 100)}% of the ${result.width}px viewport`);
  if (info.card.x < -1.5 || info.card.right > result.width + 1.5)
    fail(report, result, "card-overflow", `${key} escapes the viewport`, info.card);
}

function checkFocus(report, result, asset, image) {
  if (image.focus !== asset.focus) fail(report, result, "focus-contract", `${asset.filename} data-focus is '${image.focus}', expected '${asset.focus}'`);
  if (normalizePosition(image.objectPosition) !== normalizePosition(asset.focus))
    fail(report, result, "focus-style", `${asset.filename} computed object-position '${image.objectPosition}' does not match '${asset.focus}'`);
  if (image.objectFit !== "cover") fail(report, result, "object-fit", `${asset.filename} should use object-fit: cover; got ${image.objectFit}`);
}

async function checkCarousel(page, card, report, result) {
  const slides = card.locator("[data-reception-slide]");
  const dots = card.locator("[data-reception-dot]");
  const output = { slides: await slides.count(), dots: await dots.count(), states: [], keyboard: [] };
  if (output.slides !== 2 || output.dots !== 2) {
    fail(report, result, "carousel-count", `intent carousel needs 2 slides and 2 dots; got ${output.slides}/${output.dots}`);
    return output;
  }
  for (let index = 0; index < 2; index += 1) {
    const dotMeta = await dots.nth(index).evaluate((node) => ({ tag: node.tagName, role: node.getAttribute("role"), selected: node.getAttribute("aria-selected"), controls: node.getAttribute("aria-controls"), name: node.getAttribute("aria-label") || node.textContent.trim() }));
    if (dotMeta.tag !== "BUTTON" || dotMeta.role !== "tab" || !dotMeta.controls || !dotMeta.name)
      fail(report, result, "carousel-dot-a11y", `dot ${index} is missing button/tab/controls/name semantics`, dotMeta);
    await dots.nth(index).click();
    await page.waitForTimeout(100);
    const state = await readCarousel(card);
    output.states.push(state);
    if (state.selected !== index || state.visibleSlides.length !== 1 || state.visibleSlides[0] !== index)
      fail(report, result, "carousel-sync", `dot ${index} did not synchronize aria-selected, hidden and active slide`, state);
    const expected = EXPECTED[index];
    const image = slides.nth(index);
    const info = await inspectMedia(card, image);
    output[`slide${index}`] = info;
    checkMediaGeometry(report, result, "intent-mining", info);
    checkFocus(report, result, expected, info.image);
  }
  await dots.nth(0).click();
  await dots.nth(1).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(80);
  let state = await readCarousel(card); output.keyboard.push({ key: "Enter", selected: state.selected });
  if (state.selected !== 1) fail(report, result, "carousel-keyboard", "Enter did not activate dot 1", state);
  await dots.nth(0).focus(); await page.keyboard.press("Space"); await page.waitForTimeout(80);
  state = await readCarousel(card); output.keyboard.push({ key: "Space", selected: state.selected });
  if (state.selected !== 0) fail(report, result, "carousel-keyboard", "Space did not activate dot 0", state);
  await dots.nth(0).focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(80);
  state = await readCarousel(card); output.keyboard.push({ key: "ArrowRight", selected: state.selected });
  if (state.selected !== 1) fail(report, result, "carousel-keyboard", "ArrowRight did not activate dot 1", state);
  return output;
}

async function readCarousel(card) {
  return card.evaluate((element) => {
    const dots = [...element.querySelectorAll("[data-reception-dot]")];
    const slides = [...element.querySelectorAll("[data-reception-slide]")];
    return {
      selected: dots.findIndex((dot) => dot.getAttribute("aria-selected") === "true"),
      selectedCount: dots.filter((dot) => dot.getAttribute("aria-selected") === "true").length,
      visibleSlides: slides.map((slide, index) => (!slide.hidden && slide.getAttribute("aria-hidden") !== "true" && slide.classList.contains("is-active")) ? index : -1).filter((index) => index >= 0),
      identity: JSON.stringify({ selected: dots.map((dot) => dot.getAttribute("aria-selected")), hidden: slides.map((slide) => slide.hidden), active: slides.map((slide) => slide.classList.contains("is-active")) }),
    };
  });
}

async function runMotion(browser, route, reduced, report) {
  const page = await browser.newPage({ viewport: { width: 1440, height: HEIGHT } });
  page.setDefaultTimeout(7000); await configure(page, report.baseUrl);
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  const result = { route: route.id, width: 1440, mode: reduced ? "reduced-motion" : "normal-motion", status: "passed" };
  report.motionCases.push(result);
  try {
    const response = await page.goto(joinUrl(report.baseUrl, route.path), { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!response || !response.ok()) return fail(report, result, "motion-http", `${route.path} did not load`);
    await activateReception(page);
    const card = page.locator('[data-reception-card="intent-mining"]');
    await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(220);
    const root = card.locator("[data-reception-carousel]");
    const interval = Number(await root.getAttribute("data-autoplay-interval")) || 4500;
    const before = await readCarousel(card);
    await page.waitForTimeout(Math.min(6000, interval + 650));
    const after = await readCarousel(card);
    result.interval = interval; result.before = before; result.after = after; result.changed = before.identity !== after.identity;
    if (reduced && result.changed) fail(report, result, "reduced-motion-autoplay", "carousel advanced with prefers-reduced-motion: reduce");
    if (!reduced && !result.changed) fail(report, result, "normal-motion-no-autoplay", `carousel did not advance after ${interval + 650}ms`);
  } catch (error) {
    fail(report, result, "motion-error", error && error.message ? error.message : String(error));
  } finally { await page.close(); }
}

async function configure(page, baseUrl) {
  const origin = new URL(baseUrl).origin;
  await page.route("**/*", async (route) => {
    try {
      const url = new URL(route.request().url());
      if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== origin) return route.abort();
    } catch {}
    return route.continue();
  });
}

function normalizePosition(value) {
  return String(value || "").trim().toLowerCase().split(/\s+/).map((part) => ({ left: "0%", center: "50%", right: "100%", top: "0%", bottom: "100%" }[part] || part)).join(" ");
}
function parseWidths(value) {
  if (!value) return DEFAULT_WIDTHS;
  const widths = String(value).split(",").map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
  assert(widths.length, "HOME_RECEPTION_WIDTHS needs comma-separated positive integers");
  return [...new Set(widths)];
}
function fail(report, result, code, message, details) {
  result.status = "failed";
  report.failures.push({ route: result.route, width: result.width, mode: result.mode, code, message, ...(details === undefined ? {} : { details }) });
}
function summarize(report) {
  return {
    totalCases: report.cases.length, passedCases: report.cases.filter((item) => item.status === "passed").length,
    totalMotionCases: report.motionCases.length, passedMotionCases: report.motionCases.filter((item) => item.status === "passed").length,
    failures: report.failures.length,
  };
}
function assert(value, message) { if (!value) throw new Error(message); }
function round(value) { return Number(Number(value).toFixed(3)); }
function stripSlash(value) { return String(value).replace(/\/+$/, ""); }
function joinUrl(base, route) { return new URL(route.replace(/^\//, ""), `${stripSlash(base)}/`).toString(); }

async function startServer() {
  const port = await freePort();
  const child = spawn(process.execPath, [SERVER], { cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  const baseUrl = `http://127.0.0.1:${port}`;
  try { await waitForHttp(`${baseUrl}/`, child); } catch (error) { await stopChild(child); throw error; }
  return { baseUrl, child };
}
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer(); server.once("error", reject);
    server.listen(0, "127.0.0.1", () => { const address = server.address(); server.close((error) => error ? reject(error) : resolve(address.port)); });
  });
}
function waitForHttp(url, child) {
  return new Promise((resolve, reject) => {
    let attempts = 0, done = false;
    const exit = (code) => { if (!done) { done = true; reject(new Error(`static server exited early (${code})`)); } };
    child.once("exit", exit);
    const poll = () => {
      if (done) return; attempts += 1;
      const request = http.get(url, (response) => { response.resume(); if (response.statusCode < 500) { done = true; child.removeListener("exit", exit); resolve(); } else retry(); });
      request.on("error", retry); request.setTimeout(500, () => request.destroy());
    };
    const retry = () => { if (done) return; if (attempts >= 80) { done = true; child.removeListener("exit", exit); reject(new Error(`timeout waiting for ${url}`)); } else setTimeout(poll, 50); };
    poll();
  });
}
function stopChild(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    const timer = setTimeout(resolve, 1500); child.once("exit", () => { clearTimeout(timer); resolve(); }); child.kill();
  });
}
