#!/bin/sh
# Bundelt src/*.js tot dist/las-rodes.js en maakt een geminificeerde versie.
cd "$(dirname "$0")"
mkdir -p dist
{ echo "/* Las Rodes — gebundelde scripts (Kerja). Bron: src/. Niet handmatig aanpassen, opnieuw bouwen met build.sh */"
  for f in src/*.js; do echo; echo "/* ===== $(basename "$f") ===== */"; cat "$f"; done; } > dist/las-rodes.js
npx --yes terser dist/las-rodes.js -c -m -o dist/las-rodes.min.js
npx --yes clean-css-cli -o dist/styles.min.css styles.css
echo "Klaar: dist/las-rodes.js, dist/las-rodes.min.js, dist/styles.min.css"
