#!/bin/sh
#
# Corre el Gradle del proyecto Android (./gradlew) con los argumentos dados.
#
# Gradle necesita Java. En macOS no suele haber uno instalado en el sistema,
# pero Android Studio trae el suyo (JBR): si JAVA_HOME no esta definida y el
# sistema no tiene Java, se usa ese.
#
set -e

if [ -z "$JAVA_HOME" ] && ! /usr/libexec/java_home >/dev/null 2>&1; then
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "$HOME/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  do
    if [ -x "$candidate/bin/java" ]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi

if [ -z "$JAVA_HOME" ] && ! /usr/libexec/java_home >/dev/null 2>&1; then
  echo "No encuentro Java. Instala Android Studio o define JAVA_HOME." >&2
  exit 1
fi

cd "$(dirname "$0")/../android"
exec ./gradlew "$@"
