# Ticket #16 — understandable missing-data repair

Specification: [GitHub #16](https://github.com/zerowing113/data_science_game/issues/16).
Review baseline: `e666da6d3a5128fb5a4ed23f08fbf6bf66b1f9ae`.
Verification uses the previously approved learner-facing browser boundary and real Python.

## Delivered behavior

- An input map reads the actual missing-data fixture and displays every day value, its date, and training/evaluation partition. Dashed borders, question marks, and explicit Missing labels distinguish gaps from real zero values. The map remains an illustration of original inputs, never a claim about edited Python output.
- An optional three-step explanation shows learning preparation from training, applying the same learned values to later inputs, and inspecting actual prediction errors. It is explicitly labeled as an illustration. No preparation code, hints, scores, progression rules, or save format changed.
- Current and saved failures share concise explanations and next actions. The exact unfinished placeholder and the LinearRegression missing-input failure have distinct guidance; unrelated errors get general debugging guidance. Full original technical details remain available in native, keyboard-operable disclosures.
- Saved successful attempts report verified predictions and scores without certifying the selected preparation method. Original code, output, expectations, choices, and dates remain inspectable. Failed and interrupted attempts retain their own status and never borrow a successful score.

## Verification

- Typechecking and production build passed.
- The new browser scenario failed before the visual map existed, then passed with real untreated, unfinished, successfully repaired, and unrelated-error executions. It checks custom preparation independent of the selector, original evidence after reload, and a 390-pixel layout.
- Both existing missing-data tests passed: training-only median preparation still scores 4.00 against baseline 11.43; custom preparation, runtime reset, and stopped attempts retain their original evidence.
- Review found a chained custom-exception classification edge. A browser regression reproduced it before the fix, then passed: the final custom exception gets general guidance even when an earlier exception was the preparation placeholder. Keyboard activation reveals its complete traceback.
- Both new browser tests passed after the correction (31.1 seconds).
- Packaged laptop/mobile input maps, preparation explanation, and a saved failure were visually inspected. At 390 pixels, document width remained 390 pixels. External networking was blocked; the screenshot session recorded zero external page requests. Visuals are static, local HTML/CSS with no new assets or dependencies.
- Full Windows packaged browser suite: all 49 tests passed in 9.4 minutes with external networking blocked.

## Standards

Independent review found no hard documented-standard violations or actionable heuristic findings. Fixture-derived data, non-color cues, shared failure rendering, preserved saves and worker lifecycle, local responsive styling, and real browser tests conform to the README and ADRs.

## Spec

Initial review found one issue: a custom exception at the end of a chained traceback could be mistaken for an earlier placeholder error. The parser and browser regression were corrected. Follow-up review confirmed the finding resolved, with no other missing requirements, incorrect implementations, or scope creep.

Review totals: Standards 0 findings; Spec 0 remaining findings (1 found and fixed). This verification does not establish native Mac acceptance, an observed learner session, or publication of a new release; #10 and #11 remain separate.
