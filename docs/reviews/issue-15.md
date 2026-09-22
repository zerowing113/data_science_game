# Ticket #15 — visual model evaluation

Specification: [GitHub #15](https://github.com/zerowing113/data_science_game/issues/15).
Review baseline: `490511eff99f1f19daffa90ae3e9f947c69f3010`.
Verification uses the previously approved learner-facing browser boundary and real Python.

## Delivered behavior

- The planned split and each saved comparison show chronological training/evaluation periods and identify all 28 historical observations with explicit T/E labels. The UI distinguishes historical holdout observations from unknown upcoming demand.
- Saved results display aligned observed-demand, model, and baseline lines above paired daily absolute-error bars. Both plots use the same dates, clearly labeled units, and separate vertical scales. Shapes, dashed lines, and solid/outlined bars supplement color.
- Native date buttons select an observation in both plots and expose the exact absolute-difference calculation for model and baseline. The sum of daily errors divided by the evaluation-day count explains each stored MAE; displayed numbers are rounded while scores retain their existing precision.
- Every chart reads the original saved rows and run number. Changed drafts and later failed/running attempts have explicit status labels; selectors cannot substitute for the actual Python output. Existing tables, saved code, metadata, hints, and inspection/progression remain available.
- Charts are static, bundled SVG with no new dependencies or network assets. Narrow layouts stack the explanation and provide keyboard-scrollable charts. No scoring logic, persistence schema, or Python execution behavior changed.

## Verification

- Typecheck and production build passed.
- The new browser regression failed before integration because the timeline did not exist, then passed. It checks custom Python despite selector changes, daily errors and score arithmetic, keyboard date inspection, immutable original splits after edits, failed reruns, and saved evidence/code after reload.
- All four existing evaluation tests passed, covering real models, both chronological splits, package recovery, invalid/misaligned outputs, and original run attribution.
- Packaged laptop/mobile charts were inspected with external networking blocked. A 390-pixel viewport retains a 390-pixel document width; charts scroll internally. The screenshot session recorded zero external page requests.
- Full Windows packaged browser suite: all 47 tests passed in 9.0 minutes with external networking blocked.

## Standards

Independent review found no documented-standard violations or actionable baseline code smells. Keyboard controls, non-color distinctions, retained exact numeric tables, responsive overflow, and original saved-state ownership were checked.

## Spec

Independent review found no missing or incorrect implementation requirements and no scope creep. Its packaged execution and visual-layout verification gates are recorded above.

Review totals: Standards 0 findings; Spec 0 implementation findings. This verification is not new native Mac acceptance, an observed learner session, or publication of a new release.
