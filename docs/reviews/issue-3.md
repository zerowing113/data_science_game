# Issue #3 implementation review

Scope: [Compare a model with a baseline on future days](https://github.com/zerowing113/data_science_game/issues/3).

Baseline: `58b93fe98ff772bf3fcc9ab45d6e7134bf014dcc` (HEAD at task start). Independent standards and specification reviewers inspected the staged implementation before commit.

## Standards

0 findings. No documented-standard violations or actionable baseline smells were identified. Evaluation calculations, presentation, and runtime handling have separate responsibilities; the existing worker lifecycle supplies stop/reset and stale-session protection.

## Spec

0 findings. The implementation provides chronological split choices, explicit training and evaluation dates, baseline/model scores on identical held-out rows, per-day predictions and errors, saved run configurations and metrics, and rejection of invalid or misaligned outputs.

The lab evaluates later historical observations, rather than inventing actual demand for the upcoming week. The baseline repeats the last training observation. Evaluation demand is excluded from Python inputs, and prediction date labels are checked against the submitted split before scoring. The saved code remains available for inspecting custom prediction logic.

Final review findings: Standards 0; Spec 0.

## Validation

- Browser tests use the learner interface and real Python, as specified in the issue.
- The first comparison test failed before the lab existed, then passed with a real scikit-learn model and independently calculated baseline MAE (80/7 = 11.43).
- The saved-experiment test failed before the comparison table existed, then passed with two real feature configurations and a later split change. The trend-only model scores 5.62; the promotion model scores 0.00 on the deliberately noise-free fixture.
- Invalid-output checks cover unindexed arrays, wrong counts, non-finite/negative values, reversed dates, and duplicate dates. None adds a successful record; reset and corrected rerun preserve earlier evaluations.
- Typechecking and the production build passed.
- Visual inspection exposed page-level overflow at 390px. A browser regression reproduced it; allowing the evaluation grid item to shrink keeps the wide tables inside their own scroll containers, and the regression passed.
- Production smoke testing exposed a Chromium cache-write failure for SciPy. Pyodide's package loader resolved despite the missing package. Startup now checks installed core packages, retries missing core downloads once, and verifies real imports before readiness. A browser regression blocks the SciPy download at the network boundary and then restores it to exercise reset/recovery with real Python.
- The download-failure regression passed. The corrected production smoke run also encountered the original cache error, recovered through the bounded retry, and successfully completed both feature comparisons. Desktop and 390px error/result views were inspected; no JavaScript page errors or page-level horizontal overflow remained.
- Final full browser suite: 14 passed, covering evaluation, original forecasts, exploration, and Python recovery. The final production build (including typechecking) passed.

Both independent reviewers rechecked the runtime-readiness and responsive-layout corrections and confirmed 0 final findings on their respective axes.

Evaluation records are session-only. Opening the lab starts a separate worker so upcoming forecasts and historical evaluations retain independent state. Private deployment and leakage lessons remain separate issues.
