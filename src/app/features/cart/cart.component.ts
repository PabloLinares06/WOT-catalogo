import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { WhatsappService } from '../../core/services/whatsapp.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, NavbarComponent],
  templateUrl: './cart.component.html'
})
export class CartComponent {
  cartService = inject(CartService);
  private whatsappService = inject(WhatsappService);

  sendOrder(): void {
    this.whatsappService.sendOrder(this.cartService.cartItems());
  }
}
