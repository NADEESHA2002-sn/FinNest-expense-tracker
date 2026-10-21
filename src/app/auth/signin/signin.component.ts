import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SignInComponent implements OnInit {
  email = '';
  password = '';
  rememberMe = true;
  showPassword = false;

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  returnUrl = '/dashboard';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    if (this.route.snapshot.queryParams['sessionExpired']) {
      this.errorMessage = 'Your session has expired. Please sign in again.';
    }

    if (this.route.snapshot.queryParams['registered']) {
      this.successMessage = 'Account created successfully! Please sign in with your credentials.';
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Please enter your password.';
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || 'Signed in successfully! Redirecting...';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigateByUrl(this.returnUrl);
        }, 500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  useDemoAccount(): void {
    this.email = 'nadeesha@example.com';
    this.password = 'password123';
  }
}
