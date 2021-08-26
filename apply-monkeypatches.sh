#!/bin/sh
echo "applying hotfixes"

# monkeypatch when@3.7.8
cp ./monkeypatches/node_modules.when.lib.env.js ./node_modules/when/lib/env.js

# monkeypatch app-builder-lib@21.2.0 electron-osx-sign
cp ./monkeypatches/node_modules.app-builder-lib.electron-osx-sign.sign.js ./node_modules/app-builder-lib/electron-osx-sign/sign.js