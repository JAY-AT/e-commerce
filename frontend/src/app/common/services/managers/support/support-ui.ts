import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupportUiManager {
  private readonly openSubject = new BehaviorSubject(false);
  readonly open$ = this.openSubject.asObservable();

  // Trace point: open()
  open(): void {
    this.openSubject.next(true);
  }

  // Trace point: close()
  close(): void {
    this.openSubject.next(false);
  }

  // Trace point: toggle()
  toggle(): void {
    this.openSubject.next(!this.openSubject.value);
  }
}
