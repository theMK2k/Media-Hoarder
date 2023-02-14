# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [x] we are on release branch `release-next` or `release-x.y.z`
- [x] Increase Version Number in [../package.json](../package.json)
- [x] create `public/history/version-x.y.z.md` from info in [../DONE.md](../DONE.md) 
- [x] Update history.json (create new entry on top of the others in the array)
- [x] Test using `npm start` - it should show the new version incl. history
- [ ] git push

## Build Packs

### Windows Build

- [WIP] in Windows run:

```bash
git pull
git checkout release-x.y.z
npm i
./build-win.sh
```

find properly named `*-portable.zip` and `*-setup.exe` in `RELEASE` directory

### Linux Build

- [ ] in Linux run:

```bash
git pull
git checkout release-x.y.z
npm i
./build-linux.sh
```

- find properly named `*.deb`, `*.rpm`, `*.snap`, `*.AppImage` and `*-portable.zip` in `RELEASE` directory

### Mac Build

- [ ] in MacOS run:

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
