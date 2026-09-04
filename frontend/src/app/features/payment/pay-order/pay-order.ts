import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, interval, of, Subject, switchMap, takeUntil, timeout } from 'rxjs';
import { OrderManager } from '@common/services/managers/order/order';
import { OrderApiService } from '@common/services/api/order/order-api.service';
import { CartManager } from '@common/services/managers/cart/cart';

@Component({
  selector: 'app-pay-order',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="pay-page">
      <div class="payment-card">
        <p class="eyebrow">Secure payment</p>
        <h1>You are paying {{ totalAmount | currency:'PHP':'symbol-narrow':'1.2-2' }}</h1>
        <p class="order-label">for Order #{{ orderId }}</p>

        <div class="gateway-box">
          <div class="gateway-logo">Pay</div>
          <span>checkout</span>
        </div>

        <div class="qr-box" *ngIf="qrCode">
          <img [src]="qrCode" alt="Payment QR code" />
        </div>

        <div class="qr-status" *ngIf="isGeneratingQr">
          <span class="spinner"></span>
          <span>Generating QR code...</span>
        </div>

        <div class="qr-status error" *ngIf="qrError">
          <span>{{ qrError }}</span>
          <button type="button" class="retry-button" (click)="generateQrCode()">Retry</button>
        </div>

        <div class="success-message" *ngIf="paymentConfirmed">
          Payment confirmed! This order has been marked as paid.
        </div>

        <button
          type="button"
          class="confirm-button"
          (click)="confirmPayment()"
          [disabled]="isLoading || isGeneratingQr || !qrCode || paymentConfirmed"
        >
          {{ paymentConfirmed ? 'Paid' : isLoading ? 'Confirming payment...' : isGeneratingQr ? 'Generating QR...' : 'Confirm Payment' }}
        </button>

        <button
          *ngIf="paymentConfirmed"
          type="button"
          class="back-cart-button"
          (click)="backToCart()"
        >
          Back to Cart
        </button>

        <p class="note">This is a demo payment page.</p>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5efe7 0%, #e9d9be 100%);
      font-family: Arial, sans-serif;
      padding: 32px 16px;
    }

    .pay-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .payment-card {
      width: min(100%, 520px);
      background: #fffdf9;
      border: 1px solid #d7b88d;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 18px 40px rgba(90, 59, 27, 0.12);
      text-align: center;
    }

    .eyebrow {
      margin: 0 0 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #7d5335;
      font-size: 12px;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      color: #3d2c20;
      font-size: clamp(32px, 5vw, 42px);
    }

    .order-label {
      margin: 12px 0 24px;
      color: #5f4637;
      font-size: 18px;
    }

    .gateway-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 18px 16px;
      background: #f6efe8;
      border: 1px solid #e6d0af;
      border-radius: 12px;
      margin-bottom: 24px;
      color: #4a3527;
      font-weight: 600;
    }

    .gateway-logo {
      background: #6f4e37;
      color: white;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .qr-box {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 20px;
      width: min(240px, 70vw);
      padding: 16px;
      background: #fff;
      border: 1px solid #e7d3b9;
      border-radius: 16px;
    }

    .qr-box img {
      display: block;
      width: 100%;
      height: auto;
      max-width: 220px;
    }

    .qr-status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin: 0 0 20px;
      color: #7f6050;
      font-size: 14px;
      min-height: 24px;
    }

    .qr-status.error {
      flex-direction: column;
      color: #9b3a3a;
      font-weight: 600;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(111, 78, 55, 0.25);
      border-top-color: #6f4e37;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .retry-button {
      margin-top: 8px;
      border: none;
      border-radius: 8px;
      background: #6f4e37;
      color: #fff;
      padding: 8px 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .success-message {
      margin: 0 0 16px;
      padding: 12px 14px;
      border-radius: 10px;
      background: rgba(20, 122, 79, 0.12);
      border: 1px solid rgba(20, 122, 79, 0.25);
      color: #176a48;
      font-weight: 700;
      text-align: center;
    }

    .confirm-button {
      width: 100%;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #6f4e37 0%, #8a6448 100%);
      color: white;
      cursor: pointer;
      font-weight: 700;
      font-size: 18px;
      padding: 18px 20px;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .confirm-button:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .confirm-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .back-cart-button {
      width: 100%;
      border: 1px solid #a67952;
      border-radius: 12px;
      background: #f6efe9;
      color: #5c3b2b;
      cursor: pointer;
      font-weight: 700;
      font-size: 18px;
      padding: 16px 20px;
      margin-top: 16px;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .back-cart-button:hover {
      transform: translateY(-1px);
      background: #f0e3d5;
    }

    .note {
      margin-top: 18px;
      color: #7f6050;
      font-size: 14px;
    }
  `]
})
export class PayOrderComponent implements OnInit, OnDestroy {
  orderId: string | null = null;
  totalAmount = 0;
  qrCode = '';
  qrError = '';
  isLoading = false;
  isGeneratingQr = false;
  paymentConfirmed = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderManager: OrderManager,
    private orderApi: OrderApiService,
    private cartManager: CartManager,
  ) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('orderId');

    if (!this.orderId) {
      this.router.navigate(['/orders']);
      return;
    }

    const navOrder = history.state?.order ?? this.router.getCurrentNavigation()?.extras?.state?.['order'];
    if (navOrder) {
      this.orderId = String(navOrder.id ?? this.orderId);
      this.totalAmount = this.readOrderAmount(navOrder);
    }

    this.generateQrCode();
    this.loadOrder();
    this.watchOrderPaymentStatus();
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Trace point: loadOrder()
  private loadOrder(): void {
    if (!this.orderId) return;

    this.orderManager.getOrderById(this.orderId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (order) => {
        this.orderId = String(order.id ?? this.orderId);
        this.totalAmount = this.readOrderAmount(order);
        this.applyPaidState(order.status === 'paid' || order.paymentStatus === 'paid');
      },
      error: () => {
        this.totalAmount = this.normalizeAmount(this.totalAmount, 0);
      },
    });
  }

  // Trace point: watchOrderPaymentStatus()
  private watchOrderPaymentStatus(): void {
    if (!this.orderId) return;

    interval(3000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.orderManager.getOrderById(this.orderId!).pipe(
        catchError(() => of(null))
      ))
    ).subscribe((order) => {
      if (!order) return;

      this.totalAmount = this.readOrderAmount(order);
      this.applyPaidState(order.status === 'paid' || order.paymentStatus === 'paid');
    });
  }

  // Trace point: generateQrCode()
  generateQrCode(): void {
    if (!this.orderId) return;

    this.qrCode = this.buildFallbackQrCodeUrl();
    this.isGeneratingQr = false;
    this.qrError = '';

    this.orderApi.getOrderQrCode(this.orderId).pipe(
      timeout(3000),
      catchError(() => of(null)),
      takeUntil(this.destroy$),
      finalize(() => this.isGeneratingQr = false)
    ).subscribe({
      next: (response) => {
        if (!response) return;

        this.qrCode = response.qrCode || this.qrCode;
        this.totalAmount = this.normalizeAmount(response.total_amount, this.totalAmount);

        if (!this.qrCode) {
          this.qrError = 'Unable to generate QR code. Please try again.';
        }
      },
      error: () => {
        this.qrCode = '';
        this.qrError = 'Unable to generate QR code. Please try again.';
      },
    });
  }

  // Trace point: confirmPayment()
  confirmPayment(): void {
    if (!this.orderId || !this.qrCode || this.paymentConfirmed) return;

    this.isLoading = true;
    this.qrError = '';

    this.orderApi.confirmOrderPayment(this.orderId).pipe(
      timeout(5000),
      catchError(() => of(null)),
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response) => {
        if (!response) {
          this.checkPaymentStatusOnce();
          return;
        }

        this.applyPaidState(true);
      },
    });
  }

  // Trace point: backToCart()
  backToCart(): void {
    this.cartManager.clearCart();
    this.router.navigate(['/user-dashboard']);
  }

  // Trace point: checkPaymentStatusOnce()
  private checkPaymentStatusOnce(): void {
    if (!this.orderId) return;

    this.orderManager.getOrderById(this.orderId).pipe(
      timeout(3000),
      catchError(() => of(null)),
      takeUntil(this.destroy$)
    ).subscribe((order) => {
      if (order?.status === 'paid' || order?.paymentStatus === 'paid') {
        this.applyPaidState(true);
        return;
      }

      this.qrError = 'Payment confirmation is taking too long. Please try again.';
    });
  }

  // Trace point: applyPaidState()
  private applyPaidState(isPaid: boolean): void {
    if (!isPaid) return;

    this.paymentConfirmed = true;
    this.isLoading = false;
    this.qrError = '';
  }

  // Trace point: readOrderAmount()
  private readOrderAmount(order: any): number {
    return this.normalizeAmount(order?.total_amount ?? order?.total ?? order?.amount, 0);
  }

  // Trace point: buildFallbackQrCodeUrl()
  private buildFallbackQrCodeUrl(): string {
    const paymentUrl = `${window.location.origin}/pay/${this.orderId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentUrl)}`;
  }

  // Trace point: normalizeAmount()
  private normalizeAmount(value: unknown, fallback: number): number {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : fallback;
  }
}
