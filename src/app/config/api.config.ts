/** URL base del backend. Todas las rutas de la API cuelgan de aquí. */
export const API_URL = 'http://192.168.15.90/v1';

/**
 * Módulos del backend en los que se puede iniciar sesión desde la app. El
 * token sólo trae las abilities del módulo elegido, y el backend borra los
 * tokens anteriores en cada login: hay una sesión, de un módulo, a la vez.
 */
export const MODULOS = {
  SNEDJ: 'SNEDJ',
  BUZON: 'BuzonElectronicoPopjl'
} as const;

export type Modulo = (typeof MODULOS)[keyof typeof MODULOS];

/** Parámetros fijos que el backend espera en el login. */
export const LOGIN_DEFAULTS = {
  device_name: 'web',
  contexto: 'panel'
} as const;
