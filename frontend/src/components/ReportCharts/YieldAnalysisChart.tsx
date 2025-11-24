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
  yield: number;
  area: number;
}

export const YieldAnalysisChart: React.FC<YieldAnalysisChartProps> = ({ crops }) => {
  // Filter harvested crops with yield data
  const harvestedCrops: HarvestedCrop[] = crops
    .filter((crop: Crop): crop is Crop & { yield: number } => 
      crop.yield !== undefined && 
      crop.yield > 0
    )
    .map(crop => ({
      name: crop.name,
      yield: crop.yield,
      area: crop.area || 0
    }));

  // Show yield and yield per area
  const chartData = {
    labels: harvestedCrops.map(crop => crop.name),
    datasets: [
      {
        label: 'Yield',
        data: harvestedCrops.map(crop => crop.yield),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Yield per Area',
        data: harvestedCrops.map(crop => crop.area > 0 ? crop.yield / crop.area : 0),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  };

  if (harvestedCrops.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Yield Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No yield data available. Yield data will appear here after crops are harvested.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Yield Analysis
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
                      
                      // FIXED: Handle null value
                      if (value === null || value === undefined) {
                        return `${label}: 0 units`;
                      }
                      
                      if (label === 'Yield') {
                        return `${label}: ${value} units`;
                      } else if (label === 'Yield per Area' && crop) {
                        return `${label}: ${value.toFixed(2)} units per area`;
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
            Yield Summary:
          </Typography>
          {harvestedCrops.map((crop, index) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
              <Typography variant="body2">{crop.name}</Typography>
              <Typography variant="body2" fontWeight="medium" color="primary">
                {crop.yield} units
              </Typography>
            </Box>
          ))}
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #ddd' }}>
            <Typography variant="body2" fontWeight="bold">
              Total Yield: {harvestedCrops.reduce((sum, crop) => sum + crop.yield, 0).toFixed(1)} units
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};