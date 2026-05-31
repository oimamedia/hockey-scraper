import { chromium } from "playwright";
import fs from "fs";

const url = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url, { waitUntil: "networkidle" });

await page.waitForTimeout(5000);

const data = await page.evaluate(() => {
  return {
    title: document.title,
    h1: document.querySelector("h1")?.innerText || null,
    tables: Array.from(document.querySelectorAll("table")).length
  };
});

console.log("DATA:", data);

// 🔥 TÄRKEIN KOHTA (varma tallennus)
fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

console.log("Saved data.json");

await browser.close();
