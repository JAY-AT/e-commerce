import { Routes } from '@angular/router';
import { AdminDashboard } from '@features/admin-dashboard/admin-dashboard';
import { Checkout } from '@features/user-dashboard/checkout/checkout';
import { Landing } from '@features/landing/landing';
import { Login } from '@features/auth/login/login';
import { Orders } from '@features/user-dashboard/orders/orders';
import { Profile } from '@features/user-dashboard/profile/profile';
import { UserDashboard } from '@features/user-dashboard/user-dashboard';
import { Signup } from '@features/auth/signup/signup';
import { PayOrderComponent } from '@features/payment/pay-order/pay-order';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  {
    path: 'user-dashboard',
    component: UserDashboard,
    canActivate: [authGuard],
    data: { role: 'customer' },
  },
  {
    path: 'checkout',
    component: Checkout,
    canActivate: [authGuard],
    data: { role: 'customer' },
  },
  {
    path: 'orders',
    component: Orders,
    canActivate: [authGuard],
    data: { role: 'customer' },
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard],
    data: { role: 'customer' },
  },
  {
    path: 'pay/:orderId',
    component: PayOrderComponent,
    canActivate: [authGuard],
    data: { role: 'customer' },
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    canActivate: [authGuard],
    data: { role: 'admin' },
  },
];
