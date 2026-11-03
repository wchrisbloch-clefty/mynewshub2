# Batch M — M6: mobile verification (branch, 390px, fixtures)

| gate | result |
|---|---|
| Idle network, 130s (after full scroll) | **0 requests** — no new timers/polling |
| App renders on scroll (after lazy sections settle) | **+0** |
| Initial JS gzip (entry + react) | **164.21 KB** (budget 165) |
| Nav reachability | every previous destination <=2 taps (Home/Sports/Briefing/Search direct; Sources/Saved/Podcasts via More) |
| Service worker | unchanged (never caches /api/*) |
| Briefing / Sports / Home / Search via bottom bar | all render, 0 console errors |
| Swipe navigation | works (News->Business); suppressed on horizontal scrollers; vertical never navigates |
| Pull-to-refresh | usePullToRefresh untouched |
| Voices / Share / PWA | modules untouched |
| J regression | App/SportsPage renders +0 on ticks, CLS 0, no remounts |
| K/L regression | promo 25/25; connections 4/4 + 0 traps; railDedup one-story-once; SoP select |
| CLS | Home 0.00; every chip page 0.00 (M4) |
| Touch targets | 0 sub-44px controls on Home or any chip page (M5) |

Desktop/iPad geometry + computed styles IDENTICAL at 820/1024/1180/1280/1440 across all mobile
commits (the desktop nav label General->News is the one intended A6 change). No api files, no new
setInterval, no new hex outside tokens.css.
