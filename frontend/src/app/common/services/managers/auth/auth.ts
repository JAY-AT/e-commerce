import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, throwError } from 'rxjs';
import {
  AuthApiService,
  AuthSession,
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
} from '@common/services/api/auth/auth-api.service';

export interface User {
  id: string;
  email: string;
  type: 'customer' | 'admin';
  name: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

const ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const CURRENT_USER_KEY = 'currentUser';

@Injectable({
  providedIn: 'root',
})
export class AuthManager {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable(); 

  constructor(private authApi: AuthApiService) {
    this.restoreSession();
  }

  login(email: string, password: string, type: 'customer' | 'admin'): Observable<User> {
    const request: LoginRequest = { email, password };

    return this.authApi.login(request).pipe(
      tap(session => this.persistSession(session)),
      map(session => this.mapSessionUser(session, type))
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.authApi.register(data).pipe(
      tap(session => this.persistSession(session)),
      map(session => this.mapSessionUser(session, 'customer'))
    );
  }

  refresh(): Observable<User> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshRequest = { refresh_token: refreshToken };

    return this.authApi.refresh(request).pipe(
      tap(session => this.persistSession(session)),
      map(session => this.mapSessionUser(session, this.getUserType() ?? 'customer'))
    );
  }

  logout(): void {
    const user = this.currentUserSubject.value;
    this.clearSession();

    this.authApi.logout().subscribe({
      error: () => {
        // Session is already cleared locally.
      },
    });
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('cart');
    this.currentUserSubject.next(null);
    this.dispatchAuthEvent('logout');
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && this.getAccessToken() !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserType(): 'customer' | 'admin' | null {
    return this.currentUserSubject.value?.type || null;
  }

  updateCurrentUser(user: Partial<User>): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...user };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }

  private restoreSession(): void {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(storedUser));
      } catch {
        this.clearSession();
      }
    }
  }

  private persistSession(session: AuthSession): void {
    const user = this.mapSessionUser(session, session.user.role === 'admin' ? 'admin' : 'customer');

    localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
    localStorage.setItem(LEGACY_ACCESS_TOKEN_KEY, session.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.dispatchAuthEvent('session-changed');
  }

  private mapSessionUser(session: AuthSession, fallbackType: 'customer' | 'admin'): User {
    const mappedType = session.user.role === 'admin' ? 'admin' : fallbackType;

    return {
      id: String(session.user.id),
      email: session.user.email,
      type: mappedType,
      name: `${session.user.first_name} ${session.user.last_name}`.trim(),
      phone: session.user.phone ?? undefined,
      addressLine1: session.user.address_line ?? undefined,
      city: session.user.city ?? undefined,
      state: session.user.state ?? undefined,
      postalCode: session.user.postal_code ?? undefined,
    };
  }

  private dispatchAuthEvent(name: 'logout' | 'session-changed'): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.dispatchEvent(new CustomEvent(`auth:${name}`));
  }

  public getRole(): 'customer' | 'admin' | null {
    console.log('currentUser', this.currentUserSubject.value);
    console.log('user',localStorage.getItem(CURRENT_USER_KEY));
    return this.currentUserSubject.value?.type === 'admin' ? 'admin' : this.currentUserSubject.value?.type === 'customer' ? 'customer' : null;
  }

}
