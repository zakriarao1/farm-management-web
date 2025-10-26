// backend/src/models/ProductionRecord.ts
export interface ProductionRecord {
  id: number;
  flockId: number;
  recordDate: string;
  productType: 'eggs' | 'milk' | 'meat' | 'wool' | 'other';
  quantity: number;
  unit: string;
  qualityGrade?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  flockName?: string; // Add this optional property
}

export interface CreateProductionRecordRequest extends Omit<ProductionRecord, 'id' | 'createdAt' | 'updatedAt' | 'flockName'> {}

export interface UpdateProductionRecordRequest extends Partial<Omit<ProductionRecord, 'id' | 'createdAt' | 'updatedAt' | 'flockName'>> {}