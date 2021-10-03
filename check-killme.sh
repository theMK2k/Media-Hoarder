#!/bin/sh
check(){
    egrep -Eqir "KILLME" ./src
}

printf "\033[1;33mchecking for KILLME content...\n"

if check; then
    printf "\033[1;31mKILLME content found in ./src, ABORT! Please remove all KILLME content from ./src to proceed.\n\n"
    exit 1;
else
    printf "\033[1;32mKILLME check successful\n\n"
    exit 0;
fi