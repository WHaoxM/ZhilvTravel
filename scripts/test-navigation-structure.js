const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dist = path.resolve(__dirname, '..', 'dist');
const read = (relative) => fs.readFileSync(path.join(dist, relative), 'utf8');

for (const home of ['index.html', 'en/index.html']) {
  const html = read(home);
  const ecosystem = html.indexOf('<section class="nm-section nm-ecosystem"');
  const solution = html.indexOf('<section class="section solution" id="solution"');
  if (ecosystem < 0 || solution < 0 || ecosystem >= solution) {
    throw new Error(`${home}: growth ecosystem must precede full-chain solutions`);
  }
}

const destinations = [
  'solution-boutique', 'solution-convert', 'solution-data',
  'solution-fulfill', 'solution-ground-ops', 'solution-growth',
  'solution-plan', 'solution-scenic', 'solution-travel-agency',
  'data-social', 'data-source', 'data-trends',
  'tech-knowledge', 'tech-mining', 'tech-multilingual',
];
for (const slug of destinations) {
  for (const [prefix, suffix] of [['pages/', '.html'], ['en/pages/', '.en.html']]) {
    const relative = `${prefix}${slug}${suffix}`;
    const html = read(relative);
    if (!/<nav class="sp-solution-location"[^>]*>[\s\S]*?<span aria-current="page">[^<]+<\/span><\/nav>/.test(html)) {
      throw new Error(`${relative}: missing current destination indicator`);
    }
    assertCurrentNav(relative, html, 'solutions');
  }
}

function assertCurrentNav(relative, html, expected) {
  const script = html.match(/\/\* 子页当前板块标记[^]*?\*\/\s*(\(function\(\)\{[^]*?\}\)\(\);)/);
  if (!script) throw new Error(`${relative}: missing current-section script`);
  const current = new Set();
  const triggers = ['products', 'solutions', 'about'].map(name => ({
    tagName: 'BUTTON',
    classList: { add(value) { if (value === 'is-current') current.add(name); } },
  }));
  const nav = {
    querySelectorAll() { return triggers; },
    querySelector(selector) {
      const name = selector.includes('cases') ? 'cases' : 'insights';
      return {
        tagName: 'A',
        classList: { add(value) { if (value === 'is-current') current.add(name); } },
        setAttribute() {},
      };
    },
  };
  vm.runInNewContext(script[1], {
    location: { pathname: `/${relative}` },
    document: { querySelector() { return nav; } },
  });
  if (current.size !== 1 || !current.has(expected)) {
    throw new Error(`${relative}: expected ${expected} nav, got ${[...current].join(', ') || 'none'}`);
  }
}

for (const [slug, expected] of [
  ['product-wenxiaolv', 'products'],
  ['cases', 'cases'],
  ['insights', 'insights'],
]) {
  for (const [prefix, suffix] of [['pages/', '.html'], ['en/pages/', '.en.html']]) {
    const relative = `${prefix}${slug}${suffix}`;
    assertCurrentNav(relative, read(relative), expected);
  }
}

console.log('Validated ecosystem order, bilingual destination indicators, and active navigation.');
