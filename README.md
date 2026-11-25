# TomiGram

TomiGram is a Windows desktop workspace for Telegram and VK, based on Abudjagram.

## Product goals

- Windows 10; Electron + React + TypeScript.
- Compact Telegram/VK switcher above the active messenger workspace.
- Independent persistent sessions and short transitions.
- Official Telegram Web and VK Web clients; no custom API credentials.
- Preserve Abudjagram's themes, styles, backgrounds, and settings.

## Upstream source

The complete Abudjagram repository is pinned as a Git submodule at `upstream/abudjagram`.

```sh
git clone --recurse-submodules https://github.com/omigros/TomiGram.git
```

For an existing clone: `git submodule update --init --recursive`. Windows CI checks out submodules recursively.

## Status

Upstream source and selected original visual assets are staged, but are not yet integrated into the TomiGram runtime. The root application remains an independent Electron prototype. Dual-client integration and a user-tested release are outstanding.

TomiGram does not request Telegram or VK API credentials. Available functionality depends on the official web clients and their policies. The project is not affiliated with Telegram or VK.

## License

Abudjagram is GPL-3.0-or-later. Preserve upstream copyright and license notices in derivative files and mark modifications. See `LICENSE`, `NOTICE.md`, and the pinned upstream repository.