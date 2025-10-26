// backend/src/repositories/ExpenseRepository.ts

import { pool } from '../config/database';

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

export class ExpenseRepository {
  // ADD THIS MISSING METHOD
  async findAll(): Promise<Expense[]> {
    const result = await pool.query(
      'SELECT * FROM expenses ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async findByCropId(cropId: number): Promise<Expense[]> {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE crop_id = $1 ORDER BY created_at DESC',
      [cropId]
    );
    return result.rows;
  }

  async create(expenseData: CreateExpenseRequest): Promise<Expense> {
    const { cropId, description, category, amount, date, notes } = expenseData;
    
    const query = `
      INSERT INTO expenses (crop_id, description, category, amount, date, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [cropId, description, category, amount, date, notes || null];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, expenseData: UpdateExpenseRequest): Promise<Expense | null> {
    const { description, category, amount, date, notes } = expenseData;
    
    const query = `
      UPDATE expenses 
      SET description = COALESCE($1, description),
          category = COALESCE($2, category),
          amount = COALESCE($3, amount),
          date = COALESCE($4, date),
          notes = COALESCE($5, notes),
          updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [description, category, amount, date, notes || null, id];
    
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1', [parseInt(id)]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByCropId(cropId: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM expenses WHERE crop_id = $1', [cropId]);
    return (result.rowCount ?? 0) > 0;
  }

  async findById(id: number): Promise<Expense | null> {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Optional: Add method to get expenses by date range
  async findByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE date BETWEEN $1 AND $2 ORDER BY date DESC',
      [startDate, endDate]
    );
    return result.rows;
  }

  // Optional: Add method to get expenses by category
  async findByCategory(category: string): Promise<Expense[]> {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    return result.rows;
  }

  // Optional: Add method to get total expenses
  async getTotalExpenses(): Promise<number> {
    const result = await pool.query('SELECT SUM(amount) as total FROM expenses');
    return parseFloat(result.rows[0]?.total || '0');
  }
}

// Export the repository instance
export const expenseRepository = new ExpenseRepository();