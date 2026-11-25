# Architecture and implementation plan

## Baseline

- Upstream: https://github.com/omigros/abudjagram
- Upstream license: GPL-3.0
- Desktop runtime: Electron
- UI: React + TypeScript + Vite
- Target: Windows 10

The first implementation should preserve the upstream application's existing build and runtime conventions rather than replacing its desktop stack.

## Application layout

1. A narrow, full-width messenger switcher at the top of the window.
2. Two compact tiles: Telegram and VK.
3. A single large content region below the switcher.
4. A short transition when changing the active messenger (fade, slight horizontal translation, and a restrained blur overlay).

## Web session isolation

Use separate persistent Electron session partitions for the two services. Keep both web contents alive while switching visibility so that switching does not sign the user out or force a full page reload.

Recommended starting partitions:

- `persist:tomigram-telegram`
- `persist:tomigram-vk`

The implementation must keep the preload surface minimal, enable context isolation, disable renderer Node integration, validate navigation targets, and open unrelated external links in the system browser.

## Messenger integration

### Telegram

Load the official Telegram Web client. Authentication is performed by Telegram's own web flow (QR code or phone number). Do not add custom Telegram API credentials or a TDLib dependency.

### VK

Load VK's official web messaging experience in its own persistent session. Authentication is performed by VK's website. Feature parity is limited to what VK exposes through its web client.

## UI reuse

Reuse the upstream Abudjagram styles, theme variables, pattern/background assets, and settings where practical. Preserve upstream copyright notices and GPL-3.0 license terms in all derivative files.

## Switching and lifecycle

- Keep both web contents mounted/alive after first initialization.
- Switch visibility and input focus without destroying the inactive session.
- Avoid unnecessary background timers and media activity where possible.
- Do not apply CSS filters directly to a native WebContentsView; use a window-level overlay/transition layer for the visual effect.

## Rust policy

Do not introduce Rust solely as a presumed performance optimization. Electron/Chromium renders the messenger websites. Consider Rust later only for measured CPU-intensive work or well-defined native/system integrations.

## Milestones

1. Import the upstream source with Git history and license notices intact.
2. Establish a reproducible Windows development/build workflow.
3. Add the two-session Electron shell and top-level switcher.
4. Integrate Telegram Web and VK web messaging.
5. Reuse Abudjagram's visual assets and settings.
6. Implement lifecycle handling, notifications, downloads, permissions, and external-link policy.
7. Build and test on Windows 10; document known web-client limitations.

## Current status

Only the repository overview and this architecture plan are committed so far. The upstream source has not yet been imported, and no Windows build has been produced or tested.
