// backend/src/repositories/FarmExpenseRepository.ts
import { pool } from '../config/database';

export interface FarmExpense {
  id: number;
  expense_type: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  date: string;
  payment_method?: string;
  supplier?: string;
  receipt_number?: string;
  notes?: string;
  crop_id?: number;
  flock_id?: number;
  livestock_id?: number;
  created_at: string;
  updated_at: string;
  crop_name?: string;
  flock_name?: string;
  animal_identifier?: string;
}

export class FarmExpenseRepository {
  async findAll(): Promise<FarmExpense[]> {
    try {
      console.log('🔄 Fetching all farm expenses...');
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        ORDER BY fe.date DESC, fe.created_at DESC
      `;
      console.log('📋 SQL Query:', query);
      
      const result = await pool.query(query);
      console.log('📦 Found', result.rows.length, 'farm expenses');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching all farm expenses:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<FarmExpense | null> {
    try {
      console.log(`🔄 Fetching farm expense with ID ${id}...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        WHERE fe.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log(`📦 No farm expense found with ID ${id}`);
        return null;
      }
      
      console.log(`📦 Found farm expense with ID ${id}`);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error fetching farm expense with ID ${id}:`, error);
      throw error;
    }
  }

  async findByType(expenseType: string): Promise<FarmExpense[]> {
    try {
      console.log(`🔄 Fetching farm expenses of type: ${expenseType}...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        WHERE fe.expense_type = $1
        ORDER BY fe.date DESC
      `;
      
      const result = await pool.query(query, [expenseType]);
      console.log(`📦 Found ${result.rows.length} expenses of type ${expenseType}`);
      
      return result.rows;
    } catch (error) {
      console.error(`❌ Error fetching farm expenses of type ${expenseType}:`, error);
      throw error;
    }
  }

  async findByFlockId(flockId: number): Promise<FarmExpense[]> {
    try {
      console.log(`🔄 Fetching farm expenses for flock ID ${flockId}...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        WHERE fe.flock_id = $1 OR (fe.expense_type = 'livestock' AND fe.flock_id IS NULL)
        ORDER BY fe.date DESC
      `;
      
      const result = await pool.query(query, [flockId]);
      console.log(`📦 Found ${result.rows.length} expenses for flock ${flockId}`);
      
      return result.rows;
    } catch (error) {
      console.error(`❌ Error fetching farm expenses for flock ${flockId}:`, error);
      throw error;
    }
  }

  async findByCropId(cropId: number): Promise<FarmExpense[]> {
    try {
      console.log(`🔄 Fetching farm expenses for crop ID ${cropId}...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        WHERE fe.crop_id = $1
        ORDER BY fe.date DESC
      `;
      
      const result = await pool.query(query, [cropId]);
      console.log(`📦 Found ${result.rows.length} expenses for crop ${cropId}`);
      
      return result.rows;
    } catch (error) {
      console.error(`❌ Error fetching farm expenses for crop ${cropId}:`, error);
      throw error;
    }
  }

  async create(expenseData: Omit<FarmExpense, 'id' | 'created_at' | 'updated_at'>): Promise<FarmExpense> {
    try {
      console.log('🔄 Creating new farm expense...', expenseData);
      const {
        expense_type,
        category,
        subcategory,
        description,
        amount,
        quantity,
        unit,
        unit_price,
        date,
        payment_method,
        supplier,
        receipt_number,
        notes,
        crop_id,
        flock_id,
        livestock_id
      } = expenseData;
      
      const query = `
        INSERT INTO farm_expenses (
          expense_type, category, subcategory, description, amount, quantity, unit, unit_price,
          date, payment_method, supplier, receipt_number, notes, crop_id, flock_id, livestock_id,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        expense_type,
        category,
        subcategory || null,
        description,
        amount,
        quantity || null,
        unit || null,
        unit_price || null,
        date,
        payment_method || null,
        supplier || null,
        receipt_number || null,
        notes || null,
        crop_id || null,
        flock_id || null,
        livestock_id || null
      ]);
      
      console.log('✅ Farm expense created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error creating farm expense:', error);
      throw error;
    }
  }

  async update(id: number, expenseData: Partial<FarmExpense>): Promise<FarmExpense | null> {
    try {
      console.log(`🔄 Updating farm expense with ID ${id}...`, expenseData);
      const {
        expense_type,
        category,
        subcategory,
        description,
        amount,
        quantity,
        unit,
        unit_price,
        date,
        payment_method,
        supplier,
        receipt_number,
        notes,
        crop_id,
        flock_id,
        livestock_id
      } = expenseData;
      
      const query = `
        UPDATE farm_expenses 
        SET expense_type = COALESCE($1, expense_type),
            category = COALESCE($2, category),
            subcategory = COALESCE($3, subcategory),
            description = COALESCE($4, description),
            amount = COALESCE($5, amount),
            quantity = COALESCE($6, quantity),
            unit = COALESCE($7, unit),
            unit_price = COALESCE($8, unit_price),
            date = COALESCE($9, date),
            payment_method = COALESCE($10, payment_method),
            supplier = COALESCE($11, supplier),
            receipt_number = COALESCE($12, receipt_number),
            notes = COALESCE($13, notes),
            crop_id = COALESCE($14, crop_id),
            flock_id = COALESCE($15, flock_id),
            livestock_id = COALESCE($16, livestock_id),
            updated_at = NOW()
        WHERE id = $17
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        expense_type,
        category,
        subcategory,
        description,
        amount,
        quantity,
        unit,
        unit_price,
        date,
        payment_method,
        supplier,
        receipt_number,
        notes,
        crop_id,
        flock_id,
        livestock_id,
        id
      ]);
      
      if (result.rows.length === 0) {
        console.log(`📦 No farm expense found with ID ${id} to update`);
        return null;
      }
      
      console.log('✅ Farm expense updated successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error updating farm expense with ID ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      console.log(`🔄 Deleting farm expense with ID ${id}...`);
      const result = await pool.query('DELETE FROM farm_expenses WHERE id = $1', [id]);
      const deleted = (result.rowCount ?? 0) > 0;
      
      if (deleted) {
        console.log(`✅ Farm expense with ID ${id} deleted successfully`);
      } else {
        console.log(`📦 No farm expense found with ID ${id} to delete`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ Error deleting farm expense with ID ${id}:`, error);
      throw error;
    }
  }

  async getExpenseSummary(): Promise<any> {
    try {
      console.log('🔄 Getting farm expense summary...');
      const query = `
        SELECT 
          expense_type,
          category,
          subcategory,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM farm_expenses
        GROUP BY expense_type, category, subcategory
        ORDER BY expense_type, total_amount DESC
      `;
      
      const result = await pool.query(query);
      console.log('📦 Expense summary retrieved:', result.rows.length, 'categories');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting farm expense summary:', error);
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
          expense_type,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM farm_expenses
      `;
      
      const params: any[] = [];
      
      if (year) {
        query += ' WHERE EXTRACT(YEAR FROM date) = $1';
        params.push(year);
      }
      
      query += `
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), expense_type
        ORDER BY year, month, expense_type
      `;
      
      const result = await pool.query(query, params);
      console.log('📦 Monthly expense summary retrieved:', result.rows.length, 'records');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting monthly expense summary:', error);
      throw error;
    }
  }

  async getFlockExpenseSummary(flockId?: number): Promise<any[]> {
    try {
      console.log(`🔄 Getting flock expense summary for flock: ${flockId || 'all'}...`);
      let query = `
        SELECT 
          f.id as flock_id,
          f.name as flock_name,
          fe.category,
          fe.subcategory,
          COUNT(fe.id) as expense_count,
          SUM(fe.amount) as total_amount,
          AVG(fe.amount) as average_amount
        FROM flocks f
        LEFT JOIN farm_expenses fe ON f.id = fe.flock_id
      `;
      
      const params: any[] = [];
      
      if (flockId) {
        query += ' WHERE f.id = $1';
        params.push(flockId);
      }
      
      query += `
        GROUP BY f.id, f.name, fe.category, fe.subcategory
        HAVING COUNT(fe.id) > 0
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query, params);
      console.log('📦 Flock expense summary retrieved:', result.rows.length, 'records');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting flock expense summary:', error);
      throw error;
    }
  }

  async getTopExpenses(limit: number = 10): Promise<FarmExpense[]> {
    try {
      console.log(`🔄 Getting top ${limit} farm expenses...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        ORDER BY fe.amount DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      console.log(`📦 Retrieved top ${result.rows.length} farm expenses`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting top farm expenses:', error);
      throw error;
    }
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<FarmExpense[]> {
    try {
      console.log(`🔄 Getting farm expenses between ${startDate} and ${endDate}...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        WHERE fe.date BETWEEN $1 AND $2
        ORDER BY fe.date DESC, fe.amount DESC
      `;
      
      const result = await pool.query(query, [startDate, endDate]);
      console.log(`📦 Found ${result.rows.length} expenses in date range`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting farm expenses by date range:', error);
      throw error;
    }
  }

  async getSupplierSummary(): Promise<any[]> {
    try {
      console.log('🔄 Getting supplier summary...');
      const query = `
        SELECT 
          supplier,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          MIN(date) as first_transaction,
          MAX(date) as last_transaction
        FROM farm_expenses
        WHERE supplier IS NOT NULL AND supplier != ''
        GROUP BY supplier
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query);
      console.log('📦 Supplier summary retrieved:', result.rows.length, 'suppliers');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting supplier summary:', error);
      throw error;
    }
  }

  async getExpenseTrends(timeframe: string = 'monthly'): Promise<any[]> {
    try {
      console.log(`🔄 Getting expense trends for timeframe: ${timeframe}...`);
      
      let periodFormat = '';
      switch (timeframe) {
        case 'daily':
          periodFormat = 'TO_CHAR(date, \'YYYY-MM-DD\') as period';
          break;
        case 'weekly':
          periodFormat = 'EXTRACT(YEAR FROM date) || \'-\' || EXTRACT(WEEK FROM date) as period';
          break;
        case 'monthly':
          periodFormat = 'TO_CHAR(date, \'YYYY-MM\') as period';
          break;
        case 'yearly':
          periodFormat = 'EXTRACT(YEAR FROM date) as period';
          break;
        default:
          periodFormat = 'TO_CHAR(date, \'YYYY-MM\') as period';
      }
      
      const query = `
        SELECT 
          ${periodFormat},
          expense_type,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM farm_expenses
        GROUP BY ${periodFormat.replace(' as period', '')}, expense_type
        ORDER BY period, expense_type
      `;
      
      const result = await pool.query(query);
      console.log('📦 Expense trends retrieved:', result.rows.length, 'periods');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting expense trends:', error);
      throw error;
    }
  }

  async getCategoryBreakdown(expenseType?: string): Promise<any[]> {
    try {
      console.log(`🔄 Getting category breakdown for expense type: ${expenseType || 'all'}...`);
      let query = `
        SELECT 
          expense_type,
          category,
          subcategory,
          COUNT(*) as expense_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount,
          (SUM(amount) / (SELECT SUM(amount) FROM farm_expenses 
            ${expenseType ? 'WHERE expense_type = $1' : ''}) * 100) as percentage_of_total
        FROM farm_expenses
      `;
      
      const params: any[] = [];
      
      if (expenseType) {
        query += ' WHERE expense_type = $1';
        params.push(expenseType);
      }
      
      query += `
        GROUP BY expense_type, category, subcategory
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query, params);
      console.log('📦 Category breakdown retrieved:', result.rows.length, 'categories');
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting category breakdown:', error);
      throw error;
    }
  }

  async getRecentExpenses(limit: number = 20): Promise<FarmExpense[]> {
    try {
      console.log(`🔄 Getting ${limit} recent farm expenses...`);
      const query = `
        SELECT 
          fe.*,
          c.name as crop_name,
          f.name as flock_name,
          l.tag_id as animal_identifier
        FROM farm_expenses fe
        LEFT JOIN crops c ON fe.crop_id = c.id
        LEFT JOIN flocks f ON fe.flock_id = f.id
        LEFT JOIN livestock l ON fe.livestock_id = l.id
        ORDER BY fe.created_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      console.log(`📦 Retrieved ${result.rows.length} recent farm expenses`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ Error getting recent farm expenses:', error);
      throw error;
    }
  }

  async getExpenseStats(): Promise<any> {
    try {
      console.log('🔄 Getting farm expense statistics...');
      
      const queries = {
        totalStats: `
          SELECT 
            COUNT(*) as total_expenses,
            SUM(amount) as total_amount,
            AVG(amount) as average_amount,
            MIN(amount) as min_amount,
            MAX(amount) as max_amount,
            MIN(date) as first_expense_date,
            MAX(date) as last_expense_date
          FROM farm_expenses
        `,
        
        typeStats: `
          SELECT 
            expense_type,
            COUNT(*) as expense_count,
            SUM(amount) as total_amount,
            AVG(amount) as average_amount
          FROM farm_expenses
          GROUP BY expense_type
          ORDER BY total_amount DESC
        `,
        
        monthlyStats: `
          SELECT 
            TO_CHAR(date, 'YYYY-MM') as month,
            COUNT(*) as expense_count,
            SUM(amount) as total_amount
          FROM farm_expenses
          GROUP BY TO_CHAR(date, 'YYYY-MM')
          ORDER BY month DESC
          LIMIT 12
        `
      };
      
      const [totalStatsResult, typeStatsResult, monthlyStatsResult] = await Promise.all([
        pool.query(queries.totalStats),
        pool.query(queries.typeStats),
        pool.query(queries.monthlyStats)
      ]);
      
      const stats = {
        totals: totalStatsResult.rows[0] || {},
        by_type: typeStatsResult.rows,
        monthly: monthlyStatsResult.rows
      };
      
      console.log('📦 Farm expense statistics retrieved');
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting farm expense statistics:', error);
      throw error;
    }
  }
}