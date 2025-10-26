// backend/src/models/Expense.ts

export interface Expense {
  id: number;
  cropId: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export enum ExpenseCategory {
  SEEDS = 'SEEDS',
  FERTILIZER = 'FERTILIZER',
  PESTICIDES = 'PESTICIDES',
  LABOR = 'LABOR',
  IRRIGATION = 'IRRIGATION',
  EQUIPMENT = 'EQUIPMENT',
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  TRANSPORTATION = 'TRANSPORTATION',
  OTHER = 'OTHER'
}