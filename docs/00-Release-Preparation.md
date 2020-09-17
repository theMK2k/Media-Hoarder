# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [x] Increase Version Number in [../package.json](../package.json)
- [x] Document contents of [../DONE.md](../DONE.md) into `public/history/version-x.y.z.html`
- [x] Update history.json

## Windows Build

- [x] in Windows run `npm run electron:build-win-setup`
- [x] in Windows run `npm run electron:build-win-portable`
- find properly named `*-portable.zip` and `*-setup.exe` in `RELEASE` directory

## Linux Build

- [x] in Linux run `npm run electron:build-linux-setup`
- [x] in Linux run `npm run electron:build-linux-portable`
- find properly named `*.deb`, `*.AppImage` and `*-portable.tar.gz` in `RELEASE` directory

## Mac Build

- [x] in MacOS run:

```bash
export APPLE_ID=%APPLE_ID%
export APPLE_ID_PASSWORD=%APPLE_ID_PASSWORD%
npm run electron:build-mac
```

- [x] use `media-hoarder-%VERSION%.dmg` as `media-hoarder-%VERSION%-mac-x64.dmg`

## Currently not working: Raspberry Pi Build

- [ ] on RPi run `npm run electron:build-rpi`
