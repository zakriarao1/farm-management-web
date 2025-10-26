// backend/src/middleware/validation.ts

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validateCrop = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    plantingDate: Joi.date().required(),
    area: Joi.number().positive().required(),
    harvestDate: Joi.date().optional().allow(null),
    status: Joi.string().valid('planted', 'growing', 'harvested').default('planted'),
    expectedYield: Joi.number().positive().optional(),
    notes: Joi.string().optional().allow(''),
    imagePath: Joi.string().optional().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0]?.message || 'Validation error' 
    });
  }
  return next();
};

// Additional validation middleware for other entities
export const validateExpense = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    description: Joi.string().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().required(),
    date: Joi.date().required(),
    cropId: Joi.number().integer().positive().optional().allow(null),
    farmId: Joi.number().integer().positive().optional().allow(null)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0]?.message || 'Validation error' 
    });
  }
  return next();
};

export const validateInventory = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    quantity: Joi.number().min(0).required(),
    unit: Joi.string().required(),
    price: Joi.number().positive().optional(),
    supplier: Joi.string().optional().allow(''),
    reorderLevel: Joi.number().min(0).optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0]?.message || 'Validation error' 
    });
  }
  return next();
};

export const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().max(50).required(),
    lastName: Joi.string().max(50).required(),
    role: Joi.string().valid('farmer', 'admin', 'viewer').default('farmer')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0]?.message || 'Validation error' 
    });
  }
  return next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0]?.message || 'Validation error' 
    });
  }
  return next();
};

// Generic validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0]?.message || 'Validation error',
        details: error.details 
      });
    }
    return next();
  };
};

// ID parameter validation
export const validateId = (req: Request, res: Response, next: NextFunction) => {
const id = parseInt(req.params.id || '0');
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ 
      error: 'Invalid ID parameter. Must be a positive integer.' 
    });
  }
  return next();
};

// Query parameter validation for pagination
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0]?.message || 'Invalid query parameters' 
    });
  }
  return next();
};