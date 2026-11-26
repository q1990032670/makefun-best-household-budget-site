# Hearth & Ledger — Household Budget Site

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/q1990032670/makefun-best-household-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/q1990032670/makefun-best-household-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

A working household budget site for one family and one real month — November 2026
for the Alvarez household (Maya, Jordan, Leo and Sofia). It runs entirely from
static files in `app/`, offline, on desktop and phone. No build step, no network
requests, no framework: vanilla HTML, CSS and JavaScript.

## What it does

- **Dashboard** — income, spending, savings moved and savings rate for the month,
  a spending-by-category donut chart, a six-month income-vs-spending bar chart,
  the next bills due and recent activity.
- **Ledger** — 31 preloaded transactions with add, edit and delete, category
  chips, category filter and text search. Every total on the site recalculates.
- **Budgets** — nine monthly envelopes (housing, groceries, transport, utilities,
  health, dining, fun, shopping, kids) with progress bars that turn amber at 80%
  and red when over, and editable monthly limits.
- **Goals** — four savings goals (emergency fund, holiday trip, washing machine,
  kids' college starter) with progress bars and working contribution forms.
- **Bills** — a November calendar grid with every recurring bill on its due day,
  plus a table with amounts, categories and autopay status ($2,192.99/month total).
- **Tools & Rules** — a 50/30/20 split planner compared against the month's actual
  needs/wants/savings, a debt payoff calculator (months to debt-free and total
  interest, with a warning when a payment does not cover interest), the family's
  money rules, and a reset back to the sample data.

Edits persist in the browser via `localStorage`; everything also works in memory
where storage is unavailable.

## Run it

Serve `app/` with any static file server, e.g. from the repo root:

```
python3 -m http.server 8080 --directory app
```

then open http://localhost:8080 — or simply open `app/index.html` in a browser.

## Hand-in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the
output directory and writes `dossier.json` using `vendor/makefun-frontend.ts`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/index.html` — page shell, header totals strip and navigation
- `app/data.js` — sample dataset and state store (one job: data)
- `app/charts.js` — inline-SVG donut, envelope bars and trend chart builders
- `app/views.js` — one renderer per view
- `app/app.js` — hash router, form wiring and the calculators
- `app/style.css` — the whole visual design, including the phone layout
- `screenshots/` — real browser renders of the site (desktop + phone)

## License

MIT — see `LICENSE`.

<sub>Entered on [make.fun](https://make.fun/bounty/best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
