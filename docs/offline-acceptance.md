# Native-device acceptance for ticket #10

Use the actual published ZIP for each target. CI verifies native executables headlessly, with external browser networking blocked. It does not establish Explorer/Finder launch behavior, downloaded-app security prompts, or physical disconnection. Keep these observations separate.

## Device record

| Target | Release / archive SHA-256 | OS / browser version | Normal launch | Disconnected first launch + full mission | Restart + compatible replacement |
|---|---|---|---|---|---|
| Windows 11 x64 | Pending | Pending | Not observed | Not observed | Not observed on a manual device |
| macOS 14+ Intel | Pending | Pending | Not observed | Not observed | Not observed on a manual device |
| macOS 14+ Apple Silicon | Pending | Pending | Not observed | Not observed | Not observed on a manual device |

For each observation record the date, observer, exact build/checksum, OS version, processor, browser/version, and whether the browser profile was fresh. Record exact security or startup messages and the actions required to proceed. A blocked launch is a finding, not a pass. Do not disable OS protections to obtain a passing result.

## Procedure

1. Download the target ZIP and its SHA-256 file from the release. Verify they match, then extract using the normal OS archive tool into a new folder. Keep the previous compatible build for the replacement check.
2. Set Chrome or Edge as the default browser and use a fresh test profile. Disconnect external networking before first launch. Double-click Start Game in Explorer/Finder; record all prompts and whether the browser opens without developer tools or a separate Python installation.
3. Complete exploration, forecast, historical comparison, missing-data repair, leakage correction, and stocking. Finish a fresh-data final challenge and enter all three reflections. Record any loading, layout, Python, or interaction failures and the browser/OS used.
4. Use Stop game, close the browser, and reopen Start Game in the same profile. Confirm code, choices, experiment attribution, inspected progress, stocking outcomes, final results, and reflections remain available. Revealed answers must stay revealed.
5. Stop the previous compatible save-capable version, extract the newer version into a separate folder, and launch it in the same browser profile. Confirm the journey resumes at the normal local address. Preview 1 cannot provide a save because it predates persistence.
6. Verify Start over cancellation preserves the test journey. Only after recording the resume evidence, confirm deletion and check that a new empty journey opens. Restore connectivity after completing the offline observations.

## Closure

Link each platform's automated CI evidence alongside these observations in #10. Leave unobserved cells pending. Fix demonstrated blockers and repeat the affected check against the replacement release. Signing/notarization is deferred for the agreed unsigned preview; if ordinary launch cannot succeed under that choice, record the concrete release decision needed rather than claiming platform acceptance.

The separate learner playtest, timing, and understanding assessment belong to #11.

## Published package reference, September 22, 2026

[Preview 2](https://github.com/zerowing113/data_science_game/releases/tag/offline-v0.1.0-preview.2) is built from clean revision `20e3a280805a`. All three native jobs passed the complete 42-test browser suite plus launcher/offline/restart checks in [CI](https://github.com/zerowing113/data_science_game/actions/runs/35697325071). Public unauthenticated downloads match those CI artifacts and their manifests:

- Windows x64: `c26fe06d6b726205c1df70b7688d1097439233766ae308a61cde235957f2aef1`
- Intel Mac: `fed439e09d67b357065a077f8707a51f17e01589a728b025c31a09b7b4692059`
- Apple Silicon Mac: `00c8a23a69be8455405e384f4b2fbdf7b5c1f9f58225d8f9e14b633995cba210`

The owner has Windows and Apple Silicon devices available to test; Intel Mac device access is unconfirmed. For preview 2, the owner reported that the game worked on Windows using Firefox with Wi-Fi on and no security warning. OS/browser versions, normal extraction/launch details, disconnected first launch/full mission, and stop/reopen results were not supplied. This limited observation does not complete the device criteria or establish full Firefox support. The pending device table above remains unfilled intentionally. The automated Windows replacement check passed from the prior save-capable verification build to the CI-built preview 2 executable, but that is not an Explorer launch or physical-disconnection observation.

Use the [learner observation guide](learner-playtest.md) for the separate #11 session. Record the exact release under test; observations of preview 2 do not establish acceptance of the later visual upgrade.
