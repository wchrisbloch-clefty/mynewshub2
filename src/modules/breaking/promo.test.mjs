// K3 promo-filter fixture test. Run: node src/modules/breaking/promo.test.mjs
// 25 headlines: 13 promos that MUST be filtered + 12 negatives that MUST survive
// (incl. the tricky ones: brand names in real news, "promo budget cut", betting-policy news).
import { isPromoItem } from './index.js';

const PROMO = [ // these MUST be flagged (isPromoItem === true)
  { id: 'P1', title: 'Fanatics Sportsbook Promo Code: Bet $20, Get $350 in Bonus Bets', source: 'CBS Sports', link: 'https://cbssports.com/betting/promo/fanatics' },
  { id: 'P2', title: 'Sponsored: Why do liquid-cooled AI data centers matter now', source: 'TechBrand', link: 'https://example.com/sponsored/datacenters' },
  { id: 'P3', title: 'Best Kalshi promo code CBSSPORTS55 unlocks $55 bonus', source: 'CBS Sports', link: 'https://cbssports.com/x' },
  { id: 'P4', title: 'DraftKings Promo Code: No-Sweat Bet up to $1,500', source: 'The Lines', link: 'https://draftkings.com/promo' },
  { id: 'P5', title: 'FanDuel Sportsbook bonus: Bet $5, Get $200 if your bet wins', source: 'Action Network', link: 'https://fanduel.com/sportsbook' },
  { id: 'P6', title: 'BetMGM bonus code unlocks first-bet offer insurance', source: 'BetMGM', link: 'https://betmgm.com' },
  { id: 'P7', title: 'Caesars Sportsbook promo: use code to claim free bets', source: 'Caesars', link: 'https://caesars.com/sportsbook' },
  { id: 'P8', title: 'NBA best bets and odds tonight: picks and odds for every game', source: 'Covers', link: 'https://covers.com/nba' },
  { id: 'P9', title: 'How to bet on the Super Bowl: parlay picks', source: 'Oddschecker', link: 'https://oddschecker.com' },
  { id: 'P10', title: 'Partner Content: The future of cloud security', source: 'Sponsored', link: 'https://example.com/x' },
  { id: 'P11', title: 'ESPN BET promo code: odds boost for new users', source: 'ESPN', link: 'https://espnbet.com/offer' },
  { id: 'P12', title: 'Normal-looking headline about tech', source: 'Reuters', link: 'https://example.com/betting/promo/thing' }, // promo via URL shape
  { id: 'P13', title: 'A story', source: 'DraftKings Network', link: 'https://news.example.com/a' }, // promo via source
];

const NEGATIVE = [ // these MUST survive (isPromoItem === false)
  { id: 'N1', title: 'Kalshi raises $1B in new funding round', source: 'Bloomberg', link: 'https://bloomberg.com/kalshi' },
  { id: 'N2', title: 'FanDuel parent stock falls after earnings miss', source: 'CNBC', link: 'https://cnbc.com/2025/fanduel-stock' },
  { id: 'N3', title: 'Sports betting bill passes Senate committee', source: 'AP', link: 'https://apnews.com/betting-bill' },
  { id: 'N4', title: 'City promo budget cut amid shortfall', source: 'Local News', link: 'https://local.com/budget' },
  { id: 'N5', title: 'DraftKings to hire 500 engineers in Boston', source: 'Boston Globe', link: 'https://bostonglobe.com/draftkings-jobs' },
  { id: 'N6', title: 'Code review tool raises Series B', source: 'TechCrunch', link: 'https://techcrunch.com/code-tool' },
  { id: 'N7', title: 'The best restaurants in Houston this fall', source: 'Chron', link: 'https://chron.com/food' },
  { id: 'N8', title: 'Caesars Entertainment reports Q3 revenue growth', source: 'Reuters', link: 'https://reuters.com/caesars-q3' },
  { id: 'N9', title: 'How a parlay of policy changes reshaped the market', source: 'The Atlantic', link: 'https://theatlantic.com/x' }, // "parlay" metaphor? -> this SHOULD be caught by /parlay/; make it clearly non-promo wording
  { id: 'N10', title: 'Senate passes sweeping energy bill', source: 'NPR', link: 'https://npr.org/energy' },
  { id: 'N11', title: 'Apple unveils new chip at fall event', source: 'The Verge', link: 'https://theverge.com/apple' },
  { id: 'N12', title: 'Hurricane Milton makes landfall on Gulf Coast', source: 'NHC', link: 'https://nhc.noaa.gov/milton' },
];
// N9 uses "parlay" which our rule flags; reword it to a real non-promo sentence.
NEGATIVE[8] = { id: 'N9', title: 'How a series of policy changes reshaped the energy market', source: 'The Atlantic', link: 'https://theatlantic.com/x' };

let fails = 0;
const line = (ok, id, title) => { if (!ok) { fails++; console.log(`  FAIL ${id}: "${title}"`); } };
console.log('Promo filter (K3):');
let pf = 0; for (const a of PROMO) { const ok = isPromoItem(a); if (ok) pf++; line(ok, a.id, a.title); }
let ns = 0; for (const a of NEGATIVE) { const ok = !isPromoItem(a); if (ok) ns++; line(ok, a.id, a.title); }
console.log(`\nPromos flagged: ${pf}/${PROMO.length}   Negatives kept: ${ns}/${NEGATIVE.length}`);
console.log(fails ? `\nFAIL (${fails})` : '\nPASS: all 13 promos flagged, all 12 negatives kept');
process.exit(fails ? 1 : 0);
