import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

chromium.use(StealthPlugin());

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const context = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

const page = await context.newPage();

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const raw = await page.evaluate(async () => {
  const res = await fetch(
    "https://tulospalvelu.leijonat.fi/serie/helpers/getstandings?season=2026&subSerieId=201",
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Referer": "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201",
      },
      credentials: "include",
    }
  );
  const text = await res.text();
  return { status: res.status, body: text };
});

console.log("Status:", raw.status);
console.log("Body:", raw.body.slice(0, 500));

fs.writeFileSync("./data.json", JSON.stringify(raw, null, 2));

await browser.close();
