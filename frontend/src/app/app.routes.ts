import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'criar-conta',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'ninhos',
        loadComponent: () => import('./features/ninhos/ninhos.component').then((m) => m.NinhosComponent)
      },
      {
        path: 'ninhos/:id',
        loadComponent: () => import('./features/ninhos/ninho-detail.component').then((m) => m.NinhoDetailComponent)
      },
      {
        path: 'movimentos',
        loadComponent: () => import('./features/transactions/transactions.component').then((m) => m.TransactionsComponent)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/categories/categories.component').then((m) => m.CategoriesComponent)
      }
    ]
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' }
];
