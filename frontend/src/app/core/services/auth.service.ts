import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, User } from '../models/models';

const TOKEN_KEY = 'ninho.token';
const USER_KEY = 'ninho.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly userSignal = signal<User | null>(this.readUser());
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);

  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => this.persist(response))
    );
  }

  register(name: string, email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/register', { name, email, password }).pipe(
      tap((response) => this.persist(response))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    void this.router.navigateByUrl('/entrar');
  }

  private persist(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.userSignal.set(response.user);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
