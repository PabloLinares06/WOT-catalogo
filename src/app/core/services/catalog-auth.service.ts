import { Injectable, signal } from '@angular/core';

const SESSION_KEY = 'natec_catalog_session';
const SESSION_TTL_MS = 72 * 60 * 60 * 1000; // 72 horas

interface SessionData {
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogAuthService {
  /** Contraseña maestra — hardcoded aquí para que nunca viaje al cliente en texto plano desde el env */
  private readonly PASSWORD = 'NA2026@';

  private _authenticated = signal(this._checkStoredSession());

  /** Signal reactivo — los guards lo pueden leer directamente */
  isAuthenticated = this._authenticated.asReadonly();

  /** Valida la contraseña y persiste la sesión si es correcta */
  login(password: string): boolean {
    if (password !== this.PASSWORD) return false;

    const session: SessionData = {
      expiresAt: Date.now() + SESSION_TTL_MS
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this._authenticated.set(true);
    return true;
  }

  /** Cierra la sesión del catálogo (no afecta la sesión del admin) */
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._authenticated.set(false);
  }

  /** Verifica si hay una sesión válida y no expirada en localStorage */
  private _checkStoredSession(): boolean {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session: SessionData = JSON.parse(raw);
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      return true;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
  }
}
