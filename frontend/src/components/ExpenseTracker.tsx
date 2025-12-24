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
import { expenseApi } from '../services/api';
import type { Expense, ExpenseCategory, CreateExpenseRequest } from '../types';

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
  notes?: string; // Added notes field
}

// Safe formatting functions - Updated to PKR
const safeFormatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '₨0.00';
  try {
    return `₨${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  } catch (error) {
    return '₨0.00';
  }
};

const safeFormatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

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
    notes: '', // Added notes field
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
      // Prepare expense data for API - only include fields that exist in CreateExpenseRequest
      const expenseData: CreateExpenseRequest = {
        crop_id: cropId ? parseInt(cropId) : 0, // Use crop_id (snake_case)
        date: formData.date,
        category: formData.category as ExpenseCategory,
        description: formData.description,
        amount: parseFloat(formData.amount.toString()),
        notes: formData.notes || '', // Add notes if available
      };

      console.log('📤 Submitting expense data:', expenseData);
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
        notes: '',
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
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);

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
                  InputLabelProps={{ shrink: true }}
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
                  onChange={(e) => {
                    const quantity = parseFloat(e.target.value) || 0;
                    const unitPrice = formData.unitPrice || 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      quantity,
                      amount: quantity * unitPrice
                    }));
                  }}
                  sx={{ flex: '1 1 150px' }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  sx={{ flex: '1 1 150px' }}
                  placeholder="kg, liter, hour, etc."
                />
                <TextField
                  label="Unit Price (₨)"
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => {
                    const unitPrice = parseFloat(e.target.value) || 0;
                    const quantity = formData.quantity || 1;
                    setFormData(prev => ({ 
                      ...prev, 
                      unitPrice,
                      amount: unitPrice * quantity
                    }));
                  }}
                  sx={{ flex: '1 1 150px' }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <TextField
                  label="Total Amount (₨)"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))}
                  required
                  sx={{ flex: '1 1 150px' }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Box>

              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={2}
                fullWidth
                placeholder="Additional notes about this expense (optional)"
              />

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
                {safeFormatCurrency(totalExpenses)}
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
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {safeFormatDate(expense.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={(expense.category || 'OTHER').toLowerCase()}
                        color={getCategoryColor(expense.category || 'OTHER')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {expense.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {expense.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="error">
                        {safeFormatCurrency(expense.amount)}
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
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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

export default ExpenseTracker;