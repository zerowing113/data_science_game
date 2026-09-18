# Issue #8 implementation review

Scope: [Guide the mission with fading help and hints](https://github.com/zerowing113/data_science_game/issues/8), including its published Agent Brief.

Baseline: `6cdf14fbc8705275f13d91b1bdb2cdcd786bf4e5` (HEAD at task start). Independent standards and specification reviewers inspected the staged implementation before commit.

## Standards

0 remaining findings. The initial review found that observations made while guided practice was paused were discarded, leaving hints locked after resuming despite a saved result/error. Observation events now survive mode changes without awarding completion. A browser regression failed before the fix and passed afterward. The reviewer confirmed the correction, with no documented-standard violations or other actionable smells.

## Spec

0 findings. The six ordered steps expose objectives and progress, preserve the choice/expectation/code/result-inspection loop, require increasingly independent repair code, and provide optional progressive hints after observed consequences. Errors and hints cannot award completion. Previously reached workspaces preserve editors and attributed experiment evidence across revisits and mode changes. Practice completion explicitly reserves the fresh challenge/reflection for #9.

Final review findings: Standards 0; Spec 0.

## Validation

- Tests use the established learner-facing browser boundary and actual Python. The opening journey failed before the guide existed, then passed. The complete journey failed before the evaluation inspection action existed, then passed after integration.
- Exploration requires a selected historical day, an inspected column, and an upcoming-input view. A successful forecast still cannot advance until explicitly inspected. Failed code and all three hints leave progress unchanged; corrected code remains retryable.
- A failure executed in free practice unlocks hints on returning to the guide, while leaving the forecast step incomplete. The saved editor, hint count, and inspected source run survive navigation.
- The full journey runs a real promotion forecast, obtains evaluation MAE 0.00, exposes untreated NaN input, writes the two missing imputation lines, and obtains repaired MAE 4.00.
- The timing step first records leaked evidence. Its independent repair omits the entire model creation/training/prediction block; the placeholder fails without awarding progress. The learner supplies the block and obtains supported valid evidence before inspection can complete the step.
- Requesting the full hint sequence does not alter the editor or advance the step. Restore controls preserve guided scaffolding rather than inserting complete solutions.
- A committed stocking outcome requires its own inspection. The finished state identifies a practice journey, not a final win or proof of understanding. Revisited repair records, source code, and hints survive a round trip through free practice.
- Typechecking and production build passed. The complete real-Python journey also passed against the production build. Desktop guide/repair/completion views and the 390px guide were visually inspected; the browser check found no page-level horizontal overflow or replacement characters in the rendered text.
- Final full browser suite: 26 passed (5.4 minutes), covering the prior free-practice lessons, simultaneous runtime startup, the two guided journeys, recovery, and stocking. The staged whitespace check passed.

Progress, hints, and records are session-only. The original free-practice workspaces remain available. No final challenge, reflection assessment, private deployment, or observed learner playtest is claimed by this issue.
