// backend/src/models/Crop.ts
export interface Crop {
  id?: number;
  firestoreId?: string;
  name: string;
  type: string;
  variety?: string;
  plantingDate: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  area: number;
  areaUnit: 'ACRES' | 'HECTARES' | 'SQUARE_METERS';
  expectedYield: number;
  actualYield?: number;
  yieldUnit?: 'TONS' | 'KILOGRAMS' | 'POUNDS' | 'BUSHELS';
  fieldLocation?: string;
  marketPrice: number;
  totalExpenses: number;
  notes?: string;
  status: 'PLANNED' | 'PLANTED' | 'GROWING' | 'READY_FOR_HARVEST' | 'HARVESTED' | 'FAILED';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCropRequest extends Omit<Crop, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateCropRequest extends Partial<Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>> {}