import { writeFileSync } from "fs";

const URL =
  "https://tulospalvelu.leijonat.fi/helpers/getgames?dwl=0&season=2026&subSerieId=201&teamid=0&districtid=0&gamedays=0&dog=2025-09-01&levelid=-1";

console.log("Fetching games...");

const res = await fetch(URL, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://tulospalvelu.leijonat.fi/",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  },
});

if (!res.ok) {
  console.error("Fetch failed:", res.status);
  process.exit(1);
}

const raw = await res.json();
console.log("Raw keys:", Object.keys(raw));

// Parsataan pelit — kenttänimet tarkistetaan ensimmäisellä ajolla
const games = (raw.games ?? raw.Games ?? raw.data ?? raw).map((g) => ({
  id:        g.gameId        ?? g.id,
  date:      g.date          ?? g.Date,
  time:      g.time          ?? g.Time,
  home:      g.homeTeam      ?? g.HomeTeam      ?? g.home,
  away:      g.awayTeam      ?? g.AwayTeam      ?? g.away,
  homeGoals: g.homeGoals     ?? g.HomeGoals     ?? null,
  awayGoals: g.awayGoals     ?? g.AwayGoals     ?? null,
  played:    g.played        ?? g.Played        ?? false,
  arena:     g.arena         ?? g.Arena         ?? null,
}));

const output = {
  scraped_at: new Date().toISOString(),
  season: "2026",
  subSerieId: "201",
  total:    games.length,
  played:   games.filter((g) => g.played).length,
  upcoming: games.filter((g) => !g.played).length,
  games,
};

writeFileSync("games.json", JSON.stringify(output, null, 2));
console.log(`Saved ${games.length} games to games.json`);
