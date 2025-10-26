// backend/src/types/expense.ts

export interface Expense {
  id: number;
  crop_id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  cropId: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  category?: string;
  amount?: number;
  date?: string;
  notes?: string;
}