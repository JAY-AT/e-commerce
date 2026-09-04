import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { CartItem } from '../cart/cart';
import {
  CreateOrderRequest,
  OrderApiService,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  UpdateOrderStatusRequest,
} from '@common/services/api/order/order-api.service';
import { OrderDetailDTO, OrderSummaryDTO } from '@common/dtos/order.dto';
import { OrderMapper } from './mapper/order.mapper';
import { createTracker } from './tracking';
import { NotificationManager } from '../notification/notification.manager';

export interface OrderItem {
  id: string | number;
  product: {
    id: string | number;
    name: string;
    price: number;
  };
  quantity: number;
  subtotal: number;
}
export interface OrderData {
  totalQuantity: number;
  totalSpent: number;
  totalOrders: number;
}

export interface OrderTracking {
    label: string,
    status: 'pending' | 'current' | 'done',
    date?: string | null
}
export interface OrderReview {
  rating: number,
  comment: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  tracking?: OrderTracking[] | null;
  review?: OrderReview | null;
  total: number;
  status: OrderStatus;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  createdAt: string;
  shippingAddr?: string;
}

@Injectable({
  providedIn: 'root',
})

export class OrderManager {
  private isLoaded = false;
  private readonly orderDataSubject = new BehaviorSubject<OrderData>({
    totalQuantity: 0,
    totalSpent: 0,
    totalOrders: 0,
  });

  readonly orderData$ = this.orderDataSubject.asObservable(); 

  private readonly orderSubject = new BehaviorSubject<Order[]>([]);
  readonly orders$ = this.orderSubject.asObservable();

  private readonly orderFullSubject = new BehaviorSubject<Order[]>([]);
  readonly orderFull$ = this.orderFullSubject.asObservable();

  // Trace point: constructor()
  constructor(private api: OrderApiService, private notifManager: NotificationManager) {}

  // INITITALIZE THE SOURCE OF TRUTHS
  adminLoad(forceRefresh = false): void {
    if (this.isLoaded && !forceRefresh) return;

    this.api.getAllOrders().pipe(
      tap(orders => {
        this.orderSubject.next(orders.map(order => this.mapSummary(order)));
        this.isLoaded = true;
      }),

      switchMap(orders => {
        const requests = orders.map(order =>
          this.api.getOrderById(order.id)
        );

        return forkJoin(requests);
      }),

      tap(fullOrders => {
        const mappedOrders = fullOrders.map(order => this.mapDetail(order));
        this.orderFullSubject.next(mappedOrders);
        const orderData = this.computeOrderData(mappedOrders);
        this.orderDataSubject.next(orderData);
      })
    ).subscribe();
  }
  
  // Trace point: userLoad()
  userLoad(forceRefresh = false): void {
    
    if (this.isLoaded && !forceRefresh) return;
    this.api.getOrders().pipe(
      tap(orders => {
        const mapped = orders.map(order => this.mapSummary(order));
        this.orderSubject.next(mapped);
        this.isLoaded = true;
      }),

      switchMap(orders => {
        const requests = orders.map(order =>
          this.api.getOrderById(order.id)
        );

        return forkJoin(requests);
      }),

      tap(fullOrders => {
        const mappedOrders = fullOrders.map(order => this.mapDetail(order));
        this.orderFullSubject.next(mappedOrders);
        const orderData = this.computeOrderData(mappedOrders);
        this.orderDataSubject.next(orderData);
      })
    ).subscribe();
  }

  // Trace point: refreshOrder()
  public refreshOrder(id: string | number): Observable<Order> {
    return this.api.getOrderById(String(id)).pipe(
      map(order => this.mapDetail(order)),

      tap((updatedOrder: Order) => {
        const currentOrders = this.orderFullSubject.value;

        const updatedOrders = currentOrders.map(order =>
          String(order.id) === String(updatedOrder.id)
            ? updatedOrder
            : order
        );
        const exists = currentOrders.some(
          order => String(order.id) === String(updatedOrder.id)
        );

        if (!exists) {
          updatedOrders.push(updatedOrder);
        }
        
        this.orderFullSubject.next(updatedOrders);

        // Recompute aggregated stats
        const orderData = this.computeOrderData(updatedOrders);
        this.orderDataSubject.next(orderData);
      })
    );
  } 

  // Trace point: getDetailedOrder()
  public getDetailedOrder() : Observable<Order[]> {
    this.adminLoad();

    return this.orderFull$;
  }

  // Trace point: mapSummary()
  private mapSummary(order: OrderSummary): Order {
    return {
      id: String(order.id),
      userId: String(order.user_id ?? ''),
      items: order.items,
      total: order.total_amount,
      status: order.status,
      paymentMethod: order.payment_method ?? null,
      paymentStatus: order.payment_status ?? null,
      createdAt: order.created_at,
    };
  }

  // Trace point: mapDetail()
  private mapDetail(order: OrderDetail): Order {
    return {
      id: String(order.id),
      userId: String(order.user_id),
      items: order.items.map(item => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      review: order.review,
      tracking: createTracker(order.status),
      total: order.total_amount,
      status: order.status,
      paymentMethod: order.payment_method ?? null,
      paymentStatus: order.payment_status ?? null,
      createdAt: order.created_at,
      shippingAddr: order.shipping_addr,
    };
  }

  // Trace point: placeOrder()
  placeOrder(_userId: string, _items: CartItem[], shippingAddr: string): Observable<Order> {
    const request: CreateOrderRequest = {
      shipping_addr: shippingAddr,
    };

    return this.api.createOrder(request).pipe(
      tap(order => {
        this.orderFullSubject.next([
          ...this.orderFullSubject.value,
          this.mapDetail(order)
        ]);
      }),
      map(order => this.mapDetail(order))
    );
  }

  // Trace point: getAllOrders()
  getAllOrders(): Observable<Order[]> {
    return this.orderFull$;
  }

  // Trace point: getOrderById()
  getOrderById(orderId: string): Observable<Order> {
    return this.api.getOrderById(orderId).pipe(
      map(order => this.mapDetail(order))
    );
  }

  // Trace point: getOrderData()
  getOrderData(): Observable<OrderData> {
    this.adminLoad();
    return this.orderData$;
  }

  // Trace point: updateOrderStatus()
  updateOrderStatus(orderId: string, status: Order['status']): Observable<Order> {
    const request: UpdateOrderStatusRequest = { status };

    return this.api.updateOrderStatus(orderId, request).pipe(
      map(order => this.mapDetail(order)),

      tap(updatedOrder => {
        console.log(updatedOrder);
        const current = this.orderFullSubject.value;
        const updatedList = current.map(o =>
          o.id === updatedOrder.id ? updatedOrder : o
        );
        this.orderFullSubject.next(updatedList);
      })
    );
  }

  // Trace point: computeOrderData()
  private computeOrderData(orders: Order[]): OrderData {
    let totalQuantity = 0;
    let totalSpent = 0;

    orders.forEach(order => {
      if (order.status === 'completed' || order.status === 'shipped') {
        totalSpent += Number(order.total);
      }

      order.items.forEach(item => {
        totalQuantity += item.quantity;
      });
    });

    console.log('CUR: ',totalSpent);
    console.log('CUR: ',totalQuantity);
    return {
      totalQuantity,
      totalSpent,
      totalOrders: orders.length,
    };
  }

  // Trace point: clearState()
  clearState(): void {
    // Reset loading flag
    this.isLoaded = false;

    // Clear all cached orders
    this.orderSubject.next([]);
    this.orderFullSubject.next([]);

    // Reset aggregated data
    this.orderDataSubject.next({
      totalQuantity: 0,
      totalSpent: 0,
      totalOrders: 0,
  });
}
}
