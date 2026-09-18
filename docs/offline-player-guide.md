# Little Goods offline test edition

Download the archive for your computer and extract it completely. On Windows, open **Start Game.exe**. On a Mac, open **Start Game.app**. The game opens in your default browser; keep the extracted folder for next time. No Python, Node, Go, terminal commands, account, or internet connection are required to play.

Choose `windows-x64` for Windows 11 on Intel/AMD, `macos-intel` for Intel Macs, or `macos-apple-silicon` for Apple Silicon Macs. Mac builds target macOS 14 or newer. Chrome or Edge are the initial supported browsers; Safari and Firefox are not yet verified. Set a supported browser as your default before launching.

This is an unsigned test build, not a signed/notarized consumer release. Windows or macOS may show an unknown-publisher warning or refuse to launch it. Only use artifacts from a source you trust. If your system blocks the app, report the exact message to the maintainer; do not disable system security. The maintainer must verify the normal downloaded-app launch experience before a wider release.

## Playing and stopping

Python loads from the bundled files the first time you enter a workspace. It can take a little time. Runtime messages explain loading, failures, and Reset Python. Once loaded, the full practice mission and fresh-data final challenge use real Python offline.

Use **Stop game** at the top of the page to stop the local launcher. Closing a browser tab alone leaves the launcher running; opening Start Game again reconnects to it. Stop game closes the local service for all its tabs. If the tab is unavailable, end Little Goods / Start Game in Task Manager (Windows) or Activity Monitor (Mac).

**Progress is not saved in this test build.** Refreshing, closing, or stopping loses the current session. Automatic save/resume is still being implemented under ticket #12.

If another program is using the game's local port, the launcher explains the conflict. Close that program and try again. An older Little Goods version must be stopped before opening a new version. Startup problems show a native message rather than an invisible failure.

## Replacing this build

Stop the old game, download the replacement archive for the same computer type, extract it into a new folder, and launch its Start Game file. Keep the previous download if you need to return to it. There is no automatic updater or background internet connection. See `manifest.json` for the build version and included Python packages; `THIRD-PARTY` contains bundled dependency notices.
