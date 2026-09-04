import { Component, OnInit } from '@angular/core';

import { ProductListItem } from '@common/models/product';
import { CartManager } from '@common/services/managers/cart/cart';
import { AuthManager } from '@common/services/managers/auth/auth';
import { Router } from '@angular/router';
import { NavigationComponent } from '@common/components/navigation/navigation';

import { Products } from './products/products';
import { OrderManager } from '@common/services/managers/order/order';
import { NotificationManager } from '@common/services/managers/notification/notification.manager';
import { SupportManager } from '@common/services/managers/support/support';
import { ProductManager } from '@common/services/managers/product/product';
import { ProductDisplayComponent } from './product-display/product-display';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
     Products, 
     NavigationComponent,
     ProductDisplayComponent,
     CommonModule
    ],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.scss',
})
export class UserDashboard implements OnInit {
  constructor(
    private CartManager: CartManager,
    private notifManager: NotificationManager,
    private authService: AuthManager,
    private router: Router,
    private OrderManager: OrderManager,
    private supportManager: SupportManager,
    public productManager: ProductManager
  ) {}
  
  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.notifManager.load();
  }
  // Trace point: addToCart()
  addToCart(product: ProductListItem) {
    this.CartManager.addToCart(product);
  }

  // Trace point: closeProductDisplay()
  closeProductDisplay() {
    this.productManager.deselectProduct();
  }

  // Trace point: logout()
  logout() {
    this.OrderManager.clearState();
    this.notifManager.clearNotifications();
    this.supportManager.resetSupportState();
    this.CartManager.clearCart();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
