// frontend/src/components/ComparativeAnalysis.tsx

import React from 'react';
import {

  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

interface ComparativeData {
  metric: string;
  current: number;
  previous: number;
  unit?: string;
}

interface ComparativeAnalysisProps {
  title: string;
  data: ComparativeData[];
  currentPeriod: string;
  previousPeriod: string;
}

export const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  title,
  data,
  currentPeriod,
  previousPeriod,
}) => {
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return 'new';
    const change = ((current - previous) / previous) * 100;
    
    if (change > 5) return { direction: 'up', value: change };
    if (change < -5) return { direction: 'down', value: Math.abs(change) };
    return { direction: 'stable', value: change };
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <Remove color="disabled" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Comparing {currentPeriod} vs {previousPeriod}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">{currentPeriod}</TableCell>
                <TableCell align="right">{previousPeriod}</TableCell>
                <TableCell align="center">Change</TableCell>
                <TableCell align="center">Trend</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => {
                const trend = getTrend(row.current, row.previous);
                const isNew = trend === 'new';
                
                return (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {row.metric}
                    </TableCell>
                    <TableCell align="right">
                      {row.current.toLocaleString()} {row.unit || ''}
                    </TableCell>
                    <TableCell align="right">
                      {isNew ? '-' : `${row.previous.toLocaleString()} ${row.unit || ''}`}
                    </TableCell>
                    <TableCell align="center">
                      {isNew ? (
                        <Chip label="NEW" color="primary" size="small" />
                      ) : (
                        <Typography
                          variant="body2"
                          color={getTrendColor(trend.direction)}
                        >
                          {trend.direction === 'up' ? '+' : ''}
                          {trend.value.toFixed(1)}%
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {!isNew && getTrendIcon(trend.direction)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};