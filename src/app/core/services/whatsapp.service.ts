import { Injectable } from '@angular/core';
import { CartItem } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private phone = environment.whatsappNumber;

  sendOrder(items: CartItem[]): void {
    const lines = items.flatMap(item => {
      const p = item.product;
      // Formato solicitado: • (Ref: 1234) x5 unidades Cabeza de 20W iPhone
      // Referencia y cantidad en negrilla (incluyendo la viñeta para limpieza visual)
      const line = `*• (Ref: ${p.reference}) x${item.quantity} unidades* ${p.name}`;

      return item.observation?.trim()
        ? [line, `  Observación: ${item.observation.trim()}`]
        : [line];
    });

    const message = [
      'Pedido WOT S.A.S.',
      '',
      ...lines,
      '',
      `Total referencias: ${items.length}`,
      '',
      'Favor confirmar recepción del pedido.'
    ].join('\n');

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${this.phone}?text=${encoded}`, '_blank');
  }
}
