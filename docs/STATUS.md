# Development status

Last updated: 2026-11-25.

## Implemented

- Electron desktop shell and compact Telegram/VK switcher.
- Separate persistent Chromium partitions: `persist:tomigram-telegram` and `persist:tomigram-vk`.
- Official Telegram Web and VK Messages entry URLs.
- Two native Electron `WebContentsView` instances, retained while switching.
- Context-isolated preload bridge; renderer Node integration disabled; sandbox enabled.
- Top-level navigation and popup handling with a host allowlist; unrelated web links are opened externally.
- `Ctrl+1` / `Ctrl+2` switching while an embedded messenger has focus.
- Short native-view switching delay and renderer transition overlay.
- Original Abudjagram pattern asset referenced by the TomiGram shell.
- Full Abudjagram source pinned as a Git submodule at commit `948713b00e7012f957c113130bdaaa97ac987bec`.
- Navigation and download-filename regression tests run under Node.js 24; syntax checks cover the Electron main/preload, navigation and download helpers, and renderer.
- Messenger downloads pause before writing, require an explicit native Save dialog, use a sanitized suggested filename, and reject download requests originating from untrusted top-level pages.
- Windows NSIS installer successfully produced by GitHub Actions; CI artifact is available from the workflow run.

## Important architecture decision

The upstream Abudjagram React renderer is not currently embedded. Its Telegram startup path checks for `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` and renders an API-credentials setup screen if they are absent. That conflicts with TomiGram's explicit requirement to use the official Telegram Web login without custom API credentials.

Therefore TomiGram keeps the official Telegram Web page inside its own isolated Electron view. Abudjagram source remains available as the source of reusable visual assets and selected implementation references; renderer integration must not introduce a custom Telegram API credential requirement.

## Outstanding

- Validate Telegram and VK sign-in, cookies, reloads, and persistence interactively on Windows 10.
- Verify that VK authentication and media/resource host behavior are compatible with the navigation policy.
- Implement permission prompts, notifications, media-device permissions, and crash/reload recovery. Download handling is implemented but still needs interactive validation with real Telegram/VK attachments.
- Add focused automated checks for view switching and navigation behavior inside Electron.
- Improve app icon, tray behavior, window state persistence, and installer metadata.
- Verify the packaged installer on an actual Windows 10 machine.
- Decide which upstream settings/theme elements can be adapted without pulling in the upstream Telegram API client.

## Build status

The current Electron shell has passed the Windows NSIS packaging workflow. This confirms packaging only; it does not establish that the installer has been interactively tested or that all messenger web features work.

The Windows workflow checks out the pinned upstream submodule recursively.
