#!/bin/bash
# La Cue — release: firma l'app, crea il DMG e (se configurato) lo notarizza con Apple.
# Uso:  ./make_app.sh   poi   ./make_release.sh
set -e
cd "$(dirname "$0")"

APP="build/La Cue.app"
[ -d "$APP" ] || { echo "❌ Non trovo $APP: lancia prima ./make_app.sh"; exit 1; }

VER=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" "$APP/Contents/Info.plist")
BUILD=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "$APP/Contents/Info.plist")
OUT="build/release"; mkdir -p "$OUT"
DMG="$OUT/La-Cue-$VER-$BUILD.dmg"
PROFILE="${LACUE_NOTARY_PROFILE:-lacue-notary}"

# 1. Firma: Developer ID se c'è nel Portachiavi, altrimenti firma ad-hoc
IDENTITY=$(security find-identity -v -p codesigning 2>/dev/null | grep "Developer ID Application" | head -1 | sed -E 's/.*"(.*)"/\1/')
if [ -n "$IDENTITY" ]; then
    echo "🔏 Firmo con: $IDENTITY"
    codesign --force --deep --options runtime --timestamp --sign "$IDENTITY" "$APP"
else
    echo "⚠️  Nessun certificato 'Developer ID Application' nel Portachiavi: firma ad-hoc."
    echo "    Chi scarica dovrà aprire Impostazioni › Privacy e sicurezza › Apri comunque."
    codesign --force --deep --sign - "$APP"
fi
codesign --verify --deep --strict "$APP" && echo "✓ Firma dell'app valida"

# 2. DMG: l'app + collegamento ad Applicazioni (trascina e installa)
STAGE=$(mktemp -d)
cp -R "$APP" "$STAGE/"
ln -s /Applications "$STAGE/Applications"
[ -f Resources/AppIcon.icns ] && cp Resources/AppIcon.icns "$STAGE/.VolumeIcon.icns" && \
    { command -v SetFile >/dev/null && SetFile -a C "$STAGE" 2>/dev/null || true; }
rm -f "$DMG"
hdiutil create -volname "La Cue" -srcfolder "$STAGE" -ov -fs HFS+ -format UDZO "$DMG" >/dev/null
rm -rf "$STAGE"
echo "💿 DMG creato"

# 3. Firma del DMG + notarizzazione Apple + "staple" del ticket
if [ -n "$IDENTITY" ]; then
    codesign --force --timestamp --sign "$IDENTITY" "$DMG"
    if xcrun notarytool history --keychain-profile "$PROFILE" >/dev/null 2>&1; then
        echo "📮 Invio ad Apple per la notarizzazione (qualche minuto)…"
        xcrun notarytool submit "$DMG" --keychain-profile "$PROFILE" --wait
        xcrun stapler staple "$DMG"
        spctl -a -t open --context context:primary-signature -vv "$DMG" \
            && echo "✅ Notarizzato: si apre con un doppio clic su qualsiasi Mac"
    else
        echo "ℹ️  Profilo di notarizzazione '$PROFILE' non trovato: DMG firmato ma non notarizzato."
        echo "    Crealo una volta con:  xcrun notarytool store-credentials $PROFILE --apple-id TUA@EMAIL --team-id TEAMID"
    fi
fi

cp "$DMG" "$OUT/La-Cue-latest.dmg"
echo "📦 Pronto: $DMG"
echo "   Scrivi «nuova build pronta» nella chat del sito per pubblicarla."
