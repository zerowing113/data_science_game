# Issues #2 and #4 implementation review

Scope: [Demand exploration #2](https://github.com/zerowing113/data_science_game/issues/2) and [Python recovery #4](https://github.com/zerowing113/data_science_game/issues/4), including the previously confirmed dataset-viewer interactions.

Baseline: `698bb773b4808df4363de916a0e1fe19efe52d9a` (HEAD at task start). Two implementation agents worked in parallel with separate file ownership; the parent integrated the learner interface. Independent standards and specification reviewers reviewed the staged changes before the implementation commit.

## Standards

0 findings. The changes follow the documented runtime and accessibility conventions and the domain distinction between historical observations, future inputs, and predicted demand. No actionable baseline smell or documented-standard violation was identified.

## Spec

0 unresolved findings, with no exclusions. The implementation covers fixture-backed exploration, column availability, separate upcoming inputs, sorting, linked chart selection, Python correction and retry, stop/reset, stale-session isolation, and attribution of saved forecasts.

Integration inspection caught two chart-selection edge cases: selecting a future point after sorting history by demand retained an invalid sort, and selecting the same point again did not reveal a row scrolled out of view. Cross-tab selection now resets sorting, and each chart selection triggers row reveal. Regression checks pass; the spec reviewer also verified both source corrections.

Final findings: Standards 0; Spec 0 unresolved.

## Validation

- Tests use the learner-facing browser boundary specified in the tickets, with real Python execution and independently worked fixture values.
- Initial history inspection and stop/reset tests failed before implementation, then passed. Exploration was extended through successive browser behavior slices.
- Four focused history tests passed: fixture values and column timing, sorting and unknown future demand, keyboard/mouse chart links, and real Python input parity with upcoming prediction links.
- Three focused recovery tests passed: stopping an infinite loop and resetting, correcting a Python error while preserving the original successful forecast, and resetting a delayed run without accepting its old result.
- Runtime readiness and model-completion assertions allow up to 60 seconds for cold Python/package imports. Ordinary UI assertions retain their shorter limits; the application's execution limits were not increased.
- TypeScript typecheck and production build passed.
- Final full browser suite: 10 passed, including the original forecasting tests and both new ticket suites.
- Production preview executed the two-feature model and then a deliberate Python error. Desktop (1440px) and narrow-screen (390px) snapshots of exploration, error feedback, and the expanded saved forecast were inspected. No JavaScript page errors or page-level horizontal overflow were observed.

Saved forecasts last for the current page session. Baseline evaluation and multi-experiment comparison remain issue #3. No hosting or deployment changes are included.
