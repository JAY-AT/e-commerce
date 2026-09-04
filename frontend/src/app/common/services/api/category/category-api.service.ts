import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

@Injectable({
  providedIn: 'root'
})

export class CategoryApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/categories`;

  // Trace point: constructor()
  constructor(private http: HttpClient) {}

  /**
   * List all categories
   */
  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(this.baseUrl);
  }

  /**
   * Create a new category (admin only)
   */
  createCategory(category: CreateCategoryRequest): Observable<CategoryItem> {
    return this.http.post<CategoryItem>(this.baseUrl, category);
  }

  /**
   * Update an existing category (admin only)
   */
  updateCategory(id: number, category: UpdateCategoryRequest): Observable<CategoryItem> {
    return this.http.put<CategoryItem>(`${this.baseUrl}/${id}`, category);
  }

  /**
   * Delete a category (admin only)
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
