#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';
const out = path.resolve(__dirname, '..', '.sites-artifacts', 'home-cases');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const locale of ['zh', 'en']) {
      const root = locale === 'zh' ? '/' : '/en/';
      const sub = locale === 'zh' ? '/pages/' : '/en/pages/';
      const ext = locale === 'zh' ? '.html' : '.en.html';
      const title = locale === 'zh' ? '文数智旅为你接住全球客源' : 'WenshuTravelConnectsYouwithTravelersWorldwide';
      for (const width of [390, 1440, 2560]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(base + root, { waitUntil: 'domcontentloaded' });
        await page.locator('#cases').scrollIntoViewIfNeeded();
        const section = page.locator('#cases');
        const heading = (await section.locator('h2').innerText()).replace(/\s+/g, '');
        assert.equal(heading, title, `${locale} title at ${width}`);
        for (let i = 0; i < 4; i++) {
          const img = section.locator('.case-slide img').nth(i);
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(el => el.decode());
        }
        await section.locator('.case-slide').first().scrollIntoViewIfNeeded();
        const media = await section.locator('.case-slide img').evaluateAll(images => images.map(img => ({
          src: img.currentSrc, complete: img.complete, width: img.naturalWidth,
          card: img.closest('.case-slide').getBoundingClientRect().width,
          rendered: img.getBoundingClientRect().width,
        })));
        assert.equal(media.length, 4);
        for (const img of media) {
          assert(img.src.includes('/home-cases/'), img.src);
          assert(img.complete && img.width > 0, `image failed ${img.src}`);
          assert(Math.abs(img.card - img.rendered) < 1, `image/card width mismatch ${width}`);
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
        assert.equal(overflow, false, `${locale} horizontal overflow at ${width}`);
        await section.screenshot({ path: path.join(out, `${locale}-${width}.png`) });
        console.log(`PASS cases ${locale} ${width}px`);
        await page.close();
      }
      for (const slug of ['cases', 'solution-growth', 'product-wenxiaolv']) {
        for (const control of ['header .nav-links > li:first-child a', 'header .brand']) {
          const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
          await page.goto(base + sub + slug + ext, { waitUntil: 'domcontentloaded' });
          await page.locator(control).click();
          try {
            await page.waitForURL(url => url.pathname === root || url.pathname === root + 'index.html', { timeout: 12000 });
          } catch (error) {
            throw new Error(`Return-home failed: ${locale} ${slug} ${control}, current URL ${page.url()}: ${error.message}`);
          }
          console.log(`PASS return home ${locale} ${slug} ${control}`);
          await page.close();
        }
      }
      const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await mobile.goto(base + sub + 'cases' + ext, { waitUntil: 'domcontentloaded' });
      await mobile.locator('#mobileMenuToggle').click();
      await mobile.locator('.mobile-nav-link').first().click();
      await mobile.waitForURL(url => url.pathname === root || url.pathname === root + 'index.html', { timeout: 8000 });
      console.log(`PASS mobile return home ${locale}`);
      await mobile.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
