import { strFromU8, unzipSync } from "fflate";
import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv, docx, markdown, png, xlsx } from "./support/fixtures";

test("a mixed batch converts with one click and each file downloads", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([png(), csv(), markdown(), docx(), xlsx()]);
  await app.waitForDetection();

  // Defaults come from the registry: png to jpg, csv to json, md and docx to pdf, xlsx to csv.
  await expect(app.row("photo.png")).toContainText("PNG");
  await app.convert();
  await app.waitForDone();

  const jpg = await app.download("photo.jpg");
  expect([...jpg.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);

  const json = JSON.parse((await app.download("people.json")).toString());
  expect(json).toEqual([{ name: "Ada", age: 36 }, { name: "Lin", age: 29 }]);

  expect((await app.download("report.pdf")).subarray(0, 4).toString()).toBe("%PDF");
  expect((await app.download("Q3-report.pdf")).subarray(0, 4).toString()).toBe("%PDF");
  expect((await app.download("budget.csv")).toString()).toContain("Rent,1200");

  await expect(page.getByText(/^5 files converted,/)).toBeVisible();
});

test("the global format changes every compatible row at once", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([png("a.png"), png("b.png"), csv()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("WEBP");

  await expect(app.row("a.png").getByRole("button", { name: /Output format/ })).toContainText("WEBP");
  await expect(app.row("b.png").getByRole("button", { name: /Output format/ })).toContainText("WEBP");
  // CSV cannot become WebP, so it keeps its own choice and says why.
  await expect(app.row("people.csv").getByRole("button", { name: /Output format/ })).toContainText("JSON");
  await expect(app.row("people.csv")).toContainText("Cannot convert to WEBP");
});

test("Download all streams a zip with de-duplicated names", async ({ page }) => {
  // Stand in for the File System Access picker so we can read what gets written.
  await page.addInitScript(() => {
    const chunks: number[][] = [];
    Object.assign(window, { __zipChunks: chunks, __zipClosed: false });
    const handle = {
      createWritable: async () => ({
        write: async (chunk: Uint8Array) => void chunks.push([...chunk]),
        close: async () => void Object.assign(window, { __zipClosed: true }),
      }),
    };
    Object.assign(window, { showSaveFilePicker: async () => handle });
  });
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv("data.csv"), csv("data.csv"), markdown()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  await page.getByRole("button", { name: "Download all" }).click();
  // The zip is only complete once the writable has been closed.
  await page.waitForFunction(() => (window as never as { __zipClosed: boolean }).__zipClosed);

  const bytes = await page.evaluate(() => (window as never as { __zipChunks: number[][] }).__zipChunks.flat());
  const files = unzipSync(new Uint8Array(bytes));
  expect(Object.keys(files).sort()).toEqual(["data (1).json", "data.json", "report.pdf"]);
  expect(strFromU8(files["data.json"])).toContain("Ada");
});

test("Download all falls back to a plain download without the File System Access API", async ({ page }) => {
  await page.addInitScript(() => Object.assign(window, { showSaveFilePicker: undefined }));
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv(), markdown()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download all" }).click()]);
  expect(download.suggestedFilename()).toBe("converted.zip");
});

test("Clear starts over with an empty page", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  await page.getByRole("button", { name: "Clear" }).click();
  await expect(page.getByRole("heading", { name: "Drop files" })).toBeVisible();
});
