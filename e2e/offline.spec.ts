import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv, docx, pdf, png, svg } from "./support/fixtures";

test("after the first load, conversions keep working with no network", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The app warms its engines when the browser is idle. Wait for the cache to fill.
  await page.waitForFunction(
    async () => {
      const cache = await caches.open("convert-shell-v1");
      const urls = (await cache.keys()).map((request) => request.url);
      return urls.some((url) => url.includes("avif_enc")) && urls.some((url) => url.includes("pdf.worker"));
    },
    undefined,
    { timeout: 90_000 },
  );

  await context.setOffline(true);
  await page.reload();
  const app = new ConvertApp(page);
  await expect(page.getByRole("heading", { name: "Drop files" })).toBeVisible();

  await app.addFiles([png(), csv(), docx(), svg(), await pdf()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  // Print every row first, so a failure in a slow environment says which file broke.
  console.log("offline rows:", JSON.stringify((await page.getByRole("listitem").allInnerTexts()).map((t) => t.replace(/\n+/g, " | "))));
  await expect(page.getByText(/^5 files converted,/)).toBeVisible();

  // AVIF has no native encoder in Chromium, so this goes through the cached WASM codec.
  await page.getByRole("button", { name: "Clear" }).click();
  await app.addFiles([png()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("AVIF");
  await app.convert();
  await app.waitForDone();
  expect((await app.download("photo.avif")).subarray(4, 12).toString()).toBe("ftypavif");
});
