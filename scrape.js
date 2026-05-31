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

// ✅ VANHA TOIMIVA KOODi — ei muutoksia
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => typeof ui !== "undefined", { timeout: 15000 });
await page.waitForTimeout(5000);

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

// ✅ UUSI — games-kaappaus standings-kaappauksen jälkeen
const allGames = [];
page.on("response", async (res) => {
  if (res.url().includes("getgames")) {
    try {
      const json = await res.json();
      const games = json.flatMap((d) => d.Games || []);
      allGames.push(...games);
    } catch {}
  }
});

await page.evaluate(() => ui.GamesOpened());
await page.waitForTimeout(2000);

for (let i = 0; i < 30; i++) {
  await page.evaluate(() => ui.ScrollNextDate());
  await page.waitForTimeout(300);
}

await page.waitForTimeout(2000);

const sortedGames = allGames
  .filter((g, i, arr) => arr.findIndex((x) => x.GameID === g.GameID) === i)
  .map((g) => ({
    gameId: g.GameID,
    date: g.GameDateDB,
    dateShort: g.GameDateShort,
    time: g.GameTime,
    homeTeam: g.HomeTeamAbbrv,
    awayTeam: g.AwayTeamAbbrv,
    homeGoals: g.HomeGoals,
    awayGoals: g.AwayGoals,
    status: g.GameStatus,
    rink: g.RinkName,
    dow: g.DowFI,
  }))
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const output = {
  scraped_at: new Date().toISOString(),
  serie: "II-divisioona, lohko 6",
  standings,
  games: sortedGames,
};

fs.writeFileSync("./data.json", JSON.stringify(output, null, 2));
console.log(`Standings: ${standings.length} joukkuetta, Games: ${sortedGames.length} peliä`);

await browser.close();
