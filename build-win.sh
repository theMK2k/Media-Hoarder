#!/bin/sh

rm ./RELEASE/*

npx browserslist@latest --update-db

npm run electron:build-win-portable
npm run electron:build-win-setup

cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES; do
    sha256sum $FILE >$FILE.sha256
done

cd -
