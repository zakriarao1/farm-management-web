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
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { expenseApi } from '../services/api';
import type { Expense, CreateExpenseRequest, ExpenseCategory, UpdateExpenseRequest } from '../types';

interface ExpenseManagerProps {
  cropId: number;
  cropName: string;
  onExpensesUpdated?: () => void;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  cropId,
  cropName,
  onExpensesUpdated
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // FIXED: Use crop_id (snake_case) to match CreateExpenseRequest interface
  const [formData, setFormData] = useState<CreateExpenseRequest>({
    crop_id: cropId, // Changed from cropId to crop_id
    description: '',
    category: 'OTHER' as ExpenseCategory,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load expenses function
  const loadExpenses = useCallback(async () => {
  try {
    setLoading(true);
    setError('');
    
    console.log(`🚀 DEBUG START ======================================`);
    console.log(`📖 Loading expenses for crop ID: ${cropId}, Name: ${cropName}`);
    
    // Test 1: Direct API call without transformation
    console.log('🔍 Making direct API call...');
    const directUrl = `/.netlify/functions/expenses/crops/${cropId}/expenses`;
    console.log(`🔍 URL: ${directUrl}`);
    
    const directResponse = await fetch(directUrl);
    const directData = await directResponse.json();
    
    console.log('🔍 Direct API Status:', directResponse.status);
    console.log('🔍 Direct API Response:', directData);
    
    // Check what we got
    if (directData.data && Array.isArray(directData.data)) {
      console.log(`🔍 Direct: Got ${directData.data.length} items`);
      if (directData.data.length > 0) {
        const firstItem = directData.data[0];
        console.log('🔍 First item type:', typeof firstItem);
        console.log('🔍 First item keys:', Object.keys(firstItem));
        console.log('🔍 First item values:', firstItem);
        
        // Determine if it's expense or crop data
        const isExpense = 'crop_id' in firstItem && 'description' in firstItem;
        const isCrop = 'name' in firstItem || 'plantingDate' in firstItem;
        
        console.log(`🔍 Is expense data? ${isExpense}`);
        console.log(`🔍 Is crop data? ${isCrop}`);
        
        if (isCrop) {
          console.error('❌❌❌ CONFIRMED: Backend is returning CROP data, not EXPENSE data!');
          console.error('❌ This means either:');
          console.error('❌ 1. Wrong backend function is being called');
          console.error('❌ 2. Wrong SQL query in backend');
          console.error('❌ 3. Route conflict in Netlify functions');
        }
      }
    }
    
    // Test 2: Use expenseApi
    console.log('🔍 Now using expenseApi.getByCropId...');
    const response = await expenseApi.getByCropId(cropId);
    console.log('🔍 expenseApi response:', response);
    
    console.log(`🚀 DEBUG END ========================================`);
    
    // Continue with your existing code...
    if (response.data && Array.isArray(response.data)) {
      console.log(`✅ Found ${response.data.length} expenses`);
      setExpenses(response.data);
    } else {
      console.log('⚠️ No valid expense data');
      setExpenses([]);
    }
    
  } catch (err: any) {
    console.error('❌ Error:', err);
    setError('Failed to load expenses');
    setExpenses([]);
  } finally {
    setLoading(false);
  }
}, [cropId, cropName]);

  // Load expenses on component mount and when cropId changes
  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Open dialog for add/edit
  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        crop_id: cropId,
        description: expense.description || '',
        category: expense.category || 'OTHER',
        amount: expense.amount || 0,
        date: expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        crop_id: cropId,
        description: '',
        category: 'OTHER',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setOpenDialog(true);
    setError('');
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpense(null);
    setError('');
  };

  // Handle form submission (Add/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.description?.trim()) {
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
      if (editingExpense) {
        // Update existing expense using expenseApi service
        console.log('🔄 Updating expense...');
        const updateData: UpdateExpenseRequest = {
          description: formData.description,
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes,
          // Include crop_id for updates if needed
          crop_id: cropId,
        };
        
        console.log('📤 Update data:', updateData);
        
        const response = await expenseApi.update(editingExpense.id.toString(), updateData);
        console.log('✅ Expense updated:', response);
        
        setSuccessMessage('Expense updated successfully!');
      } else {
        // Create new expense using expenseApi service
        console.log('🔄 Creating new expense...');
        console.log('📤 Create data:', formData); // Already has crop_id
        
        const response = await expenseApi.create(formData);
        console.log('✅ Expense created:', response);
        
        setSuccessMessage('Expense added successfully!');
      }
      
      // Reload expenses
      await loadExpenses();
      handleCloseDialog();
      onExpensesUpdated?.();
      
    } catch (err: any) {
      console.error('❌ Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  // Handle delete expense
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setError('');
      console.log(`🗑️ Deleting expense ID: ${id}`);
      
      const response = await expenseApi.delete(id.toString());
      console.log('✅ Expense deleted:', response);
      
      await loadExpenses();
      onExpensesUpdated?.();
      setSuccessMessage('Expense deleted successfully!');
      
    } catch (err: any) {
      console.error('❌ Error deleting expense:', err);
      setError('Failed to delete expense');
    }
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);

  // Category color mapping
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
    return colors[category] || 'default';
  };

  // Loading state
  if (loading) {
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

      {/* Error Alert */}
      {error && !openDialog && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={loadExpenses}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />

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
                {safeFormatCurrency(totalExpenses)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

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
                <TableRow key={expense.id} hover>
                  <TableCell>
                    {safeFormatDate(expense.date)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {expense.description || 'No description'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.category || 'OTHER'}
                      color={getCategoryColor(expense.category || 'OTHER') as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {safeFormatCurrency(expense.amount)}
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
                      title="Edit expense"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(expense.id)}
                      color="error"
                      title="Delete expense"
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
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Expenses Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {error ? 'Error loading expenses' : 'No expenses recorded yet for this crop.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Your First Expense
            </Button>
            {error && (
              <Button 
                variant="outlined" 
                onClick={loadExpenses}
                sx={{ mt: 1, ml: 1 }}
              >
                Retry Loading
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Expense Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit} noValidate>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Description *"
                name="description"
                id="expense-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                fullWidth
                autoComplete="off"
                helperText="Describe the expense (e.g., 'Seeds purchase', 'Labor cost')"
              />
              
              <TextField
                label="Category *"
                name="category"
                id="expense-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                select
                required
                fullWidth
                helperText="Select the expense category"
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
                name="amount"
                id="expense-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                inputProps={{ 
                  min: "0.01",
                  step: "0.01",
                  placeholder: "0.00"
                }}
                required
                fullWidth
                helperText="Enter the expense amount in Pakistani Rupees"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography>,
                }}
              />
              
              <TextField
                label="Date *"
                name="date"
                id="expense-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{
                  shrink: true,
                }}
                required
                fullWidth
                helperText="Select the date when the expense occurred"
              />
              
              <TextField
                label="Notes"
                name="notes"
                id="expense-notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder="Additional notes about this expense..."
                fullWidth
                helperText="Optional: Add any additional details about this expense"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.description?.trim() || !formData.amount || formData.amount <= 0}
            >
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ExpenseManager;