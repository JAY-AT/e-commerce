import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { CartItem } from '@common/services/managers/cart/cart';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkout-summary.html',
  styleUrl: './checkout-summary.scss',
})
export class CheckoutSummaryComponent {
  @Input() cartItems: CartItem[] = [];
  @Input() subtotal = 0;
  @Input() totalQuantity = 0;
  @Input() total = 0;

  @Output() quantityChange = new EventEmitter<{ productId: string; delta: number }>();
  @Output() removeItem = new EventEmitter<string>();

  // Trace point: lineTotal()
  lineTotal(item: CartItem): number {
    return Number(item.product.price ?? 0) * Number(item.quantity ?? 0);
  }

  // Trace point: formatPrice()
  formatPrice(value: unknown): string {
    return Number(value ?? 0).toFixed(2);
  }

  // Trace point: adjustQuantity()
  adjustQuantity(productId: string, delta: number): void {
    this.quantityChange.emit({ productId, delta });
  }

  // Trace point: onRemove()
  onRemove(productId: string): void {
    this.removeItem.emit(productId);
  }
}
