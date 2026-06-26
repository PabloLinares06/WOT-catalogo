import { Component, ChangeDetectionStrategy, input, output, inject, computed, signal } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  readonly productInput = input.required<Product>({ alias: 'product' });
  addToCart = output<Product>();

  get product(): Product {
    return this.productInput();
  }

  cartService = inject(CartService);
  themeService = inject(ThemeService);

  // Estados de carga de imagen
  imageLoading = signal(true);
  imageError = signal(false);
  retryCount = 0;
  maxRetries = 2;

  // Carrusel de la tarjeta
  slideIndex = signal(0);

  // URL procesada para el carrusel (maneja el reintento agregando un timestamp si falla)
  currentImgUrl = signal('');

  allImages = computed(() => {
    const extras = this.product.images ?? [];
    return this.product.imageUrl ? [this.product.imageUrl, ...extras] : extras;
  });

  constructor() {
    // Inicializar la URL actual con la primera imagen
    setTimeout(() => {
      const images = this.allImages();
      if (images.length > 0) {
        this.currentImgUrl.set(images[0]);
      }
    });
  }

  prevCard(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const len = this.allImages().length;
    if (len < 2) return;
    const newIdx = (this.slideIndex() - 1 + len) % len;
    this.updateSlide(newIdx);
  }

  nextCard(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const len = this.allImages().length;
    if (len < 2) return;
    const newIdx = (this.slideIndex() + 1) % len;
    this.updateSlide(newIdx);
  }

  private updateSlide(index: number): void {
    this.slideIndex.set(index);
    this.retryCount = 0;
    this.resetImageState();
    this.currentImgUrl.set(this.allImages()[index]);
  }

  private resetImageState(): void {
    this.imageLoading.set(true);
    this.imageError.set(false);
  }

  onImageLoad(): void {
    this.imageLoading.set(false);
    this.imageError.set(false);
    this.retryCount = 0; // Éxito, reiniciamos contador
  }

  onImageError(): void {
    // No añadimos ?retry=X porque eso rompe el caché del navegador y genera
    // descargas adicionales facturadas en Firebase Storage.
    // Si la imagen falla, mostramos el estado de error directamente.
    this.imageLoading.set(false);
    this.imageError.set(true);
  }

  // Cantidad actual de este producto en el carrito
  quantity = computed(() => {
    const item = this.cartService.cartItems().find(i => i.product.id === this.product.id);
    return item ? item.quantity : 0;
  });



  increase(): void {
    this.cartService.addToCart(this.product);
  }

  decrease(): void {
    this.cartService.updateQuantity(this.product.id, this.quantity() - 1);
  }

  increaseBy(amount: number): void {
    const current = this.quantity();
    if (current === 0) {
      this.cartService.addToCart(this.product);
      const max = this.product.stock;
      this.cartService.updateQuantity(this.product.id, max !== undefined ? Math.min(amount, max) : amount);
    } else {
      const max = this.product.stock;
      const newQty = current + amount;
      this.cartService.updateQuantity(this.product.id, max !== undefined ? Math.min(newQty, max) : newQty);
    }
  }

  decreaseBy(amount: number): void {
    const newQty = Math.max(0, this.quantity() - amount);
    this.cartService.updateQuantity(this.product.id, newQty);
  }

  observation = computed(() => {
    const item = this.cartService.cartItems().find(i => i.product.id === this.product.id);
    return item?.observation ?? '';
  });

  updateObservation(value: string): void {
    this.cartService.updateObservation(this.product.id, value);
  }

  setQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value, 10);
    if (isNaN(value) || value < 0) value = 0;
    const max = this.product.stock;
    if (max !== undefined && value > max) value = max;
    input.value = String(value);
    this.cartService.updateQuantity(this.product.id, value);
  }
}
