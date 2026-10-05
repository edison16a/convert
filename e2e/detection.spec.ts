import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv, png } from "./support/fixtures";

test("a file with the wrong extension is identified by its content", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  const pngBytes = png("holiday.heic");
  await app.addFiles([{ ...pngBytes, mimeType: "image/heic" }]);
  await app.waitForDetection();
  // The name says HEIC, the bytes say PNG, and the chip believes the bytes.
  await expect(app.row("holiday.heic").getByText("PNG", { exact: true })).toBeVisible();
});

test("an unrecognized file is flagged and never blocks the rest", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([
    { name: "mystery.bin", mimeType: "application/octet-stream", buffer: Buffer.from([1, 2, 3, 0, 4, 5, 6]) },
    csv(),
  ]);
  await app.waitForDetection();
  await expect(app.row("mystery.bin")).toContainText("Unrecognized file type");
  await app.convert();
  await app.waitForDone();
  await expect(app.row("people.json")).toContainText("CSV to JSON");
});

test("100 files can be added at once and the page stays responsive", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  const files = Array.from({ length: 100 }, (_, i) => csv(`file-${i}.csv`));
  await app.addFiles(files);
  await expect(page.getByRole("heading", { name: "100 files" })).toBeVisible();
  await app.waitForDetection();
  await expect(page.getByRole("button", { name: "Convert 100 files" })).toBeEnabled();
});
