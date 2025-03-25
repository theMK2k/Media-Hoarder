# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [ ] we are on release branch `release-next` or `release-x.y.z`
- [ ] Increase Version Number in [../package.json](../package.json)
- [ ] create `public/history/version-x.y.z.md` from info in [../DONE.md](../DONE.md)
- [ ] Update history.json (create new entry on top of the others in the array)
- [ ] Test using `npm run dev[:beta]` - it should show the new version incl. history
- [ ] git push

## Build Packs

### Windows Build

- [ ] in Windows run:

```bash
git pull
git checkout release-next
npm i
./build-win.sh
```

find properly named `*-portable.zip` and `*-setup.exe` in `RELEASE` directory

### Linux Build

- [ ] in Linux run:

```bash
git pull
git checkout release-next
npm i
./build-linux.sh
```

- find properly named `*.deb`, `*.rpm`, `*.snap`, `*.AppImage` and `*-portable.zip` in `RELEASE` directory

### Mac Build

- [ ] in MacOS run:

```bash
export APPLE_ID=%APPLE_ID%
export APPLE_ID_PASSWORD=%APPLE_ID_PASSWORD%
git checkout release-next
git pull
npm i
./build-mac.sh
```

- find properly named `*.dmg` in `RELEASE` directory

### TODO: Currently not working: Raspberry Pi Build (we get a blank screen when running)

- [ ] on RPi run `npm run electron:build-rpi`

## Create Release on GitHub

- upload all files from Build Packs

```shell
cd /d/Data/Code/WebApps/media-hoarder/RELEASES/media-hoarder-$version
gh release list
gh release upload vX.Y.Z *
```

## Update Website

- [ ] create new set of download locations in `downloads.json`
- [ ] build and deploy website
  - `./create-and-deploy-everything.sh`

## FINALLY

- [ ] merge `release-next` branch into master (this makes history.json public)
- [ ] PUBLISH the release on GitHub
