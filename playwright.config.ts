import "dotenv/config";
import { defineConfig } from "@playwright/test";

const baseURL = process.env.BASE_URL || "https://nighutlabs.dev";
const slowMo = Number(process.env.PW_SLOWMO || "0");

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  retries: 1,
  use: {
    baseURL,
    headless: true,
    launchOptions: {
      slowMo: Number.isFinite(slowMo) ? slowMo : 0
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off"
  },
  reporter: [["list"]]
});
