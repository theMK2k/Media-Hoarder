#!/bin/sh
check(){
    egrep -Eqir "KILLME" ./src
}

printf "\033[1;33mchecking for KILLME content...\n\e[0m"

if check; then
    printf "\033[1;31mKILLME content found in ./src, ABORT! Please remove all KILLME content from ./src to proceed.\n\n\e[0m"
    exit 1;
else
    printf "\033[1;32mKILLME check successful\n\n\e[0m"
    exit 0;
fi