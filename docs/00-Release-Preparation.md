# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [x] Increase Version Number in [../package.json](../package.json)
- [x] Copy contents of [../DONE.md](../DONE.md) into `public/history/version-x.y.z.md` and clean up (keep it tidy)
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
git pull
npm i
npm run electron:build-mac
```

- find properly named `*.dmg` in `RELEASE` directory

### TODO: Currently not working: Raspberry Pi Build (we get a blank screen when running)

- [ ] on RPi run `npm run electron:build-rpi`

## Create sha256 checksum files

- [ ] create sha256 checksum files

## Create Release on github

- upload all files from Build Packs

## Update Website

- [ ] create new set of download locations
- [ ] build and deploy website

## FINALLY: update history.json and push

- [x] Update history.json (create new entry on top of the others in the array)
- [x] Test using `npm start` - it should show the new version incl. history
- [x] remove any links in the history (enclose them in `inline code`)!
- [x] git push
