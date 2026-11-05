# W4 — token renames + the V4 shade-merge table

## Renames (W4) — names only, no value change

The V4 debt burn-down parked several relocated literals in `tokens.css` under non-semantic names
(a "junk drawer"). W4 renames them to role names and updates every use (no alias kept). Values are
byte-identical: the built CSS hex value set is identical before/after (verified by diffing the
compiled stylesheet), so it is a true no-op (the small pixel-diff residual is the usual fixture
content jitter, e.g. the Home-dark News-error-state race, not the rename).

| old | new | value | role |
|---|---|---|---|
| `--ink` | `--black` | `#000` | fixed pure black — fade masks, the X/Twitter brand badge, `var(--text,…)` fallbacks |
| `--c-gray` | `--gray-mid` | `#9ca3af` | a fixed mid grey fill |
| `--c-gray-line` | `--line-muted` | `#cbd5e1` | a fixed light hairline / border grey |
| `--pink` | `--accent-pink` | `#db2777` | the Pop-culture card top-border pink |
| `--brown` | `--accent-brown` | `#7c2d12` | a deep brown accent |
| `--navy-2` | `--accent-deep` | `#1e2d42` | a deep navy fill |
| `--chat-fg` | `--chat-text` | `#444` | Concierge/chat syntax foreground |
| `--chat-bg` | `--chat-surface` | `#222` | Concierge/chat syntax surface |

## V4 "close-shade" merges (for CB to veto any visible shift)

In V4, near-duplicate literals were consolidated to one token (small badge/chip/chat areas). Listed
old value → token (value), with where it renders. These were covered by V4's pixel diff (<= 0.09% on
every deterministic cell) but are listed here so a shift can be vetoed.

### AI / syntax purple → `--ai-accent` (#6001d2) and `--ai-accent-light` (#c4a5ff)
| old | → token | renders |
|---|---|---|
| #9333ea, #7c3aed, #3f0080, #2d1f5a | --ai-accent (#6001d2) | Concierge chat accents / analyze-result label / voice-test dots |
| #a78bfa | --ai-accent-light (#c4a5ff) | chat light-purple accent |

### Gold tier → `--gold` / `--gold-light` / `--gold-dark` / `--gold-wash`
| old | → token | renders |
|---|---|---|
| #5a4a1f | --gold (#b8893d) | premium/gold tier label |
| #d4b878 | --gold-light (#d4b878) | gold tier light stop |
| #2a1f0a, #2a1f08, #1e1504, #4a3500, #5a3a00 | --gold-dark (#1f1505) | gold tier dark gradient stops |
| #f9eed2, #fffbf0 | --gold-wash (#fbf5e8) | gold tier pale wash background |

### Pale washes → `--wash-warm` / `--wash-cool` / `--wash-pink`
| old | → token | renders |
|---|---|---|
| #fef3c7, #fde68a | --wash-warm (#fffbeb) | amber badge / note backgrounds |
| #f0f7ff, #e8f2fb, #e0f2fe, #bfdbfe, #f0fdf4, #f4f4f5 | --wash-cool (#f0f9ff) | blue/green pale badge/panel backgrounds, social tile fill |
| #fef2f2 | --wash-pink (#fdeff5) | red/pink pale wash |

### Semantic colours → theme tokens (shade shift, not a merge-to-neutral)
| old (light) | → token | renders |
|---|---|---|
| #16a34a, #00b37e, #4ade80 | --green | fresh/green dots, positive badges |
| #dc2626, #e5383b | --red | breaking / error signals |
| #b45309, #f59e0b, #d97706, #92400e, #fa7800, #fbbf24 | --amber | warning / "unavailable" / tier amber |
| #2563eb, #0ea5e9, #0369a1, #0284c7, #1d4ed8, #60a5fa | --accent | link / accent blues |

Also note (W1): `--text3` was nudged for contrast — light `#6b6e75 → #64676e`, dark `#7e8088 → #868892`
(clears 4.5:1 on `--surface2`); `.social-handle` dropped its brand-colour inline (now `--text2`);
`.logo-tag` `--text4 → --text3`; `.chip-more.active` `--on-media → --on-accent`.
