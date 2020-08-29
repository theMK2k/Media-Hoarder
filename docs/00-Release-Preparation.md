# Release Preparation

This document describes the steps necessary to get a new release done.

## Precondition

- [ ] Increase Version Number in [../package.json](../package.json)
- [ ] Document contents of [../DONE.md](../DONE.md) into `public/history/version-x.y.z.html`
- [ ] Update history.json

## Windows Build

- [ ] in Windows run `npm run electron:build`

## Linux Build

- [ ] in Linux run `npm run electron:build-linux`

## Currently not working: Raspberry Pi Build

- [ ] on RPi run `npm run electron:build-rpi`
