export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type NestStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  nestId: number | null;
  nestName: string | null;
  createdAt: string;
}

export interface Nest {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercent: number;
  deadline: string | null;
  status: NestStatus;
  color: string;
  createdAt: string;
}

export interface Contribution {
  id: number;
  nestId: number;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface CategoryExpense {
  categoryId: number;
  name: string;
  color: string;
  total: number;
}

export interface Dashboard {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  reservedInNests: number;
  activeNests: number;
  completedNests: number;
  expensesByCategory: CategoryExpense[];
  nests: Nest[];
  recentTransactions: Transaction[];
}

export interface ApiError {
  message: string;
  fields?: { field: string; message: string }[];
}
