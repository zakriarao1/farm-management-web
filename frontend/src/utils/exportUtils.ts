//  frontend/src/Utils/exportUtils.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalyticsData } from '../types'; // Import from shared types

// Type definitions for export data
export interface ExportDataRow {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: (number | string)[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

// REMOVE the local AnalyticsData interface and use the imported one
// export interface AnalyticsData {
//   summary?: {
//     [key: string]: string | number | boolean | null;
//   };
//   cropDistribution?: Array<{
//     [key: string]: string | number;
//   }>;
//   [key: string]: unknown;
// }

export const exportToPDF = async (elementId: string, filename: string = 'report.pdf'): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF export');
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export const exportToExcel = async (data: ExportDataRow[] | AnalyticsData, filename: string = 'report.xlsx'): Promise<void> => {
  return exportToCSV(data, filename.replace('.xlsx', '.csv'));
};

export const exportToCSV = (data: ExportDataRow[] | AnalyticsData, filename: string = 'report.csv'): void => {
  if (!data) {
    console.error('No data to export');
    return;
  }

  try {
    let csvContent = '';
    
    if (Array.isArray(data)) {
      if (data.length > 0) {
const headers = data && data.length > 0 ? Object.keys(data[0] as object) : [];
        csvContent += headers.join(',') + '\n';
        
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          });
          csvContent += values.join(',') + '\n';
        });
      }
    } else if (typeof data === 'object' && data !== null) {
      // Handle AnalyticsData structure
      csvContent = 'Metric,Value\n';
      
      // Handle summary data
      if (data.summary) {
        Object.entries(data.summary).forEach(([key, value]) => {
          csvContent += `summary.${key},${value}\n`;
        });
      }
      
      // Handle crop distribution
      if (data.cropDistribution && data.cropDistribution.length > 0) {
        data.cropDistribution.forEach((crop, index) => {
          Object.entries(crop).forEach(([key, value]) => {
            csvContent += `cropDistribution[${index}].${key},${value}\n`;
          });
        });
      }
      
      // Handle other data structures as needed
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export CSV');
  }
};

// ... rest of your existing export functions remain the same
export const exportChartData = (chartData: ChartData, filename: string = 'chart-data.csv'): void => {
  if (!chartData?.labels || !chartData?.datasets) {
    console.error('Invalid chart data for export');
    return;
  }

  try {
    let csvContent = 'Category,' + chartData.datasets.map((dataset) => dataset.label).join(',') + '\n';
    
    chartData.labels.forEach((label: string, index: number) => {
      const row = [label];
      chartData.datasets.forEach((dataset) => {
        row.push(dataset.data[index]?.toString() || '0');
      });
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Chart data export error:', error);
    throw new Error('Failed to export chart data');
  }
};

export const exportChartAsImage = async (chartId: string, filename: string = 'chart.png'): Promise<void> => {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) {
    console.error('Chart element not found');
    return;
  }

  try {
    const canvas = await html2canvas(chartElement);
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = image;
    link.click();
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
};