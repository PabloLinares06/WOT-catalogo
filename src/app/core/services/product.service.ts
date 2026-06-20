import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly uploadWebpQuality = 0.82;

  getActiveProducts(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/products?active=true`).pipe(
      map(products => products.map(p => this._mapProduct(p)))
    );
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/products`).pipe(
      map(products => products.map(p => this._mapProduct(p)))
    );
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.http.get<any>(`${this.apiUrl}/api/products/${id}`).pipe(
      map(p => p ? this._mapProduct(p) : undefined),
      catchError(() => of(undefined))
    );
  }

  private _mapProduct(p: any): Product {
    return {
      ...p,
      price: Number(p.price),
      category: p.category?.name || '',
      categoryId: p.categoryId || p.category?.id || ''
    };
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<void> {
    await firstValueFrom(
      this.http.post<unknown>(`${this.apiUrl}/api/products`, product)
    );
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await firstValueFrom(
      this.http.patch<unknown>(`${this.apiUrl}/api/products/${id}`, data)
    );
  }

  async deleteProduct(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<unknown>(`${this.apiUrl}/api/products/${id}`)
    );
  }

  /**
   * Re-ordena un listado de productos en el backend.
   */
  async reorderProducts(updates: { id: string; order: number }[]): Promise<void> {
    await firstValueFrom(
      this.http.patch<unknown>(`${this.apiUrl}/api/products/reorder`, updates)
    );
  }

  async updateProductPriceByReference(reference: string, price: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.patch<unknown>(`${this.apiUrl}/api/products/price-by-reference`, { reference, price })
      );
      return true;
    } catch (err: any) {
      if (err?.status === 404) return false;
      throw err;
    }
  }

  /**
   * Sube una imagen al backend y retorna su URL.
   * Convierte a WebP antes de subir (igual que antes).
   */
  async uploadProductImage(file: File, reference: string, isExtra: boolean = false, index?: number): Promise<string> {
    const cleanRef = reference.trim();
    const processedImage = await this._processImageForUpload(file);

    let baseName = cleanRef;
    if (isExtra && index !== undefined) {
      baseName = `${cleanRef}-${index}`;
    }

    const extension = processedImage.extension;
    const fileName = `${baseName}.${extension}`;

    const formData = new FormData();
    formData.append('file', processedImage.blob, fileName);
    formData.append('reference', baseName);

    const response = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.apiUrl}/api/upload/image`, formData)
    );
    return response.url;
  }

  /**
   * Stub: endpoint no implementado en el backend todavía.
   */
  async enableObservationForAll(): Promise<number> {
    return 0;
  }

  private async _processImageForUpload(file: File): Promise<{ blob: Blob; extension: string; contentType: string }> {
    try {
      const webpBlob = await this._convertToWebp(file, this.uploadWebpQuality);
      return {
        blob: webpBlob,
        extension: 'webp',
        contentType: 'image/webp'
      };
    } catch (err) {
      // Fallback seguro: si falla la conversión, subimos el archivo original.
      const originalExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const contentType = file.type || this._mimeTypeFromExtension(originalExt);
      return {
        blob: file,
        extension: originalExt,
        contentType
      };
    }
  }

  private _mimeTypeFromExtension(ext: string): string {
    const normalized = ext.toLowerCase();
    if (normalized === 'png') return 'image/png';
    if (normalized === 'webp') return 'image/webp';
    if (normalized === 'jpeg' || normalized === 'jpg') return 'image/jpeg';
    return 'application/octet-stream';
  }

  private async _convertToWebp(file: File, quality: number): Promise<Blob> {
    const image = await this._loadImageElement(file);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener contexto de canvas.');
    }

    // Solo convierte formato; conserva tamaño original (ej. 800x800).
    ctx.drawImage(image, 0, 0, image.width, image.height);

    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas no pudo generar blob WebP.'));
          return;
        }
        resolve(blob);
      }, 'image/webp', quality);
    });

    return webpBlob;
  }

  private async _loadImageElement(file: File): Promise<HTMLImageElement> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer archivo para conversión.'));
      reader.readAsDataURL(file);
    });

    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo decodificar imagen para conversión.'));
      img.src = dataUrl;
    });
  }
}
