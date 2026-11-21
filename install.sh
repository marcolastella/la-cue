#!/bin/bash
# La Cue — one-line installer
#   curl -fsSL https://marcolastella.github.io/la-cue/install.sh | bash
set -e
URL="https://marcolastella.github.io/la-cue/downloads/La-Cue-mac.zip"
APP="/Applications/La Cue.app"

echo ""
echo "  La Cue · Ready to Cue"
echo "  ─────────────────────"

if [ "$(uname -m)" != "arm64" ]; then
  echo "  ✗ La Cue needs a Mac with Apple Silicon (M1 or later)."; exit 1
fi
MAJOR=$(sw_vers -productVersion | cut -d. -f1)
if [ "$MAJOR" -lt 13 ]; then
  echo "  ✗ La Cue needs macOS 13 Ventura or later (this Mac has $(sw_vers -productVersion))."; exit 1
fi

TMP=$(mktemp -d)
echo "  ↓ Downloading…"
curl -fL --progress-bar "$URL" -o "$TMP/La-Cue.zip"

osascript -e 'quit app "La Cue"' >/dev/null 2>&1 || true
rm -rf "$APP"
echo "  → Installing in Applications…"
ditto -x -k "$TMP/La-Cue.zip" /Applications
xattr -cr "$APP" 2>/dev/null || true
rm -rf "$TMP"

echo "  ✓ Done. Opening La Cue."
echo ""
open "$APP"
