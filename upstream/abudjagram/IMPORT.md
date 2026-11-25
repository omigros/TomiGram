# Abudjagram upstream import

This branch starts a staged source import from https://github.com/omigros/abudjagram.

## Imported in this stage

- `upstream/abudjagram/src/styles/_patternBackground.module.scss` — original background/pattern styling.
- `upstream/abudjagram/src/assets/pattern.svg` — original chat doodle pattern asset.

The files are preserved under `upstream/abudjagram/` rather than wired into the current shell. The SCSS module depends on Abudjagram's theme variables, background component, gradient canvas, CSS-module build pipeline, and related assets. Moving it into the active UI without those dependencies would create a misleading, non-functional integration.

## Required next import stages

1. Import the original React/TypeScript application source and public assets, retaining upstream paths and copyright notices.
2. Import the matching Vite, TypeScript, Sass, PostCSS, and dependency configuration.
3. Adapt Electron's renderer entry and build output to TomiGram while preserving upstream application behavior.
4. Replace the single Telegram host view with the two persistent Telegram/VK service views only after verifying the upstream app's own Electron integration.
5. Run type checks, tests, and a Windows NSIS build; then merge the staged branch.

No upstream application code has been removed or rewritten by this asset-only stage. Do not treat this branch as a complete application import.
