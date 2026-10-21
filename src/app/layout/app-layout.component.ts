import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css'
})
export class AppLayoutComponent {

}
