import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CheckoutPaymentRequestDTO,
  PaymentCheckoutResponseDTO,
} from '@common/dtos/payment.dto';

export type CheckoutPaymentRequest = CheckoutPaymentRequestDTO;
export type PaymentCheckoutResponse = PaymentCheckoutResponseDTO;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/payment`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: checkoutPayment()
  checkoutPayment(data: CheckoutPaymentRequestDTO): Observable<PaymentCheckoutResponseDTO> {
    return this.http.post<ApiResponse<PaymentCheckoutResponseDTO>>(`${this.baseUrl}/checkout`, data).pipe(
      map(response => response.data)
    );
  }

  // Trace point: getPaymentById()
  getPaymentById(id: number | string): Observable<PaymentCheckoutResponseDTO> {
    return this.http.get<ApiResponse<PaymentCheckoutResponseDTO>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }
}
