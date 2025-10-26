import { Request, Response } from 'express';
import { Pool } from 'pg';

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'farm_management',
  password: process.env.DB_PASSWORD || 'your_password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

export const MedicalTreatmentController = {
  // Get all medical treatments
  async getAllMedicalTreatments(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          mt.*,
          l.tag_id as animal_identifier,
          f.name as flock_name
        FROM medical_treatments mt
        LEFT JOIN livestock l ON mt.livestock_id = l.id
        LEFT JOIN flocks f ON mt.flock_id = f.id
        ORDER BY mt.treatment_date DESC
      `;
      
      const result = await pool.query(query);
      
      const transformedTreatments = result.rows.map(treatment => ({
        id: treatment.id,
        livestock_id: treatment.livestock_id,
        flock_id: treatment.flock_id,
        treatment_type: treatment.treatment_type,
        medication_name: treatment.medication_name,
        dosage: treatment.dosage,
        administration_method: treatment.administration_method,
        treatment_date: treatment.treatment_date,
        next_treatment_date: treatment.next_treatment_date,
        veterinarian: treatment.veterinarian,
        cost: parseFloat(treatment.cost),
        notes: treatment.notes,
        created_at: treatment.created_at,
        updated_at: treatment.updated_at,
        animal_identifier: treatment.animal_identifier,
        flock_name: treatment.flock_name
      }));

      res.json({
        data: transformedTreatments,
        message: 'Medical treatments retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching medical treatments:', error);
      res.status(500).json({
        error: 'Failed to fetch medical treatments',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },

  // Get medical treatments by livestock ID
  async getMedicalTreatmentsByLivestock(req: Request, res: Response) {
    try {
      const { livestockId } = req.params;

      const query = `
        SELECT 
          mt.*,
          l.tag_id as animal_identifier,
          f.name as flock_name
        FROM medical_treatments mt
        LEFT JOIN livestock l ON mt.livestock_id = l.id
        LEFT JOIN flocks f ON mt.flock_id = f.id
        WHERE mt.livestock_id = $1
        ORDER BY mt.treatment_date DESC
      `;
      
      const result = await pool.query(query, [livestockId]);
      
      const transformedTreatments = result.rows.map(treatment => ({
        id: treatment.id,
        livestock_id: treatment.livestock_id,
        flock_id: treatment.flock_id,
        treatment_type: treatment.treatment_type,
        medication_name: treatment.medication_name,
        dosage: treatment.dosage,
        administration_method: treatment.administration_method,
        treatment_date: treatment.treatment_date,
        next_treatment_date: treatment.next_treatment_date,
        veterinarian: treatment.veterinarian,
        cost: parseFloat(treatment.cost),
        notes: treatment.notes,
        created_at: treatment.created_at,
        updated_at: treatment.updated_at,
        animal_identifier: treatment.animal_identifier,
        flock_name: treatment.flock_name
      }));

      res.json({
        data: transformedTreatments,
        message: 'Medical treatments retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching medical treatments for livestock:', error);
      res.status(500).json({
        error: 'Failed to fetch medical treatments',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },

  // Get upcoming medical treatments
  async getUpcomingMedicalTreatments(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + parseInt(days as string));

      const query = `
        SELECT 
          mt.*,
          l.tag_id as animal_identifier,
          f.name as flock_name
        FROM medical_treatments mt
        LEFT JOIN livestock l ON mt.livestock_id = l.id
        LEFT JOIN flocks f ON mt.flock_id = f.id
        WHERE mt.next_treatment_date IS NOT NULL 
          AND mt.next_treatment_date <= $1 
          AND mt.next_treatment_date >= $2
        ORDER BY mt.next_treatment_date ASC
      `;
      
      const result = await pool.query(query, [targetDate, new Date()]);
      
      const transformedTreatments = result.rows.map(treatment => ({
        id: treatment.id,
        livestock_id: treatment.livestock_id,
        flock_id: treatment.flock_id,
        treatment_type: treatment.treatment_type,
        medication_name: treatment.medication_name,
        dosage: treatment.dosage,
        administration_method: treatment.administration_method,
        treatment_date: treatment.treatment_date,
        next_treatment_date: treatment.next_treatment_date,
        veterinarian: treatment.veterinarian,
        cost: parseFloat(treatment.cost),
        notes: treatment.notes,
        created_at: treatment.created_at,
        updated_at: treatment.updated_at,
        animal_identifier: treatment.animal_identifier,
        flock_name: treatment.flock_name
      }));

      res.json({
        data: transformedTreatments,
        message: 'Upcoming medical treatments retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching upcoming medical treatments:', error);
      res.status(500).json({
        error: 'Failed to fetch upcoming medical treatments',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },

  // Create a new medical treatment
  async createMedicalTreatment(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const {
        livestock_id,
        flock_id,
        treatment_type,
        medication_name,
        dosage,
        administration_method,
        treatment_date,
        next_treatment_date,
        veterinarian,
        cost,
        notes
      } = req.body;

      const query = `
        INSERT INTO medical_treatments (
          livestock_id, flock_id, treatment_type, medication_name, dosage, 
          administration_method, treatment_date, next_treatment_date, 
          veterinarian, cost, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const values = [
        livestock_id,
        flock_id || null,
        treatment_type,
        medication_name,
        dosage,
        administration_method,
        treatment_date,
        next_treatment_date || null,
        veterinarian || null,
        cost,
        notes || null
      ];

      const result = await client.query(query, values);
      
      // Get the created treatment with joined data
      const joinQuery = `
        SELECT 
          mt.*,
          l.tag_id as animal_identifier,
          f.name as flock_name
        FROM medical_treatments mt
        LEFT JOIN livestock l ON mt.livestock_id = l.id
        LEFT JOIN flocks f ON mt.flock_id = f.id
        WHERE mt.id = $1
      `;
      
      const joinResult = await client.query(joinQuery, [result.rows[0].id]);
      
      await client.query('COMMIT');
      
      const transformedTreatment = {
        id: joinResult.rows[0].id,
        livestock_id: joinResult.rows[0].livestock_id,
        flock_id: joinResult.rows[0].flock_id,
        treatment_type: joinResult.rows[0].treatment_type,
        medication_name: joinResult.rows[0].medication_name,
        dosage: joinResult.rows[0].dosage,
        administration_method: joinResult.rows[0].administration_method,
        treatment_date: joinResult.rows[0].treatment_date,
        next_treatment_date: joinResult.rows[0].next_treatment_date,
        veterinarian: joinResult.rows[0].veterinarian,
        cost: parseFloat(joinResult.rows[0].cost),
        notes: joinResult.rows[0].notes,
        created_at: joinResult.rows[0].created_at,
        updated_at: joinResult.rows[0].updated_at,
        animal_identifier: joinResult.rows[0].animal_identifier,
        flock_name: joinResult.rows[0].flock_name
      };

      res.status(201).json({
        data: transformedTreatment,
        message: 'Medical treatment created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating medical treatment:', error);
      res.status(500).json({
        error: 'Failed to create medical treatment',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      client.release();
    }
  },

  // Update a medical treatment
  async updateMedicalTreatment(req: Request, res: Response) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const {
        treatment_type,
        medication_name,
        dosage,
        administration_method,
        treatment_date,
        next_treatment_date,
        veterinarian,
        cost,
        notes
      } = req.body;

      const query = `
        UPDATE medical_treatments 
        SET 
          treatment_type = COALESCE($1, treatment_type),
          medication_name = COALESCE($2, medication_name),
          dosage = COALESCE($3, dosage),
          administration_method = COALESCE($4, administration_method),
          treatment_date = COALESCE($5, treatment_date),
          next_treatment_date = COALESCE($6, next_treatment_date),
          veterinarian = COALESCE($7, veterinarian),
          cost = COALESCE($8, cost),
          notes = COALESCE($9, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;
      
      const values = [
        treatment_type,
        medication_name,
        dosage,
        administration_method,
        treatment_date,
        next_treatment_date,
        veterinarian,
        cost,
        notes,
        id
      ];

      await client.query(query, values);
      
      // Get the updated treatment with joined data
      const joinQuery = `
        SELECT 
          mt.*,
          l.tag_id as animal_identifier,
          f.name as flock_name
        FROM medical_treatments mt
        LEFT JOIN livestock l ON mt.livestock_id = l.id
        LEFT JOIN flocks f ON mt.flock_id = f.id
        WHERE mt.id = $1
      `;
      
      const joinResult = await client.query(joinQuery, [id]);
      
      await client.query('COMMIT');
      
      const transformedTreatment = {
        id: joinResult.rows[0].id,
        livestock_id: joinResult.rows[0].livestock_id,
        flock_id: joinResult.rows[0].flock_id,
        treatment_type: joinResult.rows[0].treatment_type,
        medication_name: joinResult.rows[0].medication_name,
        dosage: joinResult.rows[0].dosage,
        administration_method: joinResult.rows[0].administration_method,
        treatment_date: joinResult.rows[0].treatment_date,
        next_treatment_date: joinResult.rows[0].next_treatment_date,
        veterinarian: joinResult.rows[0].veterinarian,
        cost: parseFloat(joinResult.rows[0].cost),
        notes: joinResult.rows[0].notes,
        created_at: joinResult.rows[0].created_at,
        updated_at: joinResult.rows[0].updated_at,
        animal_identifier: joinResult.rows[0].animal_identifier,
        flock_name: joinResult.rows[0].flock_name
      };

      res.json({
        data: transformedTreatment,
        message: 'Medical treatment updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating medical treatment:', error);
      res.status(500).json({
        error: 'Failed to update medical treatment',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      client.release();
    }
  },

  // Delete a medical treatment
  async deleteMedicalTreatment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const query = 'DELETE FROM medical_treatments WHERE id = $1';
      await pool.query(query, [id]);

      res.json({
        message: 'Medical treatment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting medical treatment:', error);
      res.status(500).json({
        error: 'Failed to delete medical treatment',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
};