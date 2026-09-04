import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order, OrderManager } from '@common/services/managers/order/order';
import { BehaviorSubject, combineLatest, finalize, map, Observable } from 'rxjs';
import { OrderStatusDTO } from '@common/dtos/order.dto';
import { ToastManager } from '@common/services/managers/toast/toast.manager';
import { NotificationManager } from '@common/services/managers/notification/notification.manager';

type SortType = 'newest' | 'alpha';
type StatusFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'cancelled' | 'paid' | 'shipped' | 'refund';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class AdminOrdersComponent implements OnInit {

  private search$ = new BehaviorSubject<string>('');
  private filter$ = new BehaviorSubject<StatusFilter>('all');
  private sort$ = new BehaviorSubject<SortType>('newest');

  orders$!: Observable<Order[]>;

  isLoading = signal(false);
  
  constructor(
    public manager: OrderManager, 
    private toast: ToastManager,
    private notif: NotificationManager) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.manager.adminLoad(true);
    const base$ = this.manager.orderFull$;

    this.orders$ = combineLatest([
      base$,
      this.search$,
      this.filter$,
      this.sort$
    ]).pipe(
      map(([orders, search, filter, sort]) => {

        let result = [...orders];

        //  SEARCH
        if (search.trim()) {
          result = result.filter(o =>
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.userId.toLowerCase().includes(search.toLowerCase())
          );
        }

        //  FILTER STATUS
        if (filter !== 'all') {
          result = result.filter(o => o.status === filter);
        }

        //  SORT
        if (sort === 'newest') {
          result.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        if (sort === 'alpha') {
          result.sort((a, b) => a.id.localeCompare(b.id));
        }

        return result;
      })
    );
  }

  // Trace point: updateOrder()
  updateOrder(userId: string, id: string,status: OrderStatusDTO): void {
      this.manager.updateOrderStatus(id, status).pipe(
        finalize(() => {
          this.isLoading.set(false)}
        )).subscribe({
          next: () => {
            this.toast.success('Order Sucessfully Updated');
          },
          error: () => {
            this.toast.error('Order Failed to complete');
          }
        }
      )
  }

  // Trace point: onSearch()
  onSearch(value: string) {
    this.search$.next(value);
  }

  // Trace point: onFilter()
  onFilter(value: StatusFilter) {
    this.filter$.next(value);
  }

  // Trace point: onSort()
  onSort(value: SortType) {
    this.sort$.next(value);
  }

  // Trace point: paymentMethodLabel()
  paymentMethodLabel(method?: string | null): string {
    switch (method) {
      case 'cod':
        return 'COD';
      case 'online':
        return 'Online';
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'gcash':
        return 'GCash';
      default:
        return 'Not selected';
    }
  }

  // Trace point: paymentStatusLabel()
  paymentStatusLabel(order: Order): string {
    if (order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
      return 'Unpaid';
    }

    if (order.paymentStatus === 'paid') {
      return 'Paid';
    }

    return order.paymentStatus ? order.paymentStatus : 'Unpaid';
  }
}
