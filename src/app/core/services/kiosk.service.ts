import { Injectable, signal, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Kiosk Mode — Módulo 3
 * Se activa automáticamente en dispositivos tablet (480px–1399px).
 * Gestiona el bloqueo de scroll libre y la navegación matemática por productos.
 *
 * 0 operaciones Firebase — solo manipulación de DOM y CSS.
 */
@Injectable({ providedIn: 'root' })
export class KioskService {
  private breakpoints = inject(BreakpointObserver);

  /** true cuando el viewport es de tablet (480px–1399px) */
  isTablet = signal(false);

  /** true cuando el admin ha activado el modo kiosco manualmente */
  kioskEnabled = signal(false);

  /** true cuando ambas condiciones se cumplen */
  get isKioskActive(): boolean {
    return this.isTablet() && this.kioskEnabled();
  }

  /** Índice del producto actualmente centrado en pantalla */
  currentProductIndex = signal(0);
  totalProducts       = signal(0);

  /** Bloqueo de doble-tap (previene scroll doble por gestos rápidos) */
  private isScrolling = false;

  constructor() {
    // Escucha cambios de viewport y combina con detección de pantalla táctil
    this.breakpoints
      .observe(['(min-width: 480px) and (max-width: 1399px)'])
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        const isTabletDevice = result.matches && this.hasTouchSupport();
        this.isTablet.set(isTabletDevice);
        
        if (!isTabletDevice && this.kioskEnabled()) {
          // Si se sale del rango tablet o pierde soporte táctil, desactivar kiosco
          this.disableKiosk();
        }
      });
  }

  /**
   * Detecta si el dispositivo actual tiene soporte para pantalla táctil.
   * Evita mostrar el modo kiosco en computadoras de escritorio y laptops tradicionales.
   */
  private hasTouchSupport(): boolean {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  enableKiosk(): void {
    this.kioskEnabled.set(true);
    document.body.classList.add('kiosk-mode');
    
    // Inicializa el estado activo de la primera tarjeta del DOM tras un breve retardo
    setTimeout(() => {
      this.currentProductIndex.set(0);
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>('[data-product-card]')
      );
      this.totalProducts.set(cards.length);
      this.updateActiveDOMCard(0);
    }, 100);
  }

  disableKiosk(): void {
    this.kioskEnabled.set(false);
    document.body.classList.remove('kiosk-mode');
    this.currentProductIndex.set(0);
    this.clearAllActiveAttributes();
  }

  toggleKiosk(): void {
    this.isKioskActive ? this.disableKiosk() : this.enableKiosk();
  }

  /**
   * Reinicia la navegación al primer producto del DOM sin desactivar el modo kiosco.
   * Útil cuando el usuario cambia de categoría desde la barra de filtros del kiosco.
   */
  resetKioskNavigation(): void {
    this.isScrolling = false;
    this.clearAllActiveAttributes();
    this.currentProductIndex.set(0);
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-product-card]')
    );
    this.totalProducts.set(cards.length);
    this.updateActiveDOMCard(0);
    setTimeout(() => {
      const activeCard = document.querySelector('[data-product-card][data-kiosk-active]');
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }, 50);
  }

  /**
   * Actualiza el atributo 'data-kiosk-active' en las tarjetas del DOM,
   * permitiendo que el CSS oculte herméticamente las tarjetas adyacentes.
   */
  private updateActiveDOMCard(index: number): void {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-product-card]')
    );
    cards.forEach((card, i) => {
      const parentHost = card.closest('app-product-card');
      const section = card.closest('section');
      if (i === index) {
        card.setAttribute('data-kiosk-active', 'true');
        if (parentHost) parentHost.setAttribute('data-kiosk-host-active', 'true');
        if (section) section.setAttribute('data-kiosk-section-active', 'true');
      } else {
        card.removeAttribute('data-kiosk-active');
        if (parentHost) parentHost.removeAttribute('data-kiosk-host-active');
      }
    });

    // Asegura que las secciones sin la tarjeta activa sean desmarcadas
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section'));
    sections.forEach(section => {
      const hasActive = section.querySelector('[data-product-card][data-kiosk-active="true"]');
      if (hasActive) {
        section.setAttribute('data-kiosk-section-active', 'true');
      } else {
        section.removeAttribute('data-kiosk-section-active');
      }
    });
  }

  /** Limpia todos los atributos al desactivar el modo kiosco */
  private clearAllActiveAttributes(): void {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-product-card]')
    );
    cards.forEach(card => {
      card.removeAttribute('data-kiosk-active');
      const parentHost = card.closest('app-product-card');
      if (parentHost) parentHost.removeAttribute('data-kiosk-host-active');
    });

    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section'));
    sections.forEach(section => section.removeAttribute('data-kiosk-section-active'));
  }

  private loadMoreCallback?: () => boolean;

  /** Permite al catálogo registrar su función de scroll infinito / carga diferida */
  registerLoadMoreCallback(callback?: () => boolean): void {
    this.loadMoreCallback = callback;
  }

  /**
   * Desplaza a la siguiente o anterior tarjeta de producto.
   * Utiliza el índice del signal directamente para una precisión absoluta y
   * compatibilidad con la ocultación y colapso de las demás tarjetas.
   */
  scrollToProduct(direction: 'up' | 'down'): void {
    if (this.isScrolling) return;

    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-product-card]')
    );
    if (cards.length === 0) return;

    this.totalProducts.set(cards.length);

    const currentIndex = this.currentProductIndex();

    // Si vamos hacia abajo y estamos en el último producto, intentar cargar más categorías
    if (direction === 'down' && currentIndex === cards.length - 1) {
      if (this.loadMoreCallback && this.loadMoreCallback()) {
        this.isScrolling = true;
        
        let attempts = 0;
        const maxAttempts = 20; // 20 * 50ms = 1000ms max
        const checkDOMInterval = setInterval(() => {
          attempts++;
          const newCards = Array.from(
            document.querySelectorAll<HTMLElement>('[data-product-card]')
          );
          
          if (newCards.length > cards.length) {
            clearInterval(checkDOMInterval);
            this.totalProducts.set(newCards.length);
            
            const nextIdx = currentIndex + 1;
            this.currentProductIndex.set(nextIdx);
            this.updateActiveDOMCard(nextIdx);

            setTimeout(() => {
              const activeCard = document.querySelector('[data-product-card][data-kiosk-active]');
              if (activeCard) {
                activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              this.isScrolling = false;
            }, 50);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkDOMInterval);
            this.isScrolling = false;
          }
        }, 50);
        return;
      }
    }

    let nextIdx = currentIndex;

    if (direction === 'down') {
      nextIdx = Math.min(currentIndex + 1, cards.length - 1);
    } else {
      nextIdx = Math.max(currentIndex - 1, 0);
    }

    if (nextIdx !== currentIndex || (nextIdx === 0 && direction === 'up') || (nextIdx === cards.length - 1 && direction === 'down')) {
      this.isScrolling = true;
      this.currentProductIndex.set(nextIdx);
      this.updateActiveDOMCard(nextIdx); // Marca la nueva tarjeta activa

      // Realiza el scroll al elemento activo tras un leve retardo para que el DOM aplique los estilos
      setTimeout(() => {
        const activeCard = document.querySelector('[data-product-card][data-kiosk-active]');
        if (activeCard) {
          activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        this.isScrolling = false;
      }, 50);
    }
  }

  /**
   * Salta directamente a un índice específico de producto.
   * Útil para el indicador de posición tipo "3 / 47".
   */
  scrollToIndex(index: number): void {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-product-card]')
    );
    const card = cards[index];
    if (!card) return;
    this.currentProductIndex.set(index);
    this.updateActiveDOMCard(index); // Marca la nueva tarjeta activa
    
    setTimeout(() => {
      const activeCard = document.querySelector('[data-product-card][data-kiosk-active]');
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }
}
