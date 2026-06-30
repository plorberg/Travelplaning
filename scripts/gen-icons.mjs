// Generates the PWA icons from an inline SVG. Run once and commit the PNGs:
// `node scripts/gen-icons.mjs`.
import { mkdirSync } from "node:fs";
import sharp from "sharp";

// Full-bleed blue square + white plane kept within the maskable safe zone
// (~58% of the canvas), so the same art works for "any" and "maskable".
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1d4ed8"/>
  <g transform="translate(106,106) scale(12.5)" fill="#ffffff">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const buf = Buffer.from(svg);
const out = [
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
  ["public/icons/icon-maskable-512.png", 512],
  ["public/icons/apple-touch-icon.png", 180],
];
for (const [path, size] of out) {
  await sharp(buf).resize(size, size).png().toFile(path);
  console.log("wrote", path, `${size}x${size}`);
}
