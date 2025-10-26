// src/components/ReportCharts/PieChart.tsx

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
}

export const PieChart: React.FC<PieChartProps> = ({ title, data }) => {
  const options: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
          <Pie data={data} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
};
