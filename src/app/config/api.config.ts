/** URL base del backend. Todas las rutas de la API cuelgan de aquí. */
export const API_URL = 'http://192.168.15.90/v1';

/** Parámetros fijos que el backend espera en el login. */
export const LOGIN_DEFAULTS = {
  device_name: 'web',
  module: 'SNEDJ',
  contexto: 'panel'
} as const;
