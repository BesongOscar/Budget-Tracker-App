export type TransactionType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  currencyCode: string;
  expoPushToken: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: TransactionType;
  userId: string;
  deletedAt: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  type: TransactionType;
  categoryId: string;
  category?: Category;
  userId: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  limitAmount: number;
  spentAmount: number;
  periodMonth: string;
  categoryId: string;
  category?: Category;
  userId: string;
}

export interface DashboardData {
  balance: number;
  income: number;
  expense: number;
  recentTransactions: Transaction[];
  budgetProgress: Budget[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
