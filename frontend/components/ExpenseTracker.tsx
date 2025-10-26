// frontend/src/components/ExpenseTracker.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { expenseApi } from '../src/services/api';
import type { Expense, ExpenseCategory, CreateExpenseRequest } from '../src/types';

// Expense category options for the dropdown
const EXPENSE_CATEGORIES = {
  SEEDS: 'SEEDS',
  FERTILIZER: 'FERTILIZER',
  PESTICIDES: 'PESTICIDES',
  LABOR: 'LABOR',
  IRRIGATION: 'IRRIGATION',
  EQUIPMENT: 'EQUIPMENT',
  FUEL: 'FUEL',
  MAINTENANCE: 'MAINTENANCE',
  TRANSPORTATION: 'TRANSPORTATION',
  OTHER: 'OTHER',
} as const;

interface ExpenseTrackerProps {
  cropId?: string;
}

interface ExpenseFormData {
  date: string;
  category: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
}

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ cropId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES.OTHER,
    description: '',
    amount: 0,
    quantity: 1,
    unit: '',
    unitPrice: 0,
  });

  // Load expenses with useCallback to prevent infinite re-renders
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = cropId 
        ? await expenseApi.getByCropId(cropId)
        : await expenseApi.getAll();
      setExpenses(response.data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [cropId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.description || formData.amount <= 0) {
      setError('Description and valid amount are required');
      return;
    }

    // Validate cropId for crop-specific expenses
    if (cropId && isNaN(parseInt(cropId))) {
      setError('Invalid crop ID');
      return;
    }

    try {
      // Prepare expense data for API - convert cropId to number
      const expenseData: CreateExpenseRequest = {
        cropId: cropId ? parseInt(cropId) : 0, // Convert string to number, use 0 for general expenses
        date: formData.date,
        category: formData.category as ExpenseCategory,
        description: formData.description,
        amount: formData.amount,
        // Include optional fields only if they have values
        ...(formData.quantity && formData.quantity > 0 && { quantity: formData.quantity }),
        ...(formData.unit && { unit: formData.unit }),
        ...(formData.unitPrice && formData.unitPrice > 0 && { unitPrice: formData.unitPrice }),
      };

      await expenseApi.create(expenseData);
      
      // Reset form after successful submission
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: EXPENSE_CATEGORIES.OTHER,
        description: '',
        amount: 0,
        quantity: 1,
        unit: '',
        unitPrice: 0,
      });
      
      // Reload expenses to show the new entry
      await loadExpenses();
      setError('');
    } catch (err) {
      console.error('Failed to create expense:', err);
      setError('Failed to create expense. Please try again.');
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseApi.delete(expenseId.toString());
        await loadExpenses();
        setError('');
      } catch (err) {
        console.error('Failed to delete expense:', err);
        setError('Failed to delete expense');
      }
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default'> = {
      [EXPENSE_CATEGORIES.SEEDS]: 'primary',
      [EXPENSE_CATEGORIES.FERTILIZER]: 'success',
      [EXPENSE_CATEGORIES.PESTICIDES]: 'warning',
      [EXPENSE_CATEGORIES.LABOR]: 'error',
      [EXPENSE_CATEGORIES.IRRIGATION]: 'info',
      [EXPENSE_CATEGORIES.EQUIPMENT]: 'secondary',
      [EXPENSE_CATEGORIES.FUEL]: 'error',
      [EXPENSE_CATEGORIES.MAINTENANCE]: 'warning',
      [EXPENSE_CATEGORIES.TRANSPORTATION]: 'info',
      [EXPENSE_CATEGORIES.OTHER]: 'default',
    };
    return colors[category] || 'default';
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Expense Tracker {cropId && `- Crop Expenses`}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Add Expense Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Expense
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  sx={{ flex: '1 1 200px' }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  select
                  required
                  sx={{ flex: '1 1 200px' }}
                >
                  {Object.values(EXPENSE_CATEGORIES).map(category => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0) + category.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                fullWidth
                placeholder="Describe the expense (e.g., Seeds purchase, Labor costs, etc.)"
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    quantity: parseFloat(e.target.value) || 0 
                  }))}
                  sx={{ flex: '1 1 150px' }}
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
                <TextField
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  placeholder="kg, liter, hour, etc."
                />
                <TextField
                  label="Unit Price ($)"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => {
                    const unitPrice = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      unitPrice,
                      amount: unitPrice * (prev.quantity || 1)
                    }));
                  }}
                  sx={{ flex: '1 1 150px' }}
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
                <TextField
                  label="Total Amount ($)"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))}
                  required
                  sx={{ flex: '1 1 150px' }}
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
              </Box>

              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
                sx={{ alignSelf: 'flex-start', mt: 2 }}
                size="large"
              >
                {loading ? 'Adding Expense...' : 'Add Expense'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Expenses Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Expenses Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" color="error" fontWeight="bold">
                ${totalExpenses.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Expense History
            </Typography>
            <Button 
              onClick={loadExpenses} 
              disabled={loading}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {new Date(expense.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={expense.category.toLowerCase()}
                        color={getCategoryColor(expense.category)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.quantity ?? 'N/A'} {expense.unit ?? ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.unitPrice ? `$${expense.unitPrice.toLocaleString()}` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="error">
                        ${expense.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDelete(expense.id)}
                        aria-label="Delete expense"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No expenses recorded yet. Add your first expense above.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};