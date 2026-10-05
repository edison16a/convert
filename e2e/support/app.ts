import { expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Fixture } from "./fixtures";

/** A small page object so specs read like the user flow instead of selectors. */
export class ConvertApp {
  constructor(readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto("/");
    await expect(this.page.getByRole("heading", { name: "Drop files" })).toBeVisible();
  }

  /** Adds files through the real file chooser, the same path a person takes. */
  async addFiles(files: Fixture[]): Promise<void> {
    const trigger = this.page.getByRole("button", { name: /Choose files|Add more files/ }).first();
    const [chooser] = await Promise.all([this.page.waitForEvent("filechooser"), trigger.click()]);
    await chooser.setFiles(files);
  }

  row(name: string): Locator {
    return this.page.getByRole("listitem").filter({ hasText: name });
  }

  /** Waits until every row has a detected type, so a following click is not racing detection. */
  async waitForDetection(): Promise<void> {
    await expect(this.page.getByText("Detecting")).toHaveCount(0);
  }

  async chooseGlobalFormat(label: string): Promise<void> {
    await this.page.getByRole("button", { name: "Convert all files to" }).click();
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }

  async convert(): Promise<void> {
    await this.page.getByRole("button", { name: /^Convert \d+ files$/ }).click();
  }

  async waitForDone(): Promise<void> {
    await expect(this.page.getByRole("heading", { name: "Done" })).toBeVisible();
  }

  /** Clicks a row's download button and returns the downloaded bytes. */
  async download(fileName: string): Promise<Buffer> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.getByRole("button", { name: `Download ${fileName}` }).click(),
    ]);
    return readFile(await download.path());
  }
}
