import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-price-quick-update',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './price-quick-update.component.html'
})
export class PriceQuickUpdateComponent {
  private productService = inject(ProductService);

  reference = signal('');
  newPrice: number | null = null;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  async updatePrice(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    const cleanReference = this.reference().trim();
    if (!cleanReference) {
      this.errorMessage.set('La referencia es obligatoria.');
      return;
    }

    if (this.newPrice === null || Number.isNaN(this.newPrice) || this.newPrice < 0) {
      this.errorMessage.set('Ingresa un precio valido mayor o igual a 0.');
      return;
    }

    this.saving.set(true);

    try {
      const updated = await this.productService.updateProductPriceByReference(cleanReference, this.newPrice);
      if (!updated) {
        this.errorMessage.set('No existe un producto con esa referencia exacta.');
        return;
      }

      this.successMessage.set('Precio actualizado correctamente.');
      this.reference.set('');
      this.newPrice = null;
    } catch {
      this.errorMessage.set('No se pudo actualizar el precio. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
