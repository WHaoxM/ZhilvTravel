const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..', 'dist');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const files = walk(root).filter(f => f.endsWith('.html'));
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const surface = html.replace(/<!--[\s\S]*?-->|<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/gi, '');
  const copy = surface.replace(/<[^>]+>/g, ' ') + [...surface.matchAll(/(?:alt|aria-label|data-title)="([^"]*)"/g)].map(m => m[1]).join(' ');
  assert(!/\bdemo\b|演示数据|模拟数据|预约(?:产品)?演示/i.test(copy), file);
  assert(!/xuntingtravel|平台连接范围以项目方案与授权接口为准|Platform coverage depends on the project scope/i.test(copy), file + ': internal wording');
  if (file.includes(`${path.sep}en${path.sep}`)) {
    for (const [, value] of surface.matchAll(/(?:alt|aria-label|title|placeholder|data-title|data-desc)="([^"]*)"/g)) {
      assert(!/[\u3400-\u9fff]/.test(value), `${file}: untranslated accessible label: ${value}`);
    }
    for (const [, value] of surface.matchAll(/>([^<]*)</g)) {
      const content = value.trim();
      assert(content === '中' || !/[\u3400-\u9fff]/.test(content), `${file}: untranslated visible copy: ${content.slice(0, 80)}`);
    }
  }
  assert(!/schedule your demo|安排演示/.test(html), file + ': chat response');
}
const supportScript = fs.readFileSync(path.join(root, 'assets/js/wenshu-contact.js'), 'utf8');
assert(!/xuntingtravel 客服|xuntingtravel support/.test(supportScript), 'chat must not show the service vendor as the support agent');
const multilingual = fs.readFileSync(path.join(root, 'en/pages/tech-multilingual.en.html'), 'utf8');
for (const label of ['English Inquiry', 'Japanese Inquiry', 'Arabic Inquiry']) {
  assert(multilingual.includes(`data-title="${label}"`), `English subpage has a clipped inquiry label: ${label}`);
}
const enHome = fs.readFileSync(path.join(root, 'en/index.html'), 'utf8');
for (const home of [fs.readFileSync(path.join(root, 'index.html'), 'utf8'), enHome]) {
  assert(!home.includes('nm-compare-note'), 'homepage retains generic note under comparison or workflow cards');
  assert(!/相关数据仅作参考|所示数据仅作参考|The figures are provided for reference/.test(home), 'homepage retains generic disclaimer');
}
const ecosystem = enHome.match(/<section class="nm-section nm-ecosystem"[\s\S]*?<\/section>/)?.[0] || '';
assert(ecosystem.includes('Build a Seamless Inbound Growth Ecosystem') && ecosystem.includes('Connected workflow stages'), 'English ecosystem section must be translated');
assert(!/无缝构建入境游增长生态|可衔接的业务环节|海外官网/.test(ecosystem), 'English ecosystem section contains untranslated Chinese copy');
assert(!/客户画像|7×24 多语种值守|>首页<span>|>客户案例<span>/.test(enHome), 'English homepage contains untranslated customer copy');
const enProduct = fs.readFileSync(path.join(root, 'en/pages/product-wenxiaolv.en.html'), 'utf8');
assert(!enProduct.includes('入境游的咨询发生在全球每一个时区'), 'English product page contains untranslated customer copy');
for (const [file, expected] of [
  ['index.html', ['全域获客', 'AI 智能接待', 'AI 方案生成']],
  ['en/index.html', ['Global Acquisition', 'AI Reception', 'AI Itinerary']]
]) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const titles = vm.runInNewContext(html.match(/var segTitles = (\[[^;]+\]);/)[1]);
  assert.equal(JSON.stringify(titles), JSON.stringify(expected), file + ': rotating titles');
  assert(!html.includes('<span class="screen-badge">'), file + ': removed badge');
  assert(/界面数值用于说明功能|Interface values illustrate functionality/.test(html), file + ': contextual disclosure');
}
console.log(`PASS customer copy: ${files.length} pages, accessible labels, chat replies and rotating titles`);
