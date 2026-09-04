import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastManager, ToastData } from '@common/services/managers/toast/toast.manager';
import { Toast } from './toast/toast';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, Toast],
  template: `
    <app-toast
      *ngIf="toast$ | async as toast"
      [message]="toast?.message || ''"
      [type]="toast?.type || 'info'"
      [duration]="toast?.duration || 4000"
      [open]="toast?.open ?? false"
      (closed)="handleClose()"
    ></app-toast>
  `,
})
export class ToastContainer {
  toast$: Observable<ToastData | null>;

  // Trace point: constructor()
  constructor(private toastService: ToastManager) {
    this.toast$ = this.toastService.toast$;
  }

  // Trace point: handleClose()
  handleClose() {
    this.toastService.clear();
  }
}