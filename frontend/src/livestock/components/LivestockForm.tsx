import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Pets as AnimalIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { livestockApi, flockApi } from '../services/api';
import type { 
  CreateLivestockRequest,
  UpdateLivestockRequest,
  Flock
} from '../types';

interface LivestockFormData {
  tag_number: string;
  animal_type: string;
  breed: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  date_of_birth: string;
  purchase_date: string;
  purchase_price: number;
  current_weight: number;
  status: 'HEALTHY' | 'SICK' | 'PREGNANT' | 'SOLD' | 'DECEASED';
  location: string;
  notes: string;
  flock_id?: number;
}

export const LivestockForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [flocks, setFlocks] = useState<Flock[]>([]);

  const [formData, setFormData] = useState<LivestockFormData>({
    tag_number: '',
    animal_type: 'CHICKENS',
    breed: '',
    gender: 'FEMALE',
    date_of_birth: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    current_weight: 0,
    status: 'HEALTHY',
    location: '',
    notes: '',
    flock_id: undefined,
  });

  const ANIMAL_TYPES = [
    'CHICKENS', 'GOATS', 'SHEEP', 'COWS', 'BUFFALOES', 'OTHER'
  ];

  const STATUS_OPTIONS = [
    'HEALTHY', 'SICK', 'PREGNANT', 'SOLD', 'DECEASED'
  ];

  const GENDER_OPTIONS = [
    'MALE', 'FEMALE', 'UNKNOWN'
  ];

  useEffect(() => {
    loadFlocks();
    if (isEdit && id) {
      loadAnimalData(parseInt(id));
    }
  }, [isEdit, id]);

  const loadFlocks = async () => {
    try {
      const response = await flockApi.getAll();
      setFlocks(response.data || []);
    } catch (err) {
      console.error('Error loading flocks:', err);
    }
  };

  const loadAnimalData = async (animalId: number) => {
    try {
      setLoading(true);
      const response = await livestockApi.getById(animalId);
      const animal = response.data;
      
      setFormData({
        tag_number: animal.tag_number,
        animal_type: animal.animal_type,
        breed: animal.breed || '',
        gender: animal.gender,
        date_of_birth: animal.date_of_birth || '',
        purchase_date: animal.purchase_date || new Date().toISOString().split('T')[0],
        purchase_price: animal.purchase_price || 0,
        current_weight: animal.current_weight || 0,
        status: animal.status,
        location: animal.location || '',
        notes: animal.notes || '',
        flock_id: animal.flock_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load animal data');
      console.error('Error loading animal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LivestockFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'purchase_price' || field === 'current_weight' ? 
        (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleFlockChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      flock_id: value === '' ? undefined : (value as number)
    }));
  };

  const getAvailableFlocks = () => {
    if (!formData.animal_type) return flocks;
    return flocks.filter(flock => 
      flock.animal_type === formData.animal_type && 
      flock.current_animals > 0
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Updated validation - breed and location are now optional
    if (!formData.tag_number.trim()) {
      setError('Tag number is required');
      return;
    }
    if (!formData.animal_type) {
      setError('Animal type is required');
      return;
    }
    if (!formData.status) {
      setError('Status is required');
      return;
    }

    // Validate weight is positive if provided
    if (formData.current_weight && formData.current_weight <= 0) {
      setError('Weight must be greater than 0 if provided');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (isEdit && id) {
        const updateData: UpdateLivestockRequest = { ...formData };
        await livestockApi.update(parseInt(id), updateData);
        setSuccess('Animal updated successfully!');
      } else {
        const createData: CreateLivestockRequest = { ...formData };
        await livestockApi.create(createData);
        setSuccess('Animal created successfully!');
      }

      setTimeout(() => {
        navigate('/livestock/animals');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} animal`);
      console.error('Error saving animal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/livestock/animals');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AnimalIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Animal' : 'Add New Animal'}
          </Typography>
          <Typography color="text.secondary">
            {isEdit ? 'Update animal information' : 'Register a new animal to your livestock'}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          <Box flex={1} display="flex" flexDirection="column" gap={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      label="Tag Number *"
                      value={formData.tag_number}
                      onChange={handleInputChange('tag_number')}
                      required
                      placeholder="e.g., CHK-001, GT-001"
                    />
                    <TextField
                      fullWidth
                      select
                      label="Animal Type *"
                      value={formData.animal_type}
                      onChange={handleInputChange('animal_type')}
                      required
                    >
                      {ANIMAL_TYPES.map(type => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      label="Breed"
                      value={formData.breed}
                      onChange={handleInputChange('breed')}
                      placeholder="e.g., Rhode Island Red, Saanen (Optional)"
                    />
                    <TextField
                      fullWidth
                      select
                      label="Gender *"
                      value={formData.gender}
                      onChange={handleInputChange('gender')}
                    >
                      {GENDER_OPTIONS.map(gender => (
                        <MenuItem key={gender} value={gender}>
                          {gender}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  <FormControl fullWidth>
                    <InputLabel>Flock (Optional)</InputLabel>
                    <Select
                      value={formData.flock_id || ''}
                      onChange={handleFlockChange}
                      label="Flock (Optional)"
                    >
                      <MenuItem value="">
                        <em>No Flock</em>
                      </MenuItem>
                      {getAvailableFlocks().map(flock => (
                        <MenuItem key={flock.id} value={flock.id}>
                          {flock.name} ({flock.animal_type}) - {flock.current_animals}/{flock.total_animals} animals
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange('date_of_birth')}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Purchase Date *"
                      type="date"
                      value={formData.purchase_date}
                      onChange={handleInputChange('purchase_date')}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Health & Status
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      select
                      label="Status *"
                      value={formData.status}
                      onChange={handleInputChange('status')}
                      required
                    >
                      {STATUS_OPTIONS.map(status => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={handleInputChange('location')}
                      placeholder="e.g., North Field, Barn A (Optional)"
                    />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={formData.notes}
                    onChange={handleInputChange('notes')}
                    placeholder="Any additional notes about the animal..."
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box width={{ xs: '100%', md: 300 }} display="flex" flexDirection="column" gap={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Financial & Measurements
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    fullWidth
                    label="Purchase Price (PKR)"
                    type="number"
                    value={formData.purchase_price}
                    onChange={handleInputChange('purchase_price')}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography> }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    fullWidth
                    label="Current Weight (kg)"
                    type="number"
                    value={formData.current_weight}
                    onChange={handleInputChange('current_weight')}
                    InputProps={{ endAdornment: <Typography sx={{ ml: 1 }}>kg</Typography> }}
                    helperText="Optional - enter 0 if not applicable"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Actions
              </Typography>
              <Box display="flex" gap={1} flexDirection="column">
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'Saving...' : (isEdit ? 'Update Animal' : 'Create Animal')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </form>
    </Box>
  );
};