import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-shipping.html',
  styleUrl: './checkout-shipping.scss',
})
export class CheckoutShippingComponent {
  @Input({ required: true }) checkoutForm!: FormGroup;
  @Input() isOpen = true;

  @Output() toggled = new EventEmitter<void>();

  // Trace point: toggle()
  toggle(): void {
    this.toggled.emit();
  }
}
