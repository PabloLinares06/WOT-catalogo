import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../core/services/category.service';
import { FormsModule } from '@angular/forms';

interface CategoryWithOrder {
  id: string;
  name: string;
  order: number;
  isOriginal: boolean;
}

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './category-manager.component.html'
})
export class CategoryManagerComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<CategoryWithOrder[]>([]);
  loading = signal(true);
  saving = signal(false);

  // Nueva categoría
  showNewCategoryInput = signal(false);
  newCategoryName = signal('');
  savingNewCategory = signal(false);

  // Eliminar
  deletingCategoryId = signal<string | null>(null);

  // Edición / Renombrado
  editingCategoryId = signal<string | null>(null);
  editingCategoryName = signal<string>('');
  savingRename = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoryService.getAllCategoriesWithOrder().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.loading.set(false);
      }
    });
  }

  async updateOrder(categoryId: string, newOrder: number): Promise<void> {
    if (newOrder < 1) return;

    this.saving.set(true);
    try {
      await this.categoryService.updateCategoryOrder(categoryId, newOrder);
      this.loadCategories(); // Recargar para ver el nuevo orden
    } catch (err) {
      console.error('Error al actualizar orden:', err);
      alert('Error al actualizar el orden. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  async addNewCategory(): Promise<void> {
    const name = this.newCategoryName().trim();
    if (!name) return;

    console.log('🟢 Iniciando creación de categoría:', name);
    this.savingNewCategory.set(true);
    try {
      console.log('🟡 Llamando a categoryService.addCategory...');
      await this.categoryService.addCategory(name);
      console.log('✅ Categoría creada exitosamente');

      this.newCategoryName.set('');
      this.showNewCategoryInput.set(false);

      console.log('🟡 Recargando lista de categorías...');
      // Recargar categorías de forma síncrona
      await new Promise<void>((resolve, reject) => {
        this.categoryService.getAllCategoriesWithOrder().subscribe({
          next: (cats) => {
            console.log('✅ Categorías recargadas:', cats.length);
            this.categories.set(cats);
            this.loading.set(false);
            resolve();
          },
          error: (err) => {
            console.error('❌ Error al cargar categorías:', err);
            reject(err);
          }
        });
      });
      console.log('✅ Proceso completado');
    } catch (err: any) {
      console.error('❌ Error completo:', err);
      console.error('❌ Error code:', err?.code);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error stack:', err?.stack);
      alert(`Error al crear la categoría.\n\nDetalle: ${err?.message || err?.code || err}\n\nRevisa la consola (F12) para más información.`);
    } finally {
      console.log('🔵 Finally - reseteando savingNewCategory');
      this.savingNewCategory.set(false);
    }
  }

  async deleteCategory(id: string, name: string): Promise<void> {
    if (!confirm(`¿Eliminar la categoría "${name}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    this.deletingCategoryId.set(id);
    try {
      await this.categoryService.deleteCategory(id);
      this.loadCategories();
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      alert('Error al eliminar la categoría. Intenta de nuevo.');
    } finally {
      this.deletingCategoryId.set(null);
    }
  }

  startEdit(cat: CategoryWithOrder): void {
    this.editingCategoryId.set(cat.id);
    this.editingCategoryName.set(cat.name);
  }

  cancelEdit(): void {
    this.editingCategoryId.set(null);
    this.editingCategoryName.set('');
  }

  async saveRename(cat: CategoryWithOrder): Promise<void> {
    const newName = this.editingCategoryName().trim();
    if (!newName) return;
    if (newName === cat.name) {
      this.cancelEdit();
      return;
    }

    this.savingRename.set(true);
    try {
      await this.categoryService.renameCategory(
        cat.id,
        cat.name,
        newName,
        cat.order,
        cat.isOriginal
      );
      this.cancelEdit();
      this.loadCategories();
    } catch (err) {
      console.error('Error al renombrar categoría:', err);
      alert('Error al renombrar la categoría. Intenta de nuevo.');
    } finally {
      this.savingRename.set(false);
    }
  }

  toggleNewCategoryInput(): void {
    this.showNewCategoryInput.update(v => !v);
    if (!this.showNewCategoryInput()) {
      this.newCategoryName.set('');
    }
  }
}
