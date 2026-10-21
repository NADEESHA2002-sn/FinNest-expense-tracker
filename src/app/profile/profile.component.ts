import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  // Current logged in user
  currentUser: User | null = null;

  // Profile Form Fields
  name = '';
  email = '';
  phone = '';
  currency = 'Rs.';
  monthlyBudget = 100000;
  bio = '';
  profilePic = '👨‍💼';

  // Preset Avatars
  presetAvatars = [
    '👨‍💼',
    '👩‍💼',
    '🧑‍💻',
    '👩‍💻',
    '💼',
    '🏦',
    '💎',
    '⚡',
    '🚀',
    '💰',
    '📈',
    '👤'
  ];

  // Currency Options
  currencies = [
    { code: 'Rs.', label: 'Sri Lankan Rupee (Rs.)' },
    { code: '$', label: 'US Dollar ($)' },
    { code: '€', label: 'Euro (€)' },
    { code: '£', label: 'British Pound (£)' },
    { code: '₹', label: 'Indian Rupee (₹)' },
    { code: 'A$', label: 'Australian Dollar (A$)' }
  ];

  // Loading State
  isSavingProfile = false;

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  // Load current user information
  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser) {
      return;
    }

    this.name = this.currentUser.name || '';
    this.email = this.currentUser.email || '';
    this.phone = this.currentUser.phone || '';
    this.currency = this.currentUser.currency || 'Rs.';
    this.monthlyBudget = this.currentUser.monthlyBudget || 100000;
    this.bio = this.currentUser.bio || '';
    this.profilePic = this.currentUser.profilePic || '👨‍💼';
  }

  // Check whether profile picture is an actual image
  isImagePic(pic: string): boolean {
    if (!pic) {
      return false;
    }

    return (
      pic.startsWith('data:image') ||
      pic.startsWith('http://') ||
      pic.startsWith('https://')
    );
  }

  isOptimizingPhoto = false;

  // Compress & center-crop image to 200x200 JPEG (~15KB) for lightning-fast uploads
  private compressAndCropImage(file: File, targetSize = 200, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to decode image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Select profile image from device
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.showToast(
        'Please select a valid image file.',
        'error'
      );
      return;
    }

    try {
      this.isOptimizingPhoto = true;
      const optimizedPic = await this.compressAndCropImage(file);
      this.profilePic = optimizedPic;
      this.isOptimizingPhoto = false;

      this.showToast(
        'Photo optimized! Click "Save Changes" to apply.',
        'success'
      );
    } catch (err) {
      this.isOptimizingPhoto = false;
      this.showToast(
        'Could not process image. Please try another.',
        'error'
      );
    }
  }

  // Select preset avatar
  selectPresetAvatar(avatar: string): void {
    this.profilePic = avatar;
  }

  // Reset profile picture
  removePhoto(): void {
    this.profilePic = '👨‍💼';

    this.showToast(
      'Reverted to default avatar.',
      'success'
    );
  }

  // Save profile
  onSaveProfile(): void {

    // Validate name
    if (!this.name || !this.name.trim()) {
      this.showToast(
        'Name cannot be blank.',
        'error'
      );
      return;
    }

    // Validate monthly budget
    if (
      this.monthlyBudget < 0 ||
      isNaN(Number(this.monthlyBudget))
    ) {
      this.showToast(
        'Please enter a valid monthly budget amount.',
        'error'
      );
      return;
    }

    this.isSavingProfile = true;

    const updates: Partial<User> = {
      name: this.name.trim(),
      phone: this.phone ? this.phone.trim() : '',
      currency: this.currency,
      monthlyBudget: Number(this.monthlyBudget) || 0,
      bio: this.bio ? this.bio.trim() : '',
      profilePic: this.profilePic
    };

    this.authService.updateProfile(updates).subscribe({

      next: (res) => {

        this.isSavingProfile = false;

        if (res.success) {

          if (res.user) {

            this.currentUser = res.user;

            this.name = res.user.name || '';
            this.email = res.user.email || '';
            this.phone = res.user.phone || '';
            this.currency = res.user.currency || 'Rs.';
            this.monthlyBudget = res.user.monthlyBudget || 0;
            this.bio = res.user.bio || '';
            this.profilePic = res.user.profilePic || '👨‍💼';
          }

          this.showToast(
            res.message || 'Profile updated successfully!',
            'success'
          );

        } else {

          this.showToast(
            res.message || 'Failed to update profile.',
            'error'
          );
        }
      },

      error: (err) => {

        this.isSavingProfile = false;

        this.showToast(
          err?.error?.message || 'Failed to update profile.',
          'error'
        );
      }
    });
  }

  // Toast
  showToast(
    msg: string,
    type: 'success' | 'error'
  ): void {

    this.toastMessage = msg;
    this.toastType = type;

    setTimeout(() => {
      this.toastMessage = '';
    }, 4000);
  }
}
