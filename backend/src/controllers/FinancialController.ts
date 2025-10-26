// backend/src/controllers/FinancialController.ts

import { Request, Response } from 'express';
import { pool } from '../config/database';

export class FinancialController {
  async getProfitLossReport(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      // Revenue from sold crops
      const revenueData = await pool.query(`
        SELECT 
          SUM(actual_yield * market_price) as total_revenue,
          COUNT(*) as sold_crops_count
        FROM crops 
        WHERE status = 'SOLD' 
        AND actual_yield IS NOT NULL 
        AND market_price > 0
        AND ($1::date IS NULL OR planting_date >= $1)
        AND ($2::date IS NULL OR planting_date <= $2)
      `, [startDate || null, endDate || null]);

      // Total expenses
      const expenseData = await pool.query(`
        SELECT 
          SUM(amount) as total_expenses,
          COUNT(*) as expense_count
        FROM expenses 
        WHERE ($1::date IS NULL OR date >= $1)
        AND ($2::date IS NULL OR date <= $2)
      `, [startDate || null, endDate || null]);

      // ROI by crop
      const roiByCrop = await pool.query(`
        SELECT 
          c.name,
          c.type,
          c.actual_yield * c.market_price as revenue,
          c.total_expenses,
          CASE 
            WHEN c.total_expenses > 0 THEN 
              ((c.actual_yield * c.market_price - c.total_expenses) / c.total_expenses) * 100
            ELSE 0 
          END as roi_percentage
        FROM crops c
        WHERE c.status = 'SOLD' 
        AND c.actual_yield IS NOT NULL
        AND c.market_price > 0
        AND c.total_expenses > 0
        ORDER BY roi_percentage DESC
      `);

      const totalRevenue = parseFloat(revenueData.rows[0].total_revenue) || 0;
      const totalExpenses = parseFloat(expenseData.rows[0].total_expenses) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

      res.json({
        message: 'Profit and loss report generated successfully',
        data: {
          summary: {
            totalRevenue,
            totalExpenses,
            netProfit,
            roi: parseFloat(roi.toFixed(2)),
            soldCropsCount: parseInt(revenueData.rows[0].sold_crops_count),
            expenseCount: parseInt(expenseData.rows[0].expense_count)
          },
          roiByCrop: roiByCrop.rows,
          timeframe: {
            startDate: startDate || 'All time',
            endDate: endDate || 'Present'
          }
        }
      });
    } catch (error) {
      console.error('Get profit loss report error:', error);
      res.status(500).json({ error: 'Failed to generate profit loss report' });
    }
  }

  async getROIAnalysis(req: Request, res: Response) {
    try {
      const { period = 'monthly' } = req.query;

      let groupByClause = '';
      switch (period) {
        case 'weekly':
          groupByClause = 'TO_CHAR(c.planting_date, \'IYYY-IW\')';
          break;
        case 'monthly':
          groupByClause = 'TO_CHAR(c.planting_date, \'YYYY-MM\')';
          break;
        case 'quarterly':
          groupByClause = 'CONCAT(EXTRACT(YEAR FROM c.planting_date), \'-Q\', EXTRACT(QUARTER FROM c.planting_date))';
          break;
        default:
          groupByClause = 'TO_CHAR(c.planting_date, \'YYYY-MM\')';
      }

      const roiAnalysis = await pool.query(`
        SELECT 
          ${groupByClause} as period,
          COUNT(*) as crop_count,
          SUM(c.actual_yield * c.market_price) as total_revenue,
          SUM(c.total_expenses) as total_expenses,
          CASE 
            WHEN SUM(c.total_expenses) > 0 THEN 
              ((SUM(c.actual_yield * c.market_price) - SUM(c.total_expenses)) / SUM(c.total_expenses)) * 100
            ELSE 0 
          END as avg_roi_percentage,
          AVG(c.actual_yield * c.market_price - c.total_expenses) as avg_net_profit
        FROM crops c
        WHERE c.status = 'SOLD' 
        AND c.actual_yield IS NOT NULL
        GROUP BY ${groupByClause}
        ORDER BY period DESC
      `);

      res.json({
        message: 'ROI analysis generated successfully',
        data: {
          period,
          analysis: roiAnalysis.rows
        }
      });
    } catch (error) {
      console.error('Get ROI analysis error:', error);
      res.status(500).json({ error: 'Failed to generate ROI analysis' });
    }
  }
}