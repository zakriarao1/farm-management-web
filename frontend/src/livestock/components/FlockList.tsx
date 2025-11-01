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
} from '@mui/material';
import { Edit, Delete, Add, Pets } from '@mui/icons-material';
import { flockApi } from '../../services/api';
import { Flock } from '../types';
import Grid from '@mui/material/Grid';

export const FlockList: React.FC = () => {
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlock, setEditingFlock] = useState<Flock | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purchase_date: '',
    total_purchase_cost: '',
    // ADD THESE REQUIRED FIELDS:
    breed: 'Unknown',
    quantity: 1,
    age: 0,
    health_status: 'HEALTHY'
  });

  useEffect(() => {
    loadFlocks();
  }, []);

  const loadFlocks = async () => {
    try {
      setLoading(true);
      const response = await flockApi.getAll();
      setFlocks(response.data || []);
    } catch (err) {
      setError('Failed to load flocks');
      console.error('Error loading flocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFlock) {
        await flockApi.update(editingFlock.id, {
          ...formData,
          total_purchase_cost: formData.total_purchase_cost ? parseFloat(formData.total_purchase_cost) : undefined
        });
      } else {
        await flockApi.create({
          ...formData,
          total_purchase_cost: formData.total_purchase_cost ? parseFloat(formData.total_purchase_cost) : undefined,
        });
      }
      setDialogOpen(false);
      resetForm();
      loadFlocks();
    } catch (err) {
      setError('Failed to save flock');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this flock?')) {
      try {
        await flockApi.delete(id);
        loadFlocks();
      } catch (err) {
        setError('Failed to delete flock');
      }
    }
  };

  const handleEdit = (flock: Flock) => {
    setEditingFlock(flock);
    setFormData({
      name: flock.name,
      description: flock.description || '',
      purchase_date: flock.purchase_date || '',
      total_purchase_cost: flock.total_purchase_cost?.toString() || '',
      // ADD THESE MISSING FIELDS:
      breed: flock.breed || 'Unknown',
      quantity: flock.quantity || 1,
      age: flock.age || 0,
      health_status: flock.health_status || 'HEALTHY'
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      purchase_date: '',
      total_purchase_cost: '',
      // ADD THE SAME FIELDS HERE:
      breed: 'Unknown',
      quantity: 1,
      age: 0,
      health_status: 'HEALTHY'
    });
    setEditingFlock(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
          Flock Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Flock
        </Button>
      </Box>

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
                  <TableCell>Name</TableCell>
                  <TableCell>Breed</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Health Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Purchase Cost</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flocks.map((flock) => (
                  <TableRow key={flock.id}>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {flock.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{flock.breed || '-'}</TableCell>
                    <TableCell>{flock.quantity || 0}</TableCell>
                    <TableCell>{flock.age || 0} months</TableCell>
                    <TableCell>
                      <Chip 
                        label={flock.health_status || 'HEALTHY'} 
                        color={flock.health_status === 'HEALTHY' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{flock.description || '-'}</TableCell>
                    <TableCell>
                      {flock.purchase_date ? new Date(flock.purchase_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {flock.total_purchase_cost ? `$${flock.total_purchase_cost}` : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(flock.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(flock)}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(flock.id)}
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

          {flocks.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                No flocks found. Create your first flock to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingFlock ? 'Edit Flock' : 'Add New Flock'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Flock Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Age (months)"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Health Status"
                  value={formData.health_status}
                  onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Purchase Cost"
                  type="number"
                  value={formData.total_purchase_cost}
                  onChange={(e) => setFormData({ ...formData, total_purchase_cost: e.target.value })}
                  InputProps={{ startAdornment: '$' }}
                  margin="normal"
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingFlock ? 'Update' : 'Create'} Flock
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};