// src/components/ReportCharts/YieldAnalysisChart.tsx

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Crop } from '../../types';

interface YieldAnalysisChartProps {
  crops: Crop[];
}

interface HarvestedCrop {
  name: string;
  expectedYield: number;
  actualYield: number;
}

export const YieldAnalysisChart: React.FC<YieldAnalysisChartProps> = ({ crops }) => {
  // Filter and type the harvested crops
  const harvestedCrops: HarvestedCrop[] = crops
    .filter((crop: Crop): crop is Crop & { actualYield: number; expectedYield: number } => 
      crop.actualYield !== undefined && 
      crop.expectedYield !== undefined &&
      crop.actualYield > 0
    )
    .map(crop => ({
      name: crop.name,
      expectedYield: crop.expectedYield,
      actualYield: crop.actualYield
    }));

  const chartData = {
    labels: harvestedCrops.map(crop => crop.name),
    datasets: [
      {
        label: 'Expected Yield',
        data: harvestedCrops.map(crop => crop.expectedYield),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Actual Yield',
        data: harvestedCrops.map(crop => crop.actualYield),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };

  if (harvestedCrops.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Yield Performance: Expected vs Actual
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No harvest data available. Actual yield data will appear here after crops are harvested.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Yield Performance: Expected vs Actual
        </Typography>
        <Box sx={{ height: 300 }}>
          <Bar 
            data={chartData} 
            options={{ 
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.dataset.label || '';
                      const value = context.parsed.y;
                      const crop = harvestedCrops[context.dataIndex];
                      
                      if (label === 'Expected Yield') {
                        return `${label}: ${value} units`;
                      } else if (label === 'Actual Yield' && crop) {
                        const percentage = ((crop.actualYield / crop.expectedYield) * 100).toFixed(1);
                        return `${label}: ${value} units (${percentage}% of expected)`;
                      }
                      return `${label}: ${value}`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Yield (units)'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Crops'
                  }
                }
              }
            }} 
          />
        </Box>
        
        {/* Summary Statistics */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Performance Summary:
          </Typography>
          {harvestedCrops.map((crop, index) => {
            const efficiency = ((crop.actualYield / crop.expectedYield) * 100);
            return (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                <Typography variant="body2">{crop.name}</Typography>
                <Typography 
                  variant="body2" 
                  color={efficiency >= 100 ? 'success.main' : efficiency >= 80 ? 'warning.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {efficiency.toFixed(1)}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
