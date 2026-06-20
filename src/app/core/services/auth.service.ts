import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const TOKEN_KEY = 'wot-token';
const USER_KEY = 'wot-user';

interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

interface WotUser {
  id: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private _currentUser: WotUser | null = this._loadUserFromStorage();
  currentUser$ = new BehaviorSubject<WotUser | null>(this._currentUser);

  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

  private _loadUserFromStorage(): WotUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email, password })
    );
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUser$.next(response.user);
    this.startInactivityTimer();
    this.registerActivityListeners();
  }

  async logout(): Promise<void> {
    this.clearInactivityTimer();
    this.removeActivityListeners();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/admin/login']);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  getUserRole(): string | null {
    const user = this.currentUser$.getValue();
    return user?.role ?? null;
  }

  /** Reinicia el temporizador cuando hay actividad del usuario */
  private resetTimer = (): void => {
    this.clearInactivityTimer();
    this.startInactivityTimer();
  };

  startInactivityTimer(): void {
    this.inactivityTimer = setTimeout(() => {
      this.ngZone.run(async () => {
        await this.logout();
        this.router.navigate(['/admin/login'], {
          queryParams: { reason: 'inactivity' }
        });
      });
    }, INACTIVITY_TIMEOUT_MS);
  }

  clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  registerActivityListeners(): void {
    this.ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, this.resetTimer, { passive: true })
    );
    // También reiniciar cuando el usuario vuelve a la pestaña
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  removeActivityListeners(): void {
    this.ACTIVITY_EVENTS.forEach(event =>
      window.removeEventListener(event, this.resetTimer)
    );
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.resetTimer();
    }
  };
}
