import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  currentUser$: Observable<User | null>;

  constructor(public authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }
}
