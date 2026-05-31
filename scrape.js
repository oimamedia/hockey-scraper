import { chromium } from "playwright";
import fs from "fs";

const url = "https://example.com";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url, { waitUntil: "networkidle" });

const title = await page.title();

const data = {
  timestamp: new Date().toISOString(),
  title,
};

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

console.log("Saved:", data);

await browser.close();
