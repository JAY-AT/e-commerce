import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import {
  SupportMessageDTO,
  SupportThreadDTO,
} from '@common/services/api/support/support-api.service';
import { SupportManager } from '@common/services/managers/support/support';

@Component({
  selector: 'app-admin-chat-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-support.html',
  styleUrl: './chat-support.scss',
})
export class AdminChatSupportComponent implements OnInit {
  threads$!: Observable<SupportThreadDTO[]>;
  activeThread$!: Observable<SupportThreadDTO | null>;

  draftReply = '';
  searchQuery = '';
  threadFilter: 'newest' | 'unread' | 'open' = 'newest';
  showCustomerProfile = false;
  mobileDetailOpen = false;

  constructor(private supportManager: SupportManager) {}

  ngOnInit(): void {
    this.threads$ = this.supportManager.threads$;
    this.activeThread$ = this.supportManager.activeThread$;
    this.supportManager.loadAdminThreads().subscribe();
  }

  selectThread(thread: SupportThreadDTO): void {
    this.showCustomerProfile = false;
    this.mobileDetailOpen = true;
    this.supportManager.selectAdminThread(thread.id).subscribe({
      next: () => {
        this.supportManager.markThreadRead(thread.id).subscribe();
      },
    });
  }

  backToThreadList(): void {
    this.mobileDetailOpen = false;
  }

  reply(activeThread: SupportThreadDTO | null): void {
    if (!activeThread) {
      return;
    }

    this.supportManager.replyToThread(activeThread.id, this.draftReply).subscribe({
      next: (thread) => {
        this.draftReply = '';
        this.supportManager.selectAdminThread(thread.id).subscribe();
      },
    });
  }

  closeThread(activeThread: SupportThreadDTO | null): void {
    if (!activeThread) {
      return;
    }

    this.supportManager.closeThread(activeThread.id).subscribe();
  }

  toggleCustomerProfile(): void {
    this.showCustomerProfile = !this.showCustomerProfile;
  }

  getCustomerProfileToggleLabel(): string {
    return this.showCustomerProfile ? 'Hide profile' : 'Show profile';
  }

  trackByThread(_: number, thread: SupportThreadDTO): number {
    return thread.id;
  }

  trackByMessage(_: number, message: SupportMessageDTO): string {
    return message.id;
  }

  getThreadLabel(thread: SupportThreadDTO): string {
    return thread.user_name || thread.user_email || `Thread #${thread.id}`;
  }

  getThreadPreview(thread: SupportThreadDTO): string {
    const lastMessage = thread.messages[thread.messages.length - 1];
    return lastMessage?.body ?? 'No messages yet';
  }

  setThreadFilter(filter: 'newest' | 'unread' | 'open'): void {
    this.threadFilter = filter;
  }

  filterThreads(threads: SupportThreadDTO[]): SupportThreadDTO[] {
    const query = this.searchQuery.trim().toLowerCase();
    const filtered = threads.filter((thread) => {
      if (this.threadFilter === 'unread' && thread.unread_count === 0) {
        return false;
      }

      if (this.threadFilter === 'open' && thread.status !== 'open') {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        this.getThreadLabel(thread),
        thread.user_email ?? '',
        thread.visitor_key ?? '',
        thread.status,
        this.getThreadPreview(thread),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });

    return filtered.sort((left, right) => {
      const leftTime = new Date(left.last_message_at || left.updated_at).getTime();
      const rightTime = new Date(right.last_message_at || right.updated_at).getTime();
      return rightTime - leftTime;
    });
  }

  getThreadInitials(thread: SupportThreadDTO): string {
    const source = this.getThreadLabel(thread).trim();
    if (!source) {
      return 'S';
    }

    const parts = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
  }

  getThreadChannel(thread: SupportThreadDTO): string {
    return thread.visitor_key ? 'Guest visitor' : 'Registered customer';
  }

  getThreadLastActivity(thread: SupportThreadDTO): string {
    return this.formatCompactDate(thread.last_message_at || thread.updated_at);
  }

  getThreadMessageCount(thread: SupportThreadDTO): number {
    return thread.messages.length;
  }

  getOpenThreadCount(threads: SupportThreadDTO[]): number {
    return threads.filter((thread) => thread.status === 'open').length;
  }

  getUnreadThreadCount(threads: SupportThreadDTO[]): number {
    return threads.reduce((total, thread) => total + thread.unread_count, 0);
  }

  getMessageRoleLabel(message: SupportMessageDTO): string {
    if (message.sender === 'admin') {
      return 'You';
    }

    if (message.sender === 'system') {
      return 'System';
    }

    return 'Customer';
  }

  getMessageAlignment(message: SupportMessageDTO): 'incoming' | 'outgoing' | 'system' {
    if (message.sender === 'admin') {
      return 'outgoing';
    }

    if (message.sender === 'system') {
      return 'system';
    }

    return 'incoming';
  }

  getMessageTimestamp(message: SupportMessageDTO): string {
    return this.formatCompactDate(message.created_at);
  }

  getThreadSummary(thread: SupportThreadDTO): string {
    const firstCustomerMessage = thread.messages.find((message) => message.sender === 'customer');
    return firstCustomerMessage?.body ?? this.getThreadPreview(thread);
  }

  getThreadCreatedAt(thread: SupportThreadDTO): string {
    return this.formatCompactDate(thread.created_at);
  }

  getThreadActivityLabel(thread: SupportThreadDTO): string {
    const lastActivity = this.getThreadLastActivity(thread);
    return lastActivity ? `Last update ${lastActivity}` : 'Recently active';
  }

  getCustomerContactLabel(thread: SupportThreadDTO): string {
    return thread.user_email || 'No email captured';
  }

  getCustomerSourceLabel(thread: SupportThreadDTO): string {
    return thread.visitor_key ? 'Guest session' : 'Authenticated account';
  }

  private formatCompactDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
}
