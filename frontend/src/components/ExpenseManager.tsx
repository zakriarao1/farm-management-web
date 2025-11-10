// frontend/src/components/ExpenseManager.tsx

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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { cropApi } from '../services/api';
import type { Expense, CreateExpenseRequest, ExpenseCategory } from '../types';

interface ExpenseManagerProps {
  cropId: number;
  cropName: string;
  onExpensesUpdated?: () => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  cropId,
  cropName,
  onExpensesUpdated
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    cropId,
    description: '',
    category: 'OTHER',
    amount: 0,
    date: new Date().toISOString().split('T')[0]!,
    notes: '',
  });

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await cropApi.getExpenses(cropId);
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

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        cropId,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        cropId,
        description: '',
        category: 'OTHER',
        amount: 0,
        date: new Date().toISOString().split('T')[0]!,
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpense(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.description || formData.amount <= 0) {
      setError('Description and amount are required');
      return;
    }

    try {
      if (editingExpense) {
        await cropApi.updateExpense(editingExpense.id, formData);
      } else {
        await cropApi.addExpense(formData);
      }
      
      await loadExpenses();
      handleCloseDialog();
      onExpensesUpdated?.();
    } catch (err) {
      console.error('Failed to save expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await cropApi.deleteExpense(id);
      await loadExpenses();
      onExpensesUpdated?.();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setError('Failed to delete expense');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getCategoryColor = (category: ExpenseCategory): string => {
    const colors: Record<ExpenseCategory, string> = {
      SEEDS: 'primary',
      FERTILIZERS: 'success',
      PESTICIDES: 'warning',
      LABOR: 'error',
      FUEL: 'secondary',
      EQUIPMENT: 'info',
      WATER: 'info',
      IRRIGATION: 'info',
      TRANSPORTATION: 'secondary',
      OTHER: 'default',
    };
    return colors[category];
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" component="div" fontWeight="bold">
          Expenses for {cropName}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Expense
        </Button>
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" component="div">
                Total Expenses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon color="primary" />
              <Typography variant="h4" component="div" color="primary" fontWeight="bold">
                ${totalExpenses.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Expenses Table */}
      {expenses.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {expense.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.category}
                      color={getCategoryColor(expense.category) as 'primary' | 'success' | 'warning' | 'error' | 'secondary' | 'info' | 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${expense.amount.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {expense.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(expense)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(expense.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary" py={4}>
              No expenses recorded yet. Add your first expense to track costs.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Expense Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Description *"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
              
              <TextField
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                select
                required
              >
                <MenuItem value="SEEDS">Seeds</MenuItem>
                <MenuItem value="FERTILIZERS">Fertilizers</MenuItem>
                <MenuItem value="PESTICIDES">Pesticides</MenuItem>
                <MenuItem value="LABOR">Labor</MenuItem>
                <MenuItem value="FUEL">Fuel</MenuItem>
                <MenuItem value="EQUIPMENT">Equipment</MenuItem>
                <MenuItem value="WATER">Water</MenuItem>
                <MenuItem value="IRRIGATION">Irrigation</MenuItem>
                <MenuItem value="TRANSPORTATION">Transportation</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
              
              <TextField
                label="Amount (PKR) *"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                inputProps={{ 
                  min: "0",
                  step: "1"
                }}
                required
              />
              
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
              
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder="Additional notes about this expense..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ExpenseManager;