// frontend/src/livestock/components/SalesHistory.tsx
import React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Typography, IconButton,
  Card, CardContent
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';

interface SalesHistoryProps {
  sales: any[];
  onRefresh: () => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, onRefresh }) => {
  const formatCurrency = (amount: any) => {
    return `$${Number(amount || 0).toFixed(2)}`;
  };

  const getSaleTypeColor = (type: string) => {
    switch (type) {
      case 'animal': return 'primary';
      case 'product': return 'secondary';
      default: return 'default';
    }
  };

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Sales Recorded
          </Typography>
          <Typography color="text.secondary">
            Start recording sales to see them here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sales History
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {sale.description}
                    </Typography>
                    {sale.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {sale.notes}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.sale_type} 
                      size="small"
                      color={getSaleTypeColor(sale.sale_type)}
                    />
                  </TableCell>
                  <TableCell align="right">{sale.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(sale.unit_price)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {formatCurrency(sale.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {sale.customer_name || 'N/A'}
                    {sale.customer_contact && (
                      <Typography variant="caption" display="block">
                        {sale.customer_contact}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={sale.payment_method} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};