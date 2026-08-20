export type BudgetStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "OVER_BUDGET"
  | "ARCHIVED";

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  allocatedAmount: string | number;
  spentAmount: string | number;
  status: BudgetStatus;
  periodMonth: string;
  categoryId: string;
  category: BudgetCategory;
}

export interface BudgetSummary {
  income: number;
  allocated: number;
  remainingToAllocate: number;
  isOverAllocated: boolean;
}

export interface BudgetListPayload {
  budgets: Budget[];
  summary: BudgetSummary;
}
