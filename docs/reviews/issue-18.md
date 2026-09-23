# Ticket #18 — visual final challenge

Specification: [GitHub #18](https://github.com/zerowing113/data_science_game/issues/18).
Review baseline: `190850043a907fed72bfc3cf3e56dfc89a3e496a`.
Verification uses the previously approved learner-facing browser boundary and real Python.

## Delivered behavior

- The final challenge places its dated training/upcoming timeline and forecast cards alongside the independent Python workbench. Activity links identify modeling, stock commitment, and review. The optional feature-timing guide uses the fresh challenge's forecast period and does not supply model code.
- Upcoming cards display only known inputs and actual completed Python predictions. Dirty drafts remain labeled. Stock commitment expands across the workspace; answers, evaluation charts, and shop outcomes mount only after submission.
- Each saved recap combines the shared daily-error/MAE visualization, animated shop playback, source challenge/run identification, exact tables, submitted code, and learner reflection cards. Forecast quality, feature validity, and business profit remain distinct.
- Shared charts accept the calling activity's timeline and only the score fields they render. Shop playback accepts the saved rows/totals and source run number without inventing practice-only feature choices. No scoring, data generation, saved schema, completion criteria, or worker execution rules changed.
- Playback is transient, pauses when the final workspace is hidden, and respects reduced motion. Reopening a completed submission shows the saved week totals and reflections without rerunning Python or recommitting stock. Earlier saved recaps remain replayable after a fresh challenge starts.

## Verification

- Typechecking and production build passed.
- The new end-to-end browser test failed before the final forecast visualization existed, then passed through an unfinished starter, successful learner-written Python, committed stock, revealed evaluation/shop results, reflections, and completed recap reopening.
- The seed-1 worked example orders 117 mugs on the first day and the forecast thereafter: 867 stocked/sold, one lost sale, profit $6,069, model MAE 0 against baseline 8. The regression verifies these independently known values and original run 2 attribution, including selector/code disagreement.
- All five targeted final challenge tests passed in 2.3 minutes, covering failures, unverified high-profit runs, fresh retries, invalid stock, changed drafts, and interrupted execution.
- Review caught a replay visibility bug affecting earlier recaps after retry. The extended browser test reproduced it before the fix; afterward, it confirms the earlier recap advances through playback while new challenge answers stay hidden. Re-review confirmed resolution.
- The corrected final journey plus existing evaluation and timing visual regressions passed together (3 tests, 51.9 seconds). A rendered chart-label overlap was also corrected by placing the selection highlight behind the plot titles.
- Packaged laptop/mobile modeling, evaluation, shop, and reflection views were visually inspected. Document width remained 390 pixels at a 390-pixel viewport. External networking was blocked; the screenshot session recorded zero external page requests.
- Full Windows packaged browser suite: all 51 tests passed in 12.5 minutes with external networking blocked.

## Standards

Independent review found no hard documented-standard violations. It identified the earlier-recap replay bug as a functional judgment finding; the visibility fix and regression resolved it. No remaining naming, duplication, abstraction, or ownership issues were found.

## Spec

Independent review identified the same earlier-recap replay issue and confirmed its resolution. It found no other incorrect or missing core requirements and no scope creep. Fresh data, hidden answers, learner code, validity, baseline eligibility, saved results, and reflections remain intact.

Review totals: Standards 0 remaining findings; Spec 0 remaining findings (one shared issue found and fixed). Device/release acceptance remains in #10 and observed learner acceptance remains in #11; this work does not publish a new public release.
