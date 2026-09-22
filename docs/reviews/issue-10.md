# Ticket 10: downloadable offline test edition

The original review below records preview 1 on September 18, 2026. Its session-only and private-distribution statements describe that historical build. Save/resume is now complete under #12, and distribution is public. See the September 22 continuation at the end for current #10 work.

Baseline: `67294c2`. Review scope: staged changes against that baseline; specification is the updated GitHub ticket #10 and the accepted offline distribution decision.

## Standards

Independent review found no documented-standard violations or blocking correctness defects. It identified a minor stop-confirmation focus issue. Opening the confirmation now focuses Keep playing, and cancelling returns focus to Stop game. The browser test checks both transitions.

## Spec

Independent review found two acknowledged acceptance gaps: local save/resume integration from #12, and native downloaded-app launch/security verification through Explorer/Finder. No additional implementation defects or scope creep were identified. Ticket #10 remains open until these criteria are satisfied.

## Verification

The initial launcher test failed because the executable did not exist. Its first implementation exposed a shutdown timeout with a partly consumed runtime download; bounded forced closure fixed it. All three launcher tests then passed: embedded serving/repeated launch/shutdown, occupied-port feedback, and local request guards.

The offline browser test initially failed because the app requested Google Fonts. Removing that network import fixed it. The extracted Windows ZIP then executed a real forecast from an empty browser context with no non-loopback requests and stopped through the browser controls.

Production build and TypeScript checking pass. The packager validates Python dependency hashes and core runtime assets, produces Windows x64 and macOS Intel/Apple Silicon archives, and includes manifests/checksums and upstream license notices. Extraction verifies the packaged files before executing them.

The full 30-test browser suite passed against the extracted Windows executable with external networking blocked by the packaged test configuration (7.5 minutes). The dedicated offline smoke test and three launcher tests also passed. Playwright discovery is now explicitly limited to `*.spec.ts` so the separate Node launcher tests are not executed incidentally during collection; `--list` confirms all 30 browser tests remain included. The standards reviewer verified the focus and discovery fixes with no remaining findings.

Initial native CI run: https://github.com/zerowing113/data_science_game/actions/runs/35371332982.

The first native Windows CI run passed launcher/offline checks and eight journey tests, but one recovery test stopped waiting for startup after 60 seconds. Its trace shows all runtime requests returned HTTP 200 and package installation completed; imports were still in progress. The app already allows 120 seconds for startup. Recovery assertions now allow that existing window plus a small observation margin, with a test budget for two sessions. All three focused recovery tests pass locally after this test-only adjustment. No production timeout was increased.

Apple Silicon passed the first native run. Intel Mac passed seven journey tests; the multi-fixture challenge and complete practice tests hit their aggregate 120-second test budget while still progressing (the practice trace had reached the leakage repair). Packaged journeys now allow ten minutes overall for multiple Python sessions; per-operation limits remain intact. The intermediate run was cancelled in favor of verification at the corrected test budgets: https://github.com/zerowing113/data_science_game/actions/runs/35372921547.

Final native result: all three jobs passed at `28b4d4b` on Windows x64, Intel macOS, and Apple Silicon macOS. Each built and extracted its own ZIP, verified manifests, passed all three launcher tests, passed the fresh-browser offline real-Python smoke test, and passed nine guided-mission/challenge/recovery tests. The CI-built archives were downloaded and their SHA-256 files and clean revision manifests were verified before publishing the unsigned `offline-v0.1.0-preview.1` prerelease. The owner explicitly selected an unsigned first test release.

## Release boundary

The application remains session-only pending #12, and Stop game warns about losing progress. These are unsigned test builds, with no signing or notarization credentials configured. CI execution of an extracted native executable is distinct from normal downloaded-app security prompts and double-click launch. Automatic approval review rejected the local `Start-Process` attempt to launch the extracted GUI executable with "blocked by policy"; no normal desktop-launch verification is claimed. No repository visibility change, hosted deployment, or completed learner playtest is claimed.

## September 22 release continuation

Baseline: `c72e234`; release implementation: `cb7ee52`. The native workflow now executes all 42 packaged browser tests sequentially after launcher, offline smoke, and full process-restart checks on each target, with a 45-minute job budget. The restart test also retains committed stock, completed final results, and all three reflections across browser/launcher process boundaries. Existing persistence tests cover inspected practice progress across page reopening; the process-restart check does not independently assert that field.

TypeScript checking and the production build pass. The expanded restart check passed against the earlier Windows verification archive. A compatible-replacement check then created a journey in the earlier save-capable `ff4ff88` verification build and resumed it in the clean `cb7ee52` Windows package from a different folder, using the same origin and browser profile. Both executable paths and reported build versions differed. Forecast source, stock source, final completion, disabled resubmission, and original reflections were preserved with external networking blocked.

Standards review found no documented violations or actionable smell findings. Specification review found no blocking implementation defects or scope creep, while retaining the release, current native CI, compatible-replacement evidence, and actual-device observations as separate acceptance requirements. The native-device record explicitly leaves unobserved checks pending.

The first expanded native run was https://github.com/zerowing113/data_science_game/actions/runs/35696045686. Windows passed all 42 browser tests in 15.6 minutes. Apple Silicon passed 41 of 42 in 10.5 minutes, and Intel Mac passed 41 of 42 in 20.7 minutes; both Mac jobs failed only the history-navigation test because its Windows-specific Control+Home shortcut left the correctly focused table scrolled down at 923 rather than 0. The captured Apple Silicon trace showed that all preceding row/chart selection assertions passed. Commit `20e3a28` uses the unmodified Home key and retains the same scroll-position and viewport assertions. All four focused history tests and typechecking passed locally, and both reviewers found no concerns in the correction. Running the complete browser suite on each target exposed this previously untested platform assumption.

Corrected native release verification passed on all three targets at `20e3a280805a`: https://github.com/zerowing113/data_science_game/actions/runs/35697325071. Each job passed three launcher checks, one fresh-browser offline real-Python check, the expanded full process-restart check, and all 42 packaged browser tests. Full-suite durations were Windows 16.9 minutes, Apple Silicon 13.7 minutes, and Intel Mac 22.0 minutes. The same native Mac history test that failed in the first run passed after the key correction.

The three clean CI-built archives and SHA-256 files were verified against the source revision and every manifest file hash before publishing [preview 2](https://github.com/zerowing113/data_science_game/releases/tag/offline-v0.1.0-preview.2). All three ZIPs and checksums were then downloaded from the public release without authentication and verified to match the tested CI artifacts byte-for-byte. The compatible-replacement test passed again using the exact CI-built Windows release executable, retaining forecast and stock attribution, final completion, and the original reflections from the earlier save-capable build.

Ordinary Explorer/Finder launch, security prompts, physically disconnected native-device testing, and the learner session have not been observed in this continuation. The owner has Windows and Apple Silicon devices available for those observations; Intel Mac device access remains unconfirmed. The [device acceptance record](../offline-acceptance.md) contains the released archive hashes and leaves all unobserved device results pending. Ticket #10 remains open for that acceptance; #11 still requires the actual learner session.
