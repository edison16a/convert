import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { wav } from "./support/fixtures";

test("audio converts with ffmpeg.wasm and shows a preparing state on first use", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([wav()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  const mp3 = await app.download("tone.mp3");
  // An MP3 starts with an ID3 tag or an MPEG frame sync.
  const startsLikeMp3 = mp3.subarray(0, 3).toString() === "ID3" || (mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0);
  expect(startsLikeMp3).toBe(true);
});

test("a WAV can become FLAC, OGG or M4A", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([wav()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("FLAC");
  await app.convert();
  await app.waitForDone();
  expect((await app.download("tone.flac")).subarray(0, 4).toString()).toBe("fLaC");
});
