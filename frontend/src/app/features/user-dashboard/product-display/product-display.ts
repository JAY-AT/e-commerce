import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductDetailDTO } from '@common/dtos/product.dto';
import { CartManager } from '@common/services/managers/cart/cart';
import { toListItem } from '@common/services/managers/product/mapper';
import { ToastManager } from '@common/services/managers/toast/toast.manager';

@Component({
  selector: 'app-product-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-display.html',
  styleUrl: './product-display.scss',
})
export class ProductDisplayComponent
  implements OnChanges, OnDestroy, OnInit {

  @Input() product: ProductDetailDTO | null = null;
  @Input() isLoading = false;

  @Output() back = new EventEmitter<void>();

  activeImageIndex = 0;
  quantity = 1;

  private slideshowTimer?: ReturnType<typeof setInterval>;

  constructor( private cartManager: CartManager,
    private toastManager: ToastManager
  ) {}
  // Trace point: ngOnInit()
  ngOnInit(): void {
    console.log('ProductDisplayComponent initialized with product:', this.product);
  }

  // Trace point: ngOnChanges()
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product']) {
      this.activeImageIndex = 0;
      this.quantity = 1;
      this.syncSlideshow();
    }
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    this.clearSlideshow();
  }

  // Trace point: images()
  get images() {
    return this.product?.images ?? [];
  }

  // Trace point: hasMultipleImages()
  get hasMultipleImages(): boolean {
    return this.images.length > 1;
  }

  // Trace point: currentImageUrl()
  get currentImageUrl(): string | null {
    if (!this.product) return null;

    const current = this.images[this.activeImageIndex];

    return current?.image_url
      ?? this.images[0]?.image_url
      ?? null;
  }

  // Trace point: nextImage()
  nextImage(): void {
    if (!this.hasMultipleImages) return;

    this.activeImageIndex =
      (this.activeImageIndex + 1) % this.images.length;
  }

  // Trace point: previousImage()
  previousImage(): void {
    if (!this.hasMultipleImages) return;

    this.activeImageIndex =
      (this.activeImageIndex - 1 + this.images.length)
      % this.images.length;
  }

  // Trace point: selectImage()
  selectImage(index: number): void {
    if (index < 0 || index >= this.images.length) return;

    this.activeImageIndex = index;
    this.syncSlideshow();
  }

  trackByImageId(_: number, image: { id: number }): number {
    return image.id;
  }

  // Trace point: onBack()
  onBack(): void {
    this.back.emit();
  }

  // Trace point: syncSlideshow()
  private syncSlideshow(): void {
    this.clearSlideshow();

    if (!this.hasMultipleImages) return;

    this.slideshowTimer = setInterval(() => {
      this.nextImage();
    }, 4500);
  }

  // Trace point: clearSlideshow()
  private clearSlideshow(): void {
    if (this.slideshowTimer) {
      clearInterval(this.slideshowTimer);
      this.slideshowTimer = undefined;
    }
  }

  // Trace point: addToCart()
  addToCart(product: ProductDetailDTO, quantity: number): void {
    try {
      this.cartManager.addToCart(toListItem(product), quantity);
      this.toastManager.success(`${product.name} added to cart!`);
      this.back.emit();
    } catch (error) {
      this.toastManager.error('Failed to add product to cart');
    }
  }
}