#!/usr/bin/env node

/* Bilingual, responsive proof for the five user-specified homepage metrics. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.sites-artifacts', 'home-metrics');
const PORT = 4294;
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTHS = [320, 390, 768, 1024, 1440, 1920, 2560, 3840];
const VALUES = ['210', '100%', '90%', '200+', '7'];
const LABELS = {
  zh: ['全球投放国家／地区', '海外客户线索有效筛选', '节约人工成本', '语种互译', '全流程布局 · 签约到上线接单'],
  en: ['Countries / regions reached', 'Overseas lead screening coverage', 'Manual labor cost savings', 'Languages with two-way translation', 'Full rollout · signing to first orders'],
};

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn(process.execPath, ['scripts/serve-static-site.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore', windowsHide: true,
  });
  let browser;
  const cases = [];
  try {
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch(BASE)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ headless: true, args: ['--disable-gpu'] });
    for (const lang of ['zh', 'en']) {
      for (const width of WIDTHS) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(`${BASE}${lang === 'en' ? '/en/' : '/'}`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => document.fonts.ready);
        const section = page.locator('#metrics');
        await section.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 100));
        await page.waitForTimeout(150);
        const result = await page.evaluate(() => {
          const items = [...document.querySelectorAll('#metricsGrid .metric')];
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            sectionWidth: document.querySelector('#metrics').getBoundingClientRect().width,
            items: items.map(el => {
              const n = el.querySelector('b');
              const label = el.querySelector('span');
              const box = el.getBoundingClientRect();
              return {
                count: n.dataset.count, suffix: n.dataset.suffix || '', text: n.textContent.trim(),
                label: label.textContent.trim(), x: box.x, right: box.right, width: box.width,
                labelScrollWidth: label.scrollWidth, labelClientWidth: label.clientWidth,
              };
            }),
          };
        });
        if (errors.length) throw new Error(`${lang}/${width}: ${errors.join('; ')}`);
        if (result.overflow > 1.5) throw new Error(`${lang}/${width}: page overflow ${result.overflow}px`);
        if (result.items.length !== 5) throw new Error(`${lang}/${width}: expected 5 metrics`);
        for (let i = 0; i < 5; i++) {
          const item = result.items[i];
          if (!item.text.startsWith(VALUES[i])) throw new Error(`${lang}/${width}: metric ${i} is ${item.text}`);
          if (item.label !== LABELS[lang][i]) throw new Error(`${lang}/${width}: metric ${i} label is ${item.label}`);
          if (!item.label || item.width < 75 || item.x < -1 || item.right > width + 1)
            throw new Error(`${lang}/${width}: metric ${i} hidden or clipped`);
          if (item.labelScrollWidth > item.labelClientWidth + 1)
            throw new Error(`${lang}/${width}: metric ${i} label overflows`);
        }
        if (lang === 'zh' && [390, 1440, 2560].includes(width)) {
          const file = path.join(OUT, `metrics-${width}.png`);
          await section.screenshot({ path: file, animations: 'disabled' });
          result.screenshot = path.relative(ROOT, file);
        }
        cases.push({ lang, width, ...result });
        await page.close();
      }
      const animated = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
      await animated.goto(`${BASE}${lang === 'en' ? '/en/' : '/'}`, { waitUntil: 'domcontentloaded' });
      await animated.locator('#metricsGrid').scrollIntoViewIfNeeded();
      await animated.waitForTimeout(1800);
      const final = await animated.locator('#metricsGrid b').allTextContents();
      for (let i = 0; i < VALUES.length; i++)
        if (!final[i].startsWith(VALUES[i])) throw new Error(`${lang}: animated metric ${i} stopped at ${final[i]}`);
      await animated.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ cases }, null, 2) + '\n');
  console.log(`Homepage metrics: ${cases.length}/${WIDTHS.length * 2} bilingual viewport cases passed`);
  console.log(`Artifacts: ${OUT}`);
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
