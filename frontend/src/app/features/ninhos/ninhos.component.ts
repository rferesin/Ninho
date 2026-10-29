import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Nest } from '../../core/models/models';
import { formatBrl, formatDate } from '../../core/services/money';

@Component({
  selector: 'app-ninhos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <div class="metric-label mb-1">Envelopes</div>
        <h1 class="page-title mb-0">Ninhos</h1>
      </div>
      <button class="btn btn-gold" type="button" (click)="toggleForm()">
        {{ showForm() ? 'Cancelar' : 'Abrir ninho' }}
      </button>
    </div>

    @if (showForm()) {
      <div class="surface p-4 mb-4">
        <form class="row g-3" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="col-md-6">
            <label class="form-label" for="name">Nome</label>
            <input id="name" class="form-control" formControlName="name" placeholder="Viagem, reserva, curso" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="targetAmount">Meta</label>
            <input id="targetAmount" class="form-control" type="number" min="0.01" step="0.01" formControlName="targetAmount" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="deadline">Prazo</label>
            <input id="deadline" class="form-control" type="date" formControlName="deadline" />
          </div>
          <div class="col-md-9">
            <label class="form-label" for="description">Descricao</label>
            <input id="description" class="form-control" formControlName="description" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="color">Cor</label>
            <input id="color" class="form-control form-control-color w-100" type="color" formControlName="color" />
          </div>
          @if (formError()) {
            <div class="col-12"><div class="alert alert-danger py-2 mb-0">{{ formError() }}</div></div>
          }
          <div class="col-12">
            <button class="btn btn-forest" type="submit" [disabled]="form.invalid || saving()">Salvar ninho</button>
          </div>
        </form>
      </div>
    }

    @if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    }

    @if (nests().length === 0) {
      <div class="empty-state">Nenhum ninho aberto. Defina uma meta e comece a guardar.</div>
    } @else {
      <div class="row g-3">
        @for (nest of nests(); track nest.id) {
          <div class="col-md-6 col-xl-4">
            <a class="surface p-4 h-100 d-block text-reset" [routerLink]="['/app/ninhos', nest.id]">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 class="h5 mb-1">{{ nest.name }}</h2>
                  <span class="badge-soft" [class.badge-active]="nest.status === 'ACTIVE'" [class.badge-paused]="nest.status === 'PAUSED'" [class.badge-completed]="nest.status === 'COMPLETED'">
                    {{ statusLabel(nest.status) }}
                  </span>
                </div>
                <span class="dot" [style.background]="nest.color"></span>
              </div>
              <div class="progress mb-2">
                <div class="progress-bar" [style.width.%]="nest.progressPercent" [style.background]="nest.color"></div>
              </div>
              <div class="d-flex justify-content-between small">
                <span>{{ money(nest.currentAmount) }}</span>
                <span class="muted">{{ money(nest.targetAmount) }}</span>
              </div>
              <div class="small muted mt-2">Prazo {{ date(nest.deadline) }}</div>
            </a>
          </div>
        }
      </div>
    }
  `
})
export class NinhosComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly nests = signal<Nest[]>([]);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    targetAmount: [0, [Validators.required, Validators.min(0.01)]],
    deadline: [''],
    color: ['#1F4E3D', Validators.required]
  });

  ngOnInit(): void {
    this.reload();
  }

  toggleForm(): void {
    this.showForm.update((value) => !value);
    this.formError.set('');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const value = this.form.getRawValue();
    this.api.createNest({
      name: value.name,
      description: value.description || null,
      targetAmount: Number(value.targetAmount),
      deadline: value.deadline || null,
      color: value.color
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ name: '', description: '', targetAmount: 0, deadline: '', color: '#1F4E3D' });
        this.showForm.set(false);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Nao foi possivel salvar');
      }
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
    this.api.nests().subscribe({
      next: (nests) => this.nests.set(nests),
      error: () => this.error.set('Nao foi possivel carregar os ninhos')
    });
  }
}
