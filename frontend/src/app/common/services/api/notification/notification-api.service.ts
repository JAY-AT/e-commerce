import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface NotificationDTO {
  id: number;
  type: 'order' | 'payment' | 'system';
  target_role: 'customer' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateAdminNotificationDTO {
  target_role: 'admin';
  type: 'order' | 'payment' | 'system';
  message: string;
}

export interface CreateUserNotificationDTO {
  target_role: 'customer';
  user_id: number | null;
  type: 'order' | 'payment' | 'system';
  message: string;
}

export interface BulkNotificationResponse {
  message: string;
  updatedCount?: number;
  deletedCount?: number;
}

export type CreateNotificationRequestDTO =
  | CreateAdminNotificationDTO
  | CreateUserNotificationDTO;

@Injectable({
  providedIn: 'root',
})
export class NotificationApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/notifications`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: getUserNotifications()
  getUserNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<NotificationDTO[]>(`${this.baseUrl}/user`);
  }

  // Trace point: getAdminNotifications()
  getAdminNotifications(): Observable<NotificationDTO[]> {
    return this.http.get<NotificationDTO[]>(`${this.baseUrl}/admin`);
  }

  // Trace point: getNotification()
  getNotification(id: number | string): Observable<NotificationDTO> {
    return this.http.get<NotificationDTO>(`${this.baseUrl}/${id}`);
  }

  // Trace point: createNotification()
  createNotification(data: CreateNotificationRequestDTO): Observable<NotificationDTO> {
    return this.http.post<NotificationDTO>(this.baseUrl, data);
  }

  // Trace point: markAsRead()
  markAsRead(id: number | string): Observable<NotificationDTO> {
    return this.http.patch<NotificationDTO>(`${this.baseUrl}/${id}/read`, {});
  }

  // Trace point: markAllAsRead()
  markAllAsRead(): Observable<BulkNotificationResponse> {
    return this.http.patch<BulkNotificationResponse>(`${this.baseUrl}/read-all`, {});
  }

  // Trace point: deleteNotification()
  deleteNotification(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Trace point: deleteAllNotifications()
  deleteAllNotifications(): Observable<BulkNotificationResponse> {
    return this.http.delete<BulkNotificationResponse>(`${this.baseUrl}/all`);
  }
}
