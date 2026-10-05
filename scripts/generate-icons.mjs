// Renders the brand logo to the PNG icons the web manifest and iOS need.
// Run it with `node scripts/generate-icons.mjs` after changing assets/brand/logo.svg.
// It uses Playwright's Chromium purely as an SVG rasterizer.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = await readFile(path.join(root, "assets/brand/logo.svg"), "utf8");
const ACCENT = "#3B4CF5";

/**
 * Maskable icons get cropped by the OS, so they need a full bleed square. The
 * glyph already sits inside the central 80 percent safe zone, so it is reused as is.
 */
const maskable = logo.replace(/<rect[^>]*\/>/, `<rect width="96" height="96" fill="${ACCENT}"/>`);

const jobs = [
  { svg: logo, size: 192, file: "public/icons/icon-192.png" },
  { svg: logo, size: 512, file: "public/icons/icon-512.png" },
  { svg: maskable, size: 512, file: "public/icons/maskable-512.png" },
  { svg: logo, size: 180, file: "src/app/apple-icon.png" },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  for (const { svg, size, file } of jobs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
    );
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await page.screenshot({ omitBackground: true }));
    await page.close();
    console.log(`wrote ${file}`);
  }
} finally {
  await browser.close();
}
