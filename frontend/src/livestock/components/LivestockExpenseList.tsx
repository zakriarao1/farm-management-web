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
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Edit, Delete, Add, AttachMoney } from '@mui/icons-material';
import { livestockExpenseApi, flockApi } from '../services/api';
import { LivestockExpense, Flock, CreateLivestockExpenseRequest } from '../types';
import Grid from '@mui/material/Grid';

export const LivestockExpenseList: React.FC = () => {
  const [expenses, setExpenses] = useState<LivestockExpense[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<LivestockExpense | null>(null);
  const [formData, setFormData] = useState<CreateLivestockExpenseRequest>({
    flock_id: 0,
    livestock_id: undefined,
    description: '',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const expenseCategories = [
    'Feed',
    'Veterinary',
    'Medication',
    'Equipment',
    'Shelter',
    'Labor',
    'Transportation',
    'Supplies',
    'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, flocksResponse] = await Promise.all([
        livestockExpenseApi.getAll(),
        flockApi.getAll()
      ]);
      setExpenses(expensesResponse.data || []);
      setFlocks(flocksResponse.data || []);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.flock_id || !formData.description || !formData.category || formData.amount <= 0) {
      setError('Please fill all required fields with valid values');
      return;
    }

    try {
      if (editingExpense) {
        await livestockExpenseApi.update(editingExpense.id, formData);
      } else {
        await livestockExpenseApi.create(formData);
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      setError('Failed to save expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await livestockExpenseApi.delete(id);
        loadData();
      } catch (err) {
        setError('Failed to delete expense');
      }
    }
  };

  const handleEdit = (expense: LivestockExpense) => {
    setEditingExpense(expense);
    setFormData({
      flock_id: expense.flock_id,
      livestock_id: expense.livestock_id,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date.split('T')[0],
      notes: expense.notes || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      flock_id: 0,
      livestock_id: undefined,
      description: '',
      category: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const getFlockName = (flockId: number) => {
    const flock = flocks.find(f => f.id === flockId);
    return flock ? flock.name : 'Unknown Flock';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default'> = {
      'Feed': 'primary',
      'Veterinary': 'error',
      'Medication': 'warning',
      'Equipment': 'info',
      'Shelter': 'secondary',
      'Labor': 'success',
      'Transportation': 'primary',
      'Supplies': 'info',
      'Other': 'default'
    };
    return colors[category] || 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
          Livestock Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          disabled={flocks.length === 0}
        >
          Add Expense
        </Button>
      </Box>

      {flocks.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No flocks found. Please create a flock first before adding expenses.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Flock</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {expense.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={expense.category} 
                        size="small" 
                        color={getCategoryColor(expense.category)}
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>{getFlockName(expense.flock_id)}</TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color="primary">
                        ₨{expense.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {expense.notes || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(expense.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(expense)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(expense.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {expenses.length === 0 && !loading && flocks.length > 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                No expenses found. Add your first livestock expense.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Livestock Expense' : 'Add New Livestock Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Flock</InputLabel>
                  <Select
                    value={formData.flock_id}
                    label="Flock"
                    onChange={(e) => setFormData({ ...formData, flock_id: Number(e.target.value) })}
                  >
                    <MenuItem value={0}>Select Flock</MenuItem>
                    {flocks.map((flock) => (
                      <MenuItem key={flock.id} value={flock.id}>
                        {flock.name} ({flock.animal_type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {expenseCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description *"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  margin="normal"
                  placeholder="Describe the expense..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount (PKR) *"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography> }}
                  required
                  margin="normal"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date *"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={3}
                  margin="normal"
                  placeholder="Additional notes about this expense..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.flock_id || !formData.description || !formData.category || formData.amount <= 0}
            >
              {editingExpense ? 'Update' : 'Create'} Expense
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};