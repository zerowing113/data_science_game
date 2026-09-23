# Little Goods — the forecasting game

A complete first mission of an e-commerce game for learning model building. Built for a learner who already knows basic Python and pandas.

Choose **Trend only** or **Trend + promotions**, write what you expect, edit the Python starter, and run a real seven-day demand forecast. The shop brief, history chart, predicted daily values, and saved pre-run expectation connect the code to a business question.

Implements [issue #1](https://github.com/zerowing113/data_science_game/issues/1), [demand exploration #2](https://github.com/zerowing113/data_science_game/issues/2), [baseline comparison #3](https://github.com/zerowing113/data_science_game/issues/3), [Python recovery #4](https://github.com/zerowing113/data_science_game/issues/4), [missing-data repair #5](https://github.com/zerowing113/data_science_game/issues/5), [leakage discovery #6](https://github.com/zerowing113/data_science_game/issues/6), [stocking decisions #7](https://github.com/zerowing113/data_science_game/issues/7), and [guided practice #8](https://github.com/zerowing113/data_science_game/issues/8). The [fresh-data final challenge #9](https://github.com/zerowing113/data_science_game/issues/9) is also implemented. Distribution uses downloadable offline Windows and macOS packages (#10), with local save/resume (#12).

Explore historical observations and upcoming inputs before modeling. The inspect-only viewer explains the columns and when their values become known; selecting a row or chart point connects the records with demand patterns. Upcoming demand is not presented as an observed outcome. Sorting changes only the view, not the Python inputs.

If code fails, edit it and rerun. Use **Stop run** for unfinished execution and **Reset Python** to start a fresh interpreter without reloading the page. Reset preserves your code and expectation. The last successful forecast remains inspectable as a previous run with its original code and expectation; it is never presented as the output of a failed or stopped run. This record saves automatically in the current browser profile.

Open the **evaluation lab** to test on later historical days before trusting an upcoming forecast. Choose 21 training / 7 evaluation days or 14 training / 14 evaluation days. The baseline repeats the last training day's demand. Baseline and model MAE use the same held-out rows, with actual demand, predictions, and absolute errors displayed for each date. Saved evaluations retain code, feature choice, reported fitted features and model configuration, split, expectation, and scores across sessions in the current browser profile. Compare scores only for runs using the same evaluation dates.

Evaluation starts its own worker only when the lab is opened, keeping upcoming-week forecasts separate from historical holdouts. Its Python receives only training observations and held-out input features, without evaluation demand. Return a pandas Series indexed by `future.index`; the worker verifies prediction count, finite non-negative values, and exact date alignment before scoring. This catches accidental invalid outputs and row mismatches; arbitrary learner code is not an anti-cheating sandbox. The fixture's historical answers are already visible in exploration.

For the 21/7 split, the last observed demand is 60 mugs and baseline absolute errors sum to 80, giving MAE 11.43. The trend-only linear model scores 5.62, while adding promotions scores 0.00 on this noise-free teaching fixture. The lab neither evaluates nor reveals actual demand for September 28–October 4.

Use **Stock the shop** to select a completed upcoming-week forecast and choose seven daily orders. Suggestions round its predictions to the nearest whole mug; blank, fractional, negative, or above-capacity quantities cannot be committed. Each day has a 10,000-mug capacity. Selecting a newer forecast explicitly replaces the draft; code edits, failed runs, and runtime resets do not silently replace its source.

Commit all quantities before advancing the shop. Orders arrive before each day's demand: sale price is $12, purchase cost is $5 for every stocked mug, and unsold mugs are cleared for $1 each at day's end. Inventory and lost demand do not carry over. Profit is sales revenue plus leftover recovery minus purchase cost; fixed costs, taxes, and extra lost-sale fees are excluded. Calculations use integer cents. Profit is business feedback, not proof of forecast quality or mission completion.

Advancing reveals daily demand, fulfilled orders, lost sales, leftovers, and profit in matching bars and tables. Each saved decision retains its source forecast run, predictions, code, choice, and expectation for comparison and later recap. Records save automatically in the current browser profile. Further decisions replay the same revealed week; they are explicitly not unseen forecast tests. The data explorer retains the original forecast-time inputs, and Python never receives the future demand answers through its scenario tables.

The fixed shop week has demand `[76, 78, 80, 82, 96, 98, 88]` (598 mugs). Exact stock earns $4,186; 60 per day fulfills 420 mugs, loses 178, and earns $2,940; 100 per day leaves 102 mugs and earns $3,778 after leftover recovery.

Open the **missing-data lesson** to inspect a deliberately incomplete copy of the historical fixture. The first attempt leaves the missing values untreated so real model execution exposes the problem. After that consequence, a preparation choice and editable Python let the learner repair and rerun. The supported imputation step learns its median from training rows and applies it unchanged to later evaluation inputs. Saved attempts retain failures alongside successful comparisons, code, and expectations. The missing day fields are September 10 (training) and September 24 (evaluation). The training median is 10; using it for the latter predicts 40 mugs instead of 68. All other repaired predictions are exact, so model MAE is 28/7 = 4.00 versus baseline MAE 11.43. Custom preparation code remains inspectable but is not automatically audited for training-only imputation.

Open the **leakage lesson** to try a feature that becomes available only after the day closes. A real historical comparison can look excellent while the same program cannot forecast with the inputs actually available in advance. Saved experiments distinguish valid, leaked, and unverified runs; a visual feature choice alone cannot certify edited Python. Supported programs undergo a separate forecast-time execution without the post-outcome column. Custom programs outside the supported recipe remain unverified. This is an educational check, not a security boundary or a universal code auditor.

Both lessons load Python only when opened and save their own editor and experiment history in this browser profile. Their historical practice scores are separate from the upcoming-week forecast and its stocking decisions. The leakage lesson does not invent an upcoming error score when future demand is unknown. Guided practice consumes inspected evidence from these lessons; the final challenge applies separate completion rules.

Use **Start guided practice** for six ordered steps: explore, forecast, compare, repair, check timing, and stock. Each step names the current objective and tracks inspected evidence. Exploration requires a selected historical day, a column explanation, and an upcoming-input view. Modeling progress requires a successful saved result plus an explicit inspection action. The repair step requires a completed guided repair; timing requires a supported valid independent repair. Errors, interrupted runs, leaked/unverified timing results, and hints do not complete those steps. Stocking completes only after the learner inspects an actual committed outcome.

The opening forecast and baseline comparison provide working code. Guided median repair leaves two preparation lines for the learner, and the later timing repair leaves the entire model-training/prediction block. Restore buttons retain that level of scaffolding. Three optional hints per step progress from a conceptual nudge to concrete code or actions after a consequence has been observed. Hints do not edit code or advance progress.

Previously reached workspaces remain mounted, preserving editors, attempts, Python sessions, and saved outcomes when revisited or when switching to free practice. The guide retains the exact inspected source record for each completed step. Progress, hints, and records save automatically in this browser profile. Completing all six steps marks the **practice journey** complete; it does not claim a final win, fresh unseen evaluation, or demonstrated learning. The final challenge uses fresh data and requires a valid forecast that beats the baseline, committed stock, and a three-part reflection. Revealed results, explanations, and earlier recaps remain saved; retrying starts a new reproducible challenge.

## Download and play

Download [offline preview 3](https://github.com/zerowing113/data_science_game/releases/tag/offline-v0.1.0-preview.3) for Windows x64, Intel Mac, or Apple Silicon Mac. Extract the ZIP and open **Start Game**; no developer tools or Python installation are needed. The repository and downloads are public.

Preview 3 includes the visual learning workspace, shop playback, final recap, and automatic save/resume in the same browser profile. All 51 packaged browser tests, launcher checks, offline Python smoke tests, and full process-restart checks passed on all three native targets. These are unsigned test builds; normal downloaded-app security prompts and physically disconnected-device acceptance remain tracked in [#10](https://github.com/zerowing113/data_science_game/issues/10). See the [player guide](docs/offline-player-guide.md), [verification record](docs/reviews/offline-preview-3.md), and [learner observation guide](docs/learner-playtest.md) before testing. Preview 1 predates saves and cannot provide a previous saved journey.

## Start locally

Requires Node.js 22.12 or newer and npm. No Python installation is needed.

```sh
npm ci
npm run prepare:python
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

`prepare:python` copies the pinned interpreter from npm and downloads the compatible Python wheels from the official Pyodide distribution on jsDelivr. Downloads are verified against the SHA-256 checksums in Pyodide's package lock and reused on later runs. These generated assets are ignored by Git. The browser serves Python and its packages from the same local origin; forecast execution does not require a CDN. Styling uses system fonts without external requests.

## Verify and build

```sh
npx playwright install chromium
npm run typecheck
npm run test:forecast
npm test
npm run build
npm run preview
```

Run `prepare:python` before development, tests, or building a fresh checkout. The production build includes the prepared runtime under `dist/python`. Ticket #10 now packages this game for offline browser play on Windows and macOS. See the [player guide](docs/offline-player-guide.md) and [build/verification procedure](docs/offline-build.md). The source includes browser-local save/resume (#12); the earlier published preview.1 does not. See the player guide for storage scope and recovery.

Browser tests use actual Python execution and the visible learner interface, with no canned forecast response or mocked model. Chromium is the tested browser. The supported fixture has 28 observed days starting August 31, 2026 and seven future dates, September 28–October 4. The exact underlying relationship is `20 + 2 * day + 12 * promotion`; this noise-free fixture teaches feature effects and is not intended to represent realistic forecast accuracy. For the two-feature model, September 28 predicts 76 mugs and the October 2 promotion predicts 96 mugs.

## Runtime and design

- React 19.3, TypeScript 5.9, Vite 6.4 (compatible with the project's Node version).
- Pyodide 0.28.3 with Python 3.13.2; pandas 2.3.1, scikit-learn 1.7.0, NumPy 2.2.5 and SciPy 1.14.1 from its compatible package lock.
- Python runs in a dedicated web worker so model training does not block the page. Each run gets fresh pandas tables and a fresh Python namespace; modules remain cached in the interpreter.
- The upcoming-week script receives `history` and `future` pandas DataFrames and must produce `predictions`: seven finite, non-negative numbers in future-date order. Evaluation uses the date-indexed Series contract described above for its seven or fourteen held-out days. Worker validation rejects absent, malformed, negative, and non-finite results.
- The feature choice updates the supported one-line starter `features` assignment without replacing the rest of the learner's edits. Custom assignments (including multiline Python) are preserved with explicit guidance; the starter can be restored to reconnect the visual choice. Code edits mark existing results as stale; failed runs do not present a prior forecast as current output.
- Runtime loading, training, success, and readable errors are visible. Initialization and execution have time limits. Stop terminates the worker; reset starts a fresh interpreter. Messages from an old worker cannot change the active session, and a timed-out runtime can be reset in place.
- Where Web Locks are available (including supported Chromium on localhost or HTTPS), workers initialize one at a time to avoid concurrent wheel-cache writes; model execution remains independent. A waiting message identifies a queued workspace. Other browsers retain the bounded retry and reset behavior.
- Startup checks that the core packages installed, retries missing core downloads once, and imports pandas and the starter estimator before announcing readiness. Incomplete package loading remains a recoverable startup error rather than appearing as a learner-code failure.
- The editor intentionally uses a labeled native textarea so keyboard and assistive-technology behavior remain familiar. Charts have text alternatives and a daily forecast table.

Reference: Pyodide's [web worker guide](https://pyodide.org/en/0.28.3/usage/webworker.html) and [bundler guidance](https://pyodide.org/en/0.28.3/usage/working-with-bundlers.html).

The broader game is tracked in [GitHub Issues](https://github.com/zerowing113/data_science_game/issues).
