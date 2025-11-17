import type { Crop, Expense, InventoryItem } from '../types';
import { cropApi, expenseApi, inventoryApi } from './api';

export interface ExportData {
  crops: Crop[];
  expenses: Expense[];
  inventory: InventoryItem[];
  metadata: {
    exportedAt: string;
    version: string;
    recordCounts: {
      crops: number;
      expenses: number;
      inventory: number;
    };
  };
}

// ✅ Define a proper interface for CSV export data
interface CSVExportable {
  [key: string]: string | number | boolean | null | undefined;
}

export class ImportExportService {
  async exportData(): Promise<Blob> {
    // Use your API services instead of direct fetch
    const [cropsResponse, expensesResponse, inventoryResponse] = await Promise.all([
      cropApi.getAll(),
      expenseApi.getAll(),
      inventoryApi.getAll(),
    ]);

    const exportData: ExportData = {
      crops: cropsResponse.data || [],
      expenses: expensesResponse.data || [],
      inventory: inventoryResponse.data || [],
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        recordCounts: {
          crops: cropsResponse.data?.length || 0,
          expenses: expensesResponse.data?.length || 0,
          inventory: inventoryResponse.data?.length || 0,
        },
      },
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
  }

  async importData(file: File): Promise<{ success: boolean; message: string }> {
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      // Validate the import data structure
      if (!this.validateImportData(data)) {
        throw new Error('Invalid data format');
      }

      // Import data (you might want to do this in batches for large datasets)
      const results = await Promise.allSettled([
        this.importCrops(data.crops),
        this.importExpenses(data.expenses),
        this.importInventory(data.inventory),
      ]);

      const successfulImports = results.filter(r => r.status === 'fulfilled').length;
      
      return {
        success: successfulImports > 0,
        message: `Imported ${successfulImports} out of ${results.length} data categories successfully`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ✅ Use proper type instead of 'any'
  private validateImportData(data: unknown): data is ExportData {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const typedData = data as Record<string, unknown>;
    
    return (
      Array.isArray(typedData.crops) &&
      Array.isArray(typedData.expenses) &&
      Array.isArray(typedData.inventory) &&
      typeof typedData.metadata === 'object' &&
      typedData.metadata !== null
    );
  }

  private async importCrops(crops: Crop[]): Promise<void> {
    for (const crop of crops) {
      await cropApi.create(crop);
    }
  }

  private async importExpenses(expenses: Expense[]): Promise<void> {
    for (const expense of expenses) {
      await expenseApi.create(expense);
    }
  }

  private async importInventory(inventory: InventoryItem[]): Promise<void> {
    for (const item of inventory) {
      await inventoryApi.addItem(item);
    }
  }

  // ✅ Use proper generic type instead of 'any'
  exportToCSV<T extends CSVExportable>(data: T[], filename: string): void {
    if (data.length === 0) return;

    const headers = data && data.length > 0 ? Object.keys(data[0] as object) : [];
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Additional helper method for downloading template
  downloadTemplate(): void {
    const templateData = [
      {
        name: 'Sample Crop',
        type: 'VEGETABLE',
        variety: 'Sample Variety',
        planting_date: '2024-01-01',
        area: 1.0,
        area_unit: 'ACRES',
        expected_yield: 100,
        yield_unit: 'KILOGRAMS',
        market_price: 2.5,
        status: 'PLANNED'
      }
    ];

    this.exportToCSV(templateData, 'farm-data-template');
  }
}

export const importExportService = new ImportExportService();