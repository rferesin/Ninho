import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, Contribution, Dashboard, Nest, Transaction } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  dashboard() {
    return this.http.get<Dashboard>('/api/dashboard');
  }

  categories() {
    return this.http.get<Category[]>('/api/categories');
  }

  createCategory(body: { name: string; color: string }) {
    return this.http.post<Category>('/api/categories', body);
  }

  updateCategory(id: number, body: { name: string; color: string }) {
    return this.http.put<Category>(`/api/categories/${id}`, body);
  }

  deleteCategory(id: number) {
    return this.http.delete<void>(`/api/categories/${id}`);
  }

  transactions() {
    return this.http.get<Transaction[]>('/api/transactions');
  }

  createTransaction(body: TransactionPayload) {
    return this.http.post<Transaction>('/api/transactions', body);
  }

  updateTransaction(id: number, body: TransactionPayload) {
    return this.http.put<Transaction>(`/api/transactions/${id}`, body);
  }

  deleteTransaction(id: number) {
    return this.http.delete<void>(`/api/transactions/${id}`);
  }

  nests() {
    return this.http.get<Nest[]>('/api/nests');
  }

  nest(id: number) {
    return this.http.get<Nest>(`/api/nests/${id}`);
  }

  createNest(body: NestPayload) {
    return this.http.post<Nest>('/api/nests', body);
  }

  updateNest(id: number, body: NestPayload) {
    return this.http.put<Nest>(`/api/nests/${id}`, body);
  }

  deleteNest(id: number) {
    return this.http.delete<void>(`/api/nests/${id}`);
  }

  contributions(nestId: number) {
    return this.http.get<Contribution[]>(`/api/nests/${nestId}/contributions`);
  }

  contribute(nestId: number, body: { amount: number; date: string; note?: string }) {
    return this.http.post<Contribution>(`/api/nests/${nestId}/contributions`, body);
  }

  deleteContribution(nestId: number, contributionId: number) {
    return this.http.delete<void>(`/api/nests/${nestId}/contributions/${contributionId}`);
  }
}

export interface TransactionPayload {
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  categoryId: number;
  nestId: number | null;
}

export interface NestPayload {
  name: string;
  description?: string | null;
  targetAmount: number;
  deadline?: string | null;
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  color: string;
}
