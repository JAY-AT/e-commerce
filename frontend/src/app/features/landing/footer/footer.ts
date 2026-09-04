import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { FooterContent, FooterManager } from '@common/services/managers/footer/footer';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class LandingFooterComponent {
  footer$: Observable<FooterContent>;

  // Trace point: constructor()
  constructor(private footerManager: FooterManager) {
    this.footer$ = this.footerManager.footer$;
  }
}
