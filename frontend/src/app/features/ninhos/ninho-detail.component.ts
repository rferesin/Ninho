import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Contribution, Nest } from '../../core/models/models';
import { formatBrl, formatDate, todayIso } from '../../core/services/money';

@Component({
  selector: 'app-ninho-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a class="small d-inline-block mb-3" routerLink="/app/ninhos">Voltar aos ninhos</a>

    @if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    }

    @if (nest(); as item) {
      <div class="d-flex justify-content-between align-items-start mb-4 gap-3 flex-wrap">
        <div>
          <div class="metric-label mb-1">{{ statusLabel(item.status) }}</div>
          <h1 class="page-title mb-1">{{ item.name }}</h1>
          <p class="muted mb-0">{{ item.description || 'Sem descricao' }}</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-ghost" type="button" (click)="togglePause(item)">
            {{ item.status === 'PAUSED' ? 'Retomar' : 'Pausar' }}
          </button>
          <button class="btn btn-outline-danger" type="button" (click)="remove()">Excluir</button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-5">
          <div class="surface p-4 mb-4">
            <div class="metric-label">Progresso</div>
            <div class="display-6 mb-2">{{ item.progressPercent }}%</div>
            <div class="progress mb-3">
              <div class="progress-bar" [style.width.%]="item.progressPercent" [style.background]="item.color"></div>
            </div>
            <div class="d-flex justify-content-between">
              <div>
                <div class="metric-label">Guardado</div>
                <strong>{{ money(item.currentAmount) }}</strong>
              </div>
              <div class="text-end">
                <div class="metric-label">Falta</div>
                <strong>{{ money(item.remainingAmount) }}</strong>
              </div>
            </div>
            <div class="small muted mt-3">Meta {{ money(item.targetAmount) }} · prazo {{ date(item.deadline) }}</div>
          </div>

          <div class="surface p-4">
            <h2 class="h5 mb-3">Novo aporte</h2>
            <form [formGroup]="form" (ngSubmit)="contribute()" novalidate>
              <div class="mb-3">
                <label class="form-label" for="amount">Valor</label>
                <input id="amount" class="form-control" type="number" min="0.01" step="0.01" formControlName="amount" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="date">Data</label>
                <input id="date" class="form-control" type="date" formControlName="date" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="note">Nota</label>
                <input id="note" class="form-control" formControlName="note" />
              </div>
              @if (formError()) {
                <div class="alert alert-danger py-2">{{ formError() }}</div>
              }
              <button class="btn btn-forest" type="submit" [disabled]="form.invalid || saving()">Guardar</button>
            </form>
          </div>
        </div>
        <div class="col-lg-7">
          <div class="surface p-4">
            <h2 class="h5 mb-3">Historico de aportes</h2>
            @if (contributions().length === 0) {
              <div class="empty-state">Nenhum aporte ainda.</div>
            } @else {
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Nota</th>
                      <th class="text-end">Valor</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of contributions(); track item.id) {
                      <tr>
                        <td>{{ date(item.date) }}</td>
                        <td>{{ item.note || '—' }}</td>
                        <td class="text-end amount-in">{{ money(item.amount) }}</td>
                        <td class="text-end">
                          <button class="btn btn-sm btn-ghost" type="button" (click)="removeContribution(item.id)">Remover</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class NinhoDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly nest = signal<Nest | null>(null);
  readonly contributions = signal<Contribution[]>([]);
  readonly error = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);
  private nestId = 0;

  readonly form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [todayIso(), Validators.required],
    note: ['']
  });

  ngOnInit(): void {
    this.nestId = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();
  }

  contribute(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const value = this.form.getRawValue();
    this.api.contribute(this.nestId, {
      amount: Number(value.amount),
      date: value.date,
      note: value.note || undefined
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ amount: 0, date: todayIso(), note: '' });
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Nao foi possivel guardar');
      }
    });
  }

  togglePause(nest: Nest): void {
    const next = nest.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    this.api.updateNest(nest.id, {
      name: nest.name,
      description: nest.description,
      targetAmount: nest.targetAmount,
      deadline: nest.deadline,
      status: next,
      color: nest.color
    }).subscribe({
      next: (updated) => this.nest.set(updated),
      error: () => this.error.set('Nao foi possivel atualizar o ninho')
    });
  }

  remove(): void {
    if (!confirm('Excluir este ninho e o historico de aportes?')) {
      return;
    }
    this.api.deleteNest(this.nestId).subscribe({
      next: () => void this.router.navigateByUrl('/app/ninhos'),
      error: () => this.error.set('Nao foi possivel excluir')
    });
  }

  removeContribution(id: number): void {
    this.api.deleteContribution(this.nestId, id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Nao foi possivel remover o aporte')
    });
  }

  money(value: number): string {
    return formatBrl(value);
  }

  date(value: string | null): string {
    return formatDate(value);
  }

  statusLabel(status: string): string {
    if (status === 'COMPLETED') return 'Concluido';
    if (status === 'PAUSED') return 'Pausado';
    return 'Ativo';
  }

  private reload(): void {
    this.api.nest(this.nestId).subscribe({
      next: (nest) => this.nest.set(nest),
      error: () => this.error.set('Ninho nao encontrado')
    });
    this.api.contributions(this.nestId).subscribe({
      next: (items) => this.contributions.set(items),
      error: () => this.contributions.set([])
    });
  }
}
