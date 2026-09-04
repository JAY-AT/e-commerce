import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { CartApiService, CartDetail, CartProductItem } from '@common/services/api/cart/cart-api.service';
import { ProductListItem } from '@common/models/product';

export interface CartItem {
  product: ProductListItem;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartManager {

  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  public totalItems$ = this.cartItems$.pipe(
    map(items => items.reduce((sum, item) => sum + item.quantity, 0))
  );

  public totalPrice$ = this.cartItems$.pipe(
    map(items => items.reduce((total, item) => total + (item.product.price * item.quantity), 0))
  );

  // Trace point: constructor()
  constructor(private api: CartApiService) {
    this.loadCachedCart();
    this.refreshCart();
    this.bindAuthEvents();
  }

  // =========================
  // PRODUCT MAPPER
  // =========================
  private mapApiProduct(item: CartProductItem): ProductListItem {
    const product = (item as any)?.product ?? item;

    return {
      id: String(product?.id ?? item.product_id ?? ''),
      name: product?.name ?? 'Unnamed Product',
      description: product?.description ?? null,
      price: Number(product?.price ?? 0),
      stock: Number(product?.stock ?? 0),
      category_name: product?.category_name ?? '',
      image_url: product?.image_url ?? '',
    };
  }

  // =========================
  // CART MAPPER
  // =========================
  private mapCartDetail(detail: CartDetail): CartItem[] {
    if (!detail?.products) return [];

    return detail.products
      .filter(item => item != null)
      .map(item => ({
        product: this.mapApiProduct(item),
        quantity: Number(item.quantity ?? 0),
      }));
  }

  // =========================
  // STATE SETTER
  // =========================
  private setCartItems(items: CartItem[]): void {
    const cleaned = this.normalizeCartItems(items);
    this.cartItemsSubject.next(cleaned);
    this.saveToStorage();
  }

  // =========================
  // SAFE NORMALIZER
  // =========================
  private normalizeCartItems(items: CartItem[]): CartItem[] {
    return items
      .filter(item => item?.product) // ❗ remove broken entries
      .map(item => ({
        product: {
          ...item.product,
          id: String(item.product.id ?? ''),
          name: item.product.name ?? 'Unnamed Product',
          price: Number(item.product.price ?? 0),
          image_url: item.product.image_url ?? '',
        },
        quantity: Math.max(0, Number(item.quantity ?? 0)),
      }))
      .filter(item => item.quantity > 0);
  }

  // =========================
  // UPDATE LOCAL CART
  // =========================
  private updateLocalCart(mutator: (items: CartItem[]) => CartItem[]): void {
    const nextItems = mutator([...this.cartItemsSubject.value]);
    this.setCartItems(nextItems);
  }

  // =========================
  // REFRESH CART
  // =========================
  public refreshCart(): void {
    if (!this.hasAccessToken()) {
      this.clearLocalCart();
      return;
    }

    this.api.getCart().subscribe({
      next: cart => {
        const items = this.mapCartDetail(cart);
        this.setCartItems(items);
      },
      error: () => {
        // keep cache
      }
    });
  }

  // =========================
  // CACHE LOAD
  // =========================
  private loadCachedCart(): void {
    const stored = localStorage.getItem('cart');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      this.cartItemsSubject.next(this.normalizeCartItems(parsed));
    } catch {
      localStorage.removeItem('cart');
    }
  }

  // =========================
  // ADD TO CART
  // =========================
  addToCart(product: ProductListItem, quantity: number = 1): void {
    if (!product?.id || quantity <= 0) return;

    this.api.addItem({ productId: product.id, quantity }).subscribe({
      next: cart => {
        this.setCartItems(this.mapCartDetail(cart));
      },
      error: () => {
        this.updateLocalCart(items => {
          const existing = items.find(i => i.product.id === product.id);

          if (existing) {
            return items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            );
          }

          return [...items, { product, quantity }];
        });
      }
    });
  }

  // =========================
  // REMOVE
  // =========================
  removeFromCart(productId: string): void {
    this.api.removeItem(productId, { productId }).subscribe({
      next: cart => this.setCartItems(this.mapCartDetail(cart)),
      error: () => {
        this.updateLocalCart(items =>
          items.filter(i => i.product.id !== productId)
        );
      }
    });
  }

  // =========================
  // UPDATE QTY
  // =========================
  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.api.updateItem(productId, { productId, quantity }).subscribe({
      next: cart => this.setCartItems(this.mapCartDetail(cart)),
      error: () => {
        this.updateLocalCart(items =>
          items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          )
        );
      }
    });
  }

  // =========================
  // GETTERS
  // =========================
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // Trace point: getTotalPrice()
  getTotalPrice(): number {
    return this.cartItemsSubject.value.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  // =========================
  // CLEAR
  // =========================
  clearCart(): void {
    this.api.clearCart().subscribe({
      next: () => this.clearLocalCart(),
      error: () => this.clearLocalCart(),
    });
  }

  // Trace point: clearLocalCart()
  private clearLocalCart(): void {
    this.cartItemsSubject.next([]);
    localStorage.removeItem('cart');
  }

  // =========================
  // AUTH
  // =========================
  private bindAuthEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('auth:logout', () => this.clearLocalCart());
    window.addEventListener('auth:session-changed', () => {
      this.clearLocalCart();
      this.refreshCart();
    });
  }

  // Trace point: saveToStorage()
  private saveToStorage(): void {
    localStorage.setItem(
      'cart',
      JSON.stringify(this.cartItemsSubject.value)
    );
  }

  // Trace point: hasAccessToken()
  private hasAccessToken(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}