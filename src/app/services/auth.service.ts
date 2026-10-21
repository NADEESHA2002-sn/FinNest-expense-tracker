import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  profilePic?: string;
  currency?: string;
  monthlyBudget?: number;
  bio?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface PasswordResponse {
  success: boolean;
  message: string;
  devCode?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_STORAGE_KEY = 'lifeapp_token';
  private readonly USER_STORAGE_KEY = 'lifeapp_active_user';

  private readonly API_URL =
    'http://localhost:5000/api/auth';

  private currentUserSubject =
    new BehaviorSubject<User | null>(null);

  currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.restoreSession();
  }


  // =====================================================
  // CHECK BROWSER
  // =====================================================

  private isBrowser(): boolean {

    return (
      typeof window !== 'undefined' &&
      typeof localStorage !== 'undefined'
    );

  }


  // =====================================================
  // RESTORE LOGIN SESSION
  // =====================================================

  private restoreSession(): void {

    if (!this.isBrowser()) {
      return;
    }

    const token =
      localStorage.getItem(
        this.TOKEN_STORAGE_KEY
      );

    const savedUser =
      localStorage.getItem(
        this.USER_STORAGE_KEY
      );


    if (token && savedUser) {

      try {

        const user =
          JSON.parse(savedUser) as User;

        this.currentUserSubject.next(user);

      } catch {

        this.clearSession();

      }

    } else {

      this.clearSession();

    }

  }


  // =====================================================
  // SAVE SESSION
  // =====================================================

  private setSession(
    token: string,
    user: User
  ): void {

    if (this.isBrowser()) {

      localStorage.setItem(
        this.TOKEN_STORAGE_KEY,
        token
      );

      localStorage.setItem(
        this.USER_STORAGE_KEY,
        JSON.stringify(user)
      );

    }

    this.currentUserSubject.next(user);

  }


  // =====================================================
  // CLEAR SESSION
  // =====================================================

  private clearSession(): void {

    if (this.isBrowser()) {

      localStorage.removeItem(
        this.TOKEN_STORAGE_KEY
      );

      localStorage.removeItem(
        this.USER_STORAGE_KEY
      );

    }

    this.currentUserSubject.next(null);

  }


  // =====================================================
  // GET TOKEN
  // =====================================================

  getToken(): string | null {

    if (!this.isBrowser()) {
      return null;
    }

    return localStorage.getItem(
      this.TOKEN_STORAGE_KEY
    );

  }


  // =====================================================
  // GET CURRENT USER
  // =====================================================

  getCurrentUser(): User | null {

    return this.currentUserSubject.value;

  }


  // =====================================================
  // CHECK LOGIN
  // =====================================================

  isLoggedIn(): boolean {

    return (
      !!this.getToken() &&
      this.currentUserSubject.value !== null
    );

  }


  // =====================================================
  // REGISTER
  // =====================================================

  register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API_URL}/register`,
      data
    );
  }


  // =====================================================
  // LOGIN
  // =====================================================

  login(
    email: string,
    password: string
  ): Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.API_URL}/login`,
        {
          email,
          password
        }
      )
      .pipe(

        tap((res) => {

          if (
            res.token &&
            res.user
          ) {

            this.setSession(
              res.token,
              res.user
            );

          }

        })

      );

  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.clearSession();

    this.router.navigate([
      '/signin'
    ]);

  }


  // =====================================================
  // GET PROFILE
  // =====================================================

  getProfile(): Observable<ProfileResponse> {

    return this.http
      .get<ProfileResponse>(
        `${this.API_URL}/me`
      )
      .pipe(

        tap((res) => {

          if (res.user) {

            const token =
              this.getToken();

            if (token) {

              this.setSession(
                token,
                res.user
              );

            }

          }

        })

      );

  }


  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  updateProfile(
    updates: Partial<User>
  ): Observable<ProfileResponse> {

    return this.http
      .put<ProfileResponse>(
        `${this.API_URL}/profile`,
        updates
      )
      .pipe(

        tap((res) => {

          if (res.user) {

            const token =
              this.getToken();

            if (token) {

              this.setSession(
                token,
                res.user
              );

            }

          }

        })

      );

  }


  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  updatePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<PasswordResponse> {

    return this.http
      .put<PasswordResponse>(
        `${this.API_URL}/change-password`,
        {
          currentPassword,
          newPassword
        }
      );

  }


  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  forgotPassword(
    email: string
  ): Observable<PasswordResponse> {
    return this.http.post<PasswordResponse>(
      `${this.API_URL}/forgot-password`,
      { email }
    );
  }


  // =====================================================
  // VERIFY RESET CODE
  // =====================================================

  verifyResetCode(
    email: string,
    code: string
  ): Observable<PasswordResponse> {
    return this.http.post<PasswordResponse>(
      `${this.API_URL}/verify-reset-code`,
      { email, code }
    );
  }


  // =====================================================
  // RESET PASSWORD
  // =====================================================

  resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Observable<PasswordResponse> {
    return this.http.post<PasswordResponse>(
      `${this.API_URL}/reset-password`,
      {
        email,
        code,
        newPassword
      }
    );
  }

}
