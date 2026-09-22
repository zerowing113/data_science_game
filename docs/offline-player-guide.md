# Little Goods offline test edition

Download the archive for your computer and extract it completely. On Windows, open **Start Game.exe**. On a Mac, open **Start Game.app**. The game opens in your default browser; keep the extracted folder for next time. No Python, Node, Go, terminal commands, account, or internet connection are required to play.

Choose `windows-x64` for Windows 11 on Intel/AMD, `macos-intel` for Intel Macs, or `macos-apple-silicon` for Apple Silicon Macs. Mac builds target macOS 14 or newer. Chrome or Edge are the initial supported browsers; Safari and Firefox are not yet verified. Set a supported browser as your default before launching.

This is an unsigned test build, not a signed/notarized consumer release. Windows or macOS may show an unknown-publisher warning or refuse to launch it. Only use artifacts from a source you trust. If your system blocks the app, report the exact message to the maintainer; do not disable system security. The maintainer must verify the normal downloaded-app launch experience before a wider release.

## Playing and stopping

Python loads from the bundled files the first time you enter a workspace. It can take a little time. Runtime messages explain loading, failures, and Reset Python. Once loaded, the full practice mission and fresh-data final challenge use real Python offline.

Use **Stop game** at the top of the page to stop the local launcher. Closing a browser tab alone leaves the launcher running; opening Start Game again reconnects to it. Stop game closes the local service for all its tabs. If the tab is unavailable, end Little Goods / Start Game in Task Manager (Windows) or Activity Monitor (Mac).

**Progress saves automatically in this browser profile.** Reopen the game in the same browser to resume code, experiments, practice progress, stocking decisions, final answers, and reflections. Running Python is interrupted when the page closes; reset Python to retry it. A previously revealed challenge stays revealed. Use **Try a fresh challenge** for new data.

Use **Start over** and confirm deletion to clear this browser's journey. Cancelling keeps it. If saving fails, the page warns you: keep the tab open, download a backup, and retry saving after restoring browser storage. An unreadable or incompatible save stays untouched and can be downloaded before you decide to delete it. Backups are recovery files for the maintainer; this version does not offer an import button.

Saves stay at the game's local address in this browser profile. Changing browser, computer, profile, or port uses separate storage. Private browsing and clearing site data can erase progress. Keep one game tab open at a time: a second tab asks you to continue in the active tab, or close it and reload to resume. If an older game version changes the save, download your current work and reload rather than overwrite it. No cloud sync or account is used.

The published `offline-v0.1.0-preview.1` predates this feature and still loses progress. Use a build that includes ticket #12.

If another program is using the game's local port, the launcher explains the conflict. Close that program and try again. An older Little Goods version must be stopped before opening a new version. Startup problems show a native message rather than an invisible failure.

## Replacing this build

Stop the old game, download the replacement archive for the same computer type, extract it into a new folder, and launch its Start Game file. Keep the previous download if you need to return to it. There is no automatic updater or background internet connection. See `manifest.json` for the build version and included Python packages; `THIRD-PARTY` contains bundled dependency notices.
