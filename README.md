# TomiGram

**TomiGram** is a Windows desktop workspace for Telegram and VK, based on the Abudjagram project.

## Product direction

- Windows 10 desktop application.
- Compact messenger switcher across the top; active messenger fills the workspace.
- Independent persistent sessions for Telegram and VK.
- Short animated transitions when switching.
- Telegram through the official Telegram Web client; no custom `api_id` or `api_hash`.
- VK through the official VK web client; no VK API application credentials.
- Preserve Abudjagram's visual system, themes, backgrounds, patterns, and useful settings.
- Electron + React + TypeScript as the primary stack. Rust only where a concrete native capability requires it.

## Upstream source

The complete Abudjagram repository is pinned as a Git submodule at `upstream/abudjagram`. Clone with:

```sh
git clone --recurse-submodules https://github.com/omigros/TomiGram.git
```

If the repository is already cloned without submodules:

```sh
git submodule update --init --recursive
```

The Windows CI checkout initializes submodules recursively.

## Status

The upstream source and selected original visual assets are staged. They have not yet been integrated into the TomiGram runtime. The current root application remains an independent Electron prototype; no completed Telegram/VK dual-client integration or release build is claimed yet.

## Client and security constraints

TomiGram does not request Telegram or VK API credentials. Available features are limited to those exposed by the official web clients and their policies. Each client is intended to use a separate persistent Electron session partition. External navigation must remain restricted to safe protocols and trusted client origins.

This project is not affiliated with Telegram or VK.

## License

Abudjagram is distributed under GPL-3.0-or-later. Preserve upstream copyright and license notices in derivative files and clearly mark modifications. See `LICENSE`, `NOTICE.md`, and the pinned upstream repository.
