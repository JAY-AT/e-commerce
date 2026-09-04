import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaymentApiService,
  PaymentCheckoutResponse,
  CheckoutPaymentRequest,
} from '@common/services/api/payment/payment-api.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentManager {
  // Trace point: constructor()
  constructor(private api: PaymentApiService) {}

  // Trace point: checkoutPayment()
  checkoutPayment(data: CheckoutPaymentRequest): Observable<PaymentCheckoutResponse> {
    return this.api.checkoutPayment(data);
  }

  // Trace point: getPaymentById()
  getPaymentById(id: number | string): Observable<PaymentCheckoutResponse> {
    return this.api.getPaymentById(id);
  }
}
