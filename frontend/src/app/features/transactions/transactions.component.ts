import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Category, Nest, Transaction } from '../../core/models/models';
import { formatBrl, formatDate, todayIso } from '../../core/services/money';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <div class="metric-label mb-1">Fluxo</div>
        <h1 class="page-title mb-0">Movimentos</h1>
      </div>
      <button class="btn btn-gold" type="button" (click)="toggleForm()">
        {{ showForm() ? 'Cancelar' : 'Registrar' }}
      </button>
    </div>

    @if (showForm()) {
      <div class="surface p-4 mb-4">
        <form class="row g-3" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="col-md-6">
            <label class="form-label" for="description">Descricao</label>
            <input id="description" class="form-control" formControlName="description" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="amount">Valor</label>
            <input id="amount" class="form-control" type="number" min="0.01" step="0.01" formControlName="amount" />
          </div>
          <div class="col-md-3">
            <label class="form-label" for="type">Tipo</label>
            <select id="type" class="form-select" formControlName="type">
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label" for="date">Data</label>
            <input id="date" class="form-control" type="date" formControlName="date" />
          </div>
          <div class="col-md-4">
            <label class="form-label" for="categoryId">Categoria</label>
            <select id="categoryId" class="form-select" formControlName="categoryId">
              <option [ngValue]="0">Selecione</option>
              @for (category of categories(); track category.id) {
                <option [ngValue]="category.id">{{ category.name }}</option>
              }
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label" for="nestId">Ninho (opcional)</label>
            <select id="nestId" class="form-select" formControlName="nestId">
              <option [ngValue]="null">Nenhum</option>
              @for (nest of nests(); track nest.id) {
                <option [ngValue]="nest.id">{{ nest.name }}</option>
              }
            </select>
          </div>
          @if (formError()) {
            <div class="col-12"><div class="alert alert-danger py-2 mb-0">{{ formError() }}</div></div>
          }
          <div class="col-12">
            <button class="btn btn-forest" type="submit" [disabled]="form.invalid || saving()">
              {{ editingId() ? 'Atualizar' : 'Salvar movimento' }}
            </button>
          </div>
        </form>
      </div>
    }

    @if (error()) {
      <div class="alert alert-danger">{{ error() }}</div>
    }

    <div class="surface p-4">
      @if (items().length === 0) {
        <div class="empty-state">Nenhum movimento ainda.</div>
      } @else {
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descricao</th>
                <th>Categoria</th>
                <th>Ninho</th>
                <th class="text-end">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.id) {
                <tr>
                  <td>{{ date(item.date) }}</td>
                  <td>{{ item.description }}</td>
                  <td><span class="dot me-2" [style.background]="item.categoryColor"></span>{{ item.categoryName }}</td>
                  <td>{{ item.nestName || '—' }}</td>
                  <td class="text-end" [class.amount-in]="item.type === 'INCOME'" [class.amount-out]="item.type === 'EXPENSE'">
                    {{ item.type === 'INCOME' ? '+' : '-' }} {{ money(item.amount) }}
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-ghost me-1" type="button" (click)="edit(item)">Editar</button>
                    <button class="btn btn-sm btn-ghost" type="button" (click)="remove(item.id)">Excluir</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class TransactionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly nests = signal<Nest[]>([]);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(2)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['EXPENSE' as 'INCOME' | 'EXPENSE', Validators.required],
    date: [todayIso(), Validators.required],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    nestId: this.fb.control<number | null>(null)
  });

  ngOnInit(): void {
    this.reload();
    this.api.categories().subscribe((items) => this.categories.set(items));
    this.api.nests().subscribe((items) => this.nests.set(items));
  }

  toggleForm(): void {
    this.showForm.update((value) => !value);
    this.editingId.set(null);
    this.form.reset({
      description: '',
      amount: 0,
      type: 'EXPENSE',
      date: todayIso(),
      categoryId: 0,
      nestId: null
    });
    this.formError.set('');
  }

  edit(item: Transaction): void {
    this.showForm.set(true);
    this.editingId.set(item.id);
    this.form.reset({
      description: item.description,
      amount: item.amount,
      type: item.type,
      date: item.date,
      categoryId: item.categoryId,
      nestId: item.nestId
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    const value = this.form.getRawValue();
    const payload = {
      description: value.description,
      amount: Number(value.amount),
      type: value.type,
      date: value.date,
      categoryId: Number(value.categoryId),
      nestId: value.nestId
    };
    const request = this.editingId()
      ? this.api.updateTransaction(this.editingId()!, payload)
      : this.api.createTransaction(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.editingId.set(null);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Nao foi possivel salvar');
      }
    });
  }

  remove(id: number): void {
    this.api.deleteTransaction(id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Nao foi possivel excluir')
    });
  }

  money(value: number): string {
    return formatBrl(value);
  }

  date(value: string): string {
    return formatDate(value);
  }

  private reload(): void {
    this.api.transactions().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Nao foi possivel carregar os movimentos')
    });
  }
}
