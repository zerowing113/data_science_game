# Ticket 12: save and resume one local journey

Baseline: `56744a3`. Scope: the local save/resume implementation against GitHub issue #12 and ADR 0002. Historical planning files already present in the working directory are outside this commit.

## Standards

Independent review found that a malformed saved seven-day forecast with fourteen predictions could pass validation and crash rendering. A browser regression reproduced the failure. Contextual prediction and row-length validation now rejects it, retains the original backup, and allows confirmed recovery. Follow-up review found no remaining documented violations or actionable code smells.

## Spec

Independent review found no remaining missing requirements or scope creep. The reviewer noted that comparing localStorage before writing did not serialize simultaneous tabs. The implementation now holds a Web Lock for the active document: another tab cannot edit or delete the journey, and can resume after the active tab closes. A browser check verifies that handoff.

## Repairs and verification

The existing partial-write regression reproduced a new run source being paired with an old result when storage filled between writes. Related synchronous updates now persist together in one atomic storage write. A second browser regression reproduced lost interruption evidence on Reset Python; forecast and evaluation histories now explicitly retain that attempt before resetting. Both regressions passed after repair.

TypeScript checking and production build pass. A new Windows archive was built and extracted with manifest verification. The launcher checks, empty-browser offline real-Python smoke test, and same-profile browser/launcher process restart check pass. The restart preserves original code, feature choice, expectation, and the real computed forecast with external networking unavailable.

Final verification on September 22, 2026: all 42 browser tests passed against the extracted Windows package with external networking blocked (8.7 minutes), including all 12 persistence tests and the complete guided mission. The three launcher tests, one offline smoke test, and one full process-restart test also passed. During focused testing, overlapping Playwright commands shared the trace output directory and caused an artifact-cleanup failure; final package checks run sequentially.

## Release boundary

The local Windows archive is a working-tree verification build, not a published release. The published preview.1 still predates persistence. The native CI workflow now includes persistence and process-restart checks on all three targets, but those new checks have not been run on macOS in this session. Normal Explorer/Finder launch, disconnected-device acceptance, and the learner playtest remain #10/#11 work.

## Completion review, September 22, 2026

Rechecked the committed implementation (`git diff 56744a3...ff4ff88`) against all eight acceptance criteria in GitHub issue #12 and ADR 0002. Separate standards and specification reviewers inspected the code again. Standards found no documented violations and one nonblocking maintainability concern: saved-state key/value types and runtime validators are maintained separately, so future schema changes require coordinated edits. No speculative refactor was added to this completed slice. Specification review found no missing requirements, incorrect behavior, or substantive scope creep.

The focused 12-test persistence file, TypeScript check, and production build passed again. Built a fresh Windows archive from the current source, extracted it with manifest/checksum verification, and passed all three launcher checks, the fresh-browser offline Python smoke test, and the complete launcher/browser process-restart check. This is a local working-tree verification artifact; it is not a replacement public release.

The final full packaged browser suite passed all 42 tests in 7.9 minutes with external networking blocked, including the complete guided journey, final challenge, all 12 persistence tests, runtime recovery, and stocking outcomes. Package tests ran sequentially to avoid shared artifact-directory collisions.

The README now distinguishes the published session-only preview from the current save/resume source. Ticket #12 completion concerns persistence and recovery; replacement downloads and native-device release acceptance remain in #10, and learner observations remain in #11.
