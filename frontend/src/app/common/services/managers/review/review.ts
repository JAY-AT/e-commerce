import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { CreateReviewRequest, ReviewApiService } from '../../api/review/review-api.service';
import { TopReview } from '@common/dtos/review.dto';
import { OrderReviewDTO } from '@common/dtos/order.dto';

@Injectable({
  providedIn: 'root',
})
export class ReviewManager {

  private isLoaded = false;

  // =========================
  // STATE
  // =========================
  private readonly reviewSubject = new BehaviorSubject<OrderReviewDTO[]>([]);
  topReviewLoaded = false;
  readonly reviews$ = this.reviewSubject.asObservable();

  private readonly selectedReviewSubject = new BehaviorSubject<OrderReviewDTO | null>(null);
  readonly selectedReview$ = this.selectedReviewSubject.asObservable();

  private readonly topReviewsSubject = new BehaviorSubject<TopReview[]>([]);
  readonly topReviews$ = this.topReviewsSubject.asObservable();
  
  REVIEW_COUNT = 3;

  // Trace point: constructor()
  constructor(private api: ReviewApiService) {}

  // =========================
  // LOAD REVIEWS (lazy)
  // =========================
  private load(): void {
    if (this.isLoaded) return;

    this.api.getMyReviews().pipe(
      tap(reviews => {
        this.reviewSubject.next(reviews);
        this.isLoaded = true;
      })
    ).subscribe();
  }

  // =========================
  // GET ALL REVIEWS
  // =========================
  getReviews(): Observable<OrderReviewDTO[]> {
    this.load();
    return this.reviews$;
  }

  // =========================
  // GET TOP REVIEWS
  // ========================
  loadTopReviews(): void{
    if (!this.topReviewLoaded) {
      this.api.getTopReviews(this.REVIEW_COUNT).pipe(
        tap(topReviews => {
          this.topReviewsSubject.next(topReviews);
          this.topReviewLoaded = true;
          console.log(this.topReviewsSubject.value);
        })
      ).subscribe();
    }
  }

  // =========================
  // CREATE REVIEW
  // =========================
  createReview(payload: CreateReviewRequest): Observable<OrderReviewDTO> {
    return this.api.createReview(payload).pipe(
      tap(newReview => {
        const current = this.reviewSubject.value;

        this.reviewSubject.next([
          newReview,
          ...current
        ]);
      })
    );
  }

  // =========================
  // GET BY ORDER ID
  // =========================
  getReviewByOrderId(orderId: number): Observable<OrderReviewDTO | undefined> {
    return this.reviews$.pipe(
      map(reviews => reviews.find(r => (r as any).order_id === orderId))
    );
  }

  // =========================
  // SELECT REVIEW
  // =========================
  selectReview(orderId: number): Observable<OrderReviewDTO> {
    return this.api.getReviewByOrderId(orderId).pipe(
      tap(review => this.selectedReviewSubject.next(review))
    );
  }

  // Trace point: getSelectedReview()
  getSelectedReview(): Observable<OrderReviewDTO | null> {
    return this.selectedReview$;
  }

  // =========================
  // DELETE REVIEW
  // =========================
  deleteReview(id: number): Observable<void> {
    return this.api.deleteReview(id).pipe(
      tap(() => {
        const updated = this.reviewSubject.value.filter(r => r.id !== id);
        this.reviewSubject.next(updated);

        if (this.selectedReviewSubject.value?.id === id) {
          this.selectedReviewSubject.next(null);
        }
      })
    );
  }

  // =========================
  // FILTER: BY RATING
  // =========================
  filterByRating(rating: number): Observable<OrderReviewDTO[]> {
    return this.reviews$.pipe(
      map(reviews => reviews.filter(r => r.rating === rating))
    );
  }

  // =========================
  // CHECK IF ORDER HAS REVIEW
  // =========================
  hasReview(orderId: number): Observable<boolean> {
    return this.reviews$.pipe(
      map(reviews => reviews.some(r => (r as any).order_id === orderId))
    );
  }
}