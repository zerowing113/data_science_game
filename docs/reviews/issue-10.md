# Ticket 10: downloadable offline test edition

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

Native CI run: https://github.com/zerowing113/data_science_game/actions/runs/35371332982 (final result recorded after completion).

The first native Windows CI run passed launcher/offline checks and eight journey tests, but one recovery test stopped waiting for startup after 60 seconds. Its trace shows all runtime requests returned HTTP 200 and package installation completed; imports were still in progress. The app already allows 120 seconds for startup. Recovery assertions now allow that existing window plus a small observation margin, with a test budget for two sessions. All three focused recovery tests pass locally after this test-only adjustment. No production timeout was increased.

## Release boundary

The application remains session-only pending #12, and Stop game warns about losing progress. These are unsigned test builds, with no signing or notarization credentials configured. CI execution of an extracted native executable is distinct from normal downloaded-app security prompts and double-click launch. Automatic approval review rejected the local `Start-Process` attempt to launch the extracted GUI executable with "blocked by policy"; no normal desktop-launch verification is claimed. No repository visibility change, hosted deployment, or completed learner playtest is claimed.
