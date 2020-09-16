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

- [ ] in Linux run `npm run electron:build-linux`
- [ ] use `???` as `???`

## Mac Build

- [ ] in MacOS run `npm run electron:build-mac`
- [ ] use `???` as `???`

## Currently not working: Raspberry Pi Build

- [ ] on RPi run `npm run electron:build-rpi`
