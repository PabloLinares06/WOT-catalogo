import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  order: number;
  isOriginal?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Obtiene todas las categorías ordenadas por 'order'.
   * Retorna un array de nombres (contrato usado por el catálogo).
   */
  getAllCategories(): Observable<string[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/api/categories`).pipe(
      map(categories =>
        categories
          .slice()
          .sort((a, b) => a.order - b.order)
          .map(c => c.name)
      )
    );
  }

  /**
   * Obtiene todas las categorías con su orden completo.
   */
  getAllCategoriesWithOrder(): Observable<Array<{ id: string; name: string; order: number; isOriginal: boolean }>> {
    return this.http.get<Category[]>(`${this.apiUrl}/api/categories`).pipe(
      map(categories =>
        categories
          .map(c => ({
            id: c.id,
            name: c.name,
            order: c.order,
            isOriginal: c.isOriginal ?? false
          }))
          .sort((a, b) => a.order - b.order)
      )
    );
  }

  /**
   * Obtiene solo las categorías personalizadas (no originales).
   */
  getCustomCategories(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Category[]>(`${this.apiUrl}/api/categories`).pipe(
      map(categories =>
        categories
          .filter(c => !c.isOriginal)
          .map(c => ({ id: c.id, name: c.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    );
  }

  /**
   * Añade una nueva categoría.
   */
  async addCategory(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = trimmed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents/diacritics
      .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric chars with hyphens
      .replace(/(^-|-$)+/g, '');       // remove leading/trailing hyphens
    await firstValueFrom(
      this.http.post<unknown>(`${this.apiUrl}/api/categories`, { id, name: trimmed })
    );
  }

  /**
   * Actualiza el orden de una categoría.
   */
  async updateCategoryOrder(id: string, newOrder: number): Promise<void> {
    await firstValueFrom(
      this.http.patch<unknown>(`${this.apiUrl}/api/categories/${id}/order`, { order: newOrder })
    );
  }

  /**
   * Elimina una categoría.
   */
  async deleteCategory(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<unknown>(`${this.apiUrl}/api/categories/${id}`)
    );
  }

  /**
   * Renombra una categoría.
   */
  async renameCategory(
    id: string,
    currentName: string,
    newName: string,
    order: number,
    isOriginal: boolean
  ): Promise<void> {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === currentName) return;
    await firstValueFrom(
      this.http.patch<unknown>(`${this.apiUrl}/api/categories/${id}`, { name: trimmedNew })
    );
  }
}
