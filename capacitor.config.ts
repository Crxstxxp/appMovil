import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Live reload contra el dev server que corre en Docker.
 *
 * Si CAP_SERVER_URL esta definida, la app Android carga la web desde esa URL
 * en vez de los ficheros empaquetados en el APK: se toca `src/` y la pantalla
 * del movil se recarga sola. Sin la variable, build normal para release.
 *
 * La URL depende de donde corra la app (ver `npm run android:live:*`):
 *   emulador -> http://10.0.2.2:4200   (10.0.2.2 es el host visto por el AVD)
 *   movil    -> http://localhost:4200  (tunel USB, ver `scripts/live-device.sh`)
 *
 * Ojo: 10.0.2.2 solo existe dentro del emulador. Si se sincroniza esa URL y
 * luego se instala en un movil real, la carga se queda en connection timed out.
 */
const devServerUrl = process.env['CAP_SERVER_URL'];

const config: CapacitorConfig = {
  appId: 'com.cristopher.appmovil',
  appName: 'AppMovil',
  webDir: 'dist/app-movil/browser',
  plugins: {
    // Las peticiones HTTP salen por la capa nativa: sin CORS ni bloqueo de
    // mixed content (la app se sirve en https://localhost y el backend es http).
    CapacitorHttp: { enabled: true },
  },
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          // El dev server va por http, no https: sin esto Android bloquea la carga.
          cleartext: true,
        },
      }
    : {}),
};

export default config;
