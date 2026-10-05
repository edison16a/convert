import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv } from "./support/fixtures";

test("the empty state explains the product and promises privacy", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await expect(page.getByText("Files never leave your device. Works offline.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose files" })).toBeVisible();
});

test("View on GitHub links to the repository", async ({ page }) => {
  await new ConvertApp(page).open();
  const link = page.getByRole("link", { name: "View on GitHub" });
  await expect(link).toHaveAttribute("href", "https://github.com/edison16a/convert");
  await expect(link.locator("svg")).toBeVisible();
});

test("a conversion only talks to the page's own origin", async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith(baseURL as string) && !/^(blob|data):/.test(url)) foreign.push(url);
  });
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv()]);
  await app.waitForDetection();
  await app.convert();
  await app.waitForDone();
  expect(foreign).toEqual([]);
});

test("the page is usable at phone width without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([csv("a-rather-long-file-name-for-a-narrow-screen.csv")]);
  await app.waitForDetection();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
