# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [x] we are on release branch `release-x.y.z`
- [x] Increase Version Number in [../package.json](../package.json)
- [x] Copy contents of [../DONE.md](../DONE.md) into `public/history/version-x.y.z.md` and clean up (keep it tidy)
- [x] Update history.json (create new entry on top of the others in the array)
- [x] Test using `npm start` - it should show the new version incl. history
- [x] git push

## Build Packs

### Windows Build

- [x] in Windows run:

```bash
git pull
git checkout release-x.y.z
npm i
./build-win.sh
```

find properly named `*-portable.zip` and `*-setup.exe` in `RELEASE` directory

### Linux Build

- [x] in Linux run:

```bash
git pull
git checkout release-x.y.z
npm i
./build-linux.sh
```

- find properly named `*.deb`, `*.rpm`, `*.snap`, `*.AppImage` and `*-portable.zip` in `RELEASE` directory

### Mac Build

- [x] in MacOS run:

```bash
export APPLE_ID=%APPLE_ID%
export APPLE_ID_PASSWORD=%APPLE_ID_PASSWORD%
git checkout release-x.y.z
git pull
npm i
./build-mac.sh
```

- find properly named `*.dmg` in `RELEASE` directory

### TODO: Currently not working: Raspberry Pi Build (we get a blank screen when running)

- [ ] on RPi run `npm run electron:build-rpi`

## Create sha256 checksum files

- [ ] create sha256 checksum files

## Create Release on GitHub

- upload all files from Build Packs

## Update Website

- [ ] create new set of download locations
- [ ] build and deploy website

## FINALLY

- [ ] merge `release-x.y.z` branch into master (this makes history.json public)