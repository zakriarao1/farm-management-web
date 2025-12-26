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
import type { Livestock } from '../types';

interface LivestockListProps {
  refreshTrigger?: number;
}

export const LivestockList: React.FC<LivestockListProps> = ({ refreshTrigger = 0 }) => {
  const navigate = useNavigate();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState<Livestock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const ANIMAL_TYPES = ['CHICKENS', 'GOATS', 'SHEEP', 'COWS', 'BUFFALOES', 'OTHER'];
  const STATUS_OPTIONS = ['HEALTHY', 'SICK', 'PREGNANT', 'SOLD', 'DECEASED'];

  useEffect(() => {
    loadLivestock();
  }, [refreshTrigger]);

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      HEALTHY: 'success',
      SICK: 'error',
      PREGNANT: 'warning',
      SOLD: 'info',
      DECEASED: 'default',
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      CHICKENS: 'primary',
      GOATS: 'success',
      SHEEP: 'warning',
      COWS: 'error',
      BUFFALOES: 'info',
     OTHER: 'secondary',
    };
    return colors[type] || 'default';
  };

  const filteredLivestock = livestock.filter(animal => {
    const matchesSearch = 
      animal.tag_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || animal.animal_type === typeFilter;
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
              label="Animal Type"
              variant="outlined"
              size="small"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              {ANIMAL_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              variant="outlined"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              {STATUS_OPTIONS.map(status => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
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
              <TableCell>Tag Number</TableCell>
              <TableCell>Animal Type</TableCell>
              <TableCell>Breed</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Weight (kg)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Flock</TableCell>
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
                    <Typography fontWeight="bold">{animal.tag_number}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={animal.animal_type}
                    size="small" 
                    color={getTypeColor(animal.animal_type)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{animal.breed || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={animal.gender} 
                    size="small" 
                    color="default"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{animal.current_weight || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={animal.status} 
                    size="small" 
                    color={getStatusColor(animal.status)}
                  />
                </TableCell>
                <TableCell>{animal.location || 'N/A'}</TableCell>
                <TableCell>{animal.flock_name || 'No Flock'}</TableCell>
                <TableCell>
                  {animal.purchase_date ? new Date(animal.purchase_date).toLocaleDateString() : 'N/A'}
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
  onClick={(e) => {
    console.log('📝 Edit button clicked!');
    console.log('🔍 Animal ID:', animal.id);
    console.log('🔍 Animal:', animal);
    console.log('🔍 Path:', `/livestock/animals/${animal.id}/edit`);
    e.preventDefault();
    e.stopPropagation();
    navigate(`/livestock/animals/${animal.id}/edit`);
  }}
  title="Edit Animal"
  sx={{ 
    '&:hover': { 
      backgroundColor: 'secondary.light',
      '& .MuiSvgIcon-root': { color: 'white' }
    }
  }}
>
  <EditIcon fontSize="small" />
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
            Are you sure you want to delete animal with tag number "{animalToDelete?.tag_number}"? 
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