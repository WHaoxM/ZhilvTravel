const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const homepages = [path.join(root, "index.html"), path.join(root, "en", "index.html")];
const results = homepages.map(validateHomepage);

assert(
  sameBasenames(results[0].solutionImages, results[1].solutionImages),
  "Chinese and English homepages must use the same primary solution images",
);

console.log("Validated source homepage scene-image coverage and uniqueness in both languages.");

function validateHomepage(file) {
  const homepage = fs.readFileSync(file, "utf8");
  const label = path.relative(root, file) || path.basename(file);
  const solutionCards = [
    ...homepage.matchAll(/<a class="citem row-2[^"]*"[\s\S]*?<span class="[^"]*\bci-img\b[^"]*"[^>]*>([\s\S]*?)<\/span>/g),
  ];
  const solutionImages = solutionCards.map((match) => extractImage(match[1]));
  const proofImages = [
    ...homepage.matchAll(/<header class="nm-proof-card__head"><img\s+src="([^"]+)"/g),
  ].map((match) => match[1]);

  assert(solutionCards.length === 8, `${label}: expected 8 primary solution cards, found ${solutionCards.length}`);
  assert(solutionImages.every(Boolean), `${label}: every primary solution card must include a scene image`);
  assertUniqueFiles(solutionImages, file, `${label}: primary solution cards`);
  assert(proofImages.length === 6, `${label}: expected 6 AI-native scenario images, found ${proofImages.length}`);
  assertUniqueFiles(proofImages, file, `${label}: AI-native scenario cards`);
  return { solutionImages, proofImages };
}

function extractImage(fragment) {
  return fragment.match(/<img\s+[^>]*src="([^"]+)"/)?.[1] || "";
}

function assertUniqueFiles(items, htmlFile, label) {
  const identities = items.map((item) => {
    const clean = decodeURIComponent(item.split("#")[0].split("?")[0]);
    const file = path.resolve(path.dirname(htmlFile), clean);
    assert(fs.existsSync(file), `${label}: missing image asset ${item}`);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    return { item, file: path.normalize(file).toLowerCase(), hash };
  });
  const duplicates = identities.filter((entry, index) =>
    identities.findIndex((candidate) => candidate.file === entry.file || candidate.hash === entry.hash) !== index,
  );
  assert(duplicates.length === 0, `${label} reuse image content: ${[...new Set(duplicates.map((entry) => entry.item))].join(", ")}`);
}

function sameBasenames(left, right) {
  return left.length === right.length && left.every((item, index) => path.basename(item) === path.basename(right[index]));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
