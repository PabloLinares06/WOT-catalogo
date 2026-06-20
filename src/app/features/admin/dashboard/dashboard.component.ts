import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  products = signal<Product[]>([]);
  loading = signal(true);
  updatingBatch = signal(false);
  deletingId = signal<string | null>(null);
  searchQuery = signal('');
  selectedCategory = signal('Todas');
  statusFilter = signal<'todos' | 'activos' | 'inactivos'>('activos');
  menuOpen = signal(false); // Signal para el menú hamburguesa

  @ViewChild('loadMoreSentinel') private sentinel?: ElementRef<HTMLDivElement>;
  private observer?: IntersectionObserver;
  visibleCount = signal(20); // Paginación frontend

  // Estadísticas
  totalProducts = computed(() => this.products().length);
  activeProducts = computed(() => this.products().filter(p => p.isActive).length);
  hiddenProducts = computed(() => this.products().filter(p => !p.isActive).length);
  categories = computed(() => {
    const cats = [...new Set(this.products().map(p => p.category))].sort();
    return ['Todas', ...cats];
  });

  filteredProducts = computed(() => {
    let list = this.products();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    const status = this.statusFilter();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.reference.toLowerCase() === q
      );
    }
    if (cat !== 'Todas') {
      list = list.filter(p => p.category === cat);
    }
    if (status === 'activos') list = list.filter(p => p.isActive);
    if (status === 'inactivos') list = list.filter(p => !p.isActive);
    return list;
  });

  pagedProducts = computed(() => {
    return this.filteredProducts().slice(0, this.visibleCount());
  });

  hasMore = computed(() => {
    return this.visibleCount() < this.filteredProducts().length;
  });

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe({
      next: products => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error cargando productos:', err);
        this.loading.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.hasMore()) {
          this.visibleCount.update(n => n + 20); // Carga 20 productos más
        }
      },
      { rootMargin: '300px' }
    );

    if (this.sentinel?.nativeElement) {
      this.observer.observe(this.sentinel.nativeElement);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
    this.deletingId.set(id);
    await this.productService.deleteProduct(id);
    this.deletingId.set(null);
  }

  async toggleActive(product: Product): Promise<void> {
    await this.productService.updateProduct(product.id, { isActive: !product.isActive });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  setSearch(value: string): void {
    this.searchQuery.set(value);
    this.visibleCount.set(20);
  }

  setCategory(cat: string): void {
    this.selectedCategory.set(cat);
    this.visibleCount.set(20);
  }

  setStatusFilter(status: 'todos' | 'activos' | 'inactivos'): void {
    this.statusFilter.set(status);
    this.visibleCount.set(20);
  }

  toggleMenu(): void {
    this.menuOpen.update(val => !val);
  }

  async updateAllObservations(): Promise<void> {
    if (!confirm('¿Activar observaciones en TODOS los productos del catálogo?')) return;

    this.updatingBatch.set(true);
    try {
      const count = await this.productService.enableObservationForAll();
      alert(`¡Listo! Se actualizaron ${count} productos.`);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar productos.');
    } finally {
      this.updatingBatch.set(false);
    }
  }
}
