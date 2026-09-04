import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateOrderRequestDTO,
  OrderDetailDTO,
  OrderStatusDTO,
  OrderSummaryDTO,
  UpdateOrderStatusRequestDTO,
} from '@common/dtos/order.dto';

export type OrderStatus = OrderStatusDTO;
export type OrderSummary = OrderSummaryDTO;
export type OrderDetail = OrderDetailDTO;
export type CreateOrderRequest = CreateOrderRequestDTO;
export type UpdateOrderStatusRequest = UpdateOrderStatusRequestDTO;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface OrderQrCodeResponse {
  orderId: number | string;
  paymentUrl: string;
  qrCode: string;
  mimeType: string;
  total_amount?: number;
}

export interface ConfirmOrderPaymentResponse {
  orderId: number | string;
  status: OrderStatusDTO;
  message?: string;
  order?: OrderDetailDTO;
}

@Injectable({
  providedIn: 'root'
})
export class OrderApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/orders`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: getOrders()
  getOrders(): Observable<OrderSummaryDTO[]> {
    return this.http.get<ApiResponse<OrderSummaryDTO[]>>(this.baseUrl).pipe(
      map(response => response.data)
    );
  }

  // Trace point: getAllOrders()
  getAllOrders(): Observable<OrderSummaryDTO[]> {
    return this.http.get<ApiResponse<OrderSummaryDTO[]>>(`${this.baseUrl}/all`).pipe(
      map(response => response.data)
    );
  }

  // Trace point: getOrderById()
  getOrderById(id: number | string): Observable<OrderDetailDTO> {
    return this.http.get<ApiResponse<OrderDetailDTO>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Trace point: getOrderQrCode()
  getOrderQrCode(id: number | string): Observable<OrderQrCodeResponse> {
    return this.http.get<ApiResponse<OrderQrCodeResponse>>(`${this.baseUrl}/public/${id}/qrcode`).pipe(
      map(response => response.data)
    );
  }

  // Trace point: confirmOrderPayment()
  confirmOrderPayment(id: number | string): Observable<ConfirmOrderPaymentResponse> {
    return this.http.post<ApiResponse<ConfirmOrderPaymentResponse>>(`${this.baseUrl}/${id}/confirm-payment`, {}).pipe(
      map(response => response.data)
    );
  }

  // Trace point: createOrder()
  createOrder(data: CreateOrderRequestDTO): Observable<OrderDetailDTO> {
    return this.http.post<ApiResponse<OrderDetailDTO>>(this.baseUrl, data).pipe(
      map(response => response.data)
    );
  }

  // Trace point: updateOrderStatus()
  updateOrderStatus(id: number | string, data: UpdateOrderStatusRequestDTO): Observable<OrderDetailDTO> {
    return this.http.put<ApiResponse<OrderDetailDTO>>(`${this.baseUrl}/${id}/status`, data).pipe(
      map(response => response.data)
    );
  }
}
