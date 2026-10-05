// Copies the ffmpeg.wasm core files out of node_modules and into public/ffmpeg
// so the app serves them from its own origin. That keeps the "nothing leaves
// your device" promise honest: no CDN is ever contacted for the engine.
import { cp, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Each entry maps a package to the folder it is served from. */
const cores = [
  { pkg: "@ffmpeg/core", dest: "public/ffmpeg/st" },
  { pkg: "@ffmpeg/core-mt", dest: "public/ffmpeg/mt" },
];

for (const { pkg, dest } of cores) {
  const from = path.join(root, "node_modules", pkg, "dist", "esm");
  try {
    await access(from);
  } catch {
    console.warn(`ffmpeg core: ${pkg} is not installed, skipping.`);
    continue;
  }
  const to = path.join(root, dest);
  await mkdir(to, { recursive: true });
  await cp(from, to, { recursive: true });
  console.log(`ffmpeg core: copied ${pkg} to ${dest}`);
}
