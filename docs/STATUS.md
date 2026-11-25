# Development status

Last updated: 2026-11-25.

## Implemented in this repository

- Initial Electron desktop shell.
- Telegram and VK switcher UI.
- Two independent persistent Chromium session partitions.
- Telegram Web and VK Messages entry URLs.
- WebContentsView instances kept alive while switching.
- Minimal context-isolated preload bridge.
- External HTTP(S) popups and non-allowlisted top-level navigations/redirects are handed to the system browser.
- `Ctrl+1` / `Ctrl+2` messenger switching when an embedded messenger view has keyboard focus.
- Switch-timer cancellation and child WebContents cleanup during window teardown.
- Windows NSIS packaging configuration and a Windows CI workflow.

## Not yet completed

- The full Abudjagram source tree and assets have not been imported.
- The current shell does not yet reuse Abudjagram's original patterns, theme system, settings, tray integration, or customizations.
- Permissions, notifications, download handling, media-device behavior, and detailed navigation policy need implementation and testing.
- No Windows installer has been built or tested in this environment.

## Upstream import

The intended upstream is https://github.com/omigros/abudjagram. The repository contains 3,354 tracked files in its current tree. A true GitHub fork preserves history and binary assets; the current connected GitHub operations can read files and write Git objects in TomiGram, but do not expose GitHub's fork-repository operation or a local git clone/push workflow. Do not represent a partial file copy as a complete upstream import.

## Next engineering steps

1. Import the upstream repository with full history using GitHub's Fork action or a local `git clone --mirror` / `git push --mirror` workflow.
2. Reconcile the current TomiGram shell with Abudjagram's Electron lifecycle and renderer entry points.
3. Replace the upstream single Telegram web view with the two isolated `WebContentsView` instances.
4. Port the switcher into Abudjagram's existing design language and reuse its original pattern/background assets.
5. Run dependency installation, static checks, and Windows packaging on CI.
