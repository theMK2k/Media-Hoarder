#!/bin/bash

# Fetch a fresh copy of easylist.txt and place it in ./data/

set -e

EASYLIST_URL="https://easylist.to/easylist/easylist.txt"
MIN_SIZE=100000  # minimum expected filesize in bytes (~100 KB sanity check)
TARGET_DIR="./data"
TARGET_FILE="${TARGET_DIR}/easylist.txt"

# Create a temporary file (works on all platforms)
TMPFILE=$(mktemp "${TMPDIR:-/tmp}/easylist.XXXXXX")

cleanup() {
  rm -f "$TMPFILE"
}
trap cleanup EXIT

echo "Downloading easylist.txt ..."
curl -fSL --retry 3 -o "$TMPFILE" "$EASYLIST_URL"

# Get filesize in a cross-platform way
FILESIZE=$(wc -c < "$TMPFILE" | tr -d '[:space:]')

if [ "$FILESIZE" -lt "$MIN_SIZE" ]; then
  echo "ERROR: Downloaded file is too small (${FILESIZE} bytes). Expected at least ${MIN_SIZE} bytes."
  echo "The download may be corrupt or the URL may have changed."
  exit 1
fi

echo "Download OK (${FILESIZE} bytes)."

# Ensure target directory exists
mkdir -p "$TARGET_DIR"

# Copy to destination
cp "$TMPFILE" "$TARGET_FILE"

echo "Updated ${TARGET_FILE} successfully."
