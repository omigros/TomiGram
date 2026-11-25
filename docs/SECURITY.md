# Security baseline

- Messenger pages run in isolated persistent partitions (`persist:tomigram-telegram` and `persist:tomigram-vk`).
- Renderer Node integration is disabled; context isolation and sandboxing are enabled.
- The preload bridge exposes only the messenger switching operations and event subscriptions.
- Pop-up windows are denied in the embedded views; HTTP(S) destinations are opened externally.
- Navigation policy must be tightened to trusted Telegram/VK domains before release. The current implementation only rejects non-HTTP(S) top-level navigation and is not yet a complete origin allowlist.
- Camera, microphone, notifications, downloads, and clipboard permissions require explicit policy and manual testing. Do not grant broad permissions to arbitrary origins.

This document describes the current baseline, not a security certification. Review the Electron security checklist and test the packaged Windows application before distributing it.
