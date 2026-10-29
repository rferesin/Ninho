import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-hero d-flex align-items-center justify-content-center p-3">
      <div class="surface auth-card p-4 p-md-5 w-100">
        <div class="mb-4">
          <div class="brand-mark text-dark">Ninho</div>
          <p class="muted mb-0">Entre para acompanhar metas e envelopes.</p>
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="mb-3">
            <label class="form-label" for="email">Email</label>
            <input id="email" class="form-control" type="email" formControlName="email" autocomplete="email" />
          </div>
          <div class="mb-3">
            <label class="form-label" for="password">Senha</label>
            <input id="password" class="form-control" type="password" formControlName="password" autocomplete="current-password" />
          </div>
          @if (error()) {
            <div class="alert alert-danger py-2">{{ error() }}</div>
          }
          <button class="btn btn-forest w-100" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
        <p class="mt-4 mb-0 small">
          Ainda nao tem conta?
          <a routerLink="/criar-conta">Criar conta</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/app');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.error.set('API fora do ar. Rode ./scripts/start.sh');
          return;
        }
        this.error.set(err.error?.message ?? 'Nao foi possivel entrar');
      }
    });
  }
}
