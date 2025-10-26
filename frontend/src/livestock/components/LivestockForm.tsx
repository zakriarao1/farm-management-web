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
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Pets as AnimalIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { livestockApi } from '../services/api';
import type { 
  CreateLivestockRequest,
  UpdateLivestockRequest,
  LivestockType,
  LivestockStatus,
  LivestockGender
} from '../types';

export const LivestockForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Use type assertion for initial state to handle optional fields
  const [formData, setFormData] = useState<CreateLivestockRequest>({
    tagId: '',
    type: 'CATTLE',
    breed: '',
    gender: 'FEMALE',
    dateOfBirth: '', // This will be treated as string, not string | undefined
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    weight: 0,
    status: 'active',
    location: '',
    notes: '',
  } as CreateLivestockRequest); // Type assertion to handle optional fields

  useEffect(() => {
    if (isEdit && id) {
      loadAnimalData(parseInt(id));
    }
  }, [isEdit, id]);

  const loadAnimalData = async (animalId: number) => {
    try {
      setLoading(true);
      const response = await livestockApi.getById(animalId);
      const animal = response.data;
      
      setFormData({
        tagId: animal.tagId,
        type: animal.type,
        breed: animal.breed,
        gender: animal.gender,
        dateOfBirth: animal.dateOfBirth || '',
        purchaseDate: animal.purchaseDate,
        purchasePrice: animal.purchasePrice,
        weight: animal.weight,
        status: animal.status,
        location: animal.location,
        notes: animal.notes || '',
      } as CreateLivestockRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load animal data');
      console.error('Error loading animal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateLivestockRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'purchasePrice' || field === 'weight' ? 
        (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSelectChange = (field: keyof CreateLivestockRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value as any
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic validation
    if (!formData.tagId.trim()) {
      setError('Tag ID is required');
      return;
    }
    if (!formData.breed.trim()) {
      setError('Breed is required');
      return;
    }
    if (formData.weight <= 0) {
      setError('Weight must be greater than 0');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Prepare data for API - handle optional fields
      const submitData: CreateLivestockRequest = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || undefined, // Convert empty string to undefined
        notes: formData.notes || undefined, // Convert empty string to undefined
      };

      if (isEdit && id) {
        const updateData: UpdateLivestockRequest = { ...submitData };
        await livestockApi.update(parseInt(id), updateData);
        setSuccess('Animal updated successfully!');
      } else {
        await livestockApi.create(submitData);
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
      {/* Header */}
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
          {/* Left Column - Basic Information & Health */}
          <Box flex={1} display="flex" flexDirection="column" gap={3}>
            {/* Basic Information Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      label="Tag ID *"
                      value={formData.tagId}
                      onChange={handleInputChange('tagId')}
                      required
                    />
                    <TextField
                      fullWidth
                      select
                      label="Type *"
                      value={formData.type}
                      onChange={handleSelectChange('type')}
                    >
                      <MenuItem value="CATTLE">Cattle</MenuItem>
                      <MenuItem value="POULTRY">Poultry</MenuItem>
                      <MenuItem value="SHEEP">Sheep</MenuItem>
                      <MenuItem value="GOATS">Goats</MenuItem>
                      <MenuItem value="PIGS">Pigs</MenuItem>
                      <MenuItem value="FISH">Fish</MenuItem>
                      <MenuItem value="BEES">Bees</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </TextField>
                  </Box>
                  
                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      label="Breed *"
                      value={formData.breed}
                      onChange={handleInputChange('breed')}
                      required
                      error={!formData.breed.trim()}
                      helperText={!formData.breed.trim() ? 'Breed is required' : ''}
                    />
                    <TextField
                      fullWidth
                      select
                      label="Gender *"
                      value={formData.gender}
                      onChange={handleSelectChange('gender')}
                    >
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="CASTRATED">Castrated</MenuItem>
                    </TextField>
                  </Box>

                  <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange('dateOfBirth')}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      label="Purchase Date *"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={handleInputChange('purchaseDate')}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Health & Status Card */}
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
                      onChange={handleSelectChange('status')}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="sick">Sick</MenuItem>
                      <MenuItem value="pregnant">Pregnant</MenuItem>
                      <MenuItem value="calving">Calving</MenuItem>
                      <MenuItem value="milking">Milking</MenuItem>
                      <MenuItem value="ready_for_sale">Ready for Sale</MenuItem>
                      <MenuItem value="sold">Sold</MenuItem>
                      <MenuItem value="deceased">Deceased</MenuItem>
                    </TextField>
                    <TextField
                      fullWidth
                      label="Location *"
                      value={formData.location}
                      onChange={handleInputChange('location')}
                      required
                      error={!formData.location.trim()}
                      helperText={!formData.location.trim() ? 'Location is required' : ''}
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

          {/* Right Column - Financial & Actions */}
          <Box width={{ xs: '100%', md: 300 }} display="flex" flexDirection="column" gap={3}>
            {/* Financial & Measurements Card */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Financial & Measurements
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    fullWidth
                    label="Purchase Price ($)"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleInputChange('purchasePrice')}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    fullWidth
                    label="Weight (kg) *"
                    type="number"
                    value={formData.weight}
                    onChange={handleInputChange('weight')}
                    InputProps={{ endAdornment: <Typography sx={{ ml: 1 }}>kg</Typography> }}
                    required
                    error={formData.weight <= 0}
                    helperText={formData.weight <= 0 ? 'Weight must be greater than 0' : ''}
                    inputProps={{ min: 0.1, step: 0.1 }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Actions Card */}
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