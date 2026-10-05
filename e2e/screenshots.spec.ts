import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { bigWav } from "./support/bigWav";
import { csv, docx, markdown, png, wav, xlsx } from "./support/fixtures";

/**
 * Not a real test: it regenerates the README screenshots. Run it with
 * `CAPTURE=1 npm run e2e -- screenshots`. It is skipped in normal runs.
 */
test.skip(!process.env.CAPTURE, "set CAPTURE=1 to regenerate docs/screenshots");
test.describe.configure({ mode: "serial" });

const OUT = path.resolve("docs/screenshots");

async function shot(page: Page, name: string) {
  await mkdir(OUT, { recursive: true });
  // Let transitions settle so the image never catches a half faded state.
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

const batch = () => [
  png("IMG_4021.png"),
  docx("Q3-report.docx"),
  png("headshot.png"),
  xlsx("budget.xlsx"),
  markdown("launch-notes.md"),
  csv("signups.csv"),
];

test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

test("empty, queued with the format menu, converting and done", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await shot(page, "empty");

  await app.addFiles(batch());
  await app.waitForDetection();
  await page.getByRole("button", { name: "Convert all files to" }).click();
  await shot(page, "queued-menu");
  await page.keyboard.press("Escape");

  await app.convert();
  await app.waitForDone();
  await shot(page, "done");
});

test("converting shows live progress", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([bigWav("voice-memo.wav", 240), png("headshot.png"), csv("signups.csv"), docx("Q3-report.docx")]);
  await app.waitForDetection();
  await app.convert();
  await expect(page.getByRole("progressbar").first()).toHaveAttribute("aria-valuenow", /^(2|3|4|5)\d$/);
  await shot(page, "converting");
  await app.waitForDone();
});

test("phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const app = new ConvertApp(page);
  await app.open();
  await shot(page, "mobile-empty");
  await app.addFiles([png("IMG_4021.png"), docx("Q3-report.docx"), wav("voice-memo.wav"), xlsx("budget.xlsx")]);
  await app.waitForDetection();
  await shot(page, "mobile-queued");
});

test("dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles(batch());
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  await shot(page, "dark");
});
