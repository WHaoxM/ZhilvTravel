#!/usr/bin/env node

/* Browser proof for the supplied fulfillment / analytics assets on both homepages. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets', 'generated', 'home-fulfillment');
const OUT = path.join(ROOT, '.sites-artifacts', 'fulfillment-panel');
const WIDTHS = process.env.HOME_FULFILLMENT_WIDTHS
  ? process.env.HOME_FULFILLMENT_WIDTHS.split(',').map(Number)
  : [320, 390, 768, 1024, 1440, 1920, 2560, 3840];
const FILES = [
  'order-lifecycle-flow.png', 'analytics-overview.png',
  'analytics-channel-performance.png', 'analytics-conversion-growth.png',
  'supplier-resource-map.png', 'customer-trip-calendar.png',
];
const PORT = 4293;
const BASE = `http://127.0.0.1:${PORT}`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS, 'manifest.json'), 'utf8'));
  for (const name of FILES) {
    const record = manifest.files.find(item => item.file === name);
    if (!record) throw new Error(`Manifest missing ${name}`);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ASSETS, name))).digest('hex');
    if (hash !== record.sha256) throw new Error(`Supplied asset hash changed: ${name}`);
  }

  const server = spawn(process.execPath, ['scripts/serve-static-site.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore', windowsHide: true,
  });
  const results = [];
  let browser;
  try {
    for (let i = 0; i < 50; i++) {
      try { const r = await fetch(BASE); if (r.ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    for (const lang of ['zh', 'en']) {
      for (const width of WIDTHS) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`${BASE}${lang === 'en' ? '/en/' : '/'}`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => document.querySelector('#solTabsM [data-panel="4"]').click());
        const panel = page.locator('.sol-panel[data-panel="4"]');
        await panel.scrollIntoViewIfNeeded();
        await panel.locator('img').evaluateAll(images => Promise.all(images.map(async image => {
          image.loading = 'eager';
          if (!image.complete) await image.decode();
        })));
        await page.waitForTimeout(100);
        const result = await page.evaluate(() => {
          const panel = document.querySelector('.sol-panel[data-panel="4"]');
          const keys = ['orders', 'analytics', 'suppliers', 'remarketing'];
          const cards = Object.fromEntries(keys.map(key => {
            const card = panel.querySelector(`[data-fulfillment-card="${key}"]`);
            const media = card.querySelector('.ci-img');
            const c = card.getBoundingClientRect(), m = media.getBoundingClientRect();
            return [key, {
              cardWidth: c.width, cardHeight: c.height, cardX: c.x, cardRight: c.right,
              mediaWidth: m.width, mediaHeight: m.height,
              visibleWidth: Math.max(0, Math.min(c.right, m.right) - Math.max(c.left, m.left)),
              visibleHeight: Math.max(0, Math.min(c.bottom, m.bottom) - Math.max(c.top, m.top)),
              display: getComputedStyle(media).display,
              images: [...media.querySelectorAll('img')].map(img => ({
                src: new URL(img.src).pathname.split('/').pop(), naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight, complete: img.complete,
              })),
            }];
          }));
          return {
            active: panel.classList.contains('active'),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            cards,
            proofLabels: [...panel.querySelectorAll('.fulfillment-proof-labels span')].map(e => e.textContent.trim()),
            calendarNotes: [...panel.querySelectorAll('.calendar-note')].map(e => e.textContent.trim()),
          };
        });
        result.lang = lang; result.width = width; result.errors = errors;
        if (!result.active) throw new Error(`${lang}/${width}: panel did not activate`);
        if (result.overflow > 1.5) throw new Error(`${lang}/${width}: ${result.overflow}px overflow`);
        if (errors.length) throw new Error(`${lang}/${width}: ${errors.join('; ')}`);
        const expectedCounts = { orders: 1, analytics: 3, suppliers: 1, remarketing: 1 };
        for (const [key, card] of Object.entries(result.cards)) {
          if (card.display === 'none' || card.visibleWidth < card.cardWidth * .38 || card.visibleHeight < card.cardHeight * .24)
            throw new Error(`${lang}/${width}: ${key} image is too small or hidden`);
          if (width <= 768 && card.cardWidth < width * .72)
            throw new Error(`${lang}/${width}: ${key} card uses too little viewport width`);
          if (card.cardX < -1.5 || card.cardRight > width + 1.5)
            throw new Error(`${lang}/${width}: ${key} card leaves viewport`);
          if (card.images.length !== expectedCounts[key] || card.images.some(image => !image.complete || !image.naturalWidth))
            throw new Error(`${lang}/${width}: ${key} image count/decode failed`);
        }
        if (result.proofLabels.length !== 3 || result.calendarNotes.length !== 3)
          throw new Error(`${lang}/${width}: data or calendar labels missing`);
        if ([390, 1440, 2560].includes(width) && lang === 'zh') {
          const file = path.join(OUT, `fulfillment-${width}.png`);
          await panel.screenshot({ path: file, animations: 'disabled' });
          result.screenshot = path.relative(ROOT, file);
        }
        results.push(result);
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
  const report = { generatedAt: new Date().toISOString(), cases: results.length, widths: WIDTHS, results };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`Fulfillment panel: ${results.length}/${WIDTHS.length * 2} bilingual viewport cases passed`);
  console.log(`Artifacts: ${OUT}`);
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
