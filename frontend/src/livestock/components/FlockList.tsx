// frontend/src/components/livestock/FlockList.tsx

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
  LinearProgress,
} from '@mui/material';
import { Edit, Delete, Add, Pets } from '@mui/icons-material';
import { flockApi } from '../services/api';
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
    animal_type: '',
    breed: '',
    total_animals: 1,
    current_animals: 1,
    purchase_date: new Date().toISOString().split('T')[0],
    total_purchase_cost: 0,
    description: '',
  });

  // Animal type options
  const ANIMAL_TYPES = [
    'CHICKENS', 'GOATS', 'SHEEP', 'COWS', 'BUFFALOES','OTHER'
  ];

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
    
    if (!formData.name || !formData.animal_type || formData.total_animals <= 0) {
      setError('Name, animal type, and total animals are required');
      return;
    }

    try {
      if (editingFlock) {
        await flockApi.update(editingFlock.id, formData);
      } else {
        // For new flocks, set current_animals equal to total_animals
        const flockData = {
          ...formData,
          current_animals: formData.total_animals
        };
        await flockApi.create(flockData);
      }
      setDialogOpen(false);
      resetForm();
      loadFlocks();
    } catch (err) {
      setError('Failed to save flock');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this flock? This will remove the flock association from any animals.')) {
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
      animal_type: flock.animal_type,
      breed: flock.breed || '',
      total_animals: flock.total_animals,
      current_animals: flock.current_animals,
      purchase_date: flock.purchase_date ? flock.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
      total_purchase_cost: flock.total_purchase_cost || 0,
      description: flock.description || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      animal_type: '',
      breed: '',
      total_animals: 1,
      current_animals: 1,
      purchase_date: new Date().toISOString().split('T')[0],
      total_purchase_cost: 0,
      description: '',
    });
    setEditingFlock(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
    setError('');
  };

  const getAnimalTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default'> = {
      CHICKENS: 'primary',
      GOATS: 'success',
      SHEEP: 'warning',
      COWS: 'error',
      BUFFALOES: 'info',
      OTHER: 'secondary',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
          Loading flocks...
        </Typography>
      </Box>
    );
  }

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
                  <TableCell>Animal Type</TableCell>
                  <TableCell>Breed</TableCell>
                  <TableCell align="center">Animals</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell align="right">Purchase Price</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flocks.map((flock) => (
                  <TableRow key={flock.id} hover>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {flock.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={flock.animal_type}
                        color={getAnimalTypeColor(flock.animal_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{flock.breed || '-'}</TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <Pets color="primary" fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                          {flock.current_animals} / {flock.total_animals}
                        </Typography>
                      </Box>
                      {flock.current_animals < flock.total_animals && (
                        <Typography variant="caption" color="error">
                          {flock.total_animals - flock.current_animals} lost
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {flock.purchase_date ? new Date(flock.purchase_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ₨{flock.total_purchase_cost?.toLocaleString() || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap title={flock.description}>
                        {flock.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(flock)}
                        size="small"
                        title="Edit flock"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(flock.id)}
                        size="small"
                        title="Delete flock"
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
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Flock Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  margin="normal"
                  placeholder="e.g., Layer Chickens Batch 1"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Animal Type *"
                  value={formData.animal_type}
                  onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                  select
                  required
                  fullWidth
                  margin="normal"
                >
                  {ANIMAL_TYPES.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Breed"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  fullWidth
                  margin="normal"
                  placeholder="e.g., Rhode Island Red, Saanen"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Total Animals *"
                  type="number"
                  value={formData.total_animals}
                  onChange={(e) => setFormData({ ...formData, total_animals: parseInt(e.target.value) || 0 })}
                  fullWidth
                  margin="normal"
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              
              {editingFlock && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Current Animals"
                    type="number"
                    value={formData.current_animals}
                    onChange={(e) => setFormData({ ...formData, current_animals: parseInt(e.target.value) || 0 })}
                    fullWidth
                    margin="normal"
                    inputProps={{ 
                      min: 0, 
                      max: formData.total_animals 
                    }}
                    helperText={`Max: ${formData.total_animals}`}
                  />
                </Grid>
              )}
              
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
                  label="Purchase Price (PKR)"
                  type="number"
                  value={formData.total_purchase_cost}
                  onChange={(e) => setFormData({ ...formData, total_purchase_cost: parseFloat(e.target.value) || 0 })}
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
                  placeholder="Additional notes about this flock..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={!formData.name || !formData.animal_type || formData.total_animals <= 0}
            >
              {editingFlock ? 'Update' : 'Create'} Flock
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};