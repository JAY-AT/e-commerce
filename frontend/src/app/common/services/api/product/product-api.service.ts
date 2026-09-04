import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  CreateProductRequestDTO,
  ProductDetailDTO,
  ProductListItemDTO,
  UpdateProductRequestDTO,
} from '@common/dtos/product.dto';

export type CreateProductRequest = CreateProductRequestDTO;
export type UpdateProductRequest = UpdateProductRequestDTO;
export type ProductDetail = ProductDetailDTO;
export type ProductListItem = ProductListItemDTO;

@Injectable({
  providedIn: 'root'
})

export class ProductApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/products`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  /**
   * List all products
   */
  getProducts(): Observable<ProductListItemDTO[]> {
    return this.http.get<ProductListItemDTO[]>(this.baseUrl);
  }

  /**
   * Get product details by ID
   */
  getProduct(id: number): Observable<ProductDetailDTO> {
    return this.http.get<ProductDetailDTO>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new product (admin only)
   */
  createProduct(product: CreateProductRequestDTO): Observable<ProductDetailDTO> {
    return this.http.post<ProductDetailDTO>(this.baseUrl, product);
  }

  /**
   * Update an existing product (admin only)
   */
  updateProduct(id: number, product: UpdateProductRequestDTO): Observable<ProductDetailDTO> {
    return this.http.put<ProductDetailDTO>(`${this.baseUrl}/${id}`, product);
  }

  /**
   * Delete a product (admin only)
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
