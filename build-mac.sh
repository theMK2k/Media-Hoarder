#!/bin/sh

# allow also running npm installed tools
export PATH="$(pwd)/node_modules/.bin:$PATH"

rm ./RELEASE/*

npx update-browserslist-db@latest

npm i

# Build for Mac
check-node-version --node  ^24 && \
bash check-killme.sh && \
bash check-package.json.sh && \
npx mkdirp RELEASE && \
node set-portable --portable=false && \
electron-vite build && \
electron-builder build --mac dmg && \
mv dist/*.dmg RELEASE/media-hoarder-VERSION-mac.dmg && \
node set-release-version.js && \
rimraf dist

cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES
do
    shasum -a 256 $FILE > $FILE.sha256
done

cd -