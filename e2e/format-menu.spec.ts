import { expect, test } from "@playwright/test";
import { ConvertApp } from "./support/app";
import { csv, png, wav } from "./support/fixtures";

test("the format menu is fully keyboard operable", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([png()]);
  await app.waitForDetection();

  const picker = app.row("photo.png").getByRole("button", { name: /Output format/ });
  await picker.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(picker).toBeFocused();
  // ArrowDown moved off the starting choice (JPG) before Enter selected it.
  await expect(picker).not.toContainText("JPG");
});

test("Escape closes the menu without changing the choice", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([png()]);
  await app.waitForDetection();
  const picker = app.row("photo.png").getByRole("button", { name: /Output format/ });
  await picker.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(picker).toContainText("JPG");
});

test("the global menu groups by category, hides unreachable formats and searches as you type", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await app.addFiles([png(), csv(), wav()]);
  await app.waitForDetection();
  await page.getByRole("button", { name: "Convert all files to" }).click();

  await expect(page.getByRole("group", { name: "Image" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Audio" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Data" })).toBeVisible();
  // Nothing in this batch can become a video or a document.
  await expect(page.getByRole("group", { name: "Video" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Document" })).toHaveCount(0);

  await page.getByRole("combobox", { name: "Search formats" }).fill("js");
  await expect(page.getByRole("option")).toHaveText(["JSON"]);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Convert all files to" })).toContainText("JSON");
});
