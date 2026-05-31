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

const responses = {};
page.on("response", async (res) => {
  const url = res.url();
  if (url.includes("tulospalvelu.leijonat.fi") && !url.includes("banners")) {
    try {
      const json = await res.json();
      const key = url.split("/").pop().split("?")[0];
      responses[key] = { url, data: json };
    } catch {}
  }
});

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(10000);

fs.writeFileSync("./data.json", JSON.stringify(responses, null, 2));
console.log(JSON.stringify(responses, null, 2));

await browser.close();
