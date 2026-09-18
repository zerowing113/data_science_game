# Issues #5 and #6 implementation review

Scope: [Repair missing data](https://github.com/zerowing113/data_science_game/issues/5) and [Discover and correct a leakage trap](https://github.com/zerowing113/data_science_game/issues/6).

Baseline: `1e48bb11dc1f91d87bf24d0f6ecd112a2db520b7` (HEAD at task start). The lessons were implemented in separate worktrees, integrated on main, and reviewed independently against the staged diff.

## Standards

0 remaining findings. Initial findings identified Windows-1252 punctuation in missing-data source/tests, an interrupted timing attempt lost by reset, and duplicated prediction validation. Source/tests were converted to UTF-8. Reset now saves unverified interrupted evidence. Both historical and upcoming executions share validation against request-owned prediction counts and dates. The reviewer confirmed all corrections and found no additional actionable smells or documented-standard violations.

## Spec

0 remaining findings. The initial review identified leakage explanation available before the consequence. Feature timing metadata remains inspectable, but the diagnostic explanation and correction now appear after the learner observes a leaked result or forecast-time failure. Browser coverage checks that sequence. The reviewer confirmed coverage of both live issues and the associated SPEC stories, with no scope expansion.

Final review findings: Standards 0; Spec 0.

## Validation

- Browser tests drive visible learner controls and real Python. Each lesson's first test failed before its interface existed, then passed after implementation. Missing retained failures, reset interruption, premature explanation, and mutated upcoming inputs also had failing regressions before correction.
- Missing-data fixture: day 10 is absent in training and day 24 in evaluation. The median of observed training day values is 10; it restores training exactly. Reusing that median predicts 40 instead of 68 on evaluation day 24. The other six predictions are exact: MAE = 28/7 = 4.00. Baseline MAE = 80/7 = 11.43. A custom repair derives day from the intact calendar date and scores 0.00 with real model execution.
- Untreated missing data produces a genuine NaN error before repair guidance. Saved failed, completed, and interrupted attempts retain original source code, choices, expectations, and dates. Code survives selector changes and runtime resets.
- Leakage fixture: the fictional closing-request count equals realized demand, including unfulfilled requests. It produces retrospective model MAE 0.00 versus baseline 11.43, but the same program fails on upcoming inputs that omit that report. Removing it and using day plus planned promotion produces valid predictions, starting at 76 mugs. No upcoming demand score is invented.
- Timing validity follows the submitted program, not the visual selector. The supported recipe accepts comments/formatting changes. Unsupported custom output remains unverified even with a safe fitted model in scope. A constant-70 custom historical forecast scores 50/7 = 7.14 but is not certified. Failed and reset-interrupted attempts retain unverified status.
- Historical and upcoming prediction validation rejects changed row counts and date alignment. A custom program expanding upcoming rows previously crashed the UI; it now retains the historical result and reports the upcoming validation failure without rendering an invalid table.
- Opening all four workspaces together reproduced Chromium `ERR_CACHE_WRITE_FAILURE` while downloading SciPy, leaving lessons unavailable even after the existing bounded retry. Worker startup now uses a shared initialization lock where supported; execution remains independent. The production four-workspace regression failed before the fix and passed afterward. The [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API) provides the worker coordination; browsers without it retain retry/reset behavior.
- Typechecking and the production build passed. Production smoke testing opened all workspaces and exercised untreated/repaired missing data and leaked/corrected forecasting. Final smoke reported no page errors or mobile page overflow. Desktop and 390px lesson layouts were visually inspected.
- Final full browser suite: 24 passed (4.2 minutes), covering prior forecasts, evaluation, exploration, recovery, and stocking plus both lessons and simultaneous workspace startup. Final source line endings were normalized and the production build/typecheck and staged whitespace check passed.

Experiment records are session-only. Arbitrary preparation code is inspectable but is not automatically audited for training-only imputation; unsupported timing programs remain unverified. Guided progression, final completion/recap, playtesting, and private hosting remain separate tickets.
