# Smart Inventory Management System

A complete, frontend-only Inventory Management System built with plain **HTML, CSS, and JavaScript**. No build step, no backend, no dependencies to install — it runs by opening a file in a browser.

## Running it

Just open `index.html` in a browser. That's it.

(If your browser blocks `localStorage` for files opened directly from disk, run a tiny local server instead — e.g. `python3 -m http.server` from this folder, then visit `http://localhost:8000`.)

The first time it loads, it seeds itself with a handful of sample products, customers, suppliers, and a week of sample sales, so the dashboard isn't empty. Feel free to erase this from **Settings → Erase all data**.

## What's included

| Page | What it does |
|---|---|
| `index.html` | Dashboard — total products, total/today's sales, low stock count, a 7‑day sales chart, low stock alerts, and recent transactions |
| `products.html` | Add/edit/delete products, search & filter by category, per‑product stock in/out, and full stock movement history |
| `sales.html` | Build an invoice (add products, discount, tax), save it, print it, and browse sales history |
| `purchases.html` | Record stock coming in from a supplier — stock updates automatically on save |
| `customers.html` / `suppliers.html` | Simple contact lists (add/edit/delete) |
| `reports.html` | Sales, stock, and profit reports, each exportable to CSV |
| `settings.html` | Store name, currency, default tax rate, dark mode, and JSON backup/restore |

## How data is stored

Everything lives in the browser's `localStorage`, namespaced under `sims_*` keys (see `js/storage.js`). There is no server and nothing leaves your browser. Because of that:

- Data is per-browser. Switching browsers or devices means switching data.
- Clearing your browser's site data will erase everything — export a backup from **Settings** first.
- `data/sample.json` is a reference for the shape of the data only; the app never reads it directly.

## Project structure

```
inventory-app/
├── index.html / products.html / sales.html / purchases.html
├── customers.html / suppliers.html / reports.html / settings.html
├── css/
│   ├── style.css        # design tokens, layout shell, shared components
│   ├── dashboard.css    # dashboard-only styles (chart, activity feed)
│   └── responsive.css   # breakpoints
├── js/
│   ├── utils.js          # formatting, DOM helpers, toasts, CSV export
│   ├── storage.js        # the entire data layer (localStorage)
│   ├── app.js             # sidebar/topbar shell, theme toggle, dashboard
│   ├── products.js       # products page logic
│   ├── inventory.js      # stock in/out + movement history
│   └── reports.js        # sales/stock/profit reports
├── assets/icons, assets/images   # empty, ready for your own art
└── data/sample.json      # reference data shape only
```

Purchases, customers, and suppliers pages keep their logic inline in their own HTML file (each is small enough that a separate JS file wasn't worth the extra request).

## Where to take it next

The doc you shared calls out a natural upgrade path once this outgrows a single browser:

- **Firebase** — cloud storage + auth, still no server code to write.
- **Supabase** (or any small backend) — multi-user support, synced across devices.
- **PWA support** — installable, works offline.

None of that requires rewriting the frontend — swap `storage.js`'s localStorage calls for API calls and everything above it keeps working.
