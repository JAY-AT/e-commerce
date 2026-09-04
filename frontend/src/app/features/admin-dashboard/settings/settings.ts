import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthManager } from '@common/services/managers/auth/auth';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class AdminSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  passwordForm: FormGroup;
  message = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthManager,
    private router: Router
  ) {
    this.settingsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  // Trace point: ngOnInit()
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.settingsForm.patchValue({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
    });
  }

  // Trace point: saveSettings()
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const value = this.settingsForm.value;
    this.authService.updateCurrentUser({
      name: value.name ?? '',
      email: value.email ?? '',
      phone: value.phone ?? '',
    });
    this.message = 'Admin details updated';
  }

  // Trace point: changePassword()
  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.message = 'Passwords do not match';
      return;
    }

    this.message = 'Password updated';
    this.passwordForm.reset();
  }
}
