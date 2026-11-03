# Batch M2 — Q5: re-verify Batch M (no mobile regression) + gates

Re-ran after Q1–Q4 (fixtures, Playwright):

| check | result |
|---|---|
| Mobile first viewport (header+chips, lead, >=2 top-story headlines) | PASS |
| 4 sections within scroll depth | PASS (within first viewport) |
| No duplicate stories on Home | PASS (26 titles, 0 dups) |
| Coverage-guarantee (sections / breaking / promo filtered / empty hidden / failures isolated) | PASS |
| Bottom-bar reachability (every destination <=2 taps; Sources/Saved in More) | PASS |
| 0 controls <44px at <=640 and on touch devices | PASS |
| CLS <= 0.05 on mobile Home and every chip page | **0.00** on all 7 |
| Swipe vs row scroll (content navigates, scrollers suppressed, vertical never) | PASS |
| Idle network, 130s | **0 requests** |
| App renders on scroll +0; on score ticks +0 (home + sports) | PASS |
| Initial JS gzip | **166.28 KB** (165 +0.78%, within the +2% allowance) |
| promo 25/25; connections 4/4 + 0 traps; railDedup one-story-once; SoP select | PASS |

## Bundle justification (+0.78%)
The four iPad/desktop fixes (Q1 chip nav, Q2 breaking reposition, Q3 sticky rail, Q4
load-stability reserves) are almost entirely CSS, and this app keeps its CSS in a GLOBAL_CSS
template string that ships in the JS bundle, so CSS additions count against the JS budget. The
growth is 164.21 KB (M6) -> 166.28 KB, i.e. +2.07 KB for all four, within the +2% allowance.

## Desktop >=1100 vs main — identical EXCEPT (Q3/Q4 items)
- `.sidebar position: static -> sticky` (Q3).
- `.sidebar-sop` +3 to +17px, `.sidebar` +3 to +17px (Q4 State-of-Play slot reserve).
- `.snap-feed` y +5–8px, `.page-grid`/`.feed-col` height +2–8px (Q4 Top Stories reserve).
No other geometry/computed-style differences at 1180/1280/1440. (820/1024 additionally reflect
the intended Q1 chip nav + Q2 breaking changes.)
