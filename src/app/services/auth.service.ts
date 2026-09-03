import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'appMovil.isLoggedIn';

/**
 * Servicio de sesión. No conoce las credenciales: solo guarda si hay
 * una sesión activa (persistida en localStorage para sobrevivir recargas).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loggedIn = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

  readonly isLoggedIn = this.loggedIn.asReadonly();

  login(): void {
    localStorage.setItem(STORAGE_KEY, 'true');
    this.loggedIn.set(true);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.loggedIn.set(false);
  }
}
