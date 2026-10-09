const fs = require('node:fs');
const path = require('node:path');

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
  }
}

console.log('Validated ecosystem order and bilingual destination indicators.');
