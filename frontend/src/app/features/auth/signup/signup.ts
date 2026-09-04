import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastManager } from '@common/services/managers/toast/toast.manager';
import { AuthManager, User } from '@common/services/managers/auth/auth';
import { delay, finalize } from 'rxjs';
import { SupportManager } from '@common/services/managers/support/support';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup implements OnInit {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;

  constructor(
    private authService: AuthManager,
    private router: Router,
    private toastManager: ToastManager,
    private cdr: ChangeDetectorRef,
    private supportManager: SupportManager
  ) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.routeByUserType(user);
    }
  }

  // Trace point: onSubmit()
  onSubmit(): void {
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.confirmPassword) {
      this.toastManager.error('Please fill in all fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.toastManager.error('Passwords do not match');
      return;
    }

    this.isLoading = true;

    this.authService.register({
      first_name: this.firstName,
      last_name: this.lastName,
      email: this.email,
      password: this.password,
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      })
      )
      .subscribe({
      next: (user: User) => {
        this.isLoading = false;
        this.toastManager.success('Signup Successful');
        this.supportManager.logoutOrSwitchAccount();
        setTimeout(() => {
          this.routeByUserType(user);
        }, 100);
      },
      error: (error: any) => {
        this.isLoading = false;

        const message =
          error?.error?.errors?.[0] ||
          error?.error?.message ||
          'Sign up failed';

        this.toastManager.error(message);

        console.log("stops");
        // ❌ REMOVE THIS
        // this.cdr.detectChanges();
      },
    });
  }

  // Trace point: routeByUserType()
  private routeByUserType(user: User): void {
    if (user.type === 'admin') {
      this.router.navigate(['/admin-dashboard']);
      return;
    }

    this.router.navigate(['/user-dashboard']);
  }
}
