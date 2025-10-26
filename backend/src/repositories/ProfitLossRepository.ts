// backend/src/repositories/ProfitLossRepository.ts
import { pool } from '../config/database';

export class ProfitLossRepository {
  async getLivestockProfitLoss(flockId?: number, startDate?: string, endDate?: string): Promise<any> {
    try {
      let query = `
        SELECT 
          -- Revenue
          COALESCE(SUM(s.total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN s.sale_type = 'animal' THEN s.total_amount ELSE 0 END), 0) as animal_sales_revenue,
          COALESCE(SUM(CASE WHEN s.sale_type = 'product' THEN s.total_amount ELSE 0 END), 0) as product_sales_revenue,
          
          -- Costs
          COALESCE(SUM(l.purchase_price), 0) as total_purchase_cost,
          COALESCE(SUM(le.amount), 0) as total_expenses,
          COALESCE(SUM(mt.cost), 0) as total_medical_costs,
          
          -- Calculations
          (COALESCE(SUM(s.total_amount), 0) - 
           COALESCE(SUM(l.purchase_price), 0) - 
           COALESCE(SUM(le.amount), 0) - 
           COALESCE(SUM(mt.cost), 0)) as net_profit_loss,
           
          -- Animal counts
          COUNT(DISTINCT l.id) as total_animals,
          COUNT(DISTINCT CASE WHEN l.status = 'sold' THEN l.id END) as sold_animals,
          COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_animals
          
        FROM livestock l
        LEFT JOIN sales s ON l.id = s.livestock_id OR l.flock_id = s.flock_id
        LEFT JOIN livestock_expenses le ON l.id = le.livestock_id OR l.flock_id = le.flock_id
        LEFT JOIN medical_treatments mt ON l.id = mt.livestock_id OR l.flock_id = mt.flock_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      if (flockId) {
        paramCount++;
        query += ` AND l.flock_id = $${paramCount}`;
        params.push(flockId);
      }

      if (startDate) {
        paramCount++;
        query += ` AND (s.sale_date >= $${paramCount} OR s.sale_date IS NULL)`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND (s.sale_date <= $${paramCount} OR s.sale_date IS NULL)`;
        params.push(endDate);
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('Error calculating profit/loss:', error);
      throw error;
    }
  }

  async getAnimalProfitability(animalId: number): Promise<any> {
    const query = `
      SELECT 
        l.id,
        l.tag_id,
        l.purchase_price,
        l.purchase_date,
        COALESCE(SUM(s.total_amount), 0) as sale_revenue,
        COALESCE(SUM(le.amount), 0) as total_expenses,
        COALESCE(SUM(mt.cost), 0) as medical_costs,
        (COALESCE(SUM(s.total_amount), 0) - l.purchase_price - COALESCE(SUM(le.amount), 0) - COALESCE(SUM(mt.cost), 0)) as net_profit,
        EXTRACT(DAYS FROM (COALESCE(MAX(s.sale_date), CURRENT_DATE) - l.purchase_date)) as days_owned
      FROM livestock l
      LEFT JOIN sales s ON l.id = s.livestock_id
      LEFT JOIN livestock_expenses le ON l.id = le.livestock_id
      LEFT JOIN medical_treatments mt ON l.id = mt.livestock_id
      WHERE l.id = $1
      GROUP BY l.id, l.tag_id, l.purchase_price, l.purchase_date
    `;

    const result = await pool.query(query, [animalId]);
    return result.rows[0];
  }
}