#!/bin/sh

rm ./RELEASE/*

npx browserslist@latest --update-db

npm i

npm run electron:build-mac

cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES
do
    shasum -a 256 $FILE > $FILE.sha256
done

cd -