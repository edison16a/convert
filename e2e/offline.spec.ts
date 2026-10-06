import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv, docx, pdf, png, svg } from "./support/fixtures";

test("after the first load, conversions keep working with no network", async ({ page, context }) => {
  // Errors from the converter workers, printed so a CI failure says what broke.
  page.on("console", (message) => {
    if (message.type() === "error") console.log("page console error:", message.text().slice(0, 300));
  });
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // The app marks the page once its offline copy is complete. Going offline any earlier would
  // cut off files that are still downloading.
  await page.waitForSelector('html[data-offline="ready"]', { timeout: 90_000 });

  const cached = await page.evaluate(async () => (await (await caches.open("convert-shell-v1")).keys()).map((r) => new URL(r.url).pathname));
  console.log("cached files:", cached.length, "chunks:", cached.filter((url) => url.includes("/chunks/")).length);
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
