import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

import {
  CreateOrderReviewDTO,
  OrderReviewDTO,
  TopReview
} from '@common/dtos/review.dto';

export type CreateReviewRequest = CreateOrderReviewDTO;
export type Review = OrderReviewDTO;

@Injectable({
  providedIn: 'root'
})
export class ReviewApiService {

  private readonly baseUrl = `${environment.apiBaseUrl}/reviews`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  /**
   * Create review for an order
   */
  createReview(payload: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, payload);
  }

  /**
   * Get all reviews of logged-in user
   */
  getMyReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.baseUrl);
  }

  /**
   * Get all reviews of logged-in user
   */
  getTopReviews(count: number): Observable<TopReview[]> {
    return this.http.get<TopReview[]>(`${this.baseUrl}/top/${count}`);
  }

  /**
   * Get review by order ID
   */
  getReviewByOrderId(orderId: number): Observable<Review> {
    return this.http.get<Review>(`${this.baseUrl}/order/${orderId}`);
  }

  /**
   * Delete review by ID
   */
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}