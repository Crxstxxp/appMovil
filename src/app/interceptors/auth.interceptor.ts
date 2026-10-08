import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';

/**
 * Añade el token Bearer a las peticiones al backend. Si el backend responde
 * 401 (token caducado o sesión abierta en otro dispositivo) cierra la sesión
 * y manda al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const nav = inject(NavController);
  const token = auth.accessToken();

  if (!req.url.startsWith(API_URL)) {
    return next(req);
  }

  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && token) {
        auth.logout();
        nav.navigateRoot('/login');
      }
      return throwError(() => err);
    })
  );
};
