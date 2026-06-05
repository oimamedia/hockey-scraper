import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

chromium.use(StealthPlugin());

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch({
  headless: false,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const context = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForFunction(() => typeof ui !== "undefined", { timeout: 30000 });
await page.waitForTimeout(3000);

// Tulostetaan kaikki ui-objektin funktiot
const uiFunctions = await page.evaluate(() => {
  return Object.getOwnPropertyNames(ui)
    .filter(k => typeof ui[k] === "function");
});
console.log("ui functions:", uiFunctions);

await browser.close();
