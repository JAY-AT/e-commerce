import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CartManager } from '@common/services/managers/cart/cart';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent {
  totalItems$: Observable<number>;
  totalPrice$: Observable<number>;

  constructor(
    private CartManager: CartManager,
    private router: Router
  ) {
    this.totalItems$ = this.CartManager.totalItems$;
    this.totalPrice$ = this.CartManager.totalPrice$;
  }

  // Trace point: checkout()
  checkout(): void {
    this.router.navigate(['/checkout']);
  }
}
