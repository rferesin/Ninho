import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="page-shell d-lg-flex">
      <aside class="app-sidebar p-4">
        <div class="mb-4">
          <div class="brand-mark">Ninho</div>
          <div class="brand-sub">Metas com envelope</div>
        </div>
        <nav class="d-flex flex-lg-column gap-1 mb-4">
          <a routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Visao geral</a>
          <a routerLink="/app/ninhos" routerLinkActive="active">Ninhos</a>
          <a routerLink="/app/movimentos" routerLinkActive="active">Movimentos</a>
          <a routerLink="/app/categorias" routerLinkActive="active">Categorias</a>
        </nav>
        <div class="mt-lg-auto pt-3 border-top border-light border-opacity-25">
          <div class="small mb-2">{{ user()?.name }}</div>
          <button class="btn btn-sm btn-outline-light" type="button" (click)="logout()">Sair</button>
        </div>
      </aside>
      <main class="flex-grow-1 p-3 p-lg-5">
        <router-outlet />
      </main>
    </div>
  `
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;

  logout(): void {
    this.auth.logout();
  }
}
