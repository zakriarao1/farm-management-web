import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

export const StatsCards: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Card sx={{ minWidth: 200, flex: 1 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            Total Revenue
          </Typography>
          <Typography variant="h5" component="div">
            $0
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ minWidth: 200, flex: 1 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            Total Expenses
          </Typography>
          <Typography variant="h5" component="div">
            $0
          </Typography>
        </CardContent>
      </Card>
      <Card sx={{ minWidth: 200, flex: 1 }}>
        <CardContent>
          <Typography color="text.secondary" gutterBottom>
            Net Profit
          </Typography>
          <Typography variant="h5" component="div">
            $0
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatsCards;