import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common';
import { ThemeService } from '@common/services/managers/theme/theme';
import { Products } from '@features/user-dashboard/products/products';
import { ProductListItem } from '@common/models/product';
import { LandingFooterComponent } from './footer/footer';
import { LandingAboutComponent } from './about/about';
import { LandingTestimonialsComponent } from './testimonials/testimonials';
import { LandingHeroComponent } from './hero/hero';
import { LandingFeaturedComponent } from './featured/featured';
import { NavigationComponent } from '@common/components/navigation/navigation';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, LandingFooterComponent, LandingAboutComponent, LandingTestimonialsComponent,
    LandingHeroComponent, LandingFeaturedComponent, NavigationComponent
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit {
  isDarkMode: boolean = false;
  isMobileMenuOpen: boolean = false;

  featuredProducts$!: ProductListItem[];
  constructor(private themeService: ThemeService,
  ) {}

  // Trace point: ngOnInit()
  ngOnInit() {
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });


  }

  // Trace point: toggleDarkMode()
  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  // Trace point: toggleMobileMenu()
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Trace point: closeMobileMenu()
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
