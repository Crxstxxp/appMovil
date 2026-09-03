# AppMovil

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.8.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Docker (entorno de desarrollo)

El contenedor corre **solo el dev server de Angular**. Ese mismo server alimenta
a la vez al navegador y a la app Android, asi que se trabaja con un unico origen
de verdad para el codigo web.

```bash
npm run docker:dev     # levanta el contenedor -> http://localhost:4200
npm run docker:down    # lo para
```

El primer arranque instala las dependencias (`npm ci`) y tarda un par de
minutos; los siguientes son inmediatos. Los cambios en `src/` recargan el
navegador solos.

### Por que node_modules se comparte con el host

El proyecto Gradle de Android incluye los plugins de Capacitor **por ruta
relativa** (`android/capacitor.settings.gradle` apunta a
`../node_modules/@capacitor/...`). Si `node_modules` viviera solo dentro del
contenedor, Android Studio no podria compilar. Por eso vive en el bind mount.

La contrapartida: las dependencias se instalan desde Alpine Linux, asi que los
binarios nativos (esbuild) son de Linux. **No ejecutes `npm start` ni `ng build`
directamente en macOS**; usa el contenedor. Los comandos de Capacitor (`cap`)
si funcionan en el host, porque son JavaScript puro.

## Android Studio

Android Studio, el SDK y el emulador se quedan en el host: no estan en la imagen
ni tiene sentido meterlos. Lo que va en Docker es solo la parte web.

### Live reload: la app carga desde el dev server

Con el contenedor levantado, la app Android puede cargar la web desde
`http://<host>:4200` en vez de los ficheros empaquetados. Se toca `src/` y la
pantalla del movil se recarga sola.

```bash
npm run docker:dev            # 1. dev server arriba (dejar corriendo)
npm run android:live:emu      # 2a. para el emulador
npm run android:live:device   # 2b. para un movil por USB
```

Ambos scripts hacen `cap sync` con la URL correcta y abren Android Studio; ahi
solo hay que darle a **Run**. La URL cambia segun el destino:

| Destino  | URL que usa la app        | Por que |
|----------|---------------------------|---------|
| Emulador | `http://10.0.2.2:4200`    | `10.0.2.2` es como el AVD ve al host |
| Movil    | `http://localhost:4200`   | Tunel USB con `adb reverse` (ver abajo) |

**Los dos destinos no son intercambiables.** `10.0.2.2` solo existe dentro del
emulador: si se sincroniza esa URL y luego se instala en un movil real, la app
arranca en blanco y el log da `net::ERR_CONNECTION_TIMED_OUT`. Hay que volver a
lanzar el script del destino correcto (`cap sync` reescribe la URL en
`android/app/src/main/assets/capacitor.config.json`).

El trafico va por http, no https. Android lo bloquea desde la API 28, asi que
`android/app/src/debug/AndroidManifest.xml` habilita `usesCleartextTraffic`
**solo en debug**: los builds de release siguen sin permitir http.

#### El tunel USB (`adb reverse`)

Para el movil se usa el cable en vez de la IP de la wifi:
`scripts/live-device.sh` hace `adb reverse tcp:4200 tcp:4200`, que redirige el
`localhost:4200` **del movil** al `localhost:4200` del Mac. Ventajas frente a la
IP de la LAN: funciona sin wifi compartida (wifi de invitados, VPN, IP en `en1`
en vez de `en0`...) y la URL no cambia nunca.

El tunel se cae al desconectar el cable o reiniciar el movil. No hace falta
recompilar, solo rehacerlo:

```bash
npm run android:reverse
```

### Build normal (sin live reload)

Sin la variable `CAP_SERVER_URL`, la app usa los ficheros empaquetados:

```bash
npm run docker:build     # compila dist/ desde el contenedor
npm run android:sync     # copia dist/ a android/ (ojo: usa ng del host)
npm run android:open     # abre Android Studio
```

### Notas

- `android/gradlew` necesita permiso de ejecucion (`chmod +x`); el repo venia
  sin el, seguramente por haberse creado en Windows.
- `npm run android:build` usaba `gradlew.bat`, que es de Windows. Ahora usa
  `./gradlew`, que es el wrapper de macOS/Linux.
