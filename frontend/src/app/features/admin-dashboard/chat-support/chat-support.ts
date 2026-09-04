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

  // Trace point: constructor()
  constructor(private supportManager: SupportManager) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.threads$ = this.supportManager.threads$;
    this.activeThread$ = this.supportManager.activeThread$;
    this.supportManager.loadAdminThreads().subscribe();
  }

  // Trace point: selectThread()
  selectThread(thread: SupportThreadDTO): void {
    this.showCustomerProfile = false;
    this.mobileDetailOpen = true;
    this.supportManager.selectAdminThread(thread.id).subscribe({
      next: () => {
        this.supportManager.markThreadRead(thread.id).subscribe();
      },
    });
  }

  // Trace point: backToThreadList()
  backToThreadList(): void {
    this.mobileDetailOpen = false;
  }

  // Trace point: reply()
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

  // Trace point: closeThread()
  closeThread(activeThread: SupportThreadDTO | null): void {
    if (!activeThread) {
      return;
    }

    this.supportManager.closeThread(activeThread.id).subscribe();
  }

  // Trace point: toggleCustomerProfile()
  toggleCustomerProfile(): void {
    this.showCustomerProfile = !this.showCustomerProfile;
  }

  // Trace point: getCustomerProfileToggleLabel()
  getCustomerProfileToggleLabel(): string {
    return this.showCustomerProfile ? 'Hide profile' : 'Show profile';
  }

  // Trace point: trackByThread()
  trackByThread(_: number, thread: SupportThreadDTO): number {
    return thread.id;
  }

  // Trace point: trackByMessage()
  trackByMessage(_: number, message: SupportMessageDTO): string {
    return message.id;
  }

  // Trace point: getThreadLabel()
  getThreadLabel(thread: SupportThreadDTO): string {
    return thread.user_name || thread.user_email || `Thread #${thread.id}`;
  }

  // Trace point: getThreadPreview()
  getThreadPreview(thread: SupportThreadDTO): string {
    const lastMessage = thread.messages[thread.messages.length - 1];
    return lastMessage?.body ?? 'No messages yet';
  }

  // Trace point: setThreadFilter()
  setThreadFilter(filter: 'newest' | 'unread' | 'open'): void {
    this.threadFilter = filter;
  }

  // Trace point: filterThreads()
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

  // Trace point: getThreadInitials()
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

  // Trace point: getThreadChannel()
  getThreadChannel(thread: SupportThreadDTO): string {
    return thread.visitor_key ? 'Guest visitor' : 'Registered customer';
  }

  // Trace point: getThreadLastActivity()
  getThreadLastActivity(thread: SupportThreadDTO): string {
    return this.formatCompactDate(thread.last_message_at || thread.updated_at);
  }

  // Trace point: getThreadMessageCount()
  getThreadMessageCount(thread: SupportThreadDTO): number {
    return thread.messages.length;
  }

  // Trace point: getOpenThreadCount()
  getOpenThreadCount(threads: SupportThreadDTO[]): number {
    return threads.filter((thread) => thread.status === 'open').length;
  }

  // Trace point: getUnreadThreadCount()
  getUnreadThreadCount(threads: SupportThreadDTO[]): number {
    return threads.reduce((total, thread) => total + thread.unread_count, 0);
  }

  // Trace point: getMessageRoleLabel()
  getMessageRoleLabel(message: SupportMessageDTO): string {
    if (message.sender === 'admin') {
      return 'You';
    }

    if (message.sender === 'system') {
      return 'System';
    }

    return 'Customer';
  }

  // Trace point: getMessageAlignment()
  getMessageAlignment(message: SupportMessageDTO): 'incoming' | 'outgoing' | 'system' {
    if (message.sender === 'admin') {
      return 'outgoing';
    }

    if (message.sender === 'system') {
      return 'system';
    }

    return 'incoming';
  }

  // Trace point: getMessageTimestamp()
  getMessageTimestamp(message: SupportMessageDTO): string {
    return this.formatCompactDate(message.created_at);
  }

  // Trace point: getThreadSummary()
  getThreadSummary(thread: SupportThreadDTO): string {
    const firstCustomerMessage = thread.messages.find((message) => message.sender === 'customer');
    return firstCustomerMessage?.body ?? this.getThreadPreview(thread);
  }

  // Trace point: getThreadCreatedAt()
  getThreadCreatedAt(thread: SupportThreadDTO): string {
    return this.formatCompactDate(thread.created_at);
  }

  // Trace point: getThreadActivityLabel()
  getThreadActivityLabel(thread: SupportThreadDTO): string {
    const lastActivity = this.getThreadLastActivity(thread);
    return lastActivity ? `Last update ${lastActivity}` : 'Recently active';
  }

  // Trace point: getCustomerContactLabel()
  getCustomerContactLabel(thread: SupportThreadDTO): string {
    return thread.user_email || 'No email captured';
  }

  // Trace point: getCustomerSourceLabel()
  getCustomerSourceLabel(thread: SupportThreadDTO): string {
    return thread.visitor_key ? 'Guest session' : 'Authenticated account';
  }

  // Trace point: formatCompactDate()
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
