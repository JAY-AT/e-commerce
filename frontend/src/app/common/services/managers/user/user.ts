import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  UserApiService,
  UpdateUserRequest,
  UserDetail,
  UserSummary,
} from '@common/services/api/user/user-api.service';
import { UpdateUserRequestDTO, UserCompleteDetailDTO } from '@common/dtos/user.dto';

@Injectable({
  providedIn: 'root',
})
export class UserManager {
  private isLoaded = false;
  private readonly usersSubject = new BehaviorSubject<UserCompleteDetailDTO[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  // Trace point: constructor()
  constructor(private api: UserApiService) {}

  // Trace point: refresh()
  refresh(): void {
    this.api.getUsers().subscribe({
      next: (users) => {
        this.usersSubject.next(users);
        this.isLoaded = true;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
  
  // Trace point: load()
  load(): void {
    if (this.isLoaded) return;

    this.refresh();
  }

  // Trace point: getUsers()
  getUsers() : Observable<UserCompleteDetailDTO[]> {
    this.load();

    return this.usersSubject;
  }

  // Trace point: getUser()
  getUser(id: number | string): Observable<UserDetail> {
    return this.api.getUser(id);
  }

  // Trace point: updateUser()
  updateUser(id: number | string, data: UpdateUserRequest): Observable<UserDetail> {
    return this.api.updateUser(id, data);
  }

  // Trace point: deleteUser()
  deleteUser(id: number | string): Observable<void> {
    return this.api.deleteUser(id);
  }
}
