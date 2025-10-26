// backend/src/models/LivestockExpense.ts
export interface LivestockExpense {
  id: number;
  flockId: number;
  livestockId?: number;
  description: string;
  category: LivestockExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum LivestockExpenseCategory {
  FEED = 'FEED',
  VETERINARY = 'VETERINARY',
  MEDICATION = 'MEDICATION',
  EQUIPMENT = 'EQUIPMENT',
  SHELTER = 'SHELTER',
  LABOR = 'LABOR',
  TRANSPORTATION = 'TRANSPORTATION',
  SUPPLIES = 'SUPPLIES',
  OTHER = 'OTHER'
}

export interface CreateLivestockExpenseRequest extends Omit<LivestockExpense, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateLivestockExpenseRequest extends Partial<Omit<LivestockExpense, 'id' | 'createdAt' | 'updatedAt'>> {}