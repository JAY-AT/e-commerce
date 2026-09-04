import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, finalize, map, Observable, tap } from 'rxjs';

import { AuthManager } from '@common/services/managers/auth/auth';
import { Order, OrderData, OrderManager } from '@common/services/managers/order/order';
import { NavigationComponent } from '@common/components/navigation/navigation';
import { OrderCardComponent } from './order-card/order-card';
import { PaymentManager } from '@common/services/managers/payment/payment';
import { CheckoutPaymentRequest } from '@common/services/api/payment/payment-api.service';
import { ToastManager } from '@common/services/managers/toast/toast.manager';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavigationComponent,
    OrderCardComponent
  ],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})

export class Orders implements OnInit {

  orders$!: Observable<Order[]>;
  filteredOrders$!: Observable<Order[]>;
  orderData$!: Observable<OrderData>;
  isLoading = false;
  errorMessage = '';
  statusFilter = 'all';
  sortMode: 'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc' = 'newest';
  private readonly statusFilterSubject = new BehaviorSubject<string>(this.statusFilter);
  private readonly sortModeSubject = new BehaviorSubject<'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc'>(this.sortMode);

  readonly statusOptions = [
    { value: 'all', label: 'All status' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'paid', label: 'Paid' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refund', label: 'Refund' },
  ] as const;

  readonly sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'alpha-asc', label: 'A to Z' },
    { value: 'alpha-desc', label: 'Z to A' },
  ] as const;

  constructor(
    private orderManager: OrderManager,
    private authService: AuthManager,
    private router: Router,
    private paymentManager: PaymentManager, 
    private toastManager: ToastManager
  ) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.isLoading = true;
    this.loadOrders();
    this.filteredOrders$ = combineLatest([
      this.orderManager.orderFull$,
      this.statusFilterSubject,
      this.sortModeSubject,
    ]).pipe(
      tap(() => {
        this.isLoading = false;
      }),
      map(([orders, status, sortMode]) => this.filterAndSortOrders(orders, status, sortMode)),
    );
  }

  // Trace point: loadOrders()
  loadOrders(): void {
    this.orderManager.userLoad(true);
    this.orders$ = this.orderManager.orderFull$;
  }

  // Trace point: setStatusFilter()
  setStatusFilter(value: string): void {
    this.statusFilter = value;
    this.statusFilterSubject.next(value);
  }

  // Trace point: setSortMode()
  setSortMode(value: 'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc'): void {
    this.sortMode = value;
    this.sortModeSubject.next(value);
  }

  // Trace point: trackByOrderId()
  trackByOrderId(_: number, order: Order): string {
    return order.id;
  }

  payAmount(event: { id: string; amount: number }): void {
    console.log('Paying order:', event.id);
    console.log('Amount:', event.amount);

    const data: CheckoutPaymentRequest = {
      order_id: event.id,
      payment_method: 'cash',
      cash: event.amount,
    };

    console.log(data);

    this.paymentManager.checkoutPayment(data).subscribe({
      next: (result) => {
        this.toastManager.success('Payment Successfull');

        // refresh order AFTER successful payment
        this.orderManager.refreshOrder(event.id).subscribe({
          next: () => {
            console.log('Order refreshed');
          },
          error: (err) => {
            console.error('Failed to refresh order:', err);
          },
        });
      },

      error: (err) => {
        console.error('Payment failed:', err);
        this.toastManager.error?.(err?.message ?? 'Payment failed');
      },
    });
  }

  // Trace point: markReceived()
  markReceived(orderId: string): void {
    this.errorMessage = '';

    this.orderManager.updateOrderStatus(orderId, 'completed').subscribe({
      next: () => this.loadOrders(),
      error: () => {
        this.errorMessage = 'Failed to update order status';
      }
    });
  }

  // Trace point: backToShop()
  backToShop(): void {
    this.router.navigate(['/user-dashboard']);
  }

  // Trace point: logout()
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private filterAndSortOrders(
    orders: Order[],
    statusFilter: string,
    sortMode: 'newest' | 'oldest' | 'alpha-asc' | 'alpha-desc',
  ): Order[] {
    const filtered = statusFilter === 'all'
      ? [...orders]
      : orders.filter((order) => order.status === statusFilter);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'oldest':
          return this.compareDates(a.createdAt, b.createdAt);
        case 'alpha-asc':
          return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
        case 'alpha-desc':
          return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
        case 'newest':
        default:
          return this.compareDates(b.createdAt, a.createdAt);
      }
    });

    return sorted;
  }

  // Trace point: compareDates()
  private compareDates(left: string, right: string): number {
    return new Date(left).getTime() - new Date(right).getTime();
  }
}
