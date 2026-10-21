import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Landing / Home Route
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },

  // Authentication Routes
  {
    path: 'signin',
    loadComponent: () =>
      import('./auth/signin/signin.component').then((m) => m.SignInComponent)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then((m) => m.SignUpComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      )
  },

  // Protected App Shell Routes
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard').then((m) => m.Dashboard)
      },
      {
        path: 'income',
        loadComponent: () =>
          import('./income/income').then((m) => m.IncomeComponent)
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./expense/expense').then((m) => m.ExpenseComponent)
      },
      {
        path: 'expense',
        redirectTo: 'expenses',
        pathMatch: 'full'
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./reports/reports').then((m) => m.Reports)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent)
      }
    ]
  },

  // Fallback Wildcard
  {
    path: '**',
    redirectTo: ''
  }
];
