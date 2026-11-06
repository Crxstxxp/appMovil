import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Modulo } from '../config/api.config';
import { AuthService } from '../services/auth.service';

/**
 * Deja pasar sólo si la sesión es del módulo indicado; si no, manda a la
 * pantalla de inicio del módulo con el que se inició sesión.
 */
export function moduloGuard(modulo: Modulo): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.modulo() === modulo ? true : router.parseUrl(auth.rutaInicio());
  };
}
