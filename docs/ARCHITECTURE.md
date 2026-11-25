# Architecture and implementation plan

## Baseline

- Upstream source: [Abudjagram](https://github.com/omigros/abudjagram), pinned in `upstream/abudjagram`.
- Upstream license: GPL-3.0-or-later.
- Desktop runtime: Electron.
- TomiGram root renderer: lightweight HTML/CSS/JavaScript shell.
- Target: Windows 10.
- Embedded clients: official Telegram Web and VK web messaging.

The upstream source is retained in full for provenance, licensing, and selective reuse. Its React Telegram renderer is not a drop-in runtime for TomiGram: its startup path requires Telegram API credentials and presents a credentials setup screen when they are absent. TomiGram must not add that requirement. Reuse visual assets and independent components only where compatible with the no-credentials product constraint.

## Application layout

1. A compact full-width messenger switcher at the top of the window.
2. Two compact tiles: Telegram and VK.
3. One large content region below the switcher.
4. A short fade/blur transition when changing the active messenger.

## Web session isolation

Use separate persistent Electron session partitions:

- `persist:tomigram-telegram`
- `persist:tomigram-vk`

Keep both `WebContentsView` instances alive while switching visibility. Use context isolation, disabled renderer Node integration, sandboxing, and web security. Maintain an explicit navigation host allowlist; send unrelated HTTP(S) destinations to the system browser and deny non-web protocols.

## Messenger integration

### Telegram

Load `https://web.telegram.org/a/` in the Telegram partition. Authentication belongs to Telegram's official web flow (QR code or phone number). Do not introduce custom `api_id` / `api_hash`, GramJS, or TDLib.

### VK

Load `https://vk.com/im` in the VK partition. Authentication belongs to VK's official website. The supported feature set is limited to what VK exposes through its web client. Navigation and media host allowlists must be validated against real sign-in and chat flows.

## Visual reuse

The original Abudjagram pattern SVG is used as a subtle shell background mask. Further reuse may include theme tokens, color palettes, and settings concepts, but derivative files must preserve applicable copyright/license notices and clearly mark modifications. Do not import upstream code paths that introduce Telegram API credentials.

## Switching and lifecycle

- Create both web contents once and retain them while the window remains open.
- Hide the inactive native view instead of destroying it.
- Keep the native view bounds aligned with the compact topbar height.
- Avoid applying CSS filters directly to native `WebContentsView`; use a renderer overlay for transition effects.
- Handle renderer crashes, load failures, and window teardown explicitly.

## Security and product follow-up

- Add explicit permission handling for camera, microphone, notifications, and media devices.
- Add safe download handling and file destination confirmation.
- Validate all VK and Telegram redirect/resource host requirements using actual browser sessions.
- Keep the preload API narrow and avoid exposing arbitrary IPC.

## Rust policy

Do not introduce Rust as a presumed performance optimization. Chromium performs messenger rendering. Consider Rust only for measured CPU-intensive tasks or a concrete native integration requirement.

## Milestones

1. Preserve full upstream source and license history: pinned submodule established.
2. Establish reproducible Windows packaging: CI installer build succeeds.
3. Implement two isolated web sessions and the switcher: initial shell implemented.
4. Validate authentication and web-client compatibility on Windows 10: outstanding.
5. Adapt additional upstream visual tokens/settings without API-credential coupling: outstanding.
6. Add permissions, downloads, notifications, crash recovery, and focused tests: outstanding.
7. Test installer interactively on Windows 10: outstanding.
