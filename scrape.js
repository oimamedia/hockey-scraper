import { chromium } from "playwright";
import fs from "fs";

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const COLUMN_KEYS = ["rank", "team", "gp", "w", "otw", "otl", "l", "gf", "ga", "pts"];

const browser = await chromium.launch();
const page = await browser.newPage();

console.log("Navigating...");
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const result = await page.evaluate((columnKeys) => {
  // main-table = standings, toistuu jokaiselle lohkolle/sarjalle sivulla
  const mainTables = Array.from(document.querySelectorAll("table.main-table"));

  const standings = mainTables.map((table, tableIndex) => {
    // Yritetään löytää sarjan nimi — katso lähellä olevaa otsikkoa
    const section = table.closest("section, div[id], div[class*='serie'], div[class*='standings']");
    const heading = section
      ? section.querySelector("h1, h2, h3, h4, .serie-name, .title")
      : null;
    const serieLabel = heading ? heading.innerText.trim() : `Taulukko ${tableIndex + 1}`;

    // Header-rivit (th tai ensimmäinen tr jos ei th:ta)
    const headerCells = Array.from(table.querySelectorAll("thead th, thead td")).map(
      (th) => th.innerText.trim()
    );

    // Data-rivit
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) => {
      const cells = Array.from(row.querySelectorAll("td")).map((td) =>
        td.innerText.trim()
      );

      // Jos headerit löytyy, käytetään niitä avaimina
      if (headerCells.length > 0) {
        const entry = {};
        headerCells.forEach((key, i) => {
          const val = cells[i] ?? null;
          const k = key || `col${i}`;
          entry[k] = val !== null && val !== "" && !isNaN(Number(val)) ? Number(val) : val;
        });
        return entry;
      }

      // Fallback: käytä oletussarakkeet
      const entry = {};
      columnKeys.forEach((key, i) => {
        const val = cells[i] ?? null;
        entry[key] = key !== "team" && val !== null && val !== "" && !isNaN(Number(val))
          ? Number(val)
          : val;
      });
      return entry;
    }).filter((e) => Object.values(e).some((v) => v !== null && v !== ""));

    return { serie: serieLabel, headers: headerCells, rows };
  });

  return standings;
}, COLUMN_KEYS);

const output = {
  scraped_at: new Date().toISOString(),
  tables_found: result.length,
  standings: result,
};

fs.writeFileSync("./data.json", JSON.stringify(output, null, 2));
console.log(`Saved ${result.length} standings tables to data.json`);
console.log(JSON.stringify(output, null, 2));

await browser.close();
