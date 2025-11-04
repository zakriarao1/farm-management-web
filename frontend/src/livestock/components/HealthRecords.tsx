import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  IconButton,
  Chip,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as HealthIcon,
} from '@mui/icons-material';
import { livestockApi } from '../services/api';
import type { HealthRecord } from '../types';

interface HealthRecordsProps {
  livestockId: number;
  healthRecords: HealthRecord[];
  onRecordAdded: (record: HealthRecord) => void;
  onRecordUpdated?: (record: HealthRecord) => void;
  onRecordDeleted?: (recordId: number) => void;
}

interface HealthRecordFormData {
  date: string;
  condition: string;
  treatment: string;
  medication: string;
  dosage: string;
  veterinarian: string;
  cost: number;
  notes: string;
}

export const HealthRecords: React.FC<HealthRecordsProps> = ({
  livestockId,
  healthRecords,
  onRecordAdded,
  onRecordUpdated,
  onRecordDeleted,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState<HealthRecordFormData>({
    date: new Date().toISOString().slice(0, 10),
    condition: '',
    treatment: '',
    medication: '',
    dosage: '',
    veterinarian: '',
    cost: 0,
    notes: '',
  });

  const commonConditions = [
    'Respiratory Infection',
    'Digestive Issues',
    'Parasites',
    'Injury',
    'Lameness',
    'Mastitis',
    'Metabolic Disorder',
    'Reproductive Issues',
    'Vaccination',
    'Routine Checkup',
    'Other',
  ];

  const commonTreatments = [
    'Antibiotics',
    'Anti-inflammatory',
    'Deworming',
    'Vaccination',
    'Wound Care',
    'Fluid Therapy',
    'Nutritional Support',
    'Surgery',
    'Physical Therapy',
    'Other',
  ];

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      condition: '',
      treatment: '',
      medication: '',
      dosage: '',
      veterinarian: '',
      cost: 0,
      notes: '',
    });
    setEditingRecord(null);
    setError('');
    setSuccess('');
  };

  const handleOpenDialog = (record?: HealthRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        date: record.date,
        condition: record.condition,
        treatment: record.treatment,
        medication: record.medication || '',
        dosage: record.dosage || '',
        veterinarian: record.veterinarian || '',
        cost: record.cost,
        notes: record.notes || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleInputChange = (field: keyof HealthRecordFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'cost' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validation
    if (!formData.condition.trim() || !formData.treatment.trim()) {
      setError('Condition and treatment are required');
      return;
    }

    if (formData.cost < 0) {
      setError('Cost cannot be negative');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const recordData = {
        date: formData.date,
        condition: formData.condition,
        treatment: formData.treatment,
        medication: formData.medication || undefined,
        dosage: formData.dosage || undefined,
        veterinarian: formData.veterinarian || undefined,
        cost: formData.cost,
        notes: formData.notes || undefined,
      };

      // Use type assertion to handle the API type requirements
      const apiRecordData = recordData as any;

      if (editingRecord) {
        // Update existing record
        const response = await livestockApi.updateHealthRecord(editingRecord.id, apiRecordData);
        if (onRecordUpdated) {
          onRecordUpdated(response.data);
        }
        setSuccess('Health record updated successfully!');
      } else {
        // Create new record
        const response = await livestockApi.addHealthRecord(livestockId, apiRecordData);
        onRecordAdded(response.data);
        setSuccess('Health record added successfully!');
      }

      // Close dialog and reset form after a short delay
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingRecord ? 'update' : 'add'} health record`);
      console.error('Error saving health record:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      setLoading(true);
      await livestockApi.deleteHealthRecord(recordId);
      
      if (onRecordDeleted) {
        onRecordDeleted(recordId);
      }
      setSuccess('Health record deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete health record');
      console.error('Error deleting health record:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <HealthIcon color="primary" />
          <Typography variant="h6">Health Records</Typography>
          <Chip 
            label={`${healthRecords.length} record${healthRecords.length !== 1 ? 's' : ''}`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Add Health Record
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Health Records List */}
      {healthRecords.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <HealthIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Health Records
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              No health records found for this animal. Add the first health record to get started.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add First Health Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <List>
          {healthRecords.map((record, index) => (
            <React.Fragment key={record.id}>
              <ListItem alignItems="flex-start">
                <Box display="flex" alignItems="flex-start" gap={2} width="100%">
                  {/* Date Badge */}
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 1, 
                      minWidth: 80, 
                      textAlign: 'center',
                      backgroundColor: 'primary.main',
                      color: 'white',
                    }}
                  >
                    <Typography variant="caption" display="block">
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {new Date(record.date).getDate()}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {new Date(record.date).getFullYear()}
                    </Typography>
                  </Paper>

                  {/* Record Details */}
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {record.condition}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Treatment: {record.treatment}
                        </Typography>
                      </Box>
                      <Chip 
                        label={formatCurrency(record.cost)} 
                        size="small" 
                        color={record.cost > 100 ? "error" : "default"}
                        variant="outlined"
                      />
                    </Box>

                    {/* Additional Information */}
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      {(record.medication || record.dosage) && (
                        <Typography variant="body2">
                          <strong>Medication:</strong> {record.medication} 
                          {record.dosage && ` • ${record.dosage}`}
                        </Typography>
                      )}
                      
                      {record.veterinarian && (
                        <Typography variant="body2">
                          <strong>Veterinarian:</strong> {record.veterinarian}
                        </Typography>
                      )}
                      
                      {record.notes && (
                        <Typography variant="body2">
                          <strong>Notes:</strong> {record.notes}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" color="text.secondary">
                        Recorded on {new Date((record as any).created_at || record.createdAt).toLocaleDateString()} at{' '}
                        {new Date((record as any).created_at || record.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions */}
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(record)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
              {index < healthRecords.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Add/Edit Health Record Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <HealthIcon color="primary" />
            {editingRecord ? 'Edit Health Record' : 'Add Health Record'}
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Date and Cost */}
              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth
                  label="Date *"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange('date')}
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  fullWidth
                  label="Cost ($)"
                  type="number"
                  value={formData.cost}
                  onChange={handleInputChange('cost')}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                />
              </Box>

              {/* Condition and Treatment */}
              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth
                  select
                  label="Condition *"
                  value={formData.condition}
                  onChange={handleInputChange('condition')}
                  required
                >
                  <MenuItem value="">
                    <em>Select a condition</em>
                  </MenuItem>
                  {commonConditions.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  fullWidth
                  select
                  label="Treatment *"
                  value={formData.treatment}
                  onChange={handleInputChange('treatment')}
                  required
                >
                  <MenuItem value="">
                    <em>Select a treatment</em>
                  </MenuItem>
                  {commonTreatments.map((treatment) => (
                    <MenuItem key={treatment} value={treatment}>
                      {treatment}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Medication and Dosage */}
              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <TextField
                  fullWidth
                  label="Medication"
                  value={formData.medication}
                  onChange={handleInputChange('medication')}
                  placeholder="e.g., Antibiotic, Pain reliever"
                />
                
                <TextField
                  fullWidth
                  label="Dosage"
                  value={formData.dosage}
                  onChange={handleInputChange('dosage')}
                  placeholder="e.g., 500mg twice daily"
                />
              </Box>

              {/* Veterinarian */}
              <TextField
                fullWidth
                label="Veterinarian"
                value={formData.veterinarian}
                onChange={handleInputChange('veterinarian')}
                placeholder="Name of veterinarian or clinic"
              />

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Additional notes about the health condition, treatment response, follow-up requirements..."
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {loading ? 'Saving...' : (editingRecord ? 'Update Record' : 'Add Record')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};