# TomiGram

TomiGram is a Windows desktop workspace that places Telegram and VK behind one compact messenger switcher.

## Product constraints

- Telegram is loaded from the official Telegram Web client; sign-in is handled by Telegram (QR code or phone).
- VK is loaded from the official VK website; sign-in is handled by VK.
- No custom Telegram `api_id` / `api_hash`, VK application credentials, or TDLib.
- Each service uses its own persistent Chromium session.
- The system tray can reopen the app, switch messengers, or quit; closing the window hides TomiGram to the tray.
- The active messenger occupies the workspace below the compact top switcher.

## Upstream source

The full [Abudjagram](https://github.com/omigros/abudjagram) source is pinned as a Git submodule at `upstream/abudjagram`. Clone this repository with:

```sh
git clone --recurse-submodules https://github.com/omigros/TomiGram.git
```

For an existing clone, run `git submodule update --init --recursive`.

## Local development

Use Node.js 24 and npm 11 or later:

```sh
npm install
npm start
```

Run the navigation/security checks with `npm test`. Create the Windows NSIS installer with `npm run dist:win`.

The upstream project is GPL-3.0-or-later. Preserve its copyright and license notices in derivative files and clearly mark modifications. See `LICENSE`, `NOTICE.md`, and the pinned source.

## Implementation status

The current root application is an Electron prototype using two isolated `WebContentsView` instances. The upstream source is pinned and selected original background assets are used by the shell, but the upstream React renderer and settings system have not been integrated.

This separation is deliberate: the upstream Telegram renderer contains an API-credential setup flow and expects Telegram API credentials. TomiGram's no-credentials requirement instead uses the official Telegram Web site directly. The upstream renderer is therefore not a drop-in replacement for the current authentication model.

Windows NSIS packaging runs in GitHub Actions. A successful CI package build is not a substitute for interactive testing on Windows 10.

TomiGram is independent and is not affiliated with Telegram or VK.
