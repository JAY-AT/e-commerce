import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  CategoryApiService,
  CategoryItem,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@common/services/api/category/category-api.service';

@Injectable({
  providedIn: 'root',
})

export class CategoryManager {
  private isLoaded = false;

  private readonly categorySubject = new BehaviorSubject<CategoryItem[]>([]);
  readonly category$ = this.categorySubject.asObservable();

  constructor(
    private api: CategoryApiService
  ) {}

  // Trace point: load()
  private load(): void {
    if (this.isLoaded) return;

    this.api.getCategories().pipe(
      tap(categories => {
        this.categorySubject.next(categories);
        this.isLoaded = true;
      })
    ).subscribe();
  }

  // Trace point: refreshCategories()
  refreshCategories(): Observable<CategoryItem[]> {
    return this.api.getCategories().pipe(
      tap(categories => {
        this.categorySubject.next(categories);
        this.isLoaded = true;
      })
    );
  }

  // Trace point: getCategories()
  getCategories(): Observable<CategoryItem[]> {
    this.load();

    return this.category$;
  }

  // Trace point: getCategoryById()
  getCategoryById(id: number): Observable<CategoryItem | undefined> {
    this.load();

    return this.category$.pipe(
      map(categories => categories.find(category => category.id === id))
    );
  }

  // Trace point: createCategory()
  createCategory(category: CreateCategoryRequest): Observable<CategoryItem> {
    return this.api.createCategory(category).pipe(
      tap(createdCategory => {
        this.categorySubject.next([
          ...this.categorySubject.value,
          createdCategory,
        ]);
        this.isLoaded = true;
      })
    );
  }

  // Trace point: updateCategory()
  updateCategory(id: number, category: UpdateCategoryRequest): Observable<CategoryItem> {
    return this.api.updateCategory(id, category).pipe(
      tap(updatedCategory => {
        this.categorySubject.next(
          this.categorySubject.value.map(existingCategory =>
            existingCategory.id === id ? updatedCategory : existingCategory
          )
        );
      })
    );
  }

  // Trace point: deleteCategory()
  deleteCategory(id: number): Observable<void> {
    return this.api.deleteCategory(id).pipe(
      tap(() => {
        this.categorySubject.next(
          this.categorySubject.value.filter(category => category.id !== id)
        );
      })
    );
  }
}