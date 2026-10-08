const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const failures = [];
const warnings = [];

if (!fs.existsSync(path.join(dist, "index.html"))) {
  failures.push("Missing dist/index.html");
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const rel = slash(path.relative(dist, file));

  if (/[（(](占位|placeholder|asset pending|coming soon|待用户提供素材)[）)]/i.test(html)) {
    failures.push(`${rel}: visible placeholder marker remains`);
  }
  if (/待补充|ICP 备案号待申请|ICP filing pending/i.test(html)) {
    failures.push(`${rel}: launch blocker copy remains`);
  }

  for (const { attr, value } of extractRefs(html)) {
    if (!value || isExternal(value)) continue;
    if (value.startsWith("#")) {
      const id = value.slice(1);
      if (id && !hasId(html, id)) warnings.push(`${rel}: missing same-page anchor #${id}`);
      continue;
    }
    const clean = value.split("#")[0].split("?")[0];
    if (!clean) continue;
    const decoded = decodeURIComponent(clean);
    const target = path.resolve(path.dirname(file), decoded);
    if (!isInside(dist, target)) {
      failures.push(`${rel}: ${attr} escapes dist (${value})`);
      continue;
    }
    if (!fs.existsSync(target)) {
      failures.push(`${rel}: missing ${attr} target ${value}`);
    }
  }
}

if (warnings.length) {
  console.warn("Warnings:");
  for (const warning of warnings.slice(0, 30)) console.warn(`- ${warning}`);
  if (warnings.length > 30) console.warn(`- ... ${warnings.length - 30} more warnings`);
}

if (failures.length) {
  console.error("Validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files and local asset references.`);
require('./test-video-loading.js');
require('./test-customer-copy.js');
require('./test-home-image-coverage.js');
require('./test-home-image-quality.js');

function extractRefs(html) {
  const refs = [];
  const re = /\b(data-src|href|src|poster)\s*=\s*"([^"]+)"/gi;
  let match;
  while ((match = re.exec(html))) refs.push({ attr: match[1], value: match[2] });
  const meta = /<meta\s+(?:property|name)="(?:og:image|twitter:image)"\s+content="([^"]+)"/gi;
  while ((match = meta.exec(html))) refs.push({ attr: "meta-image", value: match[1] });
  return refs;
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value);
}

function hasId(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\bid=["']${escaped}["']`).test(html) || new RegExp(`\\bname=["']${escaped}["']`).test(html);
}

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

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

function slash(value) {
  return value.split(path.sep).join("/");
}
