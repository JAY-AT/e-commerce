import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  UpdateUserRequestDTO,
  UserCompleteDetailDTO,
  UserDetailDTO,
  UserSummaryDTO,
} from '@common/dtos/user.dto';

export type UserSummary = UserSummaryDTO;
export type UserDetail = UserDetailDTO;
export type UpdateUserRequest = UpdateUserRequestDTO;

@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/user`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: getUsers()
  getUsers(): Observable<UserCompleteDetailDTO[]> {
    return this.http.get<UserCompleteDetailDTO[]>(this.baseUrl);
  }

  // Trace point: getUser()
  getUser(id: number | string): Observable<UserDetailDTO> {
    return this.http.get<UserDetailDTO>(`${this.baseUrl}/${id}`);
  }

  // Trace point: updateUser()
  updateUser(id: number | string, data: UpdateUserRequestDTO): Observable<UserDetailDTO> {
    return this.http.put<UserDetailDTO>(`${this.baseUrl}/${id}`, data);
  }

  // Trace point: deleteUser()
  deleteUser(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
