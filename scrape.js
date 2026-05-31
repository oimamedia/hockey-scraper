import { chromium } from "playwright";
import fs from "fs";

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const context = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

const page = await context.newPage();

// Odotetaan getsubserie-vastausta — promise resolvoituu kun kutsu tulee
const subSeriePromise = page.waitForResponse(
  (res) => res.url().includes("getsubserie") && res.status() === 200
);

await page.goto(URL, { waitUntil: "domcontentloaded" });

// Odotetaan max 15s että jQuery tekee XHR-kutsun
const subSerieResponse = await subSeriePromise.catch(() => null);
const standings = subSerieResponse ? await subSerieResponse.json() : null;

const output = { scraped_at: new Date().toISOString(), standings };
fs.writeFileSync("./data.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

await browser.close();
