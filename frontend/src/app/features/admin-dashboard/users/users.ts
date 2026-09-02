import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManager } from '@common/services/managers/user/user';
import { UserCompleteDetailDTO } from '@common/dtos/user.dto';

type UserStatus = 'active' | 'suspended';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class AdminUsersComponent implements OnInit {
  allUsers: UserCompleteDetailDTO[] = [];
  searchTerm = '';

  @Output() statusChange = new EventEmitter<{ id: string; status: UserStatus }>();

  constructor(private manager: UserManager) {}

  ngOnInit(): void {
    this.manager.getUsers().subscribe((users) => {
      this.allUsers = users;
    });
  }

  get visibleUsers(): UserCompleteDetailDTO[] {
    return this.filterUsers(this.allUsers, this.searchTerm);
  }

  filterUsers(users: UserCompleteDetailDTO[] = [], search: string): UserCompleteDetailDTO[] {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim().toLowerCase();
      const email = (user.email ?? '').toLowerCase();
      const role = (user.role ?? '').toLowerCase();

      return fullName.includes(term) || email.includes(term) || role.includes(term);
    });
  }
}
