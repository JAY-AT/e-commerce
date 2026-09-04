import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  open: boolean;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})

export class ToastService {

  private initialState: ToastState = {
    open: false,
    message: '',
    type: 'info',
    duration: 4000
  };

  private toastSubject = new BehaviorSubject<ToastState>(this.initialState);
  toast$ = this.toastSubject.asObservable();

  private timeoutId: any;

  // Trace point: show()
  show(message: string, type: ToastType = 'info', duration = 1200): void {
    clearTimeout(this.timeoutId);

    this.toastSubject.next({
      open: true,
      message,
      type,
      duration
    });

    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  // Trace point: hide()
  hide(): void {
    clearTimeout(this.timeoutId);

    this.toastSubject.next({
      ...this.initialState
    });
  }
}