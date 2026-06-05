import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";

chromium.use(StealthPlugin());

const URL = "https://tulospalvelu.leijonat.fi/serie?lang=fi&season=2026&lid=67&ssid=201";

const browser = await chromium.launch({
  headless: false,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const context = await browser.newContext({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

const page = await context.newPage();
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForFunction(() => typeof ui !== "undefined", { timeout: 30000 });
await page.waitForTimeout(3000);

const [gamesResponse] = await Promise.all([
  page.waitForResponse(
    (res) => res.url().includes("getgames") && res.status() === 200
  ),
  page.evaluate(() => ui.GamesOpened()),
]);

const raw = await gamesResponse.json();

const games = (raw.Games ?? []).map((g) => ({
  id:        g.GameId,
  date:      g.Date,
  time:      g.Time,
  home:      g.HomeTeamAbbrv,
  away:      g.AwayTeamAbbrv,
  homeGoals: g.HomeGoals ?? null,
  awayGoals: g.AwayGoals ?? null,
  played:    g.Played ?? false,
  arena:     g.Arena ?? null,
}));

const output = {
  scraped_at: new Date().toISOString(),
  serie: "II-divisioona, lohko 6",
  total:    games.length,
  played:   games.filter((g) => g.played).length,
  upcoming: games.filter((g) => !g.played).length,
  games,
};

fs.writeFileSync("./games.json", JSON.stringify(output, null, 2));
console.log(`Saved ${games.length} games to games.json`);

await browser.close();
