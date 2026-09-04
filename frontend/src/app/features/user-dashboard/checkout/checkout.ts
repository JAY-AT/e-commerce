import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, map, Subject, switchMap, takeUntil } from 'rxjs';

import { CartItem, CartManager } from '@common/services/managers/cart/cart';
import { AuthManager } from '@common/services/managers/auth/auth';
import { OrderManager } from '@common/services/managers/order/order';
import { NavigationComponent } from '@common/components/navigation/navigation';
import { CheckoutSummaryComponent } from './checkout-summary/checkout-summary';
import { CheckoutShippingComponent } from './checkout-shipping/checkout-shipping';
import { PaymentManager } from '@common/services/managers/payment/payment';
import { ToastManager } from '@common/services/managers/toast/toast.manager';
import { CheckoutPaymentRequestDTO } from '@common/dtos/payment.dto';

type CheckoutPaymentMethod = 'cod' | 'online';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavigationComponent,
    CheckoutSummaryComponent,
    CheckoutShippingComponent,
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  isSubmitting = false;
  errorMessage = '';
  isShippingOpen = true;
  checkoutForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private CartManager: CartManager,
    private authService: AuthManager,
    private orderManager: OrderManager,
    private router: Router,
    private paymentManager: PaymentManager,
    private toastManager: ToastManager
  ) {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      addressLine1: ['', [Validators.required, Validators.minLength(5)]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.minLength(3)]],
      paymentMethod: ['cod' satisfies CheckoutPaymentMethod, [Validators.required]],
    });
  }

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.CartManager.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
      });

    const user = this.authService.getCurrentUser();
    if (user) {
      this.checkoutForm.patchValue({
        fullName: user.name,
        email: user.email,
        phone: user.phone ?? '',
        addressLine1: user.addressLine1 ?? '',
        addressLine2: user.addressLine2 ?? '',
        city: user.city ?? '',
        state: user.state ?? '',
        postalCode: user.postalCode ?? '',
      });
    }
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Trace point: subtotal()
  get subtotal(): number {
    return this.CartManager.getTotalPrice();
  }

  // Trace point: shippingFee()
  get shippingFee(): number {
    return this.subtotal > 0 ? 0 : 0;
  }

  // Trace point: total()
  get total(): number {
    return this.subtotal + this.shippingFee;
  }

  // Trace point: selectedPaymentMethod()
  get selectedPaymentMethod(): CheckoutPaymentMethod {
    return this.checkoutForm.value.paymentMethod || 'cod';
  }

  // Trace point: submitLabel()
  get submitLabel(): string {
    if (this.isSubmitting) {
      return 'Placing order...';
    }

    return this.selectedPaymentMethod === 'online'
      ? 'Place order and pay online'
      : 'Place COD order';
  }

  // Trace point: totalQuantity()
  get totalQuantity(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Trace point: adjustQuantity()
  adjustQuantity(productId: string, delta: number): void {
    const item = this.cartItems.find(entry => entry.product.id === productId);
    if (!item) {
      return;
    }

    const nextQuantity = item.quantity + delta;
    if (nextQuantity <= 0) {
      this.CartManager.removeFromCart(productId);
      return;
    }

    this.CartManager.updateQuantity(productId, nextQuantity);
  }

  // Trace point: removeItem()
  removeItem(productId: string): void {
    this.CartManager.removeFromCart(productId);
  }

  // Trace point: toggleShipping()
  toggleShipping(): void {
    this.isShippingOpen = !this.isShippingOpen;
  }

  // Trace point: submitOrder()
  submitOrder(): void {
    if (this.checkoutForm.invalid || this.cartItems.length === 0) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'Please sign in again to place your order.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const form = this.checkoutForm.value;

    const shippingAddr = [
      form.addressLine1,
      form.addressLine2,
      form.city,
      form.state,
      form.postalCode,
    ]
      .filter(Boolean)
      .join(', ');

    this.orderManager.placeOrder(user.id, this.cartItems, shippingAddr).pipe(
      switchMap((order) => {
        const paymentRequest: CheckoutPaymentRequestDTO = {
          order_id: order.id,
          payment_method: form.paymentMethod,
        };

        return this.paymentManager.checkoutPayment(paymentRequest).pipe(
          switchMap((payment) =>
            this.orderManager.refreshOrder(order.id).pipe(
              map((updatedOrder) => ({ order: updatedOrder, payment }))
            )
          )
        );
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: ({ order, payment }) => {
        if (form.paymentMethod === 'online') {
          this.router.navigate(['/pay', order.id], {
            state: { order },
          });
          return;
        }

        if (payment.payment.status === 'paid') {
          this.toastManager.success('Payment successful');
        } else {
          this.toastManager.success('COD order placed. Payment will be marked paid when received.');
        }

        this.CartManager.refreshCart();
        this.router.navigate(['/orders']);
      },

      error: (error: any) => {
        this.toastManager.error(
          error?.error?.message || error?.message || 'Process failed'
        );
      }
    });
  }

  // Trace point: backToDashboard()
  backToDashboard(): void {
    this.router.navigate(['/user-dashboard']);
  }

  // Trace point: logout()
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
