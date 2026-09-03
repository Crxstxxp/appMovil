#!/bin/sh
#
# Live reload contra un movil conectado por USB.
#
# En vez de la IP de la LAN se usa `adb reverse`: abre un tunel por el cable USB
# que hace que el `localhost:PORT` del movil salga al `localhost:PORT` del Mac.
# Asi funciona aunque el movil no este en la misma wifi (o no haya wifi), y no
# depende de que interfaz (en0/en1/utun...) tenga hoy la IP buena.
#
# El tunel se cae al desconectar el cable o reiniciar el movil: en ese caso
# basta `npm run android:reverse` (no hace falta volver a compilar).
#
set -e

PORT="${DEV_PORT:-4200}"

# adb casi nunca esta en el PATH en macOS; se busca donde lo pone Android Studio.
ADB="$(command -v adb || true)"
for candidate in \
  "$ANDROID_HOME/platform-tools/adb" \
  "$ANDROID_SDK_ROOT/platform-tools/adb" \
  "$HOME/Library/Android/sdk/platform-tools/adb"
do
  [ -n "$ADB" ] && break
  [ -x "$candidate" ] && ADB="$candidate"
done

if [ -z "$ADB" ]; then
  echo "No encuentro adb. Instala las platform-tools del SDK de Android." >&2
  exit 1
fi

if ! "$ADB" get-state >/dev/null 2>&1; then
  echo "No hay ningun movil conectado (o falta autorizar la depuracion USB)." >&2
  echo "Comprueba con: $ADB devices -l" >&2
  exit 1
fi

"$ADB" reverse "tcp:$PORT" "tcp:$PORT"
echo "Tunel USB listo: localhost:$PORT del movil -> localhost:$PORT del Mac."
