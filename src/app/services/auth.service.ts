import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL, LOGIN_DEFAULTS } from '../config/api.config';

const TOKEN_KEY = 'appMovil.token';
const USER_KEY = 'appMovil.user';

export interface AuthUser {
  id: number;
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  email: string;
  modulos: string[];
  roles: { id: number; rol: string }[];
}

/** Respuesta de /api/Core/auth/login: el usuario más su token de acceso. */
export interface LoginResponse extends AuthUser {
  token: string;
}

/**
 * Servicio de sesión. Hace login contra el backend y guarda el token y el
 * usuario en localStorage para sobrevivir recargas.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly currentUser = signal<AuthUser | null>(readStoredUser());

  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly accessToken = this.token.asReadonly();
  readonly user = this.currentUser.asReadonly();

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${API_URL}/api/Core/auth/login`,
        { email, password, ...LOGIN_DEFAULTS },
        { headers: { Accept: 'application/json, text/plain, */*' } }
      )
      .pipe(
        tap(({ token, ...user }) => {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.token.set(token);
          this.currentUser.set(user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
