import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { Category } from '../../core/models/models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-start mb-4">
      <div>
        <div class="metric-label mb-1">Organizacao</div>
        <h1 class="page-title mb-0">Categorias</h1>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-5">
        <div class="surface p-4">
          <h2 class="h5 mb-3">{{ editingId() ? 'Editar categoria' : 'Nova categoria' }}</h2>
          <form [formGroup]="form" (ngSubmit)="save()" novalidate>
            <div class="mb-3">
              <label class="form-label" for="name">Nome</label>
              <input id="name" class="form-control" formControlName="name" />
            </div>
            <div class="mb-3">
              <label class="form-label" for="color">Cor</label>
              <input id="color" class="form-control form-control-color" type="color" formControlName="color" />
            </div>
            @if (formError()) {
              <div class="alert alert-danger py-2">{{ formError() }}</div>
            }
            <div class="d-flex gap-2">
              <button class="btn btn-forest" type="submit" [disabled]="form.invalid || saving()">Salvar</button>
              @if (editingId()) {
                <button class="btn btn-ghost" type="button" (click)="cancel()">Cancelar</button>
              }
            </div>
          </form>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="surface p-4">
          @if (error()) {
            <div class="alert alert-danger">{{ error() }}</div>
          }
          @if (items().length === 0) {
            <div class="empty-state">Nenhuma categoria.</div>
          } @else {
            @for (item of items(); track item.id) {
              <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                  <span class="dot me-2" [style.background]="item.color"></span>
                  {{ item.name }}
                </div>
                <div>
                  <button class="btn btn-sm btn-ghost me-1" type="button" (click)="edit(item)">Editar</button>
                  <button class="btn btn-sm btn-ghost" type="button" (click)="remove(item.id)">Excluir</button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly items = signal<Category[]>([]);
  readonly error = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    color: ['#2F6B4F', Validators.required]
  });

  ngOnInit(): void {
    this.reload();
  }

  edit(item: Category): void {
    this.editingId.set(item.id);
    this.form.reset({ name: item.name, color: item.color });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', color: '#2F6B4F' });
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
    const request = this.editingId()
      ? this.api.updateCategory(this.editingId()!, value)
      : this.api.createCategory(value);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(err.error?.message ?? 'Nao foi possivel salvar');
      }
    });
  }

  remove(id: number): void {
    this.api.deleteCategory(id).subscribe({
      next: () => this.reload(),
      error: (err: HttpErrorResponse) => this.error.set(err.error?.message ?? 'Nao foi possivel excluir')
    });
  }

  private reload(): void {
    this.api.categories().subscribe({
      next: (items) => this.items.set(items),
      error: () => this.error.set('Nao foi possivel carregar as categorias')
    });
  }
}
