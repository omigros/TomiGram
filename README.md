# TomiGram

**TomiGram** is a Windows desktop shell that brings Telegram and VK into one application.

## Project direction

TomiGram is being developed as a separate project based on [Abudjagram](https://github.com/omigros/abudjagram), preserving its visual identity and adapting its Electron/React architecture.

### Goals

- Windows 10 desktop application.
- Compact top switcher for Telegram and VK, with the selected messenger shown in the main workspace.
- Independent persistent browser sessions for Telegram and VK.
- Smooth, short transitions when switching between messengers.
- Telegram through the official Telegram Web experience; no custom `api_id` or `api_hash`.
- VK through its official web interface; no VK API application credentials.
- Reuse Abudjagram's styling, backgrounds, patterns, and relevant settings.
- Keep Electron + TypeScript/React as the primary desktop stack. Introduce Rust only for concrete system-level or performance needs.

## Important limitations

TomiGram does not use Telegram or VK API credentials. Available features therefore depend on the capabilities and policies of the official web clients. This project is not affiliated with Telegram or VK.

## Development status

Repository initialized. The Abudjagram codebase has not yet been imported or adapted.

## License

Abudjagram is distributed under GPL-3.0. TomiGram's derivative code must retain applicable copyright and license notices and comply with GPL-3.0. See the upstream [Abudjagram repository](https://github.com/omigros/abudjagram) for the original license and notices.
