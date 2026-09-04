import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Order, OrderManager } from '@common/services/managers/order/order';
import { ReviewManager } from '@common/services/managers/review/review';
import { CreateReviewRequest } from '@common/services/api/review/review-api.service';
import { ToastManager } from '@common/services/managers/toast/toast.manager';
import { delay, finalize } from 'rxjs';
import { OrderStatusDTO } from '@common/dtos/order.dto';


@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-card.html',
  styleUrl: './order-card.scss',
})
export class OrderCardComponent {

  @Input() order!: Order;

  @Output() received = new EventEmitter<string>();
  @Output() pay = new EventEmitter<{ id: string; amount: number }>();

  reviewRating = 0;
  reviewComment = '';
  hoverRating = 0;
  paymentAmount: number | null = null;
  isLoading = signal(false);

  isExpanded = true; 
  // Trace point: constructor()
  constructor (private manager: ReviewManager, private toast: ToastManager, private orderManager: OrderManager) {}

  // Trace point: toggle()
  toggle(): void {
    this.isExpanded = !this.isExpanded;
  }

  // Trace point: isPaymentValid()
  get isPaymentValid(): boolean {
    return (
      this.paymentAmount !== null &&
      this.paymentAmount >= this.order.total
    );
  }

  // Trace point: paymentMethodLabel()
  get paymentMethodLabel(): string {
    switch (this.order.paymentMethod) {
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

  // Trace point: receivedOrder()
  receivedOrder() : void {
    return this.updateOrder('completed');
  }

  // Trace point: cancelOrder()
  cancelOrder() : void {
    return this.updateOrder('cancelled');
  }

  // Trace point: returnOrder()
  returnOrder() : void {
    return this.updateOrder('refund');
  }

  
  // Trace point: updateOrder()
  updateOrder(status: OrderStatusDTO): void {
    this.orderManager.updateOrderStatus(this.order.id, status).pipe(
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

  // Trace point: payOrder()
  payOrder(): void {
    if (!this.isPaymentValid) return;

    this.pay.emit({
      id: this.order.id,
      amount: this.paymentAmount!
    });

    this.paymentAmount = null;
  }

  // Trace point: setRating()
  setRating(value: number) {
    this.reviewRating = value;
  }

  // Trace point: submitReview()
  submitReview() {
    if (!this.order.review && this.reviewRating > 0) {

      this.isLoading.set(true);

      const payload: CreateReviewRequest = {
        order_id: Number(this.order.id),
        rating: this.reviewRating,
        comment: this.reviewComment
      };

      this.manager.createReview(payload).pipe(
        finalize(() => {
          this.isLoading.set(false);
        })
      ).subscribe({
        next: () => {
          this.toast.success('Successfully submitted review');
          this.order = {
          ...this.order,
          review: {
            rating: this.reviewRating,
            comment: this.reviewComment
          }
        };

        this.reviewRating = 0;
        this.reviewComment = '';
          
        },
        error: () => {
          this.toast.error('Failed to submit review');
        }
      });

    }
} 
}
