import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product } from '../../../core/models/product.model';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-product-order',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DragDropModule, CurrencyPipe],
  templateUrl: './product-order.component.html'
})
export class ProductOrderComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  allProducts    = signal<Product[]>([]);
  categoryNames  = signal<string[]>([]);
  selectedCat    = signal<string>('');
  loading        = signal(true);
  saving         = signal(false);
  saved          = signal(false);
  hasUnsaved     = signal(false);

  /** Productos de la categoría seleccionada, ordenados por campo `order` (luego precio como fallback) */
  displayProducts = computed<Product[]>(() => {
    const cat = this.selectedCat();
    if (!cat) return [];
    return [...this.allProducts()]
      .filter(p => p.category === cat)
      .sort((a, b) => {
        const hasA = a.order != null;
        const hasB = b.order != null;
        if (hasA && hasB) return a.order! - b.order!;
        if (hasA) return -1;
        if (hasB) return 1;
        return a.price - b.price;
      });
  });

  /** Lista local mutable para el drag-and-drop — se clona al cambiar de categoría */
  orderedList = signal<Product[]>([]);

  ngOnInit(): void {
    this.categoryService.getAllCategories().subscribe(cats => {
      this.categoryNames.set(cats);
      if (cats.length > 0 && !this.selectedCat()) {
        this.selectCategory(cats[0]);
      }
    });

    this.productService.getAllProducts().subscribe(products => {
      this.allProducts.set(products);
      this.loading.set(false);
      // Refrescar lista ordenada si ya hay categoría seleccionada
      if (this.selectedCat()) {
        this.refreshOrderedList();
      }
    });
  }

  selectCategory(cat: string): void {
    this.selectedCat.set(cat);
    this.hasUnsaved.set(false);
    this.saved.set(false);
    this.refreshOrderedList();
  }

  private refreshOrderedList(): void {
    this.orderedList.set([...this.displayProducts()]);
  }

  /** Angular CDK: se llama cuando el usuario suelta un item */
  onDrop(event: CdkDragDrop<Product[]>): void {
    const list = [...this.orderedList()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.orderedList.set(list);
    this.hasUnsaved.set(true);
    this.saved.set(false);
  }

  /** Persiste el orden actual en el backend */
  async saveOrder(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.saved.set(false);

    const updates = this.orderedList().map((p, index) => ({
      id: p.id,
      order: index + 1   // 1-based para facilitar lectura
    }));

    try {
      await this.productService.reorderProducts(updates);
      // Actualizar el signal local para que el orden quede reflejado
      this.allProducts.update(all =>
        all.map(p => {
          const updated = updates.find(u => u.id === p.id);
          return updated ? { ...p, order: updated.order } : p;
        })
      );
      this.hasUnsaved.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 3000);
    } catch (err) {
      console.error('Error al guardar orden:', err);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  /** Restaura la lista al último orden guardado */
  cancelChanges(): void {
    this.refreshOrderedList();
    this.hasUnsaved.set(false);
    this.saved.set(false);
  }
}
