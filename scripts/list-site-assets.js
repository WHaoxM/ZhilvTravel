const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const assetsRoot = path.join(root, "assets");
const htmlFiles = [
  path.join(root, "index.html"),
  path.join(root, "privacy.html"),
  ...walk(path.join(root, "pages")).filter((file) => file.endsWith(".html")),
  path.join(root, "en", "index.html"),
  path.join(root, "en", "privacy.html"),
  ...walk(path.join(root, "en", "pages")).filter((file) => file.endsWith(".html")),
].filter((file) => fs.existsSync(file));

const refs = new Set();
const patterns = [
  /["']((?:\.\.\/)*assets\/[^"' <>)]+)["']/g,
  /url\((?:["']?)((?:\.\.\/)*assets\/[^"')\s]+)(?:["']?)\)/g,
];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) {
      const clean = match[1].replace(/&amp;/g, "&").split("#")[0].split("?")[0];
      const resolved = path.resolve(path.dirname(file), clean);
      if (resolved.startsWith(`${assetsRoot}${path.sep}`) && fs.existsSync(resolved)) {
        refs.add(path.relative(root, resolved).split(path.sep).join("/"));
      }
    }
  }
}

console.log([...refs].sort().join("\n"));

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(file));
    else if (entry.isFile()) out.push(file);
  }
  return out;
}
