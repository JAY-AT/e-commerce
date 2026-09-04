import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthManager, User } from '@common/services/managers/auth/auth';
import { UserManager } from '@common/services/managers/user/user';
import { ToastManager } from '@common/services/managers/toast/toast.manager';
import { NavigationComponent } from '@common/components/navigation/navigation';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavigationComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  isSaving = false;
  message = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthManager,
    private userManager: UserManager,
    private toastManager: ToastManager,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      state: [''],
      postalCode: [''],
    });
  }

  // Trace point: ngOnInit()
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.userManager.getUser(user.id).subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
          phone: profile.phone ?? '',
          addressLine1: profile.address_line ?? '',
          addressLine2: '',
          city: profile.city ?? '',
          state: profile.state ?? '',
          postalCode: profile.postal_code ?? '',
        });
      },
      error: () => {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone ?? '',
          addressLine1: user.addressLine1 ?? '',
          addressLine2: user.addressLine2 ?? '',
          city: user.city ?? '',
          state: user.state ?? '',
          postalCode: user.postalCode ?? '',
        });
      },
    });
  }

  // Trace point: saveProfile()
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isSaving = true;
    this.message = '';

    const value = this.profileForm.value;
    const nameParts = String(value.name ?? '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.shift() ?? user.name;
    const lastName = nameParts.length > 0 ? nameParts.join(' ') : firstName;
    const addressLine = [value.addressLine1, value.addressLine2].filter(Boolean).join(', ');

    this.userManager.updateUser(user.id, {
      first_name: firstName,
      last_name: lastName,
      email: value.email ?? '',
      phone: value.phone ?? '',
      address_line: addressLine || '',
      city: value.city ?? '',
      state: value.state ?? '',
      postal_code: value.postalCode ?? '',
    }).pipe(
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: (profile) => {
        this.authService.updateCurrentUser({
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          email: profile.email,
          phone: profile.phone ?? '',
          addressLine1: profile.address_line ?? '',
          addressLine2: '',
          city: profile.city ?? '',
          state: profile.state ?? '',
          postalCode: profile.postal_code ?? '',
        } as Partial<User>);

        this.message = 'Profile updated';
        this.toastManager.success('Profile updated successfully');
      },
      error: (error: any) => {
        const message = error?.error?.message || error?.message || 'Failed to update profile';
        this.message = message;
        this.toastManager.error(message);
      },
    });
  }

  // Trace point: backToShop()
  backToShop(): void {
    this.router.navigate(['/user-dashboard']);
  }

  // Trace point: logout()
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
