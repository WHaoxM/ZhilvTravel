const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const required = [
  { name: "dashboard-overview.png", label: "hero dashboard" },
  { name: "resource-library.png", label: "resource library" },
  { name: "token-usage.png", label: "token usage" },
];

const homepages = [path.join(root, "index.html"), path.join(root, "en", "index.html")];
const results = homepages.map((file) => {
  assert(fs.existsSync(file), `Missing homepage ${path.relative(root, file)}`);
  return validateHomepage(file, fs.readFileSync(file, "utf8"));
});

// When a deployable build is present, validate the exact files that will be served too.
const distHomepages = [path.join(root, "dist", "index.html"), path.join(root, "dist", "en", "index.html")];
if (distHomepages.every((file) => fs.existsSync(file))) {
  results.push(...distHomepages.map((file) => validateHomepage(file, fs.readFileSync(file, "utf8"))));
}
for (const item of required) {
  assert(
    results.every((result) => result[item.name]),
    `Chinese and English homepages must use the same high-resolution ${item.label} asset`,
  );
}

console.log("Validated homepage high-resolution product screenshots and bilingual asset parity.");

function validateHomepage(file, html) {
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const result = {};

  for (const item of required) {
    const tag = tags.find((candidate) => {
      const src = candidate.match(/\bsrc="([^"]+)"/i)?.[1] || "";
      return path.basename(src.split("#")[0].split("?")[0]) === item.name;
    });
    assert(tag, `${path.relative(root, file)}: missing ${item.label} source ${item.name}`);
    assert(/\bwidth="2549"(?=\s|\/?\>)/i.test(tag), `${path.relative(root, file)}: ${item.name} needs intrinsic width=2549`);
    assert(/\bheight="1352"(?=\s|\/?\>)/i.test(tag), `${path.relative(root, file)}: ${item.name} needs intrinsic height=1352`);

    const src = tag.match(/\bsrc="([^"]+)"/i)[1];
    const asset = path.resolve(path.dirname(file), src.split("#")[0].split("?")[0]);
    assert(fs.existsSync(asset), `${path.relative(root, file)}: missing image asset ${src}`);
    const dimensions = readPngDimensions(asset);
    assert(dimensions.width === 2549 && dimensions.height === 1352,
      `${path.relative(root, file)}: ${src} is ${dimensions.width}x${dimensions.height}, expected 2549x1352`);
    result[item.name] = path.basename(asset);
  }

  return result;
}

function readPngDimensions(file) {
  const data = fs.readFileSync(file);
  assert(data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")), `${file}: not a PNG`);
  assert(data.toString("ascii", 12, 16) === "IHDR", `${file}: missing PNG IHDR`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
