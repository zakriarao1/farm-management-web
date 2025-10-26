// frontend/components/AnalyticsReport.tsx

import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { PieChart } from './ReportCharts/PieChart';
import { BarChart } from './ReportCharts/BarChart';
import type { AnalyticsData } from '../src/services/reportApi';

interface AnalyticsReportProps {
  data: AnalyticsData | null;
  crops?: Array<{
    id: string;
    name: string;
    actualYield?: number;
    expectedYield?: number;
  }>;
}

export const AnalyticsReport: React.FC<AnalyticsReportProps> = ({ data, crops = [] }) => {
  if (!data) {
    return (
      <Typography color="text.secondary" textAlign="center" py={4}>
        No analytics data available
      </Typography>
    );
  }

  // Prepare chart data
  const cropDistributionChart = data.cropDistribution ? {
    labels: data.cropDistribution.map(item => item.type),
    datasets: [
      {
        data: data.cropDistribution.map(item => item.count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderColor: [
          '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
          '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  const statusDistributionChart = data.statusDistribution ? {
    labels: data.statusDistribution.map(item => item.status.replace(/_/g, ' ')),
    datasets: [
      {
        label: 'Number of Crops',
        data: data.statusDistribution.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const monthlyExpensesChart = data.monthlyExpenses ? {
    labels: data.monthlyExpenses.map(item => 
      new Date(item.month + '-01').toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
    ),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: data.monthlyExpenses.map(item => item.total_expenses),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  // Yield Efficiency Data
  const yieldEfficiencyData = crops.filter(crop => crop.actualYield && crop.expectedYield).map(crop => ({
    name: crop.name,
    expected: crop.expectedYield || 0,
    actual: crop.actualYield || 0,
    efficiency: ((crop.actualYield || 0) / (crop.expectedYield || 1) * 100).toFixed(1)
  }));

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Farm Overview Analytics
      </Typography>

      <Box display="flex" gap={3} sx={{ flexWrap: 'wrap', mb: 3 }}>
        {/* Crop Distribution Chart */}
        {cropDistributionChart && (
          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <PieChart 
              title="Crop Distribution" 
              data={cropDistributionChart} 
            />
          </Box>
        )}

        {/* Status Distribution Chart */}
        {statusDistributionChart && (
          <Box sx={{ flex: '1 1 400px', minWidth: '300px' }}>
            <BarChart 
              title="Crop Status Distribution" 
              data={statusDistributionChart} 
            />
          </Box>
        )}
      </Box>

      {/* Monthly Expenses Chart */}
      {monthlyExpensesChart && (
        <Box sx={{ mb: 3 }}>
          <BarChart 
            title="Monthly Expenses Trend" 
            data={monthlyExpensesChart} 
          />
        </Box>
      )}

      {/* Yield Performance Section */}
      {yieldEfficiencyData.length > 0 && (
        <Card sx={{ mt: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Yield Performance
            </Typography>
            {yieldEfficiencyData.map((crop, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 1,
                  borderBottom: index < yieldEfficiencyData.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {crop.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {crop.actual.toLocaleString()} / {crop.expected.toLocaleString()}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={parseFloat(crop.efficiency) >= 100 ? 'success.main' : 'warning.main'}
                  >
                    {crop.efficiency}%
                  </Typography>
                </Box>
              </Box>
            ))}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Shows crops with both expected and actual yield data. Percentage represents actual yield compared to expected target.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats Cards */}
      <Box display="flex" gap={3} sx={{ flexWrap: 'wrap' }}>
        {data.cropDistribution && data.cropDistribution.map((crop) => (
          <Card key={crop.type} sx={{ flex: '1 1 200px', minWidth: '150px' }}>
            <CardContent>
              <Typography variant="h6" color="primary">
                {crop.count}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {crop.type} Crops
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {crop.total_area} acres
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};