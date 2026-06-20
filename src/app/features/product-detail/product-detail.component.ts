import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { Product } from '../../core/models/product.model';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, NavbarComponent],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  product = signal<Product | null>(null);
  loading = signal(true);
  notFound = signal(false);
  quantity = signal(1);
  toastMessage = signal('');
  addedToCart = signal(false);

  // Carrusel
  activeSlide = signal(0);
  private touchStartX = 0;

  /** Todas las imágenes: principal + extras */
  allImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    const extras = p.images ?? [];
    return p.imageUrl ? [p.imageUrl, ...extras] : extras;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }
    this.productService.getProductById(id).pipe(take(1)).subscribe({
      next: (product) => {
        if (!product || !product.isActive) {
          this.notFound.set(true);
        } else {
          this.product.set(product);
          this.activeSlide.set(0);
        }
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); }
    });
  }

  // ── Carrusel ──
  prevSlide(): void {
    const len = this.allImages().length;
    this.activeSlide.set((this.activeSlide() - 1 + len) % len);
  }

  nextSlide(): void {
    const len = this.allImages().length;
    this.activeSlide.set((this.activeSlide() + 1) % len);
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
  }

  onTouchEnd(e: TouchEvent): void {
    const diff = this.touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? this.nextSlide() : this.prevSlide();
    }
  }

  // ── Precio por volumen ──
  isBulkActive = computed(() => {
    const p = this.product();
    return !!p?.bulkMinQty && !!p?.bulkPrice && this.quantity() >= p.bulkMinQty;
  });

  activePrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return this.isBulkActive() ? p.bulkPrice! : p.price;
  });

  // ── Cantidad ──
  incrementQty(): void {
    const p = this.product();
    if (p?.stock !== undefined && this.quantity() >= p.stock) return;
    this.quantity.update(q => q + 1);
  }

  decrementQty(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    for (let i = 0; i < this.quantity(); i++) {
      this.cartService.addToCart(p);
    }
    this.addedToCart.set(true);
    this.showToast(`✓ ${this.quantity()} × ${p.name} añadido${this.quantity() > 1 ? 's' : ''}`);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }

  goToCart(): void {
    this.addToCart();
    setTimeout(() => this.router.navigate(['/cart']), 300);
  }

  get stockStatus(): 'ok' | 'low' | 'out' | 'none' {
    const p = this.product();
    if (!p || p.stock === undefined) return 'none';
    if (p.stock === 0) return 'out';
    if (p.stock <= 5) return 'low';
    return 'ok';
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 2500);
  }
}
