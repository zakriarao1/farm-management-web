import { pool } from '../config/database';

export class FinancialSummaryRepository {
  async getFlockFinancialSummary(flockId?: number): Promise<any[]> {
    let query = `
      SELECT * FROM flock_financial_summary
    `;
    
    const params: any[] = [];
    
    if (flockId) {
      query += ' WHERE flock_id = $1';
      params.push(flockId);
    }
    
    query += ' ORDER BY net_profit_loss DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAnimalFinancialSummary(animalId?: number): Promise<any[]> {
    let query = `
      SELECT 
        l.id as animal_id,
        l.identifier as animal_identifier,
        COALESCE(l.purchase_price, 0) as purchase_price,
        COALESCE(l.sale_price, 0) as sale_price,
        COALESCE(SUM(le.amount), 0) as total_expenses,
        COALESCE(SUM(mt.cost), 0) as total_medical_costs,
        COALESCE(SUM(pr.sale_price), 0) as total_production_revenue,
        (COALESCE(l.sale_price, 0) + COALESCE(SUM(pr.sale_price), 0) - 
         COALESCE(l.purchase_price, 0) - COALESCE(SUM(le.amount), 0) - COALESCE(SUM(mt.cost), 0)) as net_profit_loss,
        CASE 
          WHEN l.purchase_date IS NOT NULL THEN 
            EXTRACT(DAYS FROM COALESCE(l.sale_date, CURRENT_DATE) - l.purchase_date)
          ELSE 0 
        END as days_owned,
        l.status
      FROM livestock l
      LEFT JOIN livestock_expenses le ON l.id = le.livestock_id
      LEFT JOIN medical_treatments mt ON l.id = mt.livestock_id
      LEFT JOIN production_records pr ON l.id = pr.livestock_id
    `;
    
    const params: any[] = [];
    
    if (animalId) {
      query += ' WHERE l.id = $1';
      params.push(animalId);
    }
    
    query += `
      GROUP BY l.id, l.identifier, l.purchase_price, l.sale_price, l.purchase_date, l.sale_date, l.status
      ORDER BY net_profit_loss DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getFlockPerformanceMetrics(flockId: number): Promise<any> {
    const query = `
      SELECT 
        f.id as flock_id,
        f.name as flock_name,
        COUNT(l.id) as total_animals,
        AVG(l.purchase_price) as avg_purchase_price,
        AVG(l.sale_price) as avg_sale_price,
        SUM(COALESCE(le.amount, 0)) as total_expenses,
        SUM(COALESCE(mt.cost, 0)) as total_medical_costs,
        SUM(COALESCE(pr.sale_price, 0)) as total_production_revenue,
        AVG(EXTRACT(DAYS FROM COALESCE(l.sale_date, CURRENT_DATE) - l.purchase_date)) as avg_days_owned,
        (SUM(COALESCE(l.sale_price, 0)) + SUM(COALESCE(pr.sale_price, 0)) - 
         SUM(COALESCE(l.purchase_price, 0)) - SUM(COALESCE(le.amount, 0)) - SUM(COALESCE(mt.cost, 0))) as total_profit_loss,
        CASE 
          WHEN SUM(COALESCE(l.purchase_price, 0)) > 0 THEN
            ((SUM(COALESCE(l.sale_price, 0)) + SUM(COALESCE(pr.sale_price, 0)) - 
              SUM(COALESCE(l.purchase_price, 0)) - SUM(COALESCE(le.amount, 0)) - SUM(COALESCE(mt.cost, 0))) / 
             SUM(COALESCE(l.purchase_price, 0))) * 100
          ELSE 0
        END as roi_percentage
      FROM flocks f
      LEFT JOIN livestock l ON f.id = l.flock_id
      LEFT JOIN livestock_expenses le ON f.id = le.flock_id
      LEFT JOIN medical_treatments mt ON f.id = mt.flock_id
      LEFT JOIN production_records pr ON f.id = pr.flock_id
      WHERE f.id = $1
      GROUP BY f.id, f.name
    `;
    
    const result = await pool.query(query, [flockId]);
    return result.rows[0] || null;
  }
}