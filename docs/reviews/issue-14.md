# Ticket #14 — visual stocking and saved shop playback

Specification: [GitHub #14](https://github.com/zerowing113/data_science_game/issues/14).
Review baseline: `bec641b946a3aaeb095590a3469ced46107a1ffc`.
Verification uses the previously approved learner-facing browser boundary, real Python, and the existing full launcher/browser restart check.

## Delivered behavior

- Seven illustrated order cards retain editable daily quantities and the selected completed forecast. Actual demand stays hidden until the complete plan is committed.
- A committed decision is saved immediately through the existing journey model. A separate, transient viewer plays morning delivery, customer orders, and evening clearance for each day; it never computes or commits another outcome.
- Mug symbols explicitly represent groups. Exact stock, sales, unfilled demand, leftovers, costs, recovery, and profit come from the saved decision. Shelf clearance and a separate next-day order preserve the no-carryover rule.
- Pause, next-stage, direct day selection, skip-to-results, and animation replay operate on the same saved decision. A selector can inspect older decisions; revising stock still creates a separately attributed replay of already revealed demand.
- Reopening defaults to the complete saved week, independent of how much animation was watched. Reduced motion starts with static results and permits manual day/stage inspection. Hidden application activities and hidden browser tabs pause playback.
- Assets are bundled inline SVG/CSS; controls use native buttons. Small-screen scenes are keyboard-scrollable, and the page fits a 390-pixel viewport. No persistence schema, Python execution, business calculation, or final-challenge rule changed.

## Verification

- Typecheck and production build passed.
- The first new browser regression failed before implementation, then passed. It verifies day quantities, exact costs/profit, keyboard day selection, skip, a complete animated week, nondestructive replay, and reload during playback.
- A second browser regression passed for reduced motion, zero stock, the 10,000-mug capacity, next-day zero stock after clearance, and independent older-decision viewing.
- All three existing stocking tests passed, retaining exact, understock, overstock, invalid input, custom Python, failed-run attribution, and revised-plan behavior.
- Review identified that entering the final challenge could leave playback advancing in a hidden practice panel. A navigation regression failed before the fix and passed afterward. The viewer now receives the application's authoritative activity visibility.
- Desktop/mobile planning, daily scene, and week-summary screenshots were inspected in the extracted package with external networking blocked. At 390 pixels, document width equals viewport width; the scene itself scrolls horizontally. The screenshot session recorded zero external page requests.
- All 46 browser tests passed against the extracted Windows package with external networking blocked (8.9 minutes), including all three new playback regressions and the existing mission, persistence, recovery, and final-challenge journeys.
- The full launcher/browser process restart check passed (26.8 seconds), retaining original forecast, stocking attribution, completed final results, and reflections in the same browser profile.

## Standards

Independent review found no hard violations and one visibility-state finding. The authoritative visibility fix and regression resolved it; follow-up review reported no remaining findings.

## Spec

Independent review found no missing or incorrect implementation requirements and no scope creep. Packaged verification and actual process reopening are recorded above rather than inferred from a reload-only test.

Review totals: Standards 0 remaining findings; Spec 0 implementation findings. Verification does not constitute new native Mac acceptance, an observed learner session, or publication of a new release; those remain separate from this implementation.
