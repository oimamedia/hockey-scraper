import { chromium } from "playwright";
import fs from "fs";

const url = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(url, { waitUntil: "networkidle" });

// odotetaan että React ehtii renderöidä datan
await page.waitForTimeout(5000);

// otetaan sivun data DOM:sta
const data = await page.evaluate(() => {
  const title = document.querySelector("h1")?.innerText || null;

  // yritetään löytää taulukot (sarjataulukko / statsit)
  const tables = Array.from(document.querySelectorAll("table")).map(t => {
    return {
      html: t.innerHTML
    };
  });

  return {
    title,
    tables
  };
});

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

console.log("Saved data");

await browser.close();
