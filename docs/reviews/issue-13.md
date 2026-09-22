# Ticket #13 — visual forecasting workspace

Specification: [GitHub #13](https://github.com/zerowing113/data_science_game/issues/13).
User-approved review baseline: `64c063cea3e7a60d74eb25a09d12120b55e4e95f`.
User-approved test boundary: learner-facing browser UI with real Python, activity changes, failures, and saved-work reopening.

## Delivered behavior

- A bundled SVG depicts the online shop's mug shelves and packing studio. It is explicitly an illustrated display, not committed inventory or future demand.
- Exploration uses the available width. Forecasting presents data and Python side by side on a laptop, stacking at smaller widths. Existing guided progression, hints, and final-challenge visibility remain intact.
- A labeled historical/future timeline and selectable seven-day forecast strip distinguish observations, known inputs, predicted demand, and unknown actual demand. Planned promotion badges do not claim that custom Python used those features.
- Forecast bars and values come from completed Python results with their run number. Edited code is marked as stale; running or failed attempts do not present earlier predictions as current. Previous successful evidence remains available in its existing saved section.
- Native buttons support keyboard day inspection. The shop animation runs once for three seconds and is disabled for reduced motion. No new persistence fields, Python dependencies, network assets, or business rules were introduced.

## Verification

- Typecheck and production build passed.
- The new visual-workspace regression failed before integration because the forecast strip did not exist, then passed with real Python. It covers custom predictions despite a different selector, keyboard day selection, reopening, edited code, a failed run, and retained previous successful evidence.
- All seven existing forecast and history tests passed.
- Built and checksum-extracted a Windows offline verification package from the implementation working tree. This is not a published release or native Mac acceptance.
- Inspected packaged screenshots at 1366 × 900 and 390 × 844 with a real promotion forecast. Mobile content width equals viewport width; reduced-motion animation is disabled. The screenshot session recorded zero external page requests with a nonworking external proxy.
- All 43 browser tests passed against the extracted Windows executable with external networking blocked (9.4 minutes). This includes final challenge, guided activity revisits, saved code/decisions/reflections, recovery, stocking, and the new visual forecast regression.

## Standards

Independent review found no hard violations. Two nonblocking judgments were addressed: consolidate layout styling into its existing stylesheet owner and stop persistent decorative motion. The follow-up review confirmed both fixes and reported no remaining findings.

## Spec

Independent review found no blocking implementation findings or scope creep. Its outstanding verification note is covered by the full packaged suite result above, including the existing mission and persistence journeys.

Final review totals: Standards 0 remaining findings; Spec 0 implementation findings. Stocking animation and later lesson redesigns remain in #14–#18; release/device and observed learner acceptance remain in #10 and #11.
