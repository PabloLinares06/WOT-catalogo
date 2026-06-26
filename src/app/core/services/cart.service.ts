import { Injectable, computed, signal, effect } from '@angular/core';
import { CartItem, Product } from '../models/product.model';

const CART_KEY = 'wot_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private items = signal<CartItem[]>(this.loadFromStorage());

  cartItems = this.items.asReadonly();

  itemCount = computed(() =>
    this.items().reduce((acc, item) => acc + item.quantity, 0)
  );

  referenceCount = computed(() => this.items().length);

  /**
   * Calcula el total multiplicando el precio de cada producto por su cantidad.
   */
  total = computed(() =>
    this.items().reduce((acc, item) => {
      const { product, quantity } = item;
      return acc + (product.price * quantity);
    }, 0)
  );

  constructor() {
    // Persistir en localStorage cada vez que cambie el carrito
    effect(() => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(this.items()));
      } catch {}
    });
  }

  private loadFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addToCart(product: Product): void {
    const current = this.items();
    const existing = current.find(i => i.product.id === product.id);
    if (existing) {
      this.items.set(
        current.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      this.items.set([...current, { product, quantity: 1 }]);
    }
  }

  updateObservation(productId: string, observation: string): void {
    this.items.set(
      this.items().map(i =>
        i.product.id === productId ? { ...i, observation } : i
      )
    );
  }

  removeFromCart(productId: string): void {
    this.items.set(this.items().filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.items.set(
      this.items().map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }

  clearCart(): void {
    this.items.set([]);
  }
}
