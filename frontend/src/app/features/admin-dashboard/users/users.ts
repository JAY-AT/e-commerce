import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManager } from '@common/services/managers/user/user';
import { UserCompleteDetailDTO } from '@common/dtos/user.dto';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, Observable, startWith } from 'rxjs';

type UserStatus = 'active' | 'suspended';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  status: UserStatus;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class AdminUsersComponent implements OnInit{
  users$! : Observable<UserCompleteDetailDTO[]>;
  filteredUsers$!: Observable<UserCompleteDetailDTO[]>;
  searchQuery = '';
  roleFilter: 'all' | 'admin' | 'customer' = 'all';

  private searchSubject = new BehaviorSubject<string>('');
  private roleSubject = new BehaviorSubject<'all' | 'admin' | 'customer'>('all');
  
  @Output() statusChange = new EventEmitter<{ id: string; status: UserStatus }>();

  constructor (private manager: UserManager) {}

  ngOnInit(): void {
    this.users$ = this.manager.getUsers();
    this.filteredUsers$ = combineLatest([
      this.users$,
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith(''),
      ),
      this.roleSubject,
    ]).pipe(
      map(([users, query, role]) => {
        const normalizedQuery = query.trim().toLowerCase();

        return users.filter((user) => {
          const userRole = String(user.role ?? '').toLowerCase();
          const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim().toLowerCase();
          const matchesRole = role === 'all' || userRole === role;
          const matchesSearch = !normalizedQuery || [name, user.email ?? '', userRole]
            .some((value) => value.toLowerCase().includes(normalizedQuery));

          return matchesRole && matchesSearch;
        });
      }),
    );
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  setRoleFilter(role: 'all' | 'admin' | 'customer'): void {
    this.roleFilter = role;
    this.roleSubject.next(role);
  }
}
