// backend/src/repositories/LivestockExpenseRepository.ts
import { pool } from '../config/database';

export interface LivestockExpense {
  id: number;
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  flock_name?: string;
  animal_identifier?: string;
}

export class LivestockExpenseRepository {
  async findAll(): Promise<LivestockExpense[]> {
    try {
      console.log('🔄 Querying livestock_expenses table...');
      const query = `
        SELECT 
          le.*, 
          f.name as flock_name, 
          l.tag_id as animal_identifier
        FROM livestock_expenses le
        LEFT JOIN flocks f ON le.flock_id = f.id
        LEFT JOIN livestock l ON le.livestock_id = l.id
        ORDER BY le.created_at DESC
      `;
      console.log('📋 SQL Query:', query);
      
      const result = await pool.query(query);
      console.log('📦 Query result:', result.rows.length, 'expenses found');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error in findAll livestock expenses:', error);
      throw error;
    }
  }

  async findByFlockId(flockId: number): Promise<LivestockExpense[]> {
    try {
      console.log(`🔄 Querying livestock expenses for flock ${flockId}...`);
      const query = `
        SELECT 
          le.*, 
          f.name as flock_name, 
          l.tag_id as animal_identifier
        FROM livestock_expenses le
        LEFT JOIN flocks f ON le.flock_id = f.id
        LEFT JOIN livestock l ON le.livestock_id = l.id
        WHERE le.flock_id = $1
        ORDER BY le.created_at DESC
      `;
      
      const result = await pool.query(query, [flockId]);
      console.log(`📦 Found ${result.rows.length} expenses for flock ${flockId}`);
      
      return result.rows;
    } catch (error) {
      console.error(`❌ Error finding expenses for flock ${flockId}:`, error);
      throw error;
    }
  }

  async findById(id: number): Promise<LivestockExpense | null> {
    try {
      console.log(`🔄 Querying livestock expense with ID ${id}...`);
      const query = `
        SELECT 
          le.*, 
          f.name as flock_name, 
          l.tag_id as animal_identifier
        FROM livestock_expenses le
        LEFT JOIN flocks f ON le.flock_id = f.id
        LEFT JOIN livestock l ON le.livestock_id = l.id
        WHERE le.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log(`📦 No expense found with ID ${id}`);
        return null;
      }
      
      console.log(`📦 Found expense with ID ${id}`);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error finding expense with ID ${id}:`, error);
      throw error;
    }
  }

  async create(expenseData: Omit<LivestockExpense, 'id' | 'created_at' | 'updated_at'>): Promise<LivestockExpense> {
    try {
      console.log('🔄 Creating new livestock expense...', expenseData);
      const { flock_id, livestock_id, description, category, amount, date, notes } = expenseData;
      
      const query = `
        INSERT INTO livestock_expenses 
          (flock_id, livestock_id, description, category, amount, date, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        flock_id,
        livestock_id || null,
        description,
        category,
        amount,
        date,
        notes || null
      ]);
      
      console.log('✅ Livestock expense created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating livestock expense:', error);
      throw error;
    }
  }

  async update(id: number, expenseData: Partial<LivestockExpense>): Promise<LivestockExpense | null> {
    try {
      console.log(`🔄 Updating livestock expense with ID ${id}...`, expenseData);
      const { flock_id, livestock_id, description, category, amount, date, notes } = expenseData;
      
      const query = `
        UPDATE livestock_expenses 
        SET 
          flock_id = COALESCE($1, flock_id),
          livestock_id = COALESCE($2, livestock_id),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          amount = COALESCE($5, amount),
          date = COALESCE($6, date),
          notes = COALESCE($7, notes),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        flock_id,
        livestock_id,
        description,
        category,
        amount,
        date,
        notes,
        id
      ]);
      
      if (result.rows.length === 0) {
        console.log(`📦 No expense found with ID ${id} to update`);
        return null;
      }
      
      console.log('✅ Livestock expense updated successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error updating livestock expense with ID ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      console.log(`🔄 Deleting livestock expense with ID ${id}...`);
      const result = await pool.query('DELETE FROM livestock_expenses WHERE id = $1', [id]);
      const deleted = (result.rowCount ?? 0) > 0;
      
      if (deleted) {
        console.log(`✅ Livestock expense with ID ${id} deleted successfully`);
      } else {
        console.log(`📦 No expense found with ID ${id} to delete`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ Error deleting livestock expense with ID ${id}:`, error);
      throw error;
    }
  }

  async getExpenseSummary(): Promise<any> {
    try {
      console.log('🔄 Getting livestock expense summary...');
      const query = `
        SELECT 
          category,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM livestock_expenses
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query);
      console.log('📦 Expense summary retrieved:', result.rows.length, 'categories');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting livestock expense summary:', error);
      throw error;
    }
  }

  async getFlockExpenseSummary(): Promise<any> {
    try {
      console.log('🔄 Getting flock expense summary...');
      const query = `
        SELECT 
          f.id as flock_id,
          f.name as flock_name,
          COUNT(le.id) as expense_count,
          COALESCE(SUM(le.amount), 0) as total_expenses,
          COUNT(DISTINCT l.id) as animal_count,
          CASE 
            WHEN COUNT(DISTINCT l.id) > 0 THEN 
              COALESCE(SUM(le.amount), 0) / COUNT(DISTINCT l.id)
            ELSE 0 
          END as average_cost_per_animal
        FROM flocks f
        LEFT JOIN livestock_expenses le ON f.id = le.flock_id
        LEFT JOIN livestock l ON f.id = l.flock_id
        GROUP BY f.id, f.name
        ORDER BY total_expenses DESC
      `;
      
      const result = await pool.query(query);
      console.log('📦 Flock expense summary retrieved:', result.rows.length, 'flocks');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting flock expense summary:', error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<LivestockExpense[]> {
    try {
      console.log(`🔄 Getting expenses between ${startDate} and ${endDate}...`);
      const query = `
        SELECT 
          le.*, 
          f.name as flock_name, 
          l.tag_id as animal_identifier
        FROM livestock_expenses le
        LEFT JOIN flocks f ON le.flock_id = f.id
        LEFT JOIN livestock l ON le.livestock_id = l.id
        WHERE le.date BETWEEN $1 AND $2
        ORDER BY le.date DESC, le.amount DESC
      `;
      
      const result = await pool.query(query, [startDate, endDate]);
      console.log(`📦 Found ${result.rows.length} expenses in date range`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting expenses by date range:', error);
      throw error;
    }
  }

  async getExpensesByCategory(category: string): Promise<LivestockExpense[]> {
    try {
      console.log(`🔄 Getting expenses for category: ${category}...`);
      const query = `
        SELECT 
          le.*, 
          f.name as flock_name, 
          l.tag_id as animal_identifier
        FROM livestock_expenses le
        LEFT JOIN flocks f ON le.flock_id = f.id
        LEFT JOIN livestock l ON le.livestock_id = l.id
        WHERE le.category = $1
        ORDER BY le.created_at DESC
      `;
      
      const result = await pool.query(query, [category]);
      console.log(`📦 Found ${result.rows.length} expenses for category ${category}`);
      
      return result.rows;
    } catch (error) {
      console.error(`❌ Error getting expenses for category ${category}:`, error);
      throw error;
    }
  }

  async getMonthlyExpenseSummary(year?: number): Promise<any[]> {
    try {
      console.log(`🔄 Getting monthly expense summary for year: ${year || 'all'}...`);
      let query = `
        SELECT 
          EXTRACT(YEAR FROM date) as year,
          EXTRACT(MONTH FROM date) as month,
          category,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM livestock_expenses
      `;
      
      const params: any[] = [];
      
      if (year) {
        query += ' WHERE EXTRACT(YEAR FROM date) = $1';
        params.push(year);
      }
      
      query += `
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), category
        ORDER BY year, month, total_amount DESC
      `;
      
      const result = await pool.query(query, params);
      console.log('📦 Monthly expense summary retrieved:', result.rows.length, 'records');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting monthly expense summary:', error);
      throw error;
    }
  }

  async getTopExpenses(limit: number = 10): Promise<LivestockExpense[]> {
    try {
      console.log(`🔄 Getting top ${limit} expenses...`);
      const query = `
        SELECT 
          le.*, 
          f.name as flock_name, 
          l.tag_id as animal_identifier
        FROM livestock_expenses le
        LEFT JOIN flocks f ON le.flock_id = f.id
        LEFT JOIN livestock l ON le.livestock_id = l.id
        ORDER BY le.amount DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      console.log(`📦 Retrieved top ${result.rows.length} expenses`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting top expenses:', error);
      throw error;
    }
  }
}