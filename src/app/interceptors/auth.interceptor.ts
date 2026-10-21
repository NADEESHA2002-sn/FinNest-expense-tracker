import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized from an authenticated endpoint, clear session and redirect to signin
      if (error.status === 401 && !req.url.includes('/api/auth/login') && !req.url.includes('/api/auth/register')) {
        authService.logout();
        router.navigate(['/signin'], {
          queryParams: { sessionExpired: 'true' }
        });
      }
      return throwError(() => error);
    })
  );
};
