import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  AuthSessionDTO,
  AuthUserDTO,
  LoginRequestDTO,
  RefreshRequestDTO,
  RegisterRequestDTO,
} from '@common/dtos/auth.dto';

export type AuthUser = AuthUserDTO;
export type AuthSession = AuthSessionDTO;
export type LoginRequest = LoginRequestDTO;
export type RegisterRequest = RegisterRequestDTO;
export type RefreshRequest = RefreshRequestDTO;

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: register()
  register(data: RegisterRequestDTO): Observable<AuthSessionDTO> {
    return this.http.post<AuthSessionDTO>(`${this.baseUrl}/register`, data, {
      withCredentials: true,
    });
  }

  // Trace point: login()
  login(data: LoginRequestDTO): Observable<AuthSessionDTO> {
    return this.http.post<AuthSessionDTO>(`${this.baseUrl}/login`, data, {
      withCredentials: true,
    });
  }

  // Trace point: logout()
  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}, {
      withCredentials: true,
    });
  }

  // Trace point: me()
  me(): Observable<AuthUserDTO> {
    return this.http.get<AuthUserDTO>(`${this.baseUrl}/me`);
  }

  // Trace point: refresh()
  refresh(data: RefreshRequestDTO): Observable<AuthSessionDTO> {
    return this.http.post<AuthSessionDTO>(`${this.baseUrl}/refresh`, data, {
      withCredentials: true,
    });
  }
}
