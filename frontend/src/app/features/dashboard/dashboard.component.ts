import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Dashboard } from '../../core/models/models';
import { formatBrl, formatDate } from '../../core/services/money';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <div class="metric-label mb-1">Este mes</div>
        <h1 class="page-title mb-0">Visao geral</h1>
      </div>
      <a class="btn btn-gold" routerLink="/app/ninhos">Novo ninho</a>
    </div>

    @if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    }

    @if (data(); as dash) {
      <div class="row g-3 mb-4">
        <div class="col-md-6 col-xl-3">
          <div class="surface p-4 h-100">
            <div class="metric-label">Receitas</div>
            <div class="fs-3 fw-semibold amount-in">{{ money(dash.monthlyIncome) }}</div>
          </div>
        </div>
        <div class="col-md-6 col-xl-3">
          <div class="surface p-4 h-100">
            <div class="metric-label">Despesas</div>
            <div class="fs-3 fw-semibold amount-out">{{ money(dash.monthlyExpense) }}</div>
          </div>
        </div>
        <div class="col-md-6 col-xl-3">
          <div class="surface p-4 h-100">
            <div class="metric-label">Saldo do mes</div>
            <div class="fs-3 fw-semibold" [class.amount-in]="dash.monthlyBalance >= 0" [class.amount-out]="dash.monthlyBalance < 0">
              {{ money(dash.monthlyBalance) }}
            </div>
          </div>
        </div>
        <div class="col-md-6 col-xl-3">
          <div class="surface p-4 h-100">
            <div class="metric-label">Reservado nos ninhos</div>
            <div class="fs-3 fw-semibold">{{ money(dash.reservedInNests) }}</div>
            <div class="small muted">{{ dash.activeNests }} ativos · {{ dash.completedNests }} concluidos</div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-7">
          <div class="surface p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="h5 mb-0">Ninhos</h2>
              <a class="small" routerLink="/app/ninhos">Ver todos</a>
            </div>
            @if (dash.nests.length === 0) {
              <div class="empty-state">Nenhum ninho ainda. Abra o primeiro envelope.</div>
            } @else {
              @for (nest of dash.nests.slice(0, 4); track nest.id) {
                <a [routerLink]="['/app/ninhos', nest.id]" class="d-block mb-3 text-reset">
                  <div class="d-flex justify-content-between mb-1">
                    <strong>{{ nest.name }}</strong>
                    <span class="small muted">{{ nest.progressPercent }}%</span>
                  </div>
                  <div class="progress">
                    <div class="progress-bar" [style.width.%]="nest.progressPercent" [style.background]="nest.color"></div>
                  </div>
                  <div class="small muted mt-1">{{ money(nest.currentAmount) }} de {{ money(nest.targetAmount) }}</div>
                </a>
              }
            }
          </div>
        </div>
        <div class="col-lg-5">
          <div class="surface p-4 mb-4">
            <h2 class="h5 mb-3">Despesas por categoria</h2>
            @if (dash.expensesByCategory.length === 0) {
              <div class="empty-state py-4">Sem despesas neste mes.</div>
            } @else {
              @for (item of dash.expensesByCategory; track item.categoryId) {
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span><span class="dot me-2" [style.background]="item.color"></span>{{ item.name }}</span>
                  <strong>{{ money(item.total) }}</strong>
                </div>
              }
            }
          </div>
          <div class="surface p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="h5 mb-0">Ultimos movimentos</h2>
              <a class="small" routerLink="/app/movimentos">Ver todos</a>
            </div>
            @if (dash.recentTransactions.length === 0) {
              <div class="empty-state py-4">Nenhum movimento registrado.</div>
            } @else {
              @for (tx of dash.recentTransactions; track tx.id) {
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <div>
                    <div>{{ tx.description }}</div>
                    <div class="small muted">{{ date(tx.date) }} · {{ tx.categoryName }}</div>
                  </div>
                  <div [class.amount-in]="tx.type === 'INCOME'" [class.amount-out]="tx.type === 'EXPENSE'">
                    {{ tx.type === 'INCOME' ? '+' : '-' }} {{ money(tx.amount) }}
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly data = signal<Dashboard | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: (dash) => this.data.set(dash),
      error: () => this.error.set('Nao foi possivel carregar o painel')
    });
  }

  money(value: number): string {
    return formatBrl(value);
  }

  date(value: string): string {
    return formatDate(value);
  }
}
