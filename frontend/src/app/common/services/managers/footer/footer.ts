import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterGroup {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterContact {
  address: string;
  phone: string;
  email: string;
}

export interface FooterContent {
  brandName: string;
  description: string;
  groups: FooterGroup[];
  socials: FooterSocialLink[];
  contact: FooterContact;
  copyright: string;
}

const DEFAULT_FOOTER: FooterContent = {
  brandName: 'Roasted Bean',
  description: 'Fresh coffee, warm service, and a place that feels easy to come back to.',
  groups: [
    {
      id: 'explore',
      title: 'Explore',
      links: [
        { id: 'menu', label: 'Featured', href: '#featured' },
        { id: 'about', label: 'About', href: '#about' },
        { id: 'login', label: 'Login', href: '/login' },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      links: [
        { id: 'orders', label: 'Orders', href: '/orders' },
        { id: 'profile', label: 'Profile', href: '/profile' },
        { id: 'dashboard', label: 'Dashboard', href: '/user-dashboard' },
      ],
    },
    {
      id: 'company',
      title: 'Company',
      links: [
        { id: 'contact', label: 'Contact', href: '#contact' },
        { id: 'privacy', label: 'Privacy', href: '/login' },
        { id: 'terms', label: 'Terms', href: '/login' },
      ],
    },
  ],
  socials: [
    { id: 'facebook', label: 'Facebook', href: 'https://facebook.com' },
    { id: 'instagram', label: 'Instagram', href: 'https://instagram.com' },
    { id: 'twitter', label: 'Twitter', href: 'https://twitter.com' },
  ],
  contact: {
    address: '123 Coffee Street, City, State 12345',
    phone: '(555) 123-4567',
    email: 'hello@theroastedbean.com',
  },
  copyright: '2026 Roasted Bean. All rights reserved.',
};

@Injectable({
  providedIn: 'root',
})
export class FooterManager {
  private readonly storageKey = 'footer-content';
  private readonly footerSubject = new BehaviorSubject<FooterContent>(this.loadInitial());
  readonly footer$ = this.footerSubject.asObservable();

  // Trace point: getFooter()
  getFooter(): Observable<FooterContent> {
    return this.footer$;
  }

  // Trace point: updateFooter()
  updateFooter(content: FooterContent): void {
    const next = this.clone(content);
    this.footerSubject.next(next);
    localStorage.setItem(this.storageKey, JSON.stringify(next));
  }

  // Trace point: updateBrand()
  updateBrand(data: Pick<FooterContent, 'brandName' | 'description' | 'copyright'>): void {
    this.updateFooter({
      ...this.footerSubject.value,
      ...data,
    });
  }

  // Trace point: updateGroupTitle()
  updateGroupTitle(groupId: string, title: string): void {
    this.updateFooter({
      ...this.footerSubject.value,
      groups: this.footerSubject.value.groups.map(group =>
        group.id === groupId ? { ...group, title } : group
      ),
    });
  }

  // Trace point: updateLink()
  updateLink(groupId: string, linkId: string, patch: Partial<FooterLink>): void {
    this.updateFooter({
      ...this.footerSubject.value,
      groups: this.footerSubject.value.groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              links: group.links.map(link =>
                link.id === linkId ? { ...link, ...patch } : link
              ),
            }
          : group
      ),
    });
  }

  // Trace point: addLink()
  addLink(groupId: string, link?: Partial<FooterLink>): void {
    const nextLink: FooterLink = {
      id: link?.id ?? `link-${Date.now()}`,
      label: link?.label ?? 'New link',
      href: link?.href ?? '#',
    };

    this.updateFooter({
      ...this.footerSubject.value,
      groups: this.footerSubject.value.groups.map(group =>
        group.id === groupId
          ? { ...group, links: [...group.links, nextLink] }
          : group
      ),
    });
  }

  // Trace point: removeLink()
  removeLink(groupId: string, linkId: string): void {
    this.updateFooter({
      ...this.footerSubject.value,
      groups: this.footerSubject.value.groups.map(group =>
        group.id === groupId
          ? { ...group, links: group.links.filter(link => link.id !== linkId) }
          : group
      ),
    });
  }

  // Trace point: updateContact()
  updateContact(contact: Partial<FooterContact>): void {
    this.updateFooter({
      ...this.footerSubject.value,
      contact: {
        ...this.footerSubject.value.contact,
        ...contact,
      },
    });
  }

  // Trace point: updateSocialLink()
  updateSocialLink(linkId: string, patch: Partial<FooterSocialLink>): void {
    this.updateFooter({
      ...this.footerSubject.value,
      socials: this.footerSubject.value.socials.map(social =>
        social.id === linkId ? { ...social, ...patch } : social
      ),
    });
  }

  // Trace point: addSocialLink()
  addSocialLink(link?: Partial<FooterSocialLink>): void {
    const nextLink: FooterSocialLink = {
      id: link?.id ?? `social-${Date.now()}`,
      label: link?.label ?? 'New social',
      href: link?.href ?? '#',
    };

    this.updateFooter({
      ...this.footerSubject.value,
      socials: [...this.footerSubject.value.socials, nextLink],
    });
  }

  // Trace point: removeSocialLink()
  removeSocialLink(linkId: string): void {
    this.updateFooter({
      ...this.footerSubject.value,
      socials: this.footerSubject.value.socials.filter(link => link.id !== linkId),
    });
  }

  // Trace point: loadInitial()
  private loadInitial(): FooterContent {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) return this.clone(DEFAULT_FOOTER);

    try {
      const parsed = JSON.parse(stored) as FooterContent;
      return this.clone({
        ...DEFAULT_FOOTER,
        ...parsed,
      });
    } catch {
      return this.clone(DEFAULT_FOOTER);
    }
  }

  // Trace point: clone()
  private clone(content: FooterContent): FooterContent {
    return JSON.parse(JSON.stringify(content)) as FooterContent;
  }
}
