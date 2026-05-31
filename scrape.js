import { chromium } from "playwright";
import fs from "fs";

const url = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url, { waitUntil: "networkidle" });

// odota että React ehtii renderöidä
await page.waitForTimeout(8000);

// kerää perus DOM-data
const data = await page.evaluate(() => {
  const title = document.title;

  const rows = Array.from(document.querySelectorAll("tr")).slice(0, 20).map(row => {
    return row.innerText;
  });

  return {
    title,
    sampleRows: rows
  };
});

fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

console.log("Saved hockey data");

await browser.close();
