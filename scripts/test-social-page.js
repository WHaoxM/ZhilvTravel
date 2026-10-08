#!/usr/bin/env node
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const pagePath of ['/pages/data-social.html', '/en/pages/data-social.en.html']) {
      for (const width of [390, 1440, 2560]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(base + pagePath, { waitUntil: 'domcontentloaded' });
        const gallery = page.locator('.social-evidence');
        assert.equal(await gallery.locator('[role=tab]').count(), 5);
        await gallery.scrollIntoViewIfNeeded();
        await gallery.locator('[role=tab]').nth(2).click();
        assert.equal(await gallery.locator('[role=tab]').nth(2).getAttribute('aria-selected'), 'true');
        assert.equal(await gallery.locator('[role=tabpanel]:not([hidden])').count(), 1);
        assert.equal(await page.locator('.social-use-card').count(), 4);
        assert.equal(await page.locator('.social-flow-note').count(), 1);
        const reel = page.locator('[data-social-reel]');
        assert.equal(await reel.locator('.social-reel-card').count(), 7);
        await reel.scrollIntoViewIfNeeded();
        const track = reel.locator('.social-reel-track');
        const before = await track.evaluate(element => element.scrollLeft);
        await reel.locator('[data-social-step="1"]').click();
        await page.waitForTimeout(600);
        const after = await track.evaluate(element => element.scrollLeft);
        assert.ok(after > before, 'reel next button should scroll right');
        assert.equal(await reel.locator('img').evaluateAll(async images => {
          await Promise.all(images.map(image => {
            image.loading = 'eager';
            return Promise.race([
              image.decode(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('social reel image decode timed out')), 10000)),
            ]);
          }));
          return images.every(image => image.naturalWidth > 0);
        }), true);
        const outreach = page.locator('.creator-outreach');
        assert.equal(await outreach.count(), 1);
        await outreach.locator('summary').click();
        assert.equal(await outreach.locator('details').getAttribute('open'), '');
        assert.match(await outreach.locator('#creator-email-template').innerText(), /Subject: Exploring a China travel collaboration/);
        assert.equal(await page.locator('.social-use-card img').evaluateAll(async images => {
          await Promise.all(images.map(image => {
            image.loading = 'eager';
            return Promise.race([
              image.decode(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('social use image decode timed out')), 10000)),
            ]);
          }));
          return images.every(image => image.naturalWidth > 0);
        }), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
        const original = await gallery.locator('[role=tabpanel]:not([hidden]) a').getAttribute('href');
        assert.match(original, /social-china-travel\/shanghai-video-post\.png$/);
        console.log(`PASS ${pagePath} @ ${width}px`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
