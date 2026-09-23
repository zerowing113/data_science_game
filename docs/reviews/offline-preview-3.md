# Offline preview 3 verification

Release candidate: clean application revision `fb42250d0536c92a4a9dd29c50ea5c7c2561fac0`, including visual tickets #13 through #18. Later documentation commits do not change the packaged application.

[Native CI run](https://github.com/zerowing113/data_science_game/actions/runs/35808449392) builds, extracts, and tests the actual archive on each target. Browser checks use blocked external networking and real bundled Python.

| Native target | Launcher checks | Offline smoke | Process restart | Full browser suite |
|---|---|---|---|---|
| Windows x64 | 3 passed | 1 passed | 1 passed | 51 passed, 22.0 minutes |
| Apple Silicon macOS | 3 passed | 1 passed | 1 passed | 51 passed, 12.9 minutes |
| Intel macOS | 3 passed | 1 passed | 1 passed | 51 passed, 32.5 minutes |

## Compatible Windows replacement

The published preview 2 Windows archive was downloaded and checksum/manifest verified. The replacement check then used its extracted executable and the exact new Windows CI executable, in separate folders. It passed in 25.8 seconds, retaining saved Python, forecast attribution, stock decisions, final completion, and reflections across separate browser and launcher processes in the same browser profile. This is automated compatibility evidence, not normal Explorer launch evidence.

## Publication

All three CI archives match their SHA-256 files, clean revision `fb42250d0536`, and every manifest file hash (27 files on Windows, 28 on each Mac target). [Preview 3](https://github.com/zerowing113/data_science_game/releases/tag/offline-v0.1.0-preview.3) was published as a public unsigned prerelease with all three ZIPs and their checksum files. All six assets were downloaded again without authentication and matched the tested CI bytes. Public ZIP manifests and source revisions were independently reverified.

- macos-apple-silicon: `47c9028a9d487c2629eaaf05a9ad440b7b2c1541f5d27fb3fe9966b2c07ec9e5`
- macos-intel: `5d64e352c208c795888c0848891d5ee9d1fc0fd5a7e6aa04ec550b7f9522e790`
- windows-x64: `56d585657986e5f3a102f38985dc8e7b71be842d34c8c6f1cdf105d582893ffb`

## Remaining acceptance

The packages are unsigned. Normal downloaded-app launch, exact security prompts, physically disconnected first launch/full mission, and actual-device resume/replacement remain open in #10. The earlier Windows/Firefox Wi-Fi-on report with no warning applies to preview 2 only; it does not establish offline or full Firefox acceptance.

The [learner observation guide](../learner-playtest.md) is prepared for #11. The actual laptop/browser, session timing, assistance, demonstrated understanding, and recovery after the revised missing-data guidance still need observation. Automated success does not complete either ticket.

## Review and change boundary

Standards review: 0 hard violations and 0 judgment findings. Specification review: 0 findings. Review baseline: `fb42250d0536`; this follow-up changes release and acceptance documentation only. No application code or test assertions changed. Native full-suite results above provide the package verification; documentation links and whitespace were checked separately.
