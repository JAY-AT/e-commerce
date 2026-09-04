import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ProductListItem } from '@common/models/product';
import { ProductManager } from '@common/services/managers/product/product';
import { ProductCardComponent } from '@common/components/product-card/product-card';

@Component({
  selector: 'app-landing-featured',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './featured.html',
  styleUrl: './featured.scss',
})
export class LandingFeaturedComponent {
  featuredProducts$: Observable<ProductListItem[]>;

  constructor(
    private productManager: ProductManager,
    private router: Router
  ) {
    this.featuredProducts$ = this.productManager.getFeatured();
  }

  // Trace point: openShop()
  openShop(): void {
    this.router.navigate(['/login']);
  }
}
