import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManager } from '@common/services/managers/user/user';
import { UpdateUserRequestDTO, UserCompleteDetailDTO } from '@common/dtos/user.dto';
import { Observable } from 'rxjs';

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
  
  @Output() statusChange = new EventEmitter<{ id: string; status: UserStatus }>();

  constructor (private manager: UserManager) {}

  ngOnInit(): void {
    this.users$ = this.manager.getUsers();
  }
}
