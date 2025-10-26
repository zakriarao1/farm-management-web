// backend/src/repositories/CropRepository.ts

import { pool } from '../config/database';
import { Crop, CreateCropRequest, UpdateCropRequest } from '../models/Crop';

export class CropRepository {
  async findAll(): Promise<Crop[]> {
    const result = await pool.query('SELECT * FROM crops ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id: number): Promise<Crop | null> {
    const result = await pool.query('SELECT * FROM crops WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create(cropData: CreateCropRequest): Promise<Crop> {
    const {
      name,
      type,
      variety,
      plantingDate,
      expectedHarvestDate,
      area,
      areaUnit,
      expectedYield,
      yieldUnit,
      marketPrice,
      totalExpenses,
      status,
      fieldLocation,
      notes
    } = cropData;

    const query = `
      INSERT INTO crops (
        name, type, variety, planting_date, expected_harvest_date, 
        area, area_unit, expected_yield, yield_unit, market_price, 
        total_expenses, status, field_location, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      name,
      type,
      variety,
      plantingDate,
      expectedHarvestDate,
      area,
      areaUnit,
      expectedYield,
      yieldUnit,
      marketPrice,
      totalExpenses || 0,
      status,
      fieldLocation,
      notes
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id: number, cropData: UpdateCropRequest): Promise<Crop | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build dynamic update query based on provided fields
    if (cropData.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(cropData.name);
      paramCount++;
    }
    if (cropData.type !== undefined) {
      fields.push(`type = $${paramCount}`);
      values.push(cropData.type);
      paramCount++;
    }
    if (cropData.variety !== undefined) {
      fields.push(`variety = $${paramCount}`);
      values.push(cropData.variety);
      paramCount++;
    }
    if (cropData.plantingDate !== undefined) {
      fields.push(`planting_date = $${paramCount}`);
      values.push(cropData.plantingDate);
      paramCount++;
    }
    if (cropData.expectedHarvestDate !== undefined) {
      fields.push(`expected_harvest_date = $${paramCount}`);
      values.push(cropData.expectedHarvestDate);
      paramCount++;
    }
    if (cropData.area !== undefined) {
      fields.push(`area = $${paramCount}`);
      values.push(cropData.area);
      paramCount++;
    }
    if (cropData.areaUnit !== undefined) {
      fields.push(`area_unit = $${paramCount}`);
      values.push(cropData.areaUnit);
      paramCount++;
    }
    if (cropData.expectedYield !== undefined) {
      fields.push(`expected_yield = $${paramCount}`);
      values.push(cropData.expectedYield);
      paramCount++;
    }
    if (cropData.yieldUnit !== undefined) {
      fields.push(`yield_unit = $${paramCount}`);
      values.push(cropData.yieldUnit);
      paramCount++;
    }
    if (cropData.marketPrice !== undefined) {
      fields.push(`market_price = $${paramCount}`);
      values.push(cropData.marketPrice);
      paramCount++;
    }
    if (cropData.totalExpenses !== undefined) {
      fields.push(`total_expenses = $${paramCount}`);
      values.push(cropData.totalExpenses);
      paramCount++;
    }
    if (cropData.status !== undefined) {
      fields.push(`status = $${paramCount}`);
      values.push(cropData.status);
      paramCount++;
    }
    if (cropData.fieldLocation !== undefined) {
      fields.push(`field_location = $${paramCount}`);
      values.push(cropData.fieldLocation);
      paramCount++;
    }
    if (cropData.notes !== undefined) {
      fields.push(`notes = $${paramCount}`);
      values.push(cropData.notes);
      paramCount++;
    }

    // Always update the updated_at timestamp
    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) { // Only updated_at was added
      return this.findById(id);
    }

    const query = `UPDATE crops SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM crops WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async findByStatus(status: string): Promise<Crop[]> {
    const result = await pool.query('SELECT * FROM crops WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows;
  }

  async getActiveCrops(): Promise<Crop[]> {
    const result = await pool.query(
      `SELECT * FROM crops WHERE status IN ('PLANTED', 'GROWING', 'READY_FOR_HARVEST') ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async searchCrops(query: string): Promise<Crop[]> {
    const result = await pool.query(
      `SELECT * FROM crops 
       WHERE name ILIKE $1 OR type ILIKE $1 OR variety ILIKE $1 
       ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    return result.rows;
  }
}