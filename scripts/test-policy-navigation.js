#!/usr/bin/env node
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of ['/', '/en/']) {
      for (const width of [390, 1440, 2560]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.goto(base + route, { waitUntil: 'domcontentloaded' });
        const policy = page.locator('#policy-evidence');
        assert.equal(await policy.count(), 1);
        assert.equal(await policy.locator('.policy-card').count(), 4);
        assert.equal(await policy.locator('.policy-stat').count(), 3);
        await policy.scrollIntoViewIfNeeded();
        assert.equal(await policy.locator('.policy-card img').evaluateAll(async images => {
          images.forEach(image => { image.loading = 'eager'; });
          await Promise.all(images.map(image => image.decode()));
          return images.every(image => image.naturalWidth > 0);
        }), true);
        assert.match(await policy.innerText(), /65/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
        assert.deepEqual(pageErrors, []);

        if (width > 900) {
          const groups = page.locator('.sub-menu--solutions .nav-menu-group');
          assert.equal(await groups.count(), 3);
          const trigger = page.locator('.nav-menu-trigger').filter({ hasText: route === '/' ? '解决方案' : 'Solutions' }).first();
          await trigger.click();
          await page.waitForFunction(() => getComputedStyle(document.querySelector('.sub-menu--solutions')).visibility === 'visible');
          assert.equal(await groups.first().isVisible(), true);
          assert.equal(await groups.locator('.navigation-card').count(), 11);
          assert.equal(await groups.locator('.name').evaluateAll(names => names.every(name => name.scrollWidth <= name.clientWidth + 2)), true);
          const aboutTrigger = page.locator('.nav-menu-trigger').filter({ hasText: route === '/' ? '关于我们' : 'About' }).first();
          await aboutTrigger.click();
          const policyLink = page.locator('.nav-mega .navigation-card[href="#policy-evidence"]');
          await policyLink.click();
          assert.equal(new URL(page.url()).hash, '#policy-evidence');
        } else {
          await page.locator('#mobileMenuToggle').click();
          await page.locator('#mobileNav .mobile-nav-group').last().locator('summary').click();
          const policyLink = page.locator('#mobileNav a[href="#policy-evidence"]');
          assert.equal(await policyLink.count(), 1);
          await policyLink.click();
          assert.equal(new URL(page.url()).hash, '#policy-evidence');
        }
        console.log(`PASS ${route} @ ${width}px`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
