const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const name of ["index.html", "privacy.html", "pages", "en", "assets"]) {
  if (name === "assets") continue;
  const source = path.join(root, name);
  const target = path.join(dist, name);
  if (!fs.existsSync(source)) continue;
  copy(source, target);
}

for (const asset of collectReferencedAssets()) {
  copy(asset, path.join(dist, path.relative(root, asset)));
}

writeLeadRuntimeConfig();

console.log(`Built static site at ${dist}`);

function copy(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copy(path.join(source, entry), path.join(target, entry));
    }
    return;
  }
  if (stat.isFile()) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}


function writeLeadRuntimeConfig() {
  const config = loadLeadConfig();
  const target = path.join(dist, "assets", "js", "lead-config.js");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const json = JSON.stringify(config, null, 2).replace(/<\//g, "<\\/");
  fs.writeFileSync(
    target,
    `/* Generated at build time. Public browser config only; never include secrets here. */\nwindow.WENSHU_LEAD_CONFIG = ${json};\n`,
    "utf8"
  );
}

function loadLeadConfig() {
  const defaults = {
    target: "webhook",
    endpoint: "https://www.xuntingtravel.com/api/wenshu?action=lead",
    method: "POST",
    timeoutMs: 10000,
    headers: {},
    fieldMap: {
      source: "source",
      phone: "phone",
      name: "name",
      company: "company",
      companyAddress: "company_address",
      language: "language",
      businessType: "business_type",
      pageTitle: "page_title",
      pageUrl: "page_url",
      referrer: "referrer",
      userAgent: "user_agent",
      submittedAt: "submitted_at",
    },
    extra: {},
  };
  const fileConfig = readJsonIfExists(path.join(root, "lead.config.json"));
  const envConfig = {
    target: process.env.WENSHU_LEAD_TARGET,
    endpoint: process.env.WENSHU_LEAD_ENDPOINT || process.env.WENSHU_LEAD_WEBHOOK_URL || process.env.WENSHU_LEAD_CRM_URL,
    method: process.env.WENSHU_LEAD_METHOD,
    timeoutMs: process.env.WENSHU_LEAD_TIMEOUT_MS ? Number(process.env.WENSHU_LEAD_TIMEOUT_MS) : undefined,
    headers: parseJsonEnv("WENSHU_LEAD_HEADERS"),
    fieldMap: parseJsonEnv("WENSHU_LEAD_FIELD_MAP"),
    extra: parseJsonEnv("WENSHU_LEAD_EXTRA"),
  };
  return compactDeep(mergeDeep(defaults, fileConfig || {}, envConfig));
}

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${file}: ${error.message}`);
  }
}

function parseJsonEnv(name) {
  const value = process.env[name];
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON in ${name}: ${error.message}`);
  }
}

function mergeDeep(...items) {
  const out = {};
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    for (const [key, value] of Object.entries(item)) {
      if (value === undefined || Number.isNaN(value)) continue;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        out[key] = mergeDeep(out[key], value);
      } else {
        out[key] = value;
      }
    }
  }
  return out;
}

function compactDeep(value) {
  if (Array.isArray(value)) return value.map(compactDeep);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined || Number.isNaN(child)) continue;
    out[key] = compactDeep(child);
  }
  return out;
}

function collectReferencedAssets() {
  const htmlFiles = [
    path.join(root, "index.html"),
    path.join(root, "privacy.html"),
    ...walk(path.join(root, "pages")).filter((file) => file.endsWith(".html")),
    path.join(root, "en", "index.html"),
    path.join(root, "en", "privacy.html"),
    ...walk(path.join(root, "en", "pages")).filter((file) => file.endsWith(".html")),
  ].filter((file) => fs.existsSync(file));
  const assetsRoot = path.join(root, "assets");
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
          refs.add(resolved);
        }
      }
    }
  }

  return [...refs].sort();
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
