// backend/src/models/Livestock.ts
export interface Livestock {
  id: number;
  tagId: string;
  type: string;
  breed: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  dateOfBirth?: string;
  purchaseDate: string;
  purchasePrice: number;
  weight: number;
  status: 'active' | 'sold' | 'deceased' | 'transferred';
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLivestockRequest extends Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateLivestockRequest extends Partial<Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'>> {}