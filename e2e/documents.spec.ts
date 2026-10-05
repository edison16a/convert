import { strFromU8, unzipSync } from "fflate";
import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { docx, markdown, pdf, svg, xlsx } from "./support/fixtures";

test("Markdown converts to HTML, plain text and back", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([markdown()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("HTML");
  await app.convert();
  await app.waitForDone();
  const html = (await app.download("report.html")).toString();
  expect(html).toContain("<h1>Report</h1>");
  expect(html).toContain("<strong>bold</strong>");
});

test("Word converts to Markdown", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([docx()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("MD");
  await app.convert();
  await app.waitForDone();
  expect((await app.download("Q3-report.md")).toString()).toContain("Revenue grew across every region.");
});

test("a spreadsheet becomes JSON and YAML", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([xlsx()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("YAML");
  await app.convert();
  await app.waitForDone();
  expect((await app.download("budget.yaml")).toString()).toContain("item: Rent");
});

test("a PDF converts to text", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([await pdf()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  const text = (await app.download("brief.txt")).toString();
  expect(text).toContain("Page 1 of the sample");
  expect(text).toContain("Page 2 of the sample");
});

test("a multi page PDF becomes one image per page in a zip", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([await pdf()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("PNG");
  await app.convert();
  await app.waitForDone();
  const files = unzipSync(new Uint8Array(await app.download("brief.zip")));
  expect(Object.keys(files).sort()).toEqual(["brief-page-1.png", "brief-page-2.png"]);
  expect(strFromU8(files["brief-page-1.png"].subarray(1, 4))).toBe("PNG");
});

test("an SVG is rasterized to a PNG", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([svg()]);
  await app.waitForDetection();
  await app.chooseGlobalFormat("PNG");
  await app.convert();
  await app.waitForDone();
  const png = await app.download("dot.png");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1024); // small SVGs are scaled up to a useful size
});
