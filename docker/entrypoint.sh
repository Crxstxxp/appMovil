#!/bin/sh
set -e

# node_modules vive en el bind mount, compartido con el host: Android Studio lo
# necesita porque el proyecto Gradle incluye los plugins de Capacitor por ruta
# relativa (android/capacitor.settings.gradle -> ../node_modules/@capacitor/...).
#
# Como el bind mount tapa lo que instalara la imagen, se instala aqui, en el
# primer arranque o cuando el lockfile ha cambiado.
LOCK_STAMP="node_modules/.docker-lock-hash"
CURRENT="$(md5sum package-lock.json | cut -d' ' -f1)"

if [ ! -f "$LOCK_STAMP" ] || [ "$(cat "$LOCK_STAMP")" != "$CURRENT" ]; then
  echo "[entrypoint] Instalando dependencias (npm ci). La primera vez tarda un par de minutos..."
  npm ci
  echo "$CURRENT" > "$LOCK_STAMP"
  echo "[entrypoint] Dependencias listas."
fi

exec "$@"
