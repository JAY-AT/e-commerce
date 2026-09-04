import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationManager } from '@common/services/managers/notification/notification.manager';
import { NotificationDTO } from '@common/services/api/notification/notification-api.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe, CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.scss']
})
export class NotificationComponent implements OnInit {

  notifications$!: Observable<NotificationDTO[]>;
  notifCount$!: Observable<number>;
  noUnread = signal(false);
  @Output() close = new EventEmitter<void>();
  
  // Trace point: constructor()
  constructor(private notificationManager: NotificationManager) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.notifications$ = this.notificationManager.getNotifications();
    this.notifCount$ = this.notificationManager.getUnreadCount();
  }

  // Trace point: markAsRead()
  markAsRead(id: number): void {
    this.notificationManager.markAsRead(id);
  }

  // Trace point: markAllAsRead()
  markAllAsRead(): void {
    this.notificationManager.markAllAsRead();
  }

  // Trace point: deleteNotification()
  deleteNotification(id: number): void {
    this.notificationManager.deleteNotification(id);
  }

  // Trace point: deleteAllNotifications()
  deleteAllNotifications(): void {
    this.notificationManager.deleteAllNotifications();
  }

  // Trace point: getUnreadCount()
  getUnreadCount(): Observable<number> {
    return this.notificationManager.getUnreadCount();
  }
}
