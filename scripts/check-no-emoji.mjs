import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "dist", "out", "coverage", "myco1"]);
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".md", ".mdx", ".json", ".html", ".svg", ".txt", ".yml", ".yaml"]);
// Registered, copyright and trademark signs are legal punctuation, not emoji.
const ALLOWED = new Set(["\u00A9", "\u00AE", "\u2122"]);
const EMOJI = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{FE0F}\u{20E3}]/gu;

const problems = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    if (!EXTS.has(extname(name))) continue;
    const lines = readFileSync(full, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(EMOJI)) {
        if (ALLOWED.has(m[0])) continue;
        problems.push(`${full.replace(ROOT, ".")}:${i + 1}:${m.index + 1} U+${m[0].codePointAt(0).toString(16).toUpperCase()}`);
      }
    });
  }
}

walk(ROOT);
if (problems.length) {
  console.error("Emoji found (not allowed in this project):\n" + problems.join("\n"));
  process.exit(1);
}
console.info("check-no-emoji: clean");

