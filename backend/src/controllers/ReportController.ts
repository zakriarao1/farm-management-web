// backend/src/controller/ReportController.ts

import { Request, Response } from 'express';
import { pool } from '../config/database';

export class ReportController {
  async getFarmAnalytics(req: Request, res: Response) {
    try {
      // Get total statistics
      const totalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_crops,
          COUNT(CASE WHEN status IN ('PLANTED', 'GROWING', 'READY_FOR_HARVEST') THEN 1 END) as active_crops,
          SUM(area) as total_area,
          SUM(total_expenses) as total_expenses,
          SUM(expected_yield * market_price) as projected_revenue
        FROM crops
      `);

      // Get crop distribution by type
      const cropDistribution = await pool.query(`
        SELECT type, COUNT(*) as count, SUM(area) as total_area
        FROM crops 
        GROUP BY type 
        ORDER BY count DESC
      `);

      // Get status distribution
      const statusDistribution = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM crops 
        GROUP BY status 
        ORDER BY count DESC
      `);

      // Get monthly expenses
      const monthlyExpenses = await pool.query(`
        SELECT 
          TO_CHAR(date, 'YYYY-MM') as month,
          SUM(amount) as total_expenses,
          COUNT(*) as expense_count
        FROM expenses 
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `);

      // Get top crops by expenses
      const topCropsByExpenses = await pool.query(`
        SELECT 
          c.name,
          c.type,
          c.total_expenses,
          COUNT(e.id) as expense_count
        FROM crops c
        LEFT JOIN expenses e ON c.id = e.crop_id
        GROUP BY c.id, c.name, c.type, c.total_expenses
        ORDER BY c.total_expenses DESC
        LIMIT 10
      `);

      res.json({
        message: 'Farm analytics retrieved successfully',
        data: {
          summary: totalStats.rows[0],
          cropDistribution: cropDistribution.rows,
          statusDistribution: statusDistribution.rows,
          monthlyExpenses: monthlyExpenses.rows,
          topCropsByExpenses: topCropsByExpenses.rows
        }
      });

    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async getCropPerformance(req: Request, res: Response) {
    try {
      const { cropId } = req.params;

      const performance = await pool.query(`
        SELECT 
          c.*,
          COUNT(e.id) as expense_count,
          SUM(e.amount) as total_expenses,
          AVG(e.amount) as avg_expense_amount,
          (c.expected_yield * c.market_price - c.total_expenses) as projected_profit
        FROM crops c
        LEFT JOIN expenses e ON c.id = e.crop_id
        WHERE c.id = $1
        GROUP BY c.id
      `, [cropId]);

      // Get expense breakdown by category
      const expenseBreakdown = await pool.query(`
        SELECT 
          category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count
        FROM expenses 
        WHERE crop_id = $1
        GROUP BY category 
        ORDER BY total_amount DESC
      `, [cropId]);

      res.json({
        message: 'Crop performance retrieved successfully',
        data: {
          performance: performance.rows[0],
          expenseBreakdown: expenseBreakdown.rows
        }
      });

    } catch (error) {
      console.error('Get crop performance error:', error);
      res.status(500).json({ error: 'Failed to fetch crop performance' });
    }
  }

  async getFinancialReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let dateCondition = '';
      const params: any[] = [];

      if (startDate && endDate) {
        dateCondition = 'WHERE e.date BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      }

      // Get yield statistics
      const yieldStats = await pool.query(`
        SELECT 
          AVG(expected_yield) as avg_expected_yield,
          AVG(actual_yield) as avg_actual_yield,
          COUNT(CASE WHEN actual_yield IS NOT NULL THEN 1 END) as harvested_crops_count,
          SUM(CASE WHEN actual_yield IS NOT NULL THEN actual_yield ELSE 0 END) as total_actual_yield
        FROM crops
        WHERE status IN ('HARVESTED', 'SOLD')
      `);

      // Get total statistics for financial report
      const totalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_crops,
          COUNT(CASE WHEN status IN ('PLANTED', 'GROWING', 'READY_FOR_HARVEST') THEN 1 END) as active_crops,
          SUM(area) as total_area,
          SUM(total_expenses) as total_expenses,
          SUM(expected_yield * market_price) as projected_revenue
        FROM crops
      `);

      const financialReport = await pool.query(`
        SELECT 
          c.name as crop_name,
          c.type as crop_type,
          c.expected_yield,
          c.market_price,
          (c.expected_yield * c.market_price) as projected_revenue,
          c.total_expenses,
          (c.expected_yield * c.market_price - c.total_expenses) as projected_profit,
          COUNT(e.id) as expense_count
        FROM crops c
        LEFT JOIN expenses e ON c.id = e.crop_id
        ${dateCondition}
        GROUP BY c.id, c.name, c.type, c.expected_yield, c.market_price, c.total_expenses
        ORDER BY projected_profit DESC
      `, params);

      const summary = await pool.query(`
        SELECT 
          SUM(c.expected_yield * c.market_price) as total_projected_revenue,
          SUM(c.total_expenses) as total_expenses,
          SUM(c.expected_yield * c.market_price - c.total_expenses) as total_projected_profit,
          COUNT(DISTINCT c.id) as total_crops
        FROM crops c
      `);

      res.json({
        message: 'Financial report retrieved successfully',
        data: {
          summary: {
            ...totalStats.rows[0],
            ...summary.rows[0],
            avg_expected_yield: yieldStats.rows[0].avg_expected_yield,
            avg_actual_yield: yieldStats.rows[0].avg_actual_yield,
            harvested_crops_count: yieldStats.rows[0].harvested_crops_count,
            total_actual_yield: yieldStats.rows[0].total_actual_yield
          },
          crops: financialReport.rows,
          financialSummary: summary.rows[0]
        }
      });

    } catch (error) {
      console.error('Get financial report error:', error);
      res.status(500).json({ error: 'Failed to fetch financial report' });
    }
  }

  // Additional method to get recent expenses for dashboard
  async getRecentExpenses(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const recentExpenses = await pool.query(`
        SELECT 
          e.*,
          c.name as crop_name,
          c.type as crop_type
        FROM expenses e
        LEFT JOIN crops c ON e.crop_id = c.id
        ORDER BY e.date DESC, e.created_at DESC
        LIMIT $1
      `, [limit]);

      res.json({
        message: 'Recent expenses retrieved successfully',
        data: recentExpenses.rows
      });

    } catch (error) {
      console.error('Get recent expenses error:', error);
      res.status(500).json({ error: 'Failed to fetch recent expenses' });
    }
  }
}