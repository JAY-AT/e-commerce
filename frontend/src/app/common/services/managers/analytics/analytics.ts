import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, Subscription } from 'rxjs';
import { OrderManager, Order } from '../order/order';
import { UserManager } from '../user/user';

export interface ActivityItem {
  type: 'order' | 'user' | 'system';
  message: string;
  date: string;
}

export interface WeeklySales {
  date: string; // ISO date
  total: number;
}
export interface AnalyticsData {
  totalSales: number;
  ordersToday: number;
  activeUsers: number;
  avgOrderValue: number;

  totalQuantity: number;
  totalSpent: number;
  totalOrders: number;

  salesGrowth: number;
  ordersYesterday: number;
  weeklySales: WeeklySales[];
  userGrowth: number;
  avgChange: number;

  pendingOrders: number;
  acceptedOrders: number;
  paidOrders: number;
  shippedOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundOrders: number;
  conversionRate: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsManager {
  private readonly analyticsSubject = new BehaviorSubject<AnalyticsData>(
    this.getDefault()
  );
  private analyticsSubscription?: Subscription;

  readonly analytics$ = this.analyticsSubject.asObservable();

  constructor(
    private orderManager: OrderManager,
    private userManager: UserManager
  ) { }

  // Trace point: init()
  public init(): void {
    if (this.analyticsSubscription) {
      return;
    }

    this.analyticsSubscription = combineLatest([
      this.orderManager.orders$,
      this.orderManager.orderData$,
      this.userManager.getUsers(),
    ])
      .pipe(
        map(([orders, orderData, users]) =>
          this.computeAnalytics(orders, orderData, users)
        )
      )
      .subscribe((data) => this.analyticsSubject.next(data));
  }
  
  private computeAnalytics(
    orders: Order[],
    orderData: { totalQuantity: number; totalSpent: number; totalOrders: number },
    users: any[]
  ): AnalyticsData {
    const today = new Date().toDateString();

    let ordersToday = 0;
    let ordersYesterday = 0;
    let weeklySales : WeeklySales[] = this.generateWeeklySales();
    let pending = 0;
    let accepted = 0;
    let paid = 0;
    let shipped = 0;
    let completed = 0;
    let cancelled = 0;
    let refund = 0;

    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    orders.forEach(order => {
      this.filterForWeeklySales(order, weeklySales);
      const orderDate = new Date(order.createdAt).toDateString();

      if (orderDate === today) ordersToday++;
      if (orderDate === yesterday) ordersYesterday++;

      switch (order.status) {
        case 'pending':
          pending++;
          break;
        case 'accepted':
          accepted++;
          break;
        case 'paid':
          paid++;
          break;
        case 'shipped':
          shipped++;
          break;
        case 'completed':
          completed++;
          break;
        case 'cancelled':
          cancelled++;
          break;
        case 'refund':
          refund++;
          break;
      }
    });

    console.log('SALES', weeklySales);
    
    const totalSales = orderData.totalSpent;
    const totalOrders = orderData.totalOrders;

    const avgOrderValue = totalOrders
      ? totalSales / totalOrders
      : 0;

    const salesGrowth = ordersYesterday
      ? ((ordersToday - ordersYesterday) / ordersYesterday) * 100
      : 0;

    const activeUsers = users.length;

    const conversionRate = users.length
      ? (totalOrders / users.length) * 100
      : 0;

    const userGrowth = 0;

    // Avg change placeholder
    const avgChange = 0;

    return {
      totalSales,
      ordersToday,
      activeUsers,
      avgOrderValue,

      totalQuantity: orderData.totalQuantity,
      totalSpent: orderData.totalSpent,
      totalOrders: orderData.totalOrders,

      salesGrowth,
      ordersYesterday,
      weeklySales,
      userGrowth,
      avgChange,

      pendingOrders: pending,
      acceptedOrders: accepted,
      paidOrders: paid,
      shippedOrders: shipped,
      completedOrders: completed,
      cancelledOrders: cancelled,
      refundOrders: refund,
      conversionRate,
    };
  }

  // Trace point: getDefault()
  private getDefault(): AnalyticsData {
    return {
      totalSales: 0,
      ordersToday: 0,
      activeUsers: 0,
      avgOrderValue: 0,

      totalQuantity: 0,
      totalSpent: 0,
      totalOrders: 0,

      salesGrowth: 0,
      ordersYesterday: 0,
      weeklySales: [],
      userGrowth: 0,
      avgChange: 0,

      pendingOrders: 0,
      acceptedOrders: 0,
      paidOrders: 0,
      shippedOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      refundOrders: 0,
      conversionRate: 0,
    };
  }

  // Trace point: formatDate()
  formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
}

   // Trace point: generateWeeklySales()
   generateWeeklySales(): WeeklySales[] {
    const sales: WeeklySales[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);

        const dateKey = d.toISOString().split('T')[0];

        sales.push({
        date: dateKey,
        total: 0
        });
    }

    return sales;
    }

  // Trace point: filterForWeeklySales()
  filterForWeeklySales(order: Order, weeklySales: WeeklySales[]): void {
    const key = new Date(order.createdAt).toISOString().split('T')[0];
    if (!['completed', 'shipped'].includes(order.status)) {
    return;
    }
    
    const target = weeklySales.find(s => s.date === key);

    if (target) {
        target.total += Number(order.total);
    }
    }

}
