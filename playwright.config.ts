import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * End to end tests run against a production build, because that is what ships
 * (service worker, hashed worker chunks and all). Set CHROMIUM_PATH to use a
 * browser you already have, and PW_NO_SANDBOX=1 when running as root in a container.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 30_000 },
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    acceptDownloads: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: process.env.PW_NO_SANDBOX ? ["--no-sandbox"] : [],
    },
  },
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
