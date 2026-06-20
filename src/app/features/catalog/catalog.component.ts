import {
  Component, HostListener, OnInit, AfterViewInit, OnDestroy,
  inject, signal, computed, ChangeDetectionStrategy,
  ElementRef, ViewChild
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { BannerService } from '../../core/services/banner.service';
import { CategoryService } from '../../core/services/category.service';
import { KioskService } from '../../core/services/kiosk.service';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from './product-card/product-card.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProductCardComponent, NavbarComponent, SlicePipe],
  templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private bannerService = inject(BannerService);
  private categoryService = inject(CategoryService);
  kioskService = inject(KioskService); // público — el template lo usa directamente

  @ViewChild('loadMoreSentinel') private sentinel?: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;

  products = signal<Product[]>([]);
  orderedCategoryNames = signal<string[]>([]);
  selectedCategory = signal<string>('Todos');
  searchQuery = signal<string>('');
  loading = signal(true);
  connectionError = signal('');
  toastMessage = signal('');
  showBackToTop = signal(false);

  // Alias para compatibilidad con el template
  firebaseError = this.connectionError;

  bannerDesktop = signal<string | null>(null);
  bannerMobile = signal<string | null>(null);
  bannersLoaded = signal(false);

  /** Número de categorías completas visibles en el DOM */
  private visibleCategoryCount = signal(3);

  categories = computed(() => {
    const active = new Set(this.products().map(p => p.category));
    const dynamicCats = this.orderedCategoryNames();

    // Mantiene el orden de la base de datos, solo muestra las que tienen productos
    const ordered = dynamicCats.filter(c => active.has(c));

    // Categorías que puedan estar en los productos pero no en la base de datos (fallback)
    const knownCats = new Set(dynamicCats);
    const others = [...active].filter(c => !knownCats.has(c)).sort();

    return ['Todos', ...ordered, ...others];
  });

  filteredProducts = computed(() => {
    let list = this.products();
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase().trim();
    if (cat !== 'Todos') {
      list = list.filter(p => p.category === cat);
    }
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.reference?.toLowerCase() === q
      );
    }
    return list;
  });

  /** Productos agrupados por categoría, respetando el orden de la base de datos */
  groupedProducts = computed(() => {
    const filtered = this.filteredProducts();
    const groups: { category: string; products: Product[] }[] = [];
    const dynamicCats = this.orderedCategoryNames();

    // Primero las categorías con el orden configurado en el admin
    for (const cat of dynamicCats) {
      const items = filtered
        .filter(p => p.category === cat)
        .sort((a, b) => {
          const hasA = a.order != null;
          const hasB = b.order != null;
          if (hasA && hasB) return a.order! - b.order!;
          if (hasA) return -1;
          if (hasB) return 1;
          return a.price - b.price;
        });
      if (items.length > 0) groups.push({ category: cat, products: items });
    }

    // Luego categorías que no estén en la base de datos
    const knownCats = new Set(dynamicCats);
    const unknown = filtered.filter(p => !knownCats.has(p.category));
    const unknownCats = [...new Set(unknown.map(p => p.category))].sort();

    for (const cat of unknownCats) {
      groups.push({
        category: cat,
        products: unknown.filter(p => p.category === cat).sort((a, b) => {
          const hasA = a.order != null;
          const hasB = b.order != null;
          if (hasA && hasB) return a.order! - b.order!;
          if (hasA) return -1;
          if (hasB) return 1;
          return a.price - b.price;
        })
      });
    }
    return groups;
  });

  /**
   * Subconjunto de groupedProducts limitado a visibleCategoryCount categorías.
   * Cada categoría se muestra completa — nunca se corta a la mitad.
   */
  visibleGroupedProducts = computed(() => {
    return this.groupedProducts().slice(0, this.visibleCategoryCount());
  });

  /** true mientras queden categorías por mostrar */
  hasMore = computed(() => {
    return this.visibleCategoryCount() < this.groupedProducts().length;
  });

  ngOnInit(): void {
    this.categoryService.getAllCategories().subscribe(cats => {
      this.orderedCategoryNames.set(cats);
    });

    this.bannerService.getBanners().subscribe(config => {
      this.bannerDesktop.set(config.desktopUrl || null);
      this.bannerMobile.set(config.mobileUrl || null);
      this.bannersLoaded.set(true);
    });

    this.productService.getActiveProducts().subscribe({
      next: products => {
        this.products.set(products);
        this.loading.set(false);
        this.connectionError.set('');
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading.set(false);
        const status = err?.status;
        if (status === 0) {
          this.connectionError.set('No se puede conectar al servidor. Asegúrate de que el backend esté corriendo en localhost:3000.');
        } else if (status === 401 || status === 403) {
          this.connectionError.set('Sin permisos para leer los productos.');
        } else if (status >= 500) {
          this.connectionError.set(`Error interno del servidor (${status}). Revisa los logs del backend.`);
        } else {
          this.connectionError.set(`Error al cargar productos: ${err?.message || 'Verifica la conexión con el servidor.'}`);
        }
      }
    });

    // Registrar callback de carga diferida para el Modo Kiosco
    this.kioskService.registerLoadMoreCallback(() => {
      if (this.hasMore()) {
        this.visibleCategoryCount.update(n => n + 2);
        return true;
      }
      return false;
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    // Garantizar que el body no quede bloqueado si el usuario navega fuera y limpiar callback
    this.kioskService.disableKiosk();
    this.kioskService.registerLoadMoreCallback(undefined);
  }

  /** Configura el observer que carga más productos automáticamente al hacer scroll */
  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore()) {
          this.visibleCategoryCount.update(n => n + 2); // Carga 2 categorías más
        }
      },
      { rootMargin: '300px' }
    );

    if (this.sentinel?.nativeElement) {
      this.observer.observe(this.sentinel.nativeElement);
    }
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
    this.showToast(`${product.name} añadido al pedido`);
  }

  selectCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.visibleCategoryCount.set(3); // Reinicia la paginación al cambiar categoría
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
    this.visibleCategoryCount.set(3); // Reinicia la paginación al buscar
  }

  enterKioskMode(): void {
    this.selectedCategory.set('Todos');
    this.searchQuery.set('');
    this.visibleCategoryCount.set(3);
    this.kioskService.enableKiosk();
  }

  /** Cambia la categoría dentro del modo kiosco y reinicia la navegación al primer producto */
  selectKioskCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.visibleCategoryCount.set(3);
    // Pequeño delay para que Angular actualice el DOM antes de re-inicializar el kiosco
    setTimeout(() => {
      this.kioskService.resetKioskNavigation();
    }, 80);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showBackToTop.set(window.scrollY > 600);
  }

  /** Flechas de teclado para el Modo Kiosco */
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (!this.kioskService.isKioskActive) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.kioskService.scrollToProduct('down'); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); this.kioskService.scrollToProduct('up'); }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 2500);
  }
}
