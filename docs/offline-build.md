# Building the offline edition

The launcher is a small Go HTTP server with the entire production game embedded in its executable. It listens only at `127.0.0.1:43127` and opens the default browser. There is no Node/Python installation required on the player's machine. Go, Python, and Node are build tools only.

## Build and package

Use Node 22, Python 3.11 or newer, and the pinned Go 1.27.1 toolchain. From the repository root:

```text
npm ci
npm run prepare:python
npm run build
python scripts/package-offline.py --target windows-x64
```

The preparation step requires internet on the builder and verifies Python wheel checksums. Runtime loading uses only embedded local files. Packaging verifies the full pandas/scikit-learn dependency closure and compares core runtime assets to the installed pinned Pyodide package. A missing or corrupted dependency fails packaging.

Use `--target windows-x64`, `--target macos-intel`, or `--target macos-apple-silicon` to build one archive. Use `--go /path/to/go` for a portable toolchain. Build Mac targets on macOS: packaging now seals and verifies the complete app bundle with codesign. Windows builders must select --target windows-x64. Ad-hoc bundle sealing provides integrity only; it does not provide Developer ID trust or notarization. The script writes ZIP archives and SHA-256 files under ignored `release/`; each archive includes instructions, dependency notices, and a manifest with build revision, package versions, and file checksums. Fixed ZIP timestamps and pinned toolchains keep the packaging procedure repeatable. Build from a clean committed checkout for release artifacts; working-tree builds are marked accordingly.

## Verify the actual artifact

```text
python scripts/extract-offline.py release/little-goods-0.1.0-windows-x64.zip .cache/extracted
```

Set `LAUNCHER_PATH` to the executable printed by the extractor. It verifies manifest checksums and restores executable permissions when extracting Mac bundles for automated tests. Normal players use their OS archive extractor, not this script.

```text
npm run test:launcher
npm run test:offline
npm run test:restart
npx playwright test -c playwright.packaged.config.ts
```

The launcher tests cover repeated launch, port conflict, local-only request guards, asset access, and shutdown. The dedicated offline browser test starts a fresh browser context, blocks and records non-loopback requests, runs real scikit-learn, and stops the game from its controls. The full packaged configuration runs the existing browser suite through the executable with external traffic directed to an unavailable proxy; loopback remains reachable. The restart check uses the same persistent browser profile across two separate browser and launcher processes and verifies saved code, choices, computed forecasts, committed stocking decisions, and a completed final challenge with its original reflections. This simulates unavailable external networking without blocking the game itself. It does not replace physically disconnected native-device testing.

To verify a compatible update, set `PREVIOUS_LAUNCHER_PATH` to a verified older executable that already supports journey saves, and `LAUNCHER_PATH` to the replacement executable extracted into a different folder. Run `npm run test:restart`. The first process creates the journey with the older build; the second resumes it using the replacement at the same origin and browser profile. The check requires different executable paths and reported build versions. Leave `PREVIOUS_LAUNCHER_PATH` unset for the ordinary same-version restart check. Preview 1 predates saves and cannot supply a persisted journey for this test.

The manual `Offline packages` GitHub Actions workflow builds on Windows x64, Intel macOS, and Apple Silicon macOS. Each job extracts its ZIP, executes that extracted native binary, runs launcher/offline and full process-restart tests plus the entire browser suite, then uploads an unsigned test artifact. This verifies native runtime execution in CI, not Finder/Explorer double-click behavior or downloaded-app security prompts.

## Release boundary and remaining acceptance

Targets: Windows 11 x64 and macOS 14+ Intel/Apple Silicon. Chrome/Edge are the initial browser targets; automated testing uses Playwright Chromium. Safari and Firefox are not yet supported by evidence. The runtime minimum OS requirements are described by [Go](https://go.dev/wiki/MinimumRequirements); the narrower application targets still require native verification.

The packages are unsigned test builds. No Windows signing certificate, Developer ID signing, or Apple notarization has been configured. Before consumer distribution, verify freshly downloaded ZIPs through Explorer/Finder on both platforms, record OS prompts and browser versions, and establish signing/notarization if required. Do not treat bypassing system protections as a release procedure. The owner requested public distribution on September 22, 2026. The GitHub repository and release downloads are public. Release ZIPs are published only after their native CI jobs pass and archive checksums and clean source revisions are verified.

Ticket #12 adds versioned browser-local journey storage. See [the save contract](adr/0002-local-journey-save.md). Published [preview 3](https://github.com/zerowing113/data_science_game/releases/tag/offline-v0.1.0-preview.3) includes it and the visual learning upgrade; preview 1 remains session-only. The launcher's fixed origin is stable across normal starts and replacement versions; it deliberately reports an occupied port rather than silently moving to a different browser-storage origin. A matching running version is reused; a different version must be stopped first. Storage is scoped to browser profile and origin; there is no automatic portability between browsers or machines.

For preview 2 on September 22, 2026, all three native targets passed all 42 packaged browser tests, three launcher checks, one offline smoke test, and one expanded full process-restart check at clean revision `20e3a280805a`. [Native CI evidence](https://github.com/zerowing113/data_science_game/actions/runs/35697325071). The exact CI-built archives were published after checksum/manifest verification and downloaded again without authentication; all public downloads matched the tested artifacts. A Windows compatible-replacement check also passed from the earlier save-capable `ff4ff88` verification build to the CI-built release executable in a different folder. Normal downloaded-app launch/security prompts and physical disconnection remain unobserved under #10. See the [#10 release record](reviews/issue-10.md) and [#12 persistence record](reviews/issue-12.md).

For a replacement release, stop the prior launcher, download/extract the new version into a separate folder, and launch it. There is no auto-update network service. Keep prior artifacts until the replacement has been verified.

Record ordinary OS launch, security prompts, and physically disconnected checks using the [native-device acceptance record](offline-acceptance.md). Automated CI and the package-replacement check do not fill in that human/device evidence.

Preview 3 is built from clean application revision `fb42250d0536`. All three native targets passed 51 packaged browser tests plus launcher, offline smoke, and full process-restart checks. The exact Windows CI executable also passed compatible replacement from published preview 2. See the [preview 3 verification record](reviews/offline-preview-3.md) for CI, checksums, publication evidence, and remaining human acceptance.

## Preview 3 Mac launch defect

The owner reported a damaged-app dialog on a MacBook Air M4. Native assessment of the published Apple Silicon ZIP reproduced `code has no resources but signature indicates they must be present`. The Go linker ad-hoc signature did not seal the enclosing app bundle. Packaging now signs the completed bundle before manifest generation, and native CI verifies its extracted signature. The public preview 3 asset is unchanged and still affected.

Bundle sealing alone does not satisfy Gatekeeper: the repaired bundle passes integrity verification but remains rejected by distribution assessment. Developer ID signing, notarization, a stapled ticket for offline use, and a fresh normal-download device test remain required before claiming this launch blocker resolved.
