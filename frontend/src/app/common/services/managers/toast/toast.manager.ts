import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  open: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastManager {
  private toastSubject = new BehaviorSubject<ToastData | null>(null);

  toast$ = this.toastSubject.asObservable();

  // Trace point: show()
  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 700) {
    this.toastSubject.next({
      message,
      type,
      duration,
      open: true,
    });
  }

  // Trace point: success()
  success(message: string) {
    this.show(message, 'success');
  }

  // Trace point: error()
  error(message: string) {
    this.show(message, 'error');
  }

  // Trace point: info()
  info(message: string) {
    this.show(message, 'info');
  }

  // Trace point: clear()
  clear() {
    this.toastSubject.next(null);
  }
}