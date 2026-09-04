import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface SupportMessageDTO {
  id: string;
  sender: 'customer' | 'admin' | 'system';
  author_name: string;
  body: string;
  created_at: string;
}

export interface SupportThreadDTO {
  id: number;
  user_id: number | null;
  visitor_key: string | null;
  user_name: string;
  user_email: string | null;
  status: 'open' | 'closed';
  unread_count: number;
  messages: SupportMessageDTO[];
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessageRequestDTO {
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupportApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/support`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: getMyThread()
  getMyThread(): Observable<SupportThreadDTO | null> {
    return this.http.get<ApiResponse<SupportThreadDTO | null>>(`${this.baseUrl}/me`).pipe(
      map((response) => response.data)
    );
  }

  // Trace point: sendMyMessage()
  sendMyMessage(data: SupportMessageRequestDTO): Observable<SupportThreadDTO> {
    return this.http.post<ApiResponse<SupportThreadDTO>>(`${this.baseUrl}/me/messages`, data).pipe(
      map((response) => response.data)
    );
  }

  // Trace point: getVisitorThread()
  getVisitorThread(visitorKey: string): Observable<SupportThreadDTO | null> {
    return this.http.get<ApiResponse<SupportThreadDTO | null>>(
      `${this.baseUrl}/guest/${visitorKey}`
    ).pipe(map((response) => response.data));
  }

  // Trace point: sendVisitorMessage()
  sendVisitorMessage(visitorKey: string, data: SupportMessageRequestDTO): Observable<SupportThreadDTO> {
    return this.http.post<ApiResponse<SupportThreadDTO>>(
      `${this.baseUrl}/guest/${visitorKey}/messages`,
      data
    ).pipe(map((response) => response.data));
  }

  // Trace point: getAdminThreads()
  getAdminThreads(): Observable<SupportThreadDTO[]> {
    return this.http.get<ApiResponse<SupportThreadDTO[]>>(`${this.baseUrl}/admin/threads`).pipe(
      map((response) => response.data)
    );
  }

  // Trace point: getAdminThread()
  getAdminThread(id: number | string): Observable<SupportThreadDTO> {
    return this.http.get<ApiResponse<SupportThreadDTO>>(`${this.baseUrl}/admin/threads/${id}`).pipe(
      map((response) => response.data)
    );
  }

  // Trace point: replyAdminThread()
  replyAdminThread(id: number | string, data: SupportMessageRequestDTO): Observable<SupportThreadDTO> {
    return this.http.post<ApiResponse<SupportThreadDTO>>(
      `${this.baseUrl}/admin/threads/${id}/reply`,
      data
    ).pipe(map((response) => response.data));
  }

  // Trace point: markAdminThreadRead()
  markAdminThreadRead(id: number | string): Observable<SupportThreadDTO> {
    return this.http.patch<ApiResponse<SupportThreadDTO>>(
      `${this.baseUrl}/admin/threads/${id}/read`,
      {}
    ).pipe(map((response) => response.data));
  }

  // Trace point: closeAdminThread()
  closeAdminThread(id: number | string): Observable<SupportThreadDTO> {
    return this.http.patch<ApiResponse<SupportThreadDTO>>(
      `${this.baseUrl}/admin/threads/${id}/close`,
      {}
    ).pipe(map((response) => response.data));
  }
}
