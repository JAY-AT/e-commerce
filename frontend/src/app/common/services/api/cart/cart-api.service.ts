import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  AddCartItemRequestDTO,
  CartDetailDTO,
  CartProductItemDTO,
  RemoveCartItemRequestDTO,
  UpdateCartItemRequestDTO,
} from '@common/dtos/cart.dto';

export type CartProductItem = CartProductItemDTO;
export type CartDetail = CartDetailDTO;
export type AddCartItemRequest = AddCartItemRequestDTO;
export type UpdateCartItemRequest = UpdateCartItemRequestDTO;
export type RemoveCartItemRequest = RemoveCartItemRequestDTO;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class CartApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/cart`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  // Trace point: getCart()
  getCart(): Observable<CartDetailDTO> {
    return this.http.get<ApiResponse<CartDetailDTO>>(this.baseUrl).pipe(
      map(response => response.data)
    );
  }

  // Trace point: addItem()
  addItem(data: AddCartItemRequestDTO): Observable<CartDetailDTO> {
    return this.http.post<ApiResponse<CartDetailDTO>>(this.baseUrl, data).pipe(
      map(response => response.data)
    );
  }

  // Trace point: updateItem()
  updateItem(itemId: number | string, data: UpdateCartItemRequestDTO): Observable<CartDetailDTO> {
    return this.http.put<ApiResponse<CartDetailDTO>>(`${this.baseUrl}/${itemId}`, data).pipe(
      map(response => response.data)
    );
  }

  // Trace point: removeItem()
  removeItem(itemId: number | string, data: RemoveCartItemRequestDTO): Observable<CartDetailDTO> {
    return this.http.delete<ApiResponse<CartDetailDTO>>(`${this.baseUrl}/${itemId}`, {
      body: data
    }).pipe(
      map(response => response.data)
    );
  }

  // Trace point: clearCart()
  clearCart(): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/clear`).pipe(
      map(response => response.data)
    );
  }
}
