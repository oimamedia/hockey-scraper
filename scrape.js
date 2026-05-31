import { chromium } from "playwright";
import fs from "fs";

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch();
const page = await browser.newPage();

// Kaapataan getsubserie-vastaus suoraan
let standings = null;
page.on("response", async (res) => {
  if (res.url().includes("getsubserie")) {
    try {
      standings = await res.json();
    } catch {}
  }
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

const output = {
  scraped_at: new Date().toISOString(),
  standings,
};

fs.writeFileSync("./data.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

await browser.close();
