import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ProductApiService } from '../../api/product/product-api.service';
import { ProductListItem } from '@common/models/product';
import {
  CreateProductRequestDTO,
  ProductDetailDTO,
  UpdateProductRequestDTO,
} from '@common/dtos/product.dto';
import { toListItem } from './mapper';

@Injectable({
  providedIn: 'root',
})
export class ProductManager {

  private isLoaded = false;

  private readonly productSubject = new BehaviorSubject<ProductListItem[]>([]);
  readonly product$ = this.productSubject.asObservable();


  private readonly selectedProductSubject = new BehaviorSubject<ProductDetailDTO | null>(null);
  readonly selectedProduct$ = this.selectedProductSubject.asObservable();

  constructor(
    private api: ProductApiService
  ) {}

  // Trace point: load()
  public load(): void {
    if (this.isLoaded) return;

    this.api.getProducts().pipe(
      tap(products => {
        this.productSubject.next(products);
        this.isLoaded = true;
      })
    ).subscribe();
  }

  // Trace point: getProducts()
  getProducts(): Observable<ProductListItem[]> {
    this.load();
    
    console.log('Products loaded:', this.productSubject.value);
    return this.product$;
  }

  // Trace point: selectProduct()
  selectProduct(id: number): Observable<ProductDetailDTO> {
    console.log('Selecting product with ID:', id);
    return this.api.getProduct(id).pipe(
      tap(product => this.selectedProductSubject.next(product))
    );
  }

  // Trace point: createProduct()
  createProduct(productData: CreateProductRequestDTO): Observable<ProductDetailDTO> {
    return this.api.createProduct(productData).pipe(
      tap((createdProduct) => {
        const current = this.productSubject.value;
        const mapped = toListItem(createdProduct);

        this.productSubject.next([mapped, ...current]);
        this.selectedProductSubject.next(createdProduct);
      }),
      shareReplay(1)
    );
  }

  // Trace point: getSelectedProducts()
  getSelectedProducts(): Observable<ProductDetailDTO | null> {
    return this.selectedProduct$;
  }

  updateProduct(
    id: number,
    productData: UpdateProductRequestDTO
  ): Observable<ProductDetailDTO> {
    return this.api.updateProduct(id, productData).pipe(
      tap((updatedProduct) => {
        const current = this.productSubject.value;

        const mapped = toListItem(updatedProduct);

        const exists = current.some(p => p.id === mapped.id);

        const updatedList = exists
          ? current.map(p => (p.id === mapped.id ? mapped : p))
          : [...current, mapped];
        
        
        this.productSubject.next(updatedList);

        if (this.selectedProductSubject.value?.id === updatedProduct.id) {
          this.selectedProductSubject.next(updatedProduct);
        }
      }),
      shareReplay(1)
    );
  }

  // Trace point: getProductById()
  getProductById(id: string): Observable<ProductListItem | undefined> {
    return this.product$.pipe(
      map(products => products.find(p => p.id == id))
    );
  }

  // Trace point: searchProducts()
  searchProducts(query: string): Observable<ProductListItem[]> {
    const q = query.toLowerCase();

    return this.product$.pipe(
      map(products =>
        products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        ))
    );
  }

  // Trace point: filterByCategory()
  filterByCategory(category: string): Observable<ProductListItem[]> {
    if (category === 'all') {
      return this.getProducts();
    }

    return this.product$.pipe(
      map(products =>
        products.filter(p => p.category_name === category)
      )
    );
  } 

  // Trace point: getCategories()
  getCategories(): string[] {
    return ['all', 'coffee', 'soda', 'food', 'dessert'];
  }

  // Trace point: getFeaturedProducts()
  getFeaturedProducts(): Observable<ProductListItem[]> {
    return this.getFeatured();
  }

  // Trace point: getFeatured()
  getFeatured(): Observable<ProductListItem[]> {
    this.load();

    return this.product$.pipe(
      map(products => this.pickRandom(products, 4))
    );
  }

  // Trace point: pickRandom()
  private pickRandom(products: ProductListItem[], count: number): ProductListItem[] {
    const pool = [...products];

    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, Math.min(count, pool.length));
  }

  // Trace point: deleteProduct()
  deleteProduct(id: number): Observable<void> {
    return this.api.deleteProduct(id);}

  // Trace point: deselectProduct()
  deselectProduct(): void {
    this.selectedProductSubject.next(null);
  }
}
