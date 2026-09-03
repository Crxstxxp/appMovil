# syntax=docker/dockerfile:1

##
# AppMovil — entorno de desarrollo (Angular 17 + Capacitor).
#
# El contenedor corre el dev server de Angular, que sirve a la vez a:
#   - el navegador del host   -> http://localhost:4200
#   - la app Android          -> live reload de Capacitor contra este mismo server
#
# El build nativo (Gradle, SDK, emulador) se queda en el host: Android Studio
# necesita esas herramientas y meterlas en la imagen no aporta nada.
#
# Ojo con node_modules: NO va en un volumen propio del contenedor. Vive en el
# bind mount porque Android Studio lo necesita en el host (los plugins de
# Capacitor se incluyen en Gradle por ruta relativa). Lo instala el entrypoint.
##

FROM node:20-alpine

WORKDIR /app
ENV NG_CLI_ANALYTICS=false

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 4200
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# --host 0.0.0.0        expone el server fuera del contenedor (emulador y movil incluidos)
# --disable-host-check  permite entrar por IP y no solo por localhost
# --poll                los eventos de fichero no cruzan el bind mount en macOS/Windows
CMD ["npx", "ng", "serve", \
     "--host", "0.0.0.0", \
     "--port", "4200", \
     "--disable-host-check", \
     "--poll", "2000"]
