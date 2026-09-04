import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductListItem } from '@common/models/product';
import { ProductManager } from '@common/services/managers/product/product';
import { CategoryManager } from '@common/services/managers/category/category';
import { CategoryItem } from '@common/services/api/category/category-api.service';

import { ProductCardComponent } from '../../../common/components/product-card/product-card';
import { CartComponent } from '../cart/cart';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, CartComponent],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {

  filteredProducts$!: Observable<ProductListItem[]>;
  categories: CategoryItem[] = [];

  searchQuery = '';
  selectedCategory = 'all';

  isLoading = false;
  errorMessage = '';

  @Output() addToCart = new EventEmitter<ProductListItem>();

  constructor(
    private productManager: ProductManager,
    private categoryManager: CategoryManager
  ) {}

  // Trace point: ngOnInit()
  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  // Trace point: loadCategories()
  loadCategories() {
    this.categoryManager.getCategories().subscribe({
      next: (res) => this.categories = res,
      error: () => this.errorMessage = 'Failed to load categories'
    });
  }

  // Trace point: loadProducts()
  loadProducts() {
    this.isLoading = true;
    this.productManager.load()
    this.filteredProducts$ = this.availableOnly(this.productManager.product$);

    // If product$ is a BehaviorSubject, loading should stop after first emit
    this.filteredProducts$.subscribe({
      next: () => this.isLoading = false,
      error: () => {
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
      }
    });
  }

  // Trace point: onSearch()
  onSearch() {
    const query = this.searchQuery.trim();

    if (!query) {
      this.loadProducts();
      return;
    }

    this.filteredProducts$ = this.availableOnly(this.productManager.searchProducts(query));
  }

  // Trace point: onCategoryChange()
  onCategoryChange(category: string) {
    this.selectedCategory = category;

    if (category === 'all') {
      this.loadProducts();
      return;
    }

    this.filteredProducts$ = this.availableOnly(this.productManager.filterByCategory(category));
  }

  // Trace point: getCategoryLabel()
  getCategoryLabel(slug: string): string {
    if (slug === 'all') return 'All categories';

    return this.categories.find(c => c.slug === slug)?.name ?? slug;
  }

  // Trace point: availableOnly()
  private availableOnly(products$: Observable<ProductListItem[]>): Observable<ProductListItem[]> {
    return products$.pipe(
      map(products => products.filter(product => Number(product.stock) > 0))
    );
  }
}
