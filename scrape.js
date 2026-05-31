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

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const [standingsResponse] = await Promise.all([
  page.waitForResponse(
    (res) => res.url().includes("getstandings") && res.status() === 200
  ),
  page.evaluate(() => ui.StandingsOpened()),
]);

const raw = await standingsResponse.json();

const standings = raw.Teams.map((t) => ({
  ranking: t.Ranking,
  team: t.TeamAbbrv,
  games: t.Games,
  wins: t.Wins,
  otWins: t.OtWins,
  otLosses: t.OtLooses,
  losses: t.Looses,
  goalsFor: t.GoalsFor,
  goalsAgainst: t.GoalsAgainst,
  goalDiff: t.GoalDiff,
  points: t.Points,
}));

const output = {
  scraped_at: new Date().toISOString(),
  serie: "II-divisioona, lohko 6",
  standings,
};

fs.writeFileSync("./data.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

await browser.close();
