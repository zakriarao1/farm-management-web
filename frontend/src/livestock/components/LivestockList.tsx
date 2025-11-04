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
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Pets as AnimalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { livestockApi } from '../services/api';
import type { Livestock, LivestockType, LivestockStatus } from '../types';

export const LivestockList: React.FC = () => {
  const navigate = useNavigate();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState<Livestock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<LivestockType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<LivestockStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadLivestock();
  }, []);

  const loadLivestock = async () => {
    try {
      setLoading(true);
      const response = await livestockApi.getAll();
      setLivestock(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load livestock');
      console.error('Error loading livestock:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (animal: Livestock) => {
    setAnimalToDelete(animal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!animalToDelete) return;

    try {
      await livestockApi.delete(animalToDelete.id);
      setLivestock(livestock.filter(animal => animal.id !== animalToDelete.id));
      setDeleteDialogOpen(false);
      setAnimalToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete animal');
      console.error('Error deleting livestock:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAnimalToDelete(null);
  };

  const getStatusColor = (status: LivestockStatus) => {
    const colors: Record<LivestockStatus, 'success' | 'error' | 'warning' | 'info'> = {
      active: 'success',
      sick: 'error',
      pregnant: 'warning',
      calving: 'info',
      milking: 'info',
      ready_for_sale: 'warning',
      sold: 'success',
      deceased: 'error',
    };
    return colors[status];
  };

  const getTypeColor = (type: LivestockType) => {
    const colors: Record<LivestockType, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
      CATTLE: 'primary',
      POULTRY: 'secondary',
      SHEEP: 'success',
      GOATS: 'warning',
      FISH: 'info',
      OTHER: 'primary',
    };
    return colors[type];
  };

  const filteredLivestock = livestock.filter(animal => {
    const tagId = animal.tagId || '';
    const breed = animal.breed || '';
    const location = (animal as any).location || ''; // Temporary fix for location property
    
    const matchesSearch = 
      tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || animal.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || animal.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Livestock Management
          </Typography>
          <Typography color="text.secondary">
            Manage your animals and their records
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/livestock/animals/new')}
        >
          Add New Animal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ minWidth: 200 }}
            />
            <TextField
              select
              label="Type"
              variant="outlined"
              size="small"
              value={typeFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'ALL' || ['CATTLE', 'POULTRY', 'SHEEP', 'GOATS',  'FISH',  'OTHER'].includes(value)) {
                  setTypeFilter(value as LivestockType | 'ALL');
                }
              }}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="CATTLE">Cattle</MenuItem>
              <MenuItem value="POULTRY">Poultry</MenuItem>
              <MenuItem value="SHEEP">Sheep</MenuItem>
              <MenuItem value="GOATS">Goats</MenuItem>
              <MenuItem value="PIGS">Pigs</MenuItem>
              <MenuItem value="FISH">Fish</MenuItem>
              <MenuItem value="BEES">Bees</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>
            <TextField
              select
              label="Status"
              variant="outlined"
              size="small"
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'ALL' || ['active', 'sick', 'pregnant', 'calving', 'milking', 'ready_for_sale', 'sold', 'deceased'].includes(value)) {
                  setStatusFilter(value as LivestockStatus | 'ALL');
                }
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="sick">Sick</MenuItem>
              <MenuItem value="pregnant">Pregnant</MenuItem>
              <MenuItem value="calving">Calving</MenuItem>
              <MenuItem value="milking">Milking</MenuItem>
              <MenuItem value="ready_for_sale">Ready for Sale</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="deceased">Deceased</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        Showing {filteredLivestock.length} of {livestock.length} animals
      </Typography>

      {/* Livestock Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tag ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Breed</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Purchase Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLivestock.map((animal) => (
              <TableRow key={animal.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AnimalIcon fontSize="small" color="action" />
                    <Typography fontWeight="bold">{animal.tagId || 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={animal.type} 
                    size="small" 
                    color={getTypeColor(animal.type)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{animal.breed || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={animal.gender} 
                    size="small" 
                    color="default" // This is fine here since it's not using the getTypeColor function
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{animal.weight} kg</TableCell>
                <TableCell>
                  <Chip 
                    label={animal.status} 
                    size="small" 
                    color={getStatusColor(animal.status)}
                  />
                </TableCell>
                <TableCell>{(animal as any).location || 'N/A'}</TableCell>
                <TableCell>
                  {animal.purchaseDate ? new Date(animal.purchaseDate).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/livestock/animals/${animal.id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => navigate(`/livestock/animals/${animal.id}/edit`)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(animal)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredLivestock.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No animals found matching your criteria
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Animal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete animal with tag ID "{animalToDelete?.tagId}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};