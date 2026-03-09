#!/bin/sh

# allow also running npm installed tools
export PATH="$(pwd)/node_modules/.bin:$PATH"

echo "IMPORTANT: BUILDING STABLE VERSION"

rm ./RELEASE/*

bash fetch-easylist.sh

npx update-browserslist-db@latest

# Build Windows Portable
check-node-version --node  ^24 && \
bash check-killme.sh && \
bash check-package.json.sh && \
npx mkdirp RELEASE && \
node set-portable --portable=true && \
npx dotenv-cli -e .env electron-vite build && \
electron-builder build --win && \
mv dist/win-unpacked media-hoarder-portable && \
npx bestzip RELEASE/media-hoarder-VERSION-win-x64-portable.zip media-hoarder-portable && \
npx rimraf media-hoarder-portable && \
node set-portable --portable=false && \
node set-release-version.js && \
rimraf dist

# Build Windows Setup
check-node-version --node  ^24 && \
bash check-killme.sh && \
bash check-package.json.sh && \
npx mkdirp RELEASE && \
node set-portable --portable=false && \
npx dotenv-cli -e .env electron-vite build && \
electron-builder build --win nsis && \
mv dist/*.exe RELEASE/media-hoarder-VERSION-win-x64-setup.exe && \
node set-release-version.js && \
rimraf dist

cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES; do
    sha256sum $FILE >$FILE.sha256
done

cd -
