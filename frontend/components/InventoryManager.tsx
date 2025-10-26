// frontend/components/InventoryManager.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Warning as WarningIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { inventoryApi } from '../src/services/api';
import type { InventoryItem } from '../src/types';

export const InventoryManager: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInventory();
    loadLowStockAlerts();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryApi.getAll();
      setInventory(response.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadLowStockAlerts = async () => {
    try {
      const response = await inventoryApi.getLowStock();
      setLowStockItems(response.data || []);
    } catch (error) {
      console.error('Failed to load low stock alerts:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' } = {
      SEEDS: 'primary',
      FERTILIZER: 'success',
      PESTICIDES: 'warning',
      TOOLS: 'info',
      EQUIPMENT: 'secondary',
      FUEL: 'error',
      MAINTENANCE: 'default',
      OTHER: 'default',
    };
    return colors[category] || 'default';
  };

  const calculateTotalValue = () => {
    return inventory.reduce((total, item) => {
      return total + (item.quantity * (item.unitCost || 0));
    }, 0);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Low Stock Alert: {lowStockItems.length} item(s) need restocking
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
              gap: 1 
            }}>
              {lowStockItems.map(item => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1, bgcolor: 'warning.light' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {item.name}
                  </Typography>
                  <Typography variant="caption">
                    Only {item.quantity} {item.unit} left (min: {item.minQuantity})
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </Alert>
      )}

      {/* Inventory Summary */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, 
        gap: 2, 
        mb: 3 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold">
              {inventory.length}
            </Typography>
            <Typography color="text.secondary">Total Items</Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {lowStockItems.length}
            </Typography>
            <Typography color="text.secondary">Low Stock</Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              ${calculateTotalValue().toLocaleString()}
            </Typography>
            <Typography color="text.secondary">Total Value</Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Button 
              startIcon={<AddIcon />} 
              variant="contained" 
              fullWidth
              onClick={() => window.location.href = '/inventory'}
            >
              Add Item
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Current Inventory ({inventory.length} items)
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Cost</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow 
                      key={item.id}
                      sx={{ 
                        bgcolor: item.isLowStock ? 'warning.light' : 'inherit',
                        '&:hover': { bgcolor: item.isLowStock ? 'warning.light' : 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Typography fontWeight="medium">{item.name}</Typography>
                        {item.location && (
                          <Typography variant="caption" color="text.secondary">
                            Location: {item.location}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.category} 
                          color={getCategoryColor(item.category)}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {item.quantity} {item.unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Min: {item.minQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.unitCost ? `$${item.unitCost.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.unitCost ? `$${(item.quantity * item.unitCost).toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.isLowStock ? 'Low Stock' : 'In Stock'}
                          color={item.isLowStock ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {inventory.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No inventory items found. Add your first item to get started!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};