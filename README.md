# Little Goods — the forecasting game

The first playable slice of an e-commerce game for learning model building. Built for a learner who already knows basic Python and pandas.

Choose **Trend only** or **Trend + promotions**, write what you expect, edit the Python starter, and run a real seven-day demand forecast. The shop brief, history chart, predicted daily values, and saved pre-run expectation connect the code to a business question.

Implements [issue #1](https://github.com/zerowing113/data_science_game/issues/1), [demand exploration #2](https://github.com/zerowing113/data_science_game/issues/2), and [Python recovery #4](https://github.com/zerowing113/data_science_game/issues/4). Baseline comparisons, inventory decisions, leakage lessons, full mission progression, and private hosting belong to later issues.

Explore historical observations and upcoming inputs before modeling. The inspect-only viewer explains the columns and when their values become known; selecting a row or chart point connects the records with demand patterns. Upcoming demand is not presented as an observed outcome. Sorting changes only the view, not the Python inputs.

If code fails, edit it and rerun. Use **Stop run** for unfinished execution and **Reset Python** to start a fresh interpreter without reloading the page. Reset preserves your code and expectation. The last successful forecast remains inspectable as a previous run with its original code and expectation; it is never presented as the output of a failed or stopped run. This record lasts only for the current page session.

## Start locally

Requires Node.js 22.12 or newer and npm. No Python installation is needed.

```sh
npm ci
npm run prepare:python
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

`prepare:python` copies the pinned interpreter from npm and downloads the compatible Python wheels from the official Pyodide distribution on jsDelivr. Downloads are verified against the SHA-256 checksums in Pyodide's package lock and reused on later runs. These generated assets are ignored by Git. The browser serves Python and its packages from the same local origin; forecast execution does not require a CDN. Google Fonts is optional styling and falls back to system fonts when unavailable.

## Verify and build

```sh
npx playwright install chromium
npm run typecheck
npm run test:forecast
npm test
npm run build
npm run preview
```

Run `prepare:python` before development, tests, or building a fresh checkout. The production build includes the prepared runtime under `dist/python`. This is a local application build, not a deployed private website. Access-controlled deployment is issue #10.

Browser tests use actual Python execution and the visible learner interface, with no canned forecast response or mocked model. Chromium is the tested browser. The supported fixture has 28 observed days starting August 31, 2026 and seven future dates, September 28–October 4. The exact underlying relationship is `20 + 2 * day + 12 * promotion`; this noise-free fixture teaches feature effects and is not intended to represent realistic forecast accuracy. For the two-feature model, September 28 predicts 76 mugs and the October 2 promotion predicts 96 mugs.

## Runtime and design

- React 19.3, TypeScript 5.9, Vite 6.4 (compatible with the project's Node version).
- Pyodide 0.28.3 with Python 3.13.2; pandas 2.3.1, scikit-learn 1.7.0, NumPy 2.2.5 and SciPy 1.14.1 from its compatible package lock.
- Python runs in a dedicated web worker so model training does not block the page. Each run gets fresh pandas tables and a fresh Python namespace; modules remain cached in the interpreter.
- The editable script receives `history` and `future` pandas DataFrames and must produce `predictions`: seven finite, non-negative numbers in future-date order. Worker validation rejects absent, malformed, negative, and non-finite results.
- The feature choice updates the supported one-line starter `features` assignment without replacing the rest of the learner's edits. Custom assignments (including multiline Python) are preserved with explicit guidance; the starter can be restored to reconnect the visual choice. Code edits mark existing results as stale; failed runs do not present a prior forecast as current output.
- Runtime loading, training, success, and readable errors are visible. Initialization and execution have time limits. Stop terminates the worker; reset starts a fresh interpreter. Messages from an old worker cannot change the active session, and a timed-out runtime can be reset in place.
- The editor intentionally uses a labeled native textarea so keyboard and assistive-technology behavior remain familiar. Charts have text alternatives and a daily forecast table.

Reference: Pyodide's [web worker guide](https://pyodide.org/en/0.28.3/usage/webworker.html) and [bundler guidance](https://pyodide.org/en/0.28.3/usage/working-with-bundlers.html).

The broader game is tracked in [GitHub Issues](https://github.com/zerowing113/data_science_game/issues).
