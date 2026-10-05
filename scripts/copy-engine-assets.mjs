// Copies engine files out of node_modules and into public/ so the app serves
// them from its own origin. That keeps the "nothing leaves your device"
// promise honest: no CDN is ever contacted for an engine or its fonts.
import { cp, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Each entry copies one folder of a package to a folder under public/. */
const assets = [
  // ffmpeg's own worker script. It must not pass through webpack, which rewrites
  // the dynamic import of the core and breaks loading it from a blob URL.
  { from: "@ffmpeg/ffmpeg/dist/esm", to: "public/ffmpeg/worker" },
  { from: "@ffmpeg/core/dist/esm", to: "public/ffmpeg/st" },
  { from: "@ffmpeg/core-mt/dist/esm", to: "public/ffmpeg/mt" },
  { from: "pdfjs-dist/standard_fonts", to: "public/pdfjs/standard_fonts" },
  { from: "pdfjs-dist/cmaps", to: "public/pdfjs/cmaps" },
  { from: "pdfjs-dist/iccs", to: "public/pdfjs/iccs" },
  { from: "pdfjs-dist/wasm", to: "public/pdfjs/wasm" },
];

for (const { from, to } of assets) {
  const source = path.join(root, "node_modules", from);
  try {
    await access(source);
  } catch {
    console.warn(`engine assets: ${from} is not installed, skipping.`);
    continue;
  }
  const target = path.join(root, to);
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
  console.log(`engine assets: copied ${from} to ${to}`);
}
