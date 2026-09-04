import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();

  // Trace point: constructor()
  constructor() {
    // Check localStorage and system preference
    const stored = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? JSON.parse(stored) : prefersDark;

    this.setDarkMode(isDark);
  }

  // Trace point: toggleDarkMode()
  toggleDarkMode(): void {
    this.setDarkMode(!this.darkModeSubject.value);
  }

  // Trace point: setDarkMode()
  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    localStorage.setItem('darkMode', JSON.stringify(isDark));

    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  // Trace point: isDarkMode()
  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
