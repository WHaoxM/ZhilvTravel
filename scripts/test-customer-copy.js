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
  assert(!/schedule your demo|安排演示/.test(html), file + ': chat response');
}
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
