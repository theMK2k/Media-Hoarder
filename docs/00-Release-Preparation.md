# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [x] Increase Version Number in [../package.json](../package.json)
- [x] Document contents of [../DONE.md](../DONE.md) into `public/history/version-x.y.z.html`
- [x] git push

## Build Packs

### Windows Build

- [x] in Windows run:

```bash
git pull
npm i
npm run electron:build-win-setup
npm run electron:build-win-portable
```

find properly named `*-portable.zip` and `*-setup.exe` in `RELEASE` directory

### Linux Build

- [x] in Linux run:

```bash
git pull
npm i
npm run electron:build-linux-setup
npm run electron:build-linux-portable
```

- find properly named `*.deb`, `*.AppImage` and `*-portable.zip` in `RELEASE` directory

### Mac Build

- [x] in MacOS run:

```bash
export APPLE_ID=%APPLE_ID%
export APPLE_ID_PASSWORD=%APPLE_ID_PASSWORD%
npm run electron:build-mac
```

- find properly named `*.dmg` in `RELEASE` directory

### TODO: Currently not working: Raspberry Pi Build (we get a blank screen when running)

- [ ] on RPi run `npm run electron:build-rpi`

## Create Release on github

- upload all files from Build Packs

## FINALLY: update history.json and push

- [x] Update history.json
- [x] git push
