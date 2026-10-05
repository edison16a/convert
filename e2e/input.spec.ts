import { expect, test, type Page } from "@playwright/test";
import { ConvertApp } from "./support/app";

/** Fires a drag event on the window with one real File inside a DataTransfer. */
async function drag(page: Page, type: "dragenter" | "dragleave" | "drop", name = "dropped.csv") {
  await page.evaluate(
    ([eventType, fileName]) => {
      const data = new DataTransfer();
      data.items.add(new File(["a,b\n1,2\n3,4\n"], fileName, { type: "text/csv" }));
      window.dispatchEvent(new DragEvent(eventType, { dataTransfer: data, bubbles: true, cancelable: true }));
    },
    [type, name],
  );
}

const overlay = (page: Page) => page.locator('[aria-hidden="true"]').filter({ hasText: "Drop to add files" });

test("dragging a file over the page shows a hint, and dropping it adds the file", async ({ page }) => {
  await new ConvertApp(page).open();
  await expect(overlay(page)).toHaveClass(/opacity-0/);

  await drag(page, "dragenter");
  await expect(overlay(page)).toHaveClass(/opacity-100/);

  await drag(page, "drop");
  await expect(overlay(page)).toHaveClass(/opacity-0/);
  await expect(page.getByRole("listitem").filter({ hasText: "dropped.csv" })).toBeVisible();
});

test("leaving the page with a file hides the hint again", async ({ page }) => {
  await new ConvertApp(page).open();
  await drag(page, "dragenter");
  await drag(page, "dragleave");
  await expect(overlay(page)).toHaveClass(/opacity-0/);
});

test("pasting a file adds it to the queue", async ({ page }) => {
  await new ConvertApp(page).open();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File(["x,y\n1,2\n3,4\n"], "pasted.csv", { type: "text/csv" }));
    window.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect(page.getByRole("listitem").filter({ hasText: "pasted.csv" })).toBeVisible();
});

test("adding more files later appends to the queue", async ({ page }) => {
  const app = new ConvertApp(page);
  await app.open();
  await drag(page, "drop", "first.csv");
  await drag(page, "drop", "second.csv");
  await expect(page.getByRole("heading", { name: "2 files" })).toBeVisible();
});
