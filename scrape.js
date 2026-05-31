import { chromium } from "playwright";
import fs from "fs";

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch();
const page = await browser.newPage();

const requests = [];
page.on("request", (req) => {
  if (req.resourceType() === "xhr" || req.resourceType() === "fetch") {
    requests.push(req.url());
  }
});

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);

fs.writeFileSync("./data.json", JSON.stringify({ api_calls: requests }, null, 2));
console.log(JSON.stringify({ api_calls: requests }, null, 2));

await browser.close();
