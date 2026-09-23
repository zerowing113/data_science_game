# Ticket #17 — visible feature timing

Specification: [GitHub #17](https://github.com/zerowing113/data_science_game/issues/17).
Review baseline: `f48167e133cbd3a54f16cec13ed7b9dd1c2e2c25`.
Verification uses the previously approved learner-facing browser boundary and real Python.

## Delivered behavior

- A forecast-cutoff timeline places calendar trend and planned promotions before the decision, and the closing request report after the shop closes. Native buttons select an explanation, with explicit availability labels, arrows, dashed borders, and text independent of color. The guide does not claim to analyze edited code.
- Each completed experiment compares saved historical model/baseline MAE with the actual saved forecast-time execution outcome and timing verdict. Upcoming execution and future accuracy remain separate: returned predictions cannot establish accuracy against unknown future demand.
- Existing leaked, valid, and custom-unverified verdicts remain unchanged. The visual reads only the saved experiment; selectors cannot rewrite its scores or validity. Draft edits and later failed or unfinished attempts label earlier evidence as belonging to its original execution.
- Existing code, detailed tables, technical errors, optional hints, independent repair, and explicit inspection/progression remain intact. The change adds no worker behavior, hidden future outcomes, persistence fields, external dependencies, or animation.

## Verification

- Typechecking and production build passed.
- The new browser regression failed before the timeline existed, then passed with real Python. It exercises keyboard feature inspection, selector/code disagreement, leaked and valid supported models, a runnable unverified custom forecast, a later failed attempt, draft status, and saved code/evidence after reload.
- All five targeted leakage browser tests passed in 1.3 minutes, including interrupted runs, invalid upcoming dates/counts, custom code, and unchanged timing verification.
- Packaged laptop/mobile screenshots of the timeline and leaked/valid evidence were inspected. At a 390-pixel viewport, document width stayed 390 pixels. The isolated browser used an unusable external proxy and recorded zero external page requests.
- Full Windows packaged browser suite: all 50 tests passed in 11.6 minutes with external networking blocked.

## Standards

Independent review found no documented-standard violations or actionable heuristic findings. Saved execution ownership, explicit validity and accuracy distinctions, offline/local-save contracts, native keyboard controls, retained tables, and real browser regression tests conform to the README and ADRs.

## Spec

Independent review found no missing or incorrect implementation requirements and no scope creep. The timeline, actual saved-run evidence, conservative custom-code status, unchanged learning progression, keyboard/non-color presentation, and reopening regression match #17.

Review totals: Standards 0 findings; Spec 0 implementation findings. Native Mac acceptance, observed learner playtesting, and public release publication remain separate from this local Windows verification.
