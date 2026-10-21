import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnDestroy {
  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;

  // 1: Enter Email, 2: Enter OTP Code, 3: Set New Password, 4: Success
  step: 1 | 2 | 3 | 4 = 1;

  errorMessage = '';
  successMessage = '';
  devCodeHint = '';
  isSubmitting = false;

  // Resend code timer
  resendCountdown = 0;
  private timerInterval: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Password strength check for step 3
  get passwordStrength(): { score: number; label: string; color: string } {
    const p = this.newPassword;
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

  startResendTimer(): void {
    this.resendCountdown = 60;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      this.resendCountdown--;
      this.cdr.detectChanges();
      if (this.resendCountdown <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // Step 1: Send Code to Email
  onSendCode(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.devCodeHint = '';

    if (!this.email || !this.email.trim()) {
      this.errorMessage = 'Please enter your registered email address.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email format (e.g. name@domain.com).';
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || 'Verification code sent!';
        if (res.devCode) {
          this.devCodeHint = res.devCode;
        }
        this.step = 2;
        this.startResendTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'No account found with this email address.';
        this.cdr.detectChanges();
      }
    });
  }

  // Auto-fill code into input
  autoFillCode(code: string): void {
    if (code) {
      this.code = code.trim();
      this.cdr.detectChanges();
    }
  }

  // Resend code from Step 2
  onResendCode(): void {
    if (this.resendCountdown > 0 || this.isSubmitting) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = 'A new verification code has been sent!';
        if (res.devCode) {
          this.devCodeHint = res.devCode;
        }
        this.startResendTimer();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to resend code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // Step 2: Verify OTP code
  onVerifyCode(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const cleanedCode = this.code.trim();
    if (!cleanedCode || cleanedCode.length < 4) {
      this.errorMessage = 'Please enter the 6-digit verification code sent to your Gmail.';
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService.verifyResetCode(this.email.trim(), cleanedCode).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || 'Verification successful!';
        this.step = 3;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Invalid or expired verification code.';
        this.cdr.detectChanges();
      }
    });
  }

  // Step 3: Save New Password
  onResetPassword(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters long.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match. Please re-enter.';
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.authService.resetPassword(this.email.trim(), this.code.trim(), this.newPassword).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.successMessage = res.message || 'Password updated successfully!';
        this.step = 4;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Failed to reset password. Please request a new code.';
        this.cdr.detectChanges();
      }
    });
  }

  changeEmail(): void {
    this.step = 1;
    this.code = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.devCodeHint = '';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  goToSignIn(): void {
    this.router.navigate(['/signin']);
  }
}
