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
  const [tagError, setTagError] = useState<string>('');

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
        tag_number: animal.tag_number || '',
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
    
    // Clear tag error when user starts typing
    if (field === 'tag_number') {
      setTagError('');
    }
    
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
    
    // Clear tag error when flock changes
    if (tagError) {
      setTagError('');
    }
  };

  const getAvailableFlocks = () => {
    if (!formData.animal_type) return flocks;
    return flocks.filter(flock => 
      flock.animal_type === formData.animal_type
    );
  };

  // ✅ NEW: Function to check tag uniqueness
  const checkTagUniqueness = async (): Promise<boolean> => {
    if (!formData.tag_number.trim() || !formData.flock_id) return true;
    
    try {
      // In a real app, you might want to make an API call here
      // For now, we'll rely on backend validation
      return true;
    } catch (err) {
      console.error('Error checking tag uniqueness:', err);
      return true;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Clear previous errors
    setError('');
    setTagError('');
    
    // Validate tag number format
    if (!formData.tag_number.trim()) {
      setError('Tag number is required');
      return;
    }
    
    // Validate tag number format (letters, numbers, hyphens only)
    if (!/^[A-Za-z0-9\-_]+$/.test(formData.tag_number)) {
      setError('Tag number can only contain letters, numbers, hyphens, and underscores');
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

    // ✅ NEW: Validate that if flock is selected, tag must be unique
    if (formData.flock_id && formData.tag_number) {
      const isUnique = await checkTagUniqueness();
      if (!isUnique) {
        setTagError('Checking tag uniqueness...');
        // We'll let the backend handle the final check
      }
    }

    try {
      setSaving(true);
      setError('');

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
    } catch (err: any) {
      // ✅ Handle duplicate tag error specifically
      const errorMessage = err.message || 'An error occurred';
      
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('Duplicate tag') ||
          errorMessage.includes('unique constraint') ||
          errorMessage.includes('23505')) {
        setTagError(`Tag number "${formData.tag_number}" is already used in this flock. Please use a unique tag number.`);
        setError(`Tag number "${formData.tag_number}" is already used in this flock. Please use a unique tag number.`);
      } else {
        setError(errorMessage);
      }
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
          <Typography variant="body2" color="warning.main" mt={1}>
            ⚠️ Tag numbers must be unique within each flock
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
                      error={!!tagError || error.includes('already exists')}
                      helperText={tagError || error.includes('already exists') ? error : "Must be unique within the flock"}
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
                    <InputLabel>Flock *</InputLabel>
                    <Select
                      value={formData.flock_id || ''}
                      onChange={handleFlockChange}
                      label="Flock *"
                      required
                    >
                      <MenuItem value="">
                        <em>No Flock</em>
                      </MenuItem>
                      {getAvailableFlocks().map(flock => (
                        <MenuItem key={flock.id} value={flock.id}>
                          {flock.name} ({flock.animal_type}) - {flock.current_animals} animals
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

            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Tag Number Rules
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Must be unique within the selected flock<br/>
                • Only letters, numbers, hyphens, underscores<br/>
                • Examples: CHK-001, GOAT-2023, SHEEP_1<br/>
                • Required for tracking
              </Typography>
            </Paper>

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