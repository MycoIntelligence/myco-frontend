import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "public", "hooks"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".json", ".html", ".svg", ".txt"]);

const FORBIDDEN = [
  "veldt",
  "kairo",
  "oligo",
  "oligo.security",
  "kangaroo",
  "own your security",
  "secure every change",
  "behavioral security",
  "ransomware",
  "software never stands still",
  "snapshots",
];

const problems = [];

function scanFile(filePath) {
  // Strip embedded base64 data to avoid false positive substring collisions in binary data
  const raw = readFileSync(filePath, "utf8");
  const stripped = raw.replace(/data:image\/[^"']+/g, "");
  const content = stripped.toLowerCase();
  for (const phrase of FORBIDDEN) {
    if (content.includes(phrase)) {
      problems.push(`${filePath.replace(ROOT, ".")}: contains forbidden reference phrase "${phrase}"`);
    }
  }
}

function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else if (EXTS.has(extname(name))) {
      scanFile(full);
    }
  }
}

for (const d of SCAN_DIRS) {
  walk(join(ROOT, d));
}

if (problems.length) {
  console.error("Reference copy found (forbidden):\n" + problems.join("\n"));
  process.exit(1);
}
console.info("check-no-reference-copy: clean");

