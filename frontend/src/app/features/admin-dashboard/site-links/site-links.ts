import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  FooterContent,
  FooterGroup,
  FooterManager,
} from '@common/services/managers/footer/footer';

@Component({
  selector: 'app-admin-site-links',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './site-links.html',
  styleUrl: './site-links.scss',
})
export class AdminSiteLinksComponent implements OnInit, OnDestroy {
  draft!: FooterContent;
  message = '';

  private destroy$ = new Subject<void>();

  // Trace point: constructor()
  constructor(private footerManager: FooterManager) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.footerManager.footer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(content => {
        this.draft = JSON.parse(JSON.stringify(content)) as FooterContent;
      });
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Trace point: addLink()
  addLink(group: FooterGroup): void {
    group.links.push({
      id: `link-${Date.now()}`,
      label: 'New link',
      href: '#',
    });
  }

  // Trace point: removeLink()
  removeLink(group: FooterGroup, index: number): void {
    group.links.splice(index, 1);
  }

  // Trace point: addSocialLink()
  addSocialLink(): void {
    this.draft.socials.push({
      id: `social-${Date.now()}`,
      label: 'New social',
      href: '#',
    });
  }

  // Trace point: removeSocialLink()
  removeSocialLink(index: number): void {
    this.draft.socials.splice(index, 1);
  }

  // Trace point: saveFooter()
  saveFooter(): void {
    if (!this.draft) return;

    this.footerManager.updateFooter(this.draft);
    this.message = 'Footer links updated';
  }
}
