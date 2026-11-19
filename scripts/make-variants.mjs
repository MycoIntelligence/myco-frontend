import sharp from "sharp";

const [src, outSharp, outBlur] = process.argv.slice(2);

if (!src || !outSharp || !outBlur) {
  console.info("Usage: node scripts/make-variants.mjs <src> <outSharp> <outBlur>");
  process.exit(0);
}

try {
  const base = sharp(src)
    .resize(1600, 1600, { fit: "cover" })
    .grayscale()
    .normalise()
    .linear(0.92, 6);

  await base.clone().tint("#5f8f8c").webp({ quality: 82 }).toFile(outSharp);
  await base.clone().blur(26).tint("#5f8f8c").webp({ quality: 78 }).toFile(outBlur);
  console.info(`Generated: ${outSharp} and ${outBlur}`);
} catch (err) {
  console.error("Error in make-variants:", err);
  process.exit(1);
}

