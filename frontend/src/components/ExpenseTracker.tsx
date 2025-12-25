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
  LinearProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { expenseApi } from '../services/api';
import type { Expense, ExpenseCategory, CreateExpenseRequest } from '../types';

// Expense category options for the dropdown - MATCH YOUR BACKEND CATEGORIES
const EXPENSE_CATEGORIES = {
  SEEDS: 'SEEDS',
  FERTILIZERS: 'FERTILIZERS',
  PESTICIDES: 'PESTICIDES',
  LABOR: 'LABOR',
  FUEL: 'FUEL',
  EQUIPMENT: 'EQUIPMENT',
  WATER: 'WATER',
  IRRIGATION: 'IRRIGATION',
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
  notes: string;
}

// Safe formatting functions - PKR currency
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ cropId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<ExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES.OTHER,
    description: '',
    amount: 0,
    notes: '',
  });

  // Load expenses with detailed logging
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`📖 Loading expenses for crop ID: ${cropId} (type: ${typeof cropId})`);
      
      // IMPORTANT: Remove .toString() - pass the number directly
      const response = await expenseApi.getByCropId(cropId);
      console.log('📥 FULL API Response:', response);
      
      // Debug: Check the response structure
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('🔍 Response.data exists?', !!response.data);
      console.log('🔍 Response.data type:', typeof response.data);
      console.log('🔍 Response.data is array?', Array.isArray(response.data));
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Found ${response.data.length} expenses for crop ${cropId}`);
        
        if (response.data.length > 0) {
          console.log('📊 First expense:', {
            id: response.data[0].id,
            crop_id: response.data[0].crop_id,
            description: response.data[0].description,
            amount: response.data[0].amount,
            date: response.data[0].date
          });
        }
        
        setExpenses(response.data);
      } else {
        console.log('⚠️ No expenses data or data is not an array');
        console.log('⚠️ Response.data:', response.data);
        setExpenses([]);
      }
      
    } catch (err: any) {
      console.error('❌ Error loading expenses:', err);
      console.error('❌ Error details:', err.message);
      console.error('❌ Error stack:', err.stack);
      
      setError('Failed to load expenses. Please check console for details.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [cropId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!formData.date) {
      setError('Date is required');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare expense data for API
      const expenseData: CreateExpenseRequest = {
        crop_id: cropId ? parseInt(cropId) : 0,
        date: formData.date,
        category: formData.category as ExpenseCategory,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount.toString()),
        notes: formData.notes.trim(),
      };

      console.log('📤 Submitting expense:', expenseData);
      const response = await expenseApi.create(expenseData);
      console.log('✅ Expense created:', response);
      
      if (response.data) {
        // Reset form after successful submission
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: EXPENSE_CATEGORIES.OTHER,
          description: '',
          amount: 0,
          notes: '',
        });
        
        setSuccess('Expense added successfully!');
        
        // Reload expenses to show the new entry
        await loadExpenses();
        
        // Auto-hide success message
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to add expense. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Failed to create expense:', err);
      setError(err.message || 'Failed to create expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setError('');
      console.log(`🗑️ Deleting expense ID: ${expenseId}`);
      
      await expenseApi.delete(expenseId.toString());
      console.log('✅ Expense deleted');
      
      // Reload expenses
      await loadExpenses();
      setSuccess('Expense deleted successfully!');
      
      // Auto-hide success message
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('❌ Failed to delete expense:', err);
      setError('Failed to delete expense');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default'> = {
      [EXPENSE_CATEGORIES.SEEDS]: 'primary',
      [EXPENSE_CATEGORIES.FERTILIZERS]: 'success',
      [EXPENSE_CATEGORIES.PESTICIDES]: 'warning',
      [EXPENSE_CATEGORIES.LABOR]: 'error',
      [EXPENSE_CATEGORIES.FUEL]: 'secondary',
      [EXPENSE_CATEGORIES.EQUIPMENT]: 'info',
      [EXPENSE_CATEGORIES.WATER]: 'info',
      [EXPENSE_CATEGORIES.IRRIGATION]: 'info',
      [EXPENSE_CATEGORIES.TRANSPORTATION]: 'secondary',
      [EXPENSE_CATEGORIES.OTHER]: 'default',
    };
    return colors[category] || 'default';
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Loading state
  if (loading && expenses.length === 0) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
          Loading expenses...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Expense Tracker {cropId && `- Crop ID: ${cropId}`}
      </Typography>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }} 
          onClose={() => setError('')}
          action={
            <Button color="inherit" size="small" onClick={loadExpenses}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
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
                  label="Date *"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  sx={{ flex: '1 1 200px' }}
                  InputLabelProps={{ shrink: true }}
                  disabled={submitting}
                />
                <TextField
                  label="Category *"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  select
                  required
                  sx={{ flex: '1 1 200px' }}
                  disabled={submitting}
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                label="Description *"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                fullWidth
                placeholder="Describe the expense (e.g., Seeds purchase, Labor costs, etc.)"
                disabled={submitting}
                helperText="Required"
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Amount (PKR) *"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))}
                  required
                  sx={{ flex: '1 1 200px' }}
                  inputProps={{ 
                    min: "0.01",
                    step: "0.01",
                    placeholder: "0.00"
                  }}
                  disabled={submitting}
                  helperText="Required"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
                  }}
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
                disabled={submitting}
                helperText="Optional"
              />

              <Button 
                type="submit" 
                variant="contained" 
                disabled={submitting || !formData.description.trim() || !formData.amount || formData.amount <= 0}
                sx={{ alignSelf: 'flex-start', mt: 2 }}
                size="large"
              >
                {submitting ? 'Adding Expense...' : 'Add Expense'}
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
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </Box>
          
          {expenses.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No expenses recorded yet. Add your first expense above.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Notes</TableCell>
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
                          label={expense.category || 'OTHER'}
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
                        <Typography variant="body2" fontWeight="bold" color="error">
                          {safeFormatCurrency(expense.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {expense.notes || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDelete(expense.id)}
                          aria-label="Delete expense"
                          disabled={submitting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExpenseTracker;