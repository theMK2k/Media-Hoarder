#!/bin/sh
check(){
    egrep -Eqir "[\^\~]" ./package.json
}

printf "\033[1;33mchecking package.json...\n"

if check; then
    printf "\033[1;31mnon version-pinned content found in package.json, ABORT! Please remove all ^ and ~ in package.json to proceed.\n\n"
    exit 1;
else
    printf "\033[1;32mpackage.json check successful\n\n"
    exit 0;
fi