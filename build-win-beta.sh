#!/bin/sh

echo "IMPORTANT: BUILDING BETA VERSION"

rm ./RELEASE/*

npx browserslist@latest --update-db

npm run electron:build-win-portable-beta
npm run electron:build-win-setup-beta

cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES; do
    sha256sum $FILE >$FILE.sha256
done

cd -
