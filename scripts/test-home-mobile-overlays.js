#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const screenshotDir = path.join(root, '.sites-artifacts', 'mobile-overlay-regression');
const cases = [
  { route: '/', width: 320, height: 568 },
  { route: '/', width: 390, height: 400 },
  { route: '/', width: 390, height: 844 },
  { route: '/', width: 768, height: 900 },
  { route: '/', width: 844, height: 390 },
  { route: '/', width: 1280, height: 800 },
  { route: '/en/', width: 320, height: 568 },
  { route: '/en/', width: 390, height: 844 },
  { route: '/pages/cases.html', width: 390, height: 844, loginOnly: true },
  { route: '/en/pages/cases.en.html', width: 390, height: 844, loginOnly: true },
];

(async () => {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const selected = server.address().port;
      server.close(() => resolve(selected));
    });
  });
  const server = spawn(process.execPath, [path.join(root, 'scripts/serve-static-site.js')], {
    cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore', windowsHide: true,
  });
  let browser;
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${port}/`, response => { response.resume(); resolve(); }).on('error', reject);
        });
        break;
      } catch (error) {
        if (attempt === 39) throw error;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    browser = await chromium.launch({ headless: true });
    fs.mkdirSync(screenshotDir, { recursive: true });
    for (const testCase of cases) {
      const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height } });
      try {
        await page.route('**/api/wenshu**', route => route.fulfill({ status: 503, body: '{}' }));
        if (testCase.route === '/' && testCase.width === 390 && testCase.height === 844) {
          await page.addInitScript(() => {
            window.__mobileShifts = [];
            new PerformanceObserver(list => list.getEntries().forEach(entry => window.__mobileShifts.push(entry.value)))
              .observe({ type: 'layout-shift', buffered: true });
          });
        }
        await page.goto(`http://127.0.0.1:${port}${testCase.route}`, { waitUntil: 'domcontentloaded' });
        const login = await page.evaluate(() => {
          const link = document.querySelector('.nav-cta .nav-login');
          const menu = document.getElementById('mobileMenuToggle');
          const cta = document.querySelector('.nav-cta .btn');
          const rect = link.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();
          const ctaRect = cta.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return { href: link.href, x: rect.x, right: rect.right, width: rect.width, height: rect.height,
            visible: hit && !!hit.closest('.nav-cta .nav-login'), menuRight: menuRect.right, ctaLeft: ctaRect.left };
        });
        assert.equal(login.href, 'https://app.zhilvtravel.com/login');
        assert(login.visible && login.x >= 0 && login.right <= testCase.width && (testCase.width > 860 || (login.width >= 44 && login.height >= 44)),
          `header login inaccessible: ${testCase.route} ${testCase.width}px ${JSON.stringify(login)}`);
        if (testCase.width <= 860) assert(login.x >= login.menuRight && login.right <= login.ctaLeft,
          `header login overlaps navigation: ${testCase.route} ${testCase.width}px ${JSON.stringify(login)}`);
        if (testCase.route === '/' && testCase.width === 390 && testCase.height === 844)
          await page.locator('.nav').screenshot({ path: path.join(screenshotDir, 'mobile-login-390.png') });
        if (testCase.route === '/' && testCase.width === 320)
          await page.locator('.nav').screenshot({ path: path.join(screenshotDir, 'mobile-login-320.png') });
        if (testCase.loginOnly) {
          await page.locator('#chatFab').click();
          await page.waitForTimeout(400);
          assert.equal(await page.locator('.chat-backdrop').isVisible(), true, `${testCase.route}: mobile chat backdrop missing`);
          const chatCloseVisible = await page.locator('#chatClose').evaluate(element => {
            const rect = element.getBoundingClientRect();
            return !!document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).closest('#chatClose');
          });
          assert(chatCloseVisible, `${testCase.route}: mobile chat close is obscured`);
          await page.locator('#chatClose').click();
          await page.locator('.nav [data-source="nav"]').click();
          await page.waitForTimeout(400);
          const leadCloseVisible = await page.locator('#leadClose').evaluate(element => {
            const rect = element.getBoundingClientRect();
            return !!document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).closest('#leadClose');
          });
          assert(leadCloseVisible, `${testCase.route}: mobile lead close is obscured`);
          await page.locator('#leadClose').click();
          console.log(`PASS ${testCase.route} ${testCase.width}x${testCase.height}`);
          continue;
        }
        if (testCase.width <= 860) {
          const mobileLayout = await page.evaluate(() => {
            const staticText = document.querySelector('.hero-typewriter-mobile');
            const chip = document.querySelector('.sol-panel[data-panel="0"] .prop-item');
            const label = chip.querySelector('.prop-label');
            return { staticText: staticText.textContent.trim(), staticVisible: getComputedStyle(staticText).display !== 'none',
              typingHidden: getComputedStyle(document.querySelector('.hero-typewriter-current')).display === 'none',
              sheenHidden: getComputedStyle(document.querySelector('.nav-cta .btn'), '::after').content === 'none',
              chipWidth: chip.getBoundingClientRect().width, labelWidth: label.getBoundingClientRect().width };
          });
          assert(mobileLayout.staticVisible && mobileLayout.typingHidden && mobileLayout.sheenHidden && mobileLayout.chipWidth >= 125 && mobileLayout.labelWidth >= 65,
            `mobile hero or feature chips unstable: ${testCase.route} ${testCase.width}px ${JSON.stringify(mobileLayout)}`);
          if (testCase.route === '/' && testCase.width === 390 && testCase.height === 844) {
            await page.waitForTimeout(4000);
            const stable = await page.evaluate(() => ({
              text: document.querySelector('.hero-typewriter-mobile').textContent.trim(),
              shifts: window.__mobileShifts || [],
            }));
            assert.equal(stable.text, mobileLayout.staticText, 'mobile hero text changed while viewing');
            assert(stable.shifts.reduce((sum, value) => sum + value, 0) < 0.01,
              `mobile opening layout shifted: ${JSON.stringify(stable.shifts)}`);
          }
        } else if (testCase.route === '/') {
          const before = await page.locator('#typewriter-text').textContent();
          await page.waitForTimeout(350);
          const after = await page.locator('#typewriter-text').textContent();
          assert.notEqual(after, before, 'desktop typewriter stopped advancing');
          await page.setViewportSize({ width: 390, height: 844 });
          assert.equal(await page.locator('.hero-typewriter-mobile').isVisible(), true, 'mobile copy did not appear after resizing');
          await page.setViewportSize({ width: testCase.width, height: testCase.height });
        }
        const typewriter = await page.evaluate(() => {
          const text = document.getElementById('typewriter-text');
          const next = document.querySelector('.hero-sub');
          const samples = ['', ...[...document.querySelectorAll('.hero-typewriter-sizer')].map(item => item.textContent.slice(0, -1))];
          return samples.map(sample => { text.textContent = sample; return next.getBoundingClientRect().top; });
        });
        assert(typewriter.every(top => Math.abs(top - typewriter[0]) < 1), `typewriter moved hero content: ${testCase.route} ${testCase.width}px ${typewriter}`);

        await page.locator('#chatFab').click();
        await page.waitForTimeout(400);
        const chat = await page.evaluate(() => {
          const panel = document.getElementById('chatPanel').getBoundingClientRect();
          const close = document.getElementById('chatClose').getBoundingClientRect();
          const target = document.elementFromPoint(close.x + close.width / 2, close.y + close.height / 2);
          const composer = document.getElementById('chatInput').getBoundingClientRect();
          const composerTarget = document.elementFromPoint(composer.x + composer.width / 2, composer.y + composer.height / 2);
          return { top: panel.top, bottom: panel.bottom, height: panel.height, closeVisible: target && !!target.closest('#chatClose'), composerVisible: composerTarget && composerTarget.id === 'chatInput',
            welcomeHidden: getComputedStyle(document.querySelector('.cp-welcome')).display === 'none',
            toolsHidden: getComputedStyle(document.querySelector('.cp-tools')).display === 'none',
            backdropVisible: getComputedStyle(document.querySelector('.chat-backdrop')).display !== 'none',
            inputFontSize: parseFloat(getComputedStyle(document.getElementById('chatInput')).fontSize) };
        });
        assert(chat.top >= 0 && chat.bottom <= testCase.height + 1 && chat.closeVisible && chat.composerVisible, `chat controls inaccessible: ${testCase.route} ${testCase.width}px ${JSON.stringify(chat)}`);
        if (testCase.width <= 600) assert(chat.height <= 561 && chat.welcomeHidden && chat.toolsHidden && chat.backdropVisible && chat.inputFontSize >= 16,
          `mobile chat is crowded or may zoom on focus: ${testCase.route} ${testCase.width}px ${JSON.stringify(chat)}`);
        if (testCase.route === '/' && testCase.width === 390) await page.screenshot({ path: path.join(screenshotDir, `chat-390x${testCase.height}.png`) });
        if (testCase.route === '/' && testCase.width === 320) await page.screenshot({ path: path.join(screenshotDir, 'chat-320x568.png') });
        if (testCase.route === '/' && testCase.width === 390 && testCase.height === 844) {
          await page.locator('#chatInput').focus();
          assert.equal(await page.locator('.cp-contact').isVisible(), false, 'secondary phone row crowds message entry');
          await page.setViewportSize({ width: 390, height: 400 });
          const focused = await page.evaluate(() => {
            const composer = document.getElementById('chatInput').getBoundingClientRect();
            const panel = document.getElementById('chatPanel').getBoundingClientRect();
            return { panelTop: panel.top, panelBottom: panel.bottom,
              composerVisible: !!document.elementFromPoint(composer.x + composer.width / 2, composer.y + composer.height / 2)?.closest('#chatInput') };
          });
          assert(focused.panelTop >= 0 && focused.panelBottom <= 401 && focused.composerVisible, `compact chat composer inaccessible: ${JSON.stringify(focused)}`);
          await page.setViewportSize({ width: 390, height: 844 });
          await page.locator('#chatClose').focus();
          await page.mouse.click(5, 100);
          assert.equal(await page.locator('#chatPanel').isVisible(), false, 'tap outside did not close mobile chat');
          assert.equal(await page.locator('body').evaluate(element => element.classList.contains('chat-is-open')), false, 'chat scroll lock remained after closing');
          await page.locator('#chatFab').click();
        }
        await page.locator('#chatClose').click();

        await page.locator('.nav [data-source="nav"]').click();
        await page.waitForTimeout(400);
        const lead = await page.evaluate(() => {
          const modal = document.querySelector('#leadMask .modal').getBoundingClientRect();
          const close = document.getElementById('leadClose').getBoundingClientRect();
          const target = document.elementFromPoint(close.x + close.width / 2, close.y + close.height / 2);
          return { top: modal.top, bottom: modal.bottom, closeVisible: target && !!target.closest('#leadClose') };
        });
        assert(lead.top >= 0 && lead.bottom <= testCase.height + 1 && lead.closeVisible, `lead dialog inaccessible: ${testCase.route} ${testCase.width}px ${JSON.stringify(lead)}`);
        if (testCase.route === '/' && testCase.width === 390) await page.screenshot({ path: path.join(screenshotDir, 'lead-390.png') });
        await page.locator('#leadClose').click();
        console.log(`PASS ${testCase.route} ${testCase.width}x${testCase.height}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
    await once(server, 'exit').catch(() => {});
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
