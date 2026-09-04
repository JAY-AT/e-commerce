import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ProductListItem } from '@common/models/product';
import { ProductManager } from '@common/services/managers/product/product';
import { environment } from '@env/environment';
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  standalone: true,
})
export class ProductCardComponent {
  @Input() product!: ProductListItem;

  @Output() add = new EventEmitter<ProductListItem>();


  constructor(
    public productManager: ProductManager
  ) {}

  // Trace point: selectProduct()
  selectProduct(product: ProductListItem) {
    this.productManager.selectProduct(Number(product.id)).subscribe();
  }
}
