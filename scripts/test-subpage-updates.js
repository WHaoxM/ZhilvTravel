#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const shots = path.resolve(__dirname, '..', '.sites-artifacts', 'subpage-updates');
fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const locale of ['zh', 'en']) {
      const dir = locale === 'zh' ? '/pages/' : '/en/pages/';
      const suffix = locale === 'zh' ? '.html' : '.en.html';
      for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(base + dir + 'product-itinerary' + suffix, { waitUntil: 'domcontentloaded' });
        const gallery = page.locator('.sp-feature-gallery').first();
        await gallery.scrollIntoViewIfNeeded();
        assert.equal(await gallery.locator('[role=tab]').count(), 3);
        assert.equal(await page.locator('.nav-links .is-current').count(), 1);
        await gallery.locator('[role=tab]').nth(2).click();
        assert.equal(await gallery.locator('[role=tab]').nth(2).getAttribute('aria-selected'), 'true');
        assert.equal(await gallery.locator('[role=tabpanel]:not([hidden])').count(), 1);
        await gallery.locator('[role=tabpanel]:not([hidden]) img').evaluate(img => img.decode());
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
        await gallery.screenshot({ path: path.join(shots, `${locale}-itinerary-${width}.png`) });
        console.log(`PASS ${locale} itinerary gallery ${width}`);
        await page.close();
      }

      for (const slug of ['solution-growth', 'solution-fulfill', 'tech-mining', 'cases']) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto(base + dir + slug + suffix, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('.nav-links .is-current').count(), 1, `${locale} ${slug} current nav`);
        if (slug === 'solution-growth') {
          const gallery = page.locator('.sp-feature-gallery').first();
          await gallery.scrollIntoViewIfNeeded();
          assert.equal(await gallery.locator('[role=tab]').count(), 4);
          await gallery.locator('[role=tab]').nth(2).click();
          await gallery.locator('[role=tabpanel]:not([hidden]) img').evaluate(img => img.decode());
          assert.equal(await gallery.locator('[role=tab]').nth(2).getAttribute('aria-selected'), 'true');
          await gallery.screenshot({ path: path.join(shots, `${locale}-meta.png`) });
        }
        if (slug === 'solution-fulfill') {
          const img = page.locator('.sp-feat-mock--order img');
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el => el.decode());
          assert((await img.getAttribute('src')).includes('order-management.png'));
        }
        if (slug === 'tech-mining') {
          const demo = page.locator('.tech-demo');
          await demo.scrollIntoViewIfNeeded();
          const text = await demo.locator('.tds-title').innerText();
          assert(text.includes(locale === 'zh' ? '游客挖需交流' : 'Traveler discovery'));
        }
        if (slug === 'cases') {
          const images = await page.locator('.cl-item img').evaluateAll(items => items.map(img => img.getAttribute('src')));
          assert.equal(images.length, 4);
          assert(images.every(src => src.includes('home-cases/')));
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `${locale} ${slug} overflow`);
        console.log(`PASS ${locale} ${slug}`);
        await page.close();
      }
      const mobileGrowth = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await mobileGrowth.goto(base + dir + 'solution-growth' + suffix, { waitUntil: 'domcontentloaded' });
      const mobileGallery = mobileGrowth.locator('.sp-feature-gallery').first();
      await mobileGallery.scrollIntoViewIfNeeded();
      await mobileGallery.locator('[role=tabpanel]:not([hidden]) img').evaluate(img => img.decode());
      assert.equal(await mobileGrowth.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
      assert((await mobileGallery.locator('.sp-gallery-open').first().getAttribute('href')).includes('meta-campaign-hierarchy.png'));
      await mobileGallery.screenshot({ path: path.join(shots, `${locale}-meta-390.png`) });
      console.log(`PASS ${locale} meta gallery 390`);
      await mobileGrowth.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
