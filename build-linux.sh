#!/bin/sh

npm run electron:build-linux-portable; npm run electron:build-linux-setup

cd RELEASE

BINARIES=$(find *)

for FILE in $BINARIES
do
    sha256sum $FILE > $FILE.sha256
done

cd -