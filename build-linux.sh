#!/bin/sh

# allow also running npm installed tools
export PATH="$(pwd)/node_modules/.bin:$PATH"

rm ./RELEASE/*

npx browserslist@latest --update-db

npm i

#npm run electron:build-linux-portable; npm run electron:build-linux-setup

# Build Linux Portable
check-node-version --node ^24 && \
bash check-killme.sh && \
bash check-package.json.sh && \
npx mkdirp RELEASE && \
node set-portable --portable=true && \
electron-vite build && \
electron-builder build --linux && \
mv dist/linux-unpacked media-hoarder-portable && \
npx bestzip RELEASE/media-hoarder-VERSION-linux-x64-portable.zip media-hoarder-portable && \
npx rimraf media-hoarder-portable && \
node set-portable --portable=false && \
node set-release-version.js && \
rimraf dist

# Build Linux Setup
check-node-version --node  ^24 && \
bash check-killme.sh && \
bash check-package.json.sh && \
npx mkdirp RELEASE && \
node set-portable --portable=false && \
electron-vite build && \
electron-builder build --linux deb appimage snap rpm flatpak pacman apk freebsd && \
mv dist/*.deb RELEASE/media-hoarder-VERSION-linux-x64.deb && \
mv dist/*.AppImage RELEASE/media-hoarder-VERSION-linux-x64.AppImage && \
mv dist/*.snap RELEASE/media-hoarder-VERSION-linux-x64.snap && \
mv dist/*.rpm RELEASE/media-hoarder-VERSION-linux-x64.rpm && \
mv dist/*.flatpak RELEASE/media-hoarder-VERSION-linux-x64.flatpak && \
mv dist/*.pkg.tar.zst RELEASE/media-hoarder-VERSION-linux-x64.pkg.tar.zst && \
mv dist/*.apk RELEASE/media-hoarder-VERSION-linux-x64.apk && \
mv dist/*.freebsd RELEASE/media-hoarder-VERSION-linux-x64.freebsd && \
node set-release-version.js && \
rimraf dist

# Generate SHA256 checksums for all files in the RELEASE directory
cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES
do
    sha256sum $FILE > $FILE.sha256
done

cd -