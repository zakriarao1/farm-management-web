import type { Crop, Expense, InventoryItem } from '../types';

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
    // Fetch all data
    const [cropsResponse, expensesResponse, inventoryResponse] = await Promise.all([
      fetch('/api/crops').then(r => r.json()),
      fetch('/api/expenses').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
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
      await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crop),
      });
    }
  }

  private async importExpenses(expenses: Expense[]): Promise<void> {
    for (const expense of expenses) {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
    }
  }

  private async importInventory(inventory: InventoryItem[]): Promise<void> {
    for (const item of inventory) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
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
}

export const importExportService = new ImportExportService();