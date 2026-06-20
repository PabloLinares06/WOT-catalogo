import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'wot-theme';

  isDark = signal<boolean>(this.loadPreference());

  constructor() {
    // Aplicar preferencia inicial al DOM de forma síncrona
    document.documentElement.classList.toggle('dark', this.isDark());
  }

  toggle(): void {
    const next = !this.isDark();
    const doc = document.documentElement;

    // Bloquear TODAS las transiciones para evitar lag en móviles
    doc.classList.add('no-transitions');

    // Aplicar el tema al DOM de forma síncrona
    doc.classList.toggle('dark', next);
    localStorage.setItem(this.STORAGE_KEY, next ? 'dark' : 'light');
    this.isDark.set(next);

    // Esperar un frame de repintado y reactivar transiciones
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        doc.classList.remove('no-transitions');
      });
    });
  }

  private loadPreference(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) return stored === 'dark';
    // Por defecto: modo luz
    return false;
  }
}
