# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [x] Increase Version Number in [../package.json](../package.json)
- [x] Document contents of [../DONE.md](../DONE.md) into `public/history/version-x.y.z.html`
- [x] Update history.json

## Windows Build

- [x] in Windows run `npm run electron:build`
- [ ] use `media-hoarder Setup %VERSION%.exe` as `media-hoarder-%VERSION%-win-x64-setup.exe`
- [ ] use `win-unpacked` as `media-hoarder-%VERSION%-win-x64.zip`

## Linux Build

- [x] in Linux run `npm run electron:build-linux`
- [x] use `media-hoarder-%VERSION%.AppImage` as `media-hoarder-%VERSION%-linux-x64.AppImage`
- [x] use `media-hoarder_1.0.0_amd64.deb` as `media-hoarder-%VERSION%-linux-x64.deb`

## Mac Build

- [ ] in MacOS run `npm run electron:build-mac`
- [ ] use `???` as `???`

## Currently not working: Raspberry Pi Build

- [ ] on RPi run `npm run electron:build-rpi`
