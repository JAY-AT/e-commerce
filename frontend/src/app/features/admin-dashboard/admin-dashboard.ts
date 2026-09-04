import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { NavigationComponent } from '@common/components/navigation/navigation';
import { AnalyticsData, AnalyticsManager } from '@common/services/managers/analytics/analytics';
import { AuthManager } from '@common/services/managers/auth/auth';
import { FooterContent, FooterManager } from '@common/services/managers/footer/footer';
import { NotificationManager } from '@common/services/managers/notification/notification.manager';
import { ProductListItem } from '@common/models/product';
import { ProductManager } from '@common/services/managers/product/product';
import { Order, OrderData, OrderManager } from '@common/services/managers/order/order';
import { SupportManager } from '@common/services/managers/support/support';
import { SupportThreadDTO } from '@common/services/api/support/support-api.service';
import { UserManager } from '@common/services/managers/user/user';
import { UserCompleteDetailDTO } from '@common/dtos/user.dto';
import { AdminSiteLinksComponent } from './site-links/site-links';
import { AdminChatSupportComponent } from './chat-support/chat-support';
import { AdminCommandCenterComponent } from './command-center/admin-command-center';
import { AdminContentHeroComponent } from './content-hero/admin-content-hero';
import { AdminHeroMetric, AdminSection } from './admin-dashboard.types';

import { AdminAnalyticsComponent } from './analytics/analytics';
import { AdminOrdersComponent } from './orders/orders';
import { AdminProductsComponent } from './products/products';
import { AdminSettingsComponent } from './settings/settings';
import { AdminUsersComponent } from './users/users';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NavigationComponent,
    AdminCommandCenterComponent,
    AdminContentHeroComponent,
    AdminAnalyticsComponent,
    AdminProductsComponent,
    AdminOrdersComponent,
    AdminUsersComponent,
    AdminSettingsComponent,
    AdminSiteLinksComponent,
    AdminChatSupportComponent,
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit, OnDestroy {
  products: ProductListItem[] = [];
  heroMetrics: AdminHeroMetric[] = [];

  isLoading = false;
  errorMessage = '';
  showNavigation = true;

  activeSection: AdminSection = 'analytics';

  private readonly destroy$ = new Subject<void>();
  private analyticsData: AnalyticsData | null = null;
  private orderData: OrderData = {
    totalQuantity: 0,
    totalSpent: 0,
    totalOrders: 0,
  };
  private orders: Order[] = [];
  private users: UserCompleteDetailDTO[] = [];
  private footerContent: FooterContent | null = null;
  private supportThreads: SupportThreadDTO[] = [];

  constructor(
    private productService: ProductManager,
    private orderManager: OrderManager,
    private analyticsManager: AnalyticsManager,
    private userManager: UserManager,
    private footerManager: FooterManager,
    private supportManager: SupportManager,
    private notifManager: NotificationManager,
    private authService: AuthManager,
    private router: Router
  ) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.notifManager.load();
    this.orderManager.adminLoad();
    this.userManager.load();
    this.analyticsManager.init();
    this.loadProducts();
    this.loadDashboardData();
    this.supportManager.loadAdminThreads().subscribe();
    this.refreshHeroMetrics();
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Trace point: setSection()
  setSection(section: AdminSection): void {
    this.activeSection = section;
    this.refreshHeroMetrics();
  }

  // Trace point: onContentScroll()
  onContentScroll(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    this.showNavigation = target.scrollTop <= 8;
  }

  // Trace point: activeSectionLabel()
  get activeSectionLabel(): string {
    switch (this.activeSection) {
      case 'analytics':
        return 'Analytics';
      case 'products':
        return 'Products';
      case 'orders':
        return 'Orders';
      case 'users':
        return 'Users';
      case 'settings':
        return 'Settings';
      case 'site-links':
        return 'Footer Links';
      case 'chat-support':
        return 'Chat Support';
      default:
        return 'Analytics';
    }
  }

  // Trace point: activeSectionDescription()
  get activeSectionDescription(): string {
    switch (this.activeSection) {
      case 'analytics':
        return 'Watch sales, order volume, and store activity from a calm control room.';
      case 'products':
        return 'Review the catalog, edit product details, and keep the menu fresh.';
      case 'orders':
        return 'Process incoming orders with a faster workflow.';
      case 'users':
        return 'Check customer access and roles.';
      case 'settings':
        return 'Update admin security settings.';
      case 'site-links':
        return 'Manage footer links and branding.';
      case 'chat-support':
        return 'Respond to customer questions and close resolved chats.';
      default:
        return 'Monitor the coffee shop dashboard.';
    }
  }

  // Trace point: loadProducts()
  loadProducts(): void {
    this.isLoading = true;

    this.productService.getProducts().subscribe({
      next: (products: ProductListItem[]) => {
        this.products = products;
        this.isLoading = false;
        this.errorMessage = '';
        this.refreshHeroMetrics();
      },
      error: () => {
        this.errorMessage = 'Failed to load products';
        this.isLoading = false;
        this.refreshHeroMetrics();
      },
    });
  }

  // Trace point: reloadProducts()
  reloadProducts(): void {
    this.loadProducts();
  }

  updateOrderStatus(
    orderId: string,
    status: 'pending' | 'accepted' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refund'
  ): void {
    this.orderManager.updateOrderStatus(orderId, status).subscribe({
      next: () => {},
      error: (error: unknown) => {
        this.errorMessage = error ? String(error) : 'Failed to update order status';
      },
    });
  }

  // Trace point: updateUserStatus()
  updateUserStatus(userId: string, status: 'active' | 'suspended'): void {
    this.errorMessage = `User ${userId} marked as ${status}.`;
  }

  // Trace point: logout()
  logout(): void {
    this.notifManager.clearNotifications();
    this.orderManager.clearState();
    this.supportManager.resetSupportState();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Trace point: loadDashboardData()
  private loadDashboardData(): void {
    this.analyticsManager.analytics$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.analyticsData = data;
        this.refreshHeroMetrics();
      });

    this.orderManager.orderData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.orderData = data;
        this.refreshHeroMetrics();
      });

    this.userManager.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
        this.refreshHeroMetrics();
      });

    this.footerManager.footer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((footer) => {
        this.footerContent = footer;
        this.refreshHeroMetrics();
      });

    this.supportManager.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe((threads) => {
        this.supportThreads = threads;
        this.refreshHeroMetrics();
      });

    this.orderManager.orderFull$
      .pipe(takeUntil(this.destroy$))
      .subscribe((orders) => {
        this.orders = orders;
        this.refreshHeroMetrics();
      });
  }

  // Trace point: refreshHeroMetrics()
  private refreshHeroMetrics(): void {
    this.heroMetrics = this.buildHeroMetrics();
  }

  // Trace point: buildHeroMetrics()
  private buildHeroMetrics(): AdminHeroMetric[] {
    switch (this.activeSection) {
      case 'analytics':
        return this.analyticsMetrics();
      case 'products':
        return this.productMetrics();
      case 'orders':
        return this.orderMetrics();
      case 'users':
        return this.userMetrics();
      case 'settings':
        return this.settingsMetrics();
      case 'site-links':
        return this.siteLinkMetrics();
      case 'chat-support':
        return this.supportMetrics();
      default:
        return this.analyticsMetrics();
    }
  }

  // Trace point: analyticsMetrics()
  private analyticsMetrics(): AdminHeroMetric[] {
    if (!this.analyticsData) {
      return [];
    }

    return [
      {
        label: 'Sales',
        value: `PHP ${this.analyticsData.totalSales.toFixed(2)}`,
        helper: `${this.analyticsData.salesGrowth.toFixed(1)}% vs yesterday`,
      },
      {
        label: 'Today',
        value: `${this.analyticsData.ordersToday}`,
        helper: `${this.analyticsData.ordersYesterday} yesterday`,
      },
      {
        label: 'Users',
        value: `${this.analyticsData.activeUsers}`,
        helper: 'Active customer base',
      },
      {
        label: 'Average',
        value: `PHP ${this.analyticsData.avgOrderValue.toFixed(2)}`,
        helper: `${this.analyticsData.conversionRate.toFixed(1)}% conversion`,
      },
    ];
  }

  // Trace point: productMetrics()
  private productMetrics(): AdminHeroMetric[] {
    const lowStock = this.products.filter((product) => product.stock <= 5).length;
    const categories = new Set(this.products.map((product) => product.category_name).filter(Boolean)).size;
    const totalStock = this.products.reduce((total, product) => total + Number(product.stock || 0), 0);

    return [
      {
        label: 'Products',
        value: `${this.products.length}`,
        helper: 'Items in the catalog',
      },
      {
        label: 'Stock',
        value: `${totalStock}`,
        helper: 'All inventory units',
      },
      {
        label: 'Categories',
        value: `${categories}`,
        helper: 'Unique product groups',
      },
      {
        label: 'Low stock',
        value: `${lowStock}`,
        helper: 'Needs attention',
      },
    ];
  }

  // Trace point: orderMetrics()
  private orderMetrics(): AdminHeroMetric[] {
    const totalOrders = this.orderData.totalOrders;
    const totalSpent = this.orderData.totalSpent;
    const totalQuantity = this.orderData.totalQuantity;
    const activeQueue = this.orders.filter((order) =>
      ['pending', 'accepted', 'paid', 'shipped'].includes(order.status)
    ).length;

    return [
      {
        label: 'Orders',
        value: `${totalOrders}`,
        helper: 'All recorded orders',
      },
      {
        label: 'Spent',
        value: `PHP ${totalSpent.toFixed(2)}`,
        helper: 'Completed and shipped only',
      },
      {
        label: 'Items',
        value: `${totalQuantity}`,
        helper: 'Products ordered overall',
      },
      {
        label: 'Queue',
        value: `${activeQueue}`,
        helper: 'Active order pipeline',
      },
    ];
  }

  // Trace point: userMetrics()
  private userMetrics(): AdminHeroMetric[] {
    const totalUsers = this.users.length;
    const admins = this.users.filter((user) => user.role === 'admin').length;
    const customers = this.users.filter((user) => user.role !== 'admin').length;
    const contactable = this.users.filter((user) => Boolean(user.email)).length;

    return [
      {
        label: 'Users',
        value: `${totalUsers}`,
        helper: 'Total registered accounts',
      },
      {
        label: 'Admins',
        value: `${admins}`,
        helper: 'Management accounts',
      },
      {
        label: 'Customers',
        value: `${customers}`,
        helper: 'Buyer accounts',
      },
      {
        label: 'Contactable',
        value: `${contactable}`,
        helper: 'With email addresses',
      },
    ];
  }

  // Trace point: settingsMetrics()
  private settingsMetrics(): AdminHeroMetric[] {
    return [
      {
        label: 'Fields',
        value: '3',
        helper: 'Name, email, phone',
      },
      {
        label: 'Security',
        value: '3',
        helper: 'Current, new, confirm',
      },
      {
        label: 'Status',
        value: this.errorMessage ? 'Needs review' : 'Ready',
        helper: this.errorMessage || 'Profile and password forms are loaded',
      },
      {
        label: 'User',
        value: this.authService.getCurrentUser()?.name ?? 'Admin',
        helper: 'Current profile owner',
      },
    ];
  }

  // Trace point: siteLinkMetrics()
  private siteLinkMetrics(): AdminHeroMetric[] {
    const groups = this.footerContent?.groups.length ?? 0;
    const links = this.footerContent?.groups.reduce((total, group) => total + group.links.length, 0) ?? 0;
    const socials = this.footerContent?.socials.length ?? 0;

    return [
      {
        label: 'Groups',
        value: `${groups}`,
        helper: 'Footer link sections',
      },
      {
        label: 'Links',
        value: `${links}`,
        helper: 'All footer links',
      },
      {
        label: 'Socials',
        value: `${socials}`,
        helper: 'External profiles',
      },
      {
        label: 'Brand',
        value: this.footerContent?.brandName ?? 'Roasted Bean',
        helper: 'Footer identity',
      },
    ];
  }

  // Trace point: supportMetrics()
  private supportMetrics(): AdminHeroMetric[] {
    const unread = this.supportThreads.reduce((total, thread) => total + thread.unread_count, 0);
    const open = this.supportThreads.filter((thread) => thread.status === 'open').length;
    const closed = this.supportThreads.filter((thread) => thread.status === 'closed').length;

    return [
      {
        label: 'Threads',
        value: `${this.supportThreads.length}`,
        helper: 'Loaded chat threads',
      },
      {
        label: 'Open',
        value: `${open}`,
        helper: 'Support conversations in queue',
      },
      {
        label: 'Unread',
        value: `${unread}`,
        helper: 'Unread messages across threads',
      },
      {
        label: 'Closed',
        value: `${closed}`,
        helper: 'Resolved conversations',
      },
    ];
  }
}
