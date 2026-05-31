import { chromium } from "playwright";
import fs from "fs";

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

// Sarjataulukko-sarakkeet joita odotetaan
// Sivu voi käyttää eri järjestystä — tämä on tyypillinen FHL-layout
const COLUMN_KEYS = ["rank", "team", "gp", "w", "otw", "otl", "l", "gf", "ga", "pts"];

function parseStandingsTable(tableEl) {
  const rows = Array.from(tableEl.querySelectorAll("tbody tr"));

  return rows.map((row) => {
    const cells = Array.from(row.querySelectorAll("td")).map((td) =>
      td.innerText.trim()
    );

    // Rakennetaan objekti sarakkeiden mukaan
    const entry = {};
    COLUMN_KEYS.forEach((key, i) => {
      const val = cells[i] ?? null;
      // Muunnetaan numerot
      if (key !== "team" && val !== null && val !== "") {
        entry[key] = isNaN(Number(val)) ? val : Number(val);
      } else {
        entry[key] = val;
      }
    });

    return entry;
  }).filter((e) => e.team); // poistetaan tyhjät rivit
}

const browser = await chromium.launch();
const page = await browser.newPage();

console.log("Navigating...");
await page.goto(URL, { waitUntil: "networkidle" });

// Odotetaan että standings-taulukko ilmestyy
// Kokeillaan useampaa mahdollista selektoria (xl / lg / sm prefixit)
const standingsSelectors = [
  "#xl-serie-standings table",
  "#lg-serie-standings table",
  "#md-serie-standings table",
  "#sm-serie-standings table",
  ".standings table",
  "table.standings",
];

let standingsTable = null;
for (const sel of standingsSelectors) {
  try {
    await page.waitForSelector(sel, { timeout: 5000 });
    standingsTable = sel;
    console.log(`Found standings with selector: ${sel}`);
    break;
  } catch {
    // kokeillaan seuraava
  }
}

if (!standingsTable) {
  // Fallback: otetaan kaikki taulukot ja lokitetaan rakenne debuggausta varten
  console.warn("Standings table not found — dumping all table headers for debug");

  const debugData = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("table")).map((t, i) => ({
      index: i,
      id: t.id || null,
      classes: t.className || null,
      headerCells: Array.from(t.querySelectorAll("th")).map((th) => th.innerText.trim()),
      rowCount: t.querySelectorAll("tbody tr").length,
    }));
  });

  fs.writeFileSync("./data.json", JSON.stringify({ debug: debugData }, null, 2));
  console.log("Saved debug data to data.json");
  await browser.close();
  process.exit(0);
}

// Parsitaan standings
const standings = await page.evaluate(
  ({ sel, columnKeys }) => {
    const table = document.querySelector(sel);
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll("tbody tr"));

    return rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td")).map((td) =>
        td.innerText.trim()
      );

      const entry = {};
      columnKeys.forEach((key, i) => {
        const val = cells[i] ?? null;
        if (key !== "team" && val !== null && val !== "") {
          entry[key] = isNaN(Number(val)) ? val : Number(val);
        } else {
          entry[key] = val;
        }
      });

      return entry;
    }).filter((e) => e.team);
  },
  { sel: standingsTable, columnKeys: COLUMN_KEYS }
);

// Haetaan myös sarjan nimi sivuotsikosta jos löytyy
const serieTitle = await page.evaluate(() => {
  const h1 = document.querySelector("h1, h2, .serie-title, .series-name");
  return h1 ? h1.innerText.trim() : document.title;
});

const output = {
  scraped_at: new Date().toISOString(),
  serie: serieTitle,
  standings,
};

fs.writeFileSync("./data.json", JSON.stringify(output, null, 2));
console.log(`Saved ${standings.length} teams to data.json`);
console.log(JSON.stringify(output, null, 2));

await browser.close();
