import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  isMobileOpen = false;
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  toggleMobileMenu(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  closeMobileMenu(): void {
    this.isMobileOpen = false;
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }

  isImagePic(pic: string | undefined): boolean {
    return !!pic && (pic.startsWith('data:image') || pic.startsWith('http://') || pic.startsWith('https://'));
  }
}
