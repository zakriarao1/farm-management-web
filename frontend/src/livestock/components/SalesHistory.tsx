// frontend/src/livestock/components/SalesHistory.tsx
import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Typography, IconButton,
  Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Visibility as ViewIcon,
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import { SaleRecord } from '../services/salesApi';

interface SalesHistoryProps {
  sales: SaleRecord[];
  onRefresh: () => void;
  onDeleteSale: (saleId: number) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ 
  sales, 
  onRefresh, 
  onDeleteSale 
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<SaleRecord | null>(null);

  const formatCurrency = (amount: any) => {
    return `₨${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSaleTypeColor = (type: string) => {
    switch (type) {
      case 'animal': return 'primary';
      case 'product': return 'secondary';
      default: return 'default';
    }
  };

  const handleViewSale = (sale: SaleRecord) => {
    setSaleToView(sale);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSale?.id) {
      onDeleteSale(selectedSale.id);
    }
    setDeleteConfirmOpen(false);
    setSelectedSale(null);
  };

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Sales Recorded
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Start recording sales to see them here.
          </Typography>
          <Button variant="outlined" onClick={onRefresh}>
            <RefreshIcon sx={{ mr: 1 }} />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card elevation={1}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6" gutterBottom>
              Sales History ({sales.length} records)
            </Typography>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={onRefresh}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
          </Box>
          
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
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      {sale.sale_date ? formatDate(sale.sale_date) : 'N/A'}
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
                      {sale.livestock_tag && (
                        <Typography variant="caption" display="block" color="primary">
                          Tag: {sale.livestock_tag}
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
                      <Typography fontWeight="bold" color="primary">
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
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewSale(sale)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(sale)}
                      >
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

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sale Details</DialogTitle>
        <DialogContent>
          {saleToView && (
            <Box sx={{ mt: 1 }}>
              <Typography><strong>Description:</strong> {saleToView.description}</Typography>
              <Typography><strong>Date:</strong> {formatDate(saleToView.sale_date)}</Typography>
              <Typography><strong>Type:</strong> {saleToView.sale_type}</Typography>
              <Typography><strong>Quantity:</strong> {saleToView.quantity}</Typography>
              <Typography><strong>Unit Price:</strong> {formatCurrency(saleToView.unit_price)}</Typography>
              <Typography><strong>Total Amount:</strong> {formatCurrency(saleToView.total_amount)}</Typography>
              <Typography><strong>Customer:</strong> {saleToView.customer_name || 'N/A'}</Typography>
              <Typography><strong>Contact:</strong> {saleToView.customer_contact || 'N/A'}</Typography>
              <Typography><strong>Payment Method:</strong> {saleToView.payment_method}</Typography>
              {saleToView.notes && (
                <Typography><strong>Notes:</strong> {saleToView.notes}</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to delete this sale record? This action cannot be undone.
          </Alert>
          {selectedSale && (
            <Typography>
              Sale: {selectedSale.description} - {formatCurrency(selectedSale.total_amount)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};