#!/bin/sh
set -eu
trap 'exit 143' TERM INT

echo "Starting API…"
exec node dist/main.js
