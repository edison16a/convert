import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv, png, wav } from "./support/fixtures";

/** A PNG header with nothing behind it: detected as PNG, but the decoder will refuse it. */
const brokenPng = () => ({
  name: "broken.png",
  mimeType: "image/png",
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
});

test("one failed file does not block the others and can be retried", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([brokenPng(), png(), csv()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();

  await expect(app.row("broken.png")).toContainText("could not be read");
  await expect(app.row("broken.png").getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(app.row("people.json")).toContainText("CSV to JSON");
  await expect(page.getByText(/^2 files converted,/)).toBeVisible();
  await expect(page.getByText(/, 1 failed$/)).toBeVisible();
});

test("a running file can be cancelled and then retried", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([wav()]);
  await app.waitForDetection();
  await app.convert();
  await page.getByRole("button", { name: "Cancel tone.wav" }).click();
  await expect(app.row("tone.wav")).toContainText("Cancelled");

  await app.row("tone.wav").getByRole("button", { name: "Retry" }).click();
  await app.waitForDone();
  await expect(app.row("tone.mp3")).toContainText("WAV to MP3");
});

test("a file can be removed before converting", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv("a.csv"), csv("b.csv")]);
  await app.waitForDetection();
  await app.row("a.csv").getByRole("button", { name: "Remove a.csv" }).click();
  await expect(app.row("a.csv")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "1 file" })).toBeVisible();
});

test("progress and completion reach screen readers", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  await expect(page.getByRole("status")).toHaveText("All 1 files converted.");
});
