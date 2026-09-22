# Building the offline edition

The launcher is a small Go HTTP server with the entire production game embedded in its executable. It listens only at `127.0.0.1:43127` and opens the default browser. There is no Node/Python installation required on the player's machine. Go, Python, and Node are build tools only.

## Build and package

Use Node 22, Python 3.11 or newer, and the pinned Go 1.27.1 toolchain. From the repository root:

```text
npm ci
npm run prepare:python
npm run build
python scripts/package-offline.py
```

The preparation step requires internet on the builder and verifies Python wheel checksums. Runtime loading uses only embedded local files. Packaging verifies the full pandas/scikit-learn dependency closure and compares core runtime assets to the installed pinned Pyodide package. A missing or corrupted dependency fails packaging.

Use `--target windows-x64`, `--target macos-intel`, or `--target macos-apple-silicon` to build one archive. Use `--go /path/to/go` for a portable toolchain. All three can be cross-compiled from Windows, but cross-compilation alone does not verify native launch. The script writes ZIP archives and SHA-256 files under ignored `release/`; each archive includes instructions, dependency notices, and a manifest with build revision, package versions, and file checksums. Fixed ZIP timestamps and pinned toolchains keep the packaging procedure repeatable. Build from a clean committed checkout for release artifacts; working-tree builds are marked accordingly.

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

Ticket #12 adds versioned browser-local journey storage. See [the save contract](adr/0002-local-journey-save.md). The earlier preview.1 release remains session-only. The launcher's fixed origin is stable across normal starts and replacement versions; it deliberately reports an occupied port rather than silently moving to a different browser-storage origin. A matching running version is reused; a different version must be stopped first. Storage is scoped to browser profile and origin; there is no automatic portability between browsers or machines. Save/resume passed the complete 42-test browser suite and a full browser/launcher restart against an extracted Windows package on September 22, 2026. The native workflow includes these persistence and restart checks for all targets; new macOS results and normal downloaded-app verification remain outstanding under #10. See [the #12 verification record](reviews/issue-12.md).

For a replacement release, stop the prior launcher, download/extract the new version into a separate folder, and launch it. There is no auto-update network service. Keep prior artifacts until the replacement has been verified.

Record ordinary OS launch, security prompts, and physically disconnected checks using the [native-device acceptance record](offline-acceptance.md). Automated CI and the package-replacement check do not fill in that human/device evidence.
