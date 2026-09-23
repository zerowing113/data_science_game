# Mac preview 3 bundle-integrity diagnosis

User report: preview 3 Apple Silicon on a MacBook Air M4 displays a damaged/broken-app warning offering to move it to Trash. The owner described the OS as macOS Tahoe 27; exact build and literal dialog capture remain unavailable.

## Reproduction

[Native assessment](https://github.com/zerowing113/data_science_game/actions/runs/35824424898) downloaded the published archive, verified its SHA-256, and extracted it using ditto on macOS 15.7.9 arm64. `codesign --verify --deep --strict` failed with:

```text
code has no resources but signature indicates they must be present
```

The app carried the executable's Go linker ad-hoc signature, with an unbound Info.plist and no sealed resources. Gatekeeper reported the same integrity failure. This reproduces a concrete packaging defect; it does not reproduce the exact owner's OS dialog.

## Repair and verification

Commit `c2727df` signs the complete app bundle before manifest hashing. Mac packaging now requires macOS. Native package CI verifies the extracted app signature, so directly running a binary can no longer conceal this bundle-integrity defect.

[Regression run](https://github.com/zerowing113/data_science_game/actions/runs/35824638852) confirms the original failure, applies the production signing helper, and verifies the repaired app both before and after a ZIP roundtrip. TypeScript typechecking and Python compilation also passed. Application code is unchanged; the full browser suite was not rerun for this packaging-only repair.

Code-review baseline: `a68d474`. Standards: 0 hard violations, 0 judgment findings. Specification: 0 findings within the integrity repair; ordinary-launch acceptance remains incomplete.

## Remaining release blocker

After bundle repair, Gatekeeper rejects the ad-hoc app with exit 3. No Developer ID signing or notarization credentials are configured. A trusted distribution signature, notarization and stapled ticket, replacement archive verification, and actual downloaded-app testing are still required. Preview 3 assets are unchanged and its release notes now disclose the Mac launch blocker. No replacement is presented as fixed, and #10 remains open.
