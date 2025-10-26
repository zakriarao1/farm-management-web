// backend/src/controllers/LivestockReportsController.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';

export class LivestockReportsController {
  // Comprehensive livestock report
  async getComprehensiveReport(req: Request, res: Response): Promise<void> {
    try {
      const { flockId, startDate, endDate } = req.query;

      // Get financial summary
      const financialQuery = `
        SELECT 
          f.id as flock_id,
          f.name as flock_name,
          COUNT(l.id) as total_animals,
          COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_animals,
          COUNT(CASE WHEN l.status = 'sold' THEN 1 END) as sold_animals,
          SUM(COALESCE(l.purchase_price, 0)) as total_investment,
          SUM(COALESCE(l.sale_price, 0)) as total_sales,
          SUM(COALESCE(le.amount, 0)) as total_expenses,
          (SUM(COALESCE(l.sale_price, 0)) - SUM(COALESCE(l.purchase_price, 0)) - SUM(COALESCE(le.amount, 0))) as net_profit_loss
        FROM flocks f
        LEFT JOIN livestock l ON f.id = l.flock_id
        LEFT JOIN livestock_expenses le ON f.id = le.flock_id
        ${flockId ? 'WHERE f.id = $1' : ''}
        GROUP BY f.id, f.name
        ORDER BY net_profit_loss DESC
      `;

      // Get production summary
      const productionQuery = `
        SELECT 
          product_type,
          SUM(quantity) as total_quantity,
          COUNT(*) as record_count,
          AVG(quantity) as average_yield
        FROM production_records
        ${startDate || endDate ? 'WHERE 1=1' : ''}
        ${startDate ? ` AND record_date >= '${startDate}'` : ''}
        ${endDate ? ` AND record_date <= '${endDate}'` : ''}
        GROUP BY product_type
        ORDER BY total_quantity DESC
      `;

      // Get expense breakdown
      const expenseQuery = `
        SELECT 
          category,
          SUM(amount) as total_amount,
          COUNT(*) as expense_count
        FROM livestock_expenses
        ${flockId ? 'WHERE flock_id = $1' : ''}
        GROUP BY category
        ORDER BY total_amount DESC
      `;

      const params = flockId ? [flockId] : [];
      
      const [financialResult, productionResult, expenseResult] = await Promise.all([
        pool.query(financialQuery, params),
        pool.query(productionQuery),
        pool.query(expenseQuery, params)
      ]);

      const report = {
        financial_summary: financialResult.rows,
        production_summary: productionResult.rows,
        expense_breakdown: expenseResult.rows,
        generated_at: new Date().toISOString(),
        period: {
          start_date: startDate || 'All time',
          end_date: endDate || 'Present'
        }
      };

      res.json({
        data: report,
        message: 'Comprehensive livestock report generated successfully',
        success: true
      });
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }

  // ROI Analysis Report
  async getROIAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { flockId } = req.query;

      const query = `
        SELECT 
          l.id,
          l.tag_id,
          l.type,
          l.breed,
          l.purchase_price,
          l.purchase_date,
          COALESCE(l.sale_price, 0) as sale_price,
          COALESCE(SUM(le.amount), 0) as total_expenses,
          COALESCE(SUM(mt.cost), 0) as medical_costs,
          (COALESCE(l.sale_price, 0) - l.purchase_price - COALESCE(SUM(le.amount), 0) - COALESCE(SUM(mt.cost), 0)) as net_profit,
          CASE 
            WHEN l.purchase_price > 0 THEN 
              ((COALESCE(l.sale_price, 0) - l.purchase_price - COALESCE(SUM(le.amount), 0) - COALESCE(SUM(mt.cost), 0)) / l.purchase_price) * 100
            ELSE 0
          END as roi_percentage,
          EXTRACT(DAYS FROM (COALESCE(l.sale_date, CURRENT_DATE) - l.purchase_date)) as days_held
        FROM livestock l
        LEFT JOIN livestock_expenses le ON l.id = le.livestock_id
        LEFT JOIN medical_treatments mt ON l.id = mt.livestock_id
        ${flockId ? 'WHERE l.flock_id = $1' : ''}
        GROUP BY l.id, l.tag_id, l.type, l.breed, l.purchase_price, l.purchase_date, l.sale_price, l.sale_date
        ORDER BY roi_percentage DESC
      `;

      const params = flockId ? [flockId] : [];
      const result = await pool.query(query, params);

      res.json({
        data: result.rows,
        message: 'ROI analysis retrieved successfully',
        success: true
      });
    } catch (error) {
      console.error('Error generating ROI analysis:', error);
      res.status(500).json({
        data: null,
        message: 'Internal server error',
        success: false
      });
    }
  }
}