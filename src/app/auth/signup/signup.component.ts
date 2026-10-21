import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignUpComponent {
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  agreeTerms = true;
  showPassword = false;

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Live password strength calculation
  get passwordStrength(): { score: number; label: string; color: string } {
    const p = this.password;
    if (!p) return { score: 0, label: 'None', color: '#64748b' };

    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p) || /[A-Z]/.test(p)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (score === 3) return { score: 3, label: 'Good', color: '#3b82f6' };
    return { score: 4, label: 'Strong', color: '#10b981' };
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name || !this.name.trim()) {
      this.errorMessage = 'Please enter your full name.';
      return;
    }

    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Please provide a valid email format (e.g. name@domain.com).';
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match. Please verify.';
      return;
    }

    if (!this.agreeTerms) {
      this.errorMessage = 'Please agree to the Terms of Service to continue.';
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService.register({
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      phone: this.phone.trim()
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        // Navigate to Sign In page upon successful sign up as requested
        this.router.navigate(['/signin'], {
          queryParams: { registered: 'true' }
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please check your details and try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
