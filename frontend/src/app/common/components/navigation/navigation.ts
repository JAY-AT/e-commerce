import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationComponent } from '@common/components/notification/notification';
import { NotificationManager } from '@common/services/managers/notification/notification.manager';
import { filter, Observable, Subscription } from 'rxjs';
import { SupportUiManager } from '@common/services/managers/support/support-ui';

export type NavigationContext = 'landing' | 'dashboard' | 'orders' | 'profile' | 'checkout' | 'admin';

interface NavigationLink {
  label: string;
  href: string;
  route: boolean;
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NotificationComponent],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
})
export class NavigationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() context: NavigationContext = 'dashboard';
  @Input() userId!: number;
  @Output() logout = new EventEmitter<void>();

  notifCount$!: Observable<number>;

  mobileOpen = false;
  notifOpen = false;
  activeHref = '#home';

  private routerSub?: Subscription;
  private sectionObserver?: IntersectionObserver;

  constructor(
    private notifManager: NotificationManager,
    private router: Router,
    private supportUi: SupportUiManager,
  ) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.notifCount$ = this.notifManager.getUnreadCount();

    if (this.context !== 'landing') {
      this.routerSub = this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => {
          if (this.mobileOpen) {
            this.closeMobileMenu();
          }
        });
    }
  }

  // Trace point: ngAfterViewInit()
  ngAfterViewInit(): void {
    if (this.context === 'landing') {
      this.setupLandingSectionObserver();
    }
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.sectionObserver?.disconnect();
  }

  // Trace point: toggleMobileMenu()
  toggleMobileMenu(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  // Trace point: closeMobileMenu()
  closeMobileMenu(): void {
    this.mobileOpen = false;
  }

  // Trace point: toggleNotifications()
  toggleNotifications(): void {
    this.notifOpen = !this.notifOpen;
  }

  // Trace point: closeNotifications()
  closeNotifications(): void {
    this.notifOpen = false;
  }

  // Trace point: isLinkActive()
  isLinkActive(link: NavigationLink): boolean {
    return this.context === 'landing' && this.activeHref === link.href;
  }

  // Trace point: onLinkClick()
  onLinkClick(link: NavigationLink): void {
    if (this.context === 'landing') {
      this.activeHref = link.href;
    }

    this.closeMobileMenu();
  }

  // Trace point: links()
  get links(): NavigationLink[] {
    switch (this.context) {
      case 'landing':
        return [
          { label: 'Home', href: '#home', route: false },
          { label: 'Featured', href: '#featured', route: false },
          { label: 'About', href: '#about', route: false },
          { label: 'Contact', href: '#contact', route: false },
        ];
      case 'orders':
        return [
          { label: 'Dashboard', href: '/user-dashboard', route: true },
          { label: 'Profile', href: '/profile', route: true },
          { label: 'Checkout', href: '/checkout', route: true },
        ];
      case 'profile':
        return [
          { label: 'Dashboard', href: '/user-dashboard', route: true },
          { label: 'Orders', href: '/orders', route: true },
          { label: 'Checkout', href: '/checkout', route: true },
        ];
      case 'checkout':
        return [
          { label: 'Dashboard', href: '/user-dashboard', route: true },
          { label: 'Orders', href: '/orders', route: true },
          { label: 'Profile', href: '/profile', route: true },
        ];
      case 'admin':
        return [];
      case 'dashboard':
      default:
        return [
          { label: 'Orders', href: '/orders', route: true },
          { label: 'Profile', href: '/profile', route: true },
          { label: 'Checkout', href: '/checkout', route: true },
        ];
    }
  }

  // Trace point: brandNote()
  get brandNote(): string {
    switch (this.context) {
      case 'landing':
        return 'Fresh coffee, easy mornings.';
      case 'admin':
        return 'Management view.';
      default:
        return 'Your Bean account.';
    }
  }

  // Trace point: actionLabel()
  get actionLabel(): string | null {
    return this.context === 'landing' ? 'Login' : null;
  }

  // Trace point: showLogout()
  get showLogout(): boolean {
    return this.context !== 'landing';
  }

  // Trace point: showSupportToggle()
  get showSupportToggle(): boolean {
    return this.context !== 'admin';
  }

  // Trace point: toggleSupport()
  toggleSupport(): void {
    this.supportUi.toggle();
  }

  // Trace point: setupLandingSectionObserver()
  private setupLandingSectionObserver(): void {
    const sections = this.links
      .map((link) => document.getElementById(link.href.replace('#', '')))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length || typeof IntersectionObserver === 'undefined') {
      this.activeHref = this.links[0]?.href ?? '#home';
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible?.target.id) {
          return;
        }

        this.activeHref = `#${visible.target.id}`;
      },
      {
        root: null,
        rootMargin: '-38% 0px -45% 0px',
        threshold: [0.15, 0.3, 0.55],
      },
    );

    sections.forEach((section) => this.sectionObserver?.observe(section));
    this.activeHref = this.links[0]?.href ?? '#home';
  }
}
