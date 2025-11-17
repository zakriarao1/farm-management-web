import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as AnimalIcon
} from '@mui/icons-material';
import { healthRecordsApi, livestockApi } from '../services/api';
import type { HealthRecord, Livestock } from '../types';

interface HealthRecordFormData {
  livestock_id: number;
  record_date: string;
  health_status: string;
  diagnosis: string;
  treatment: string;
  medication: string;
  dosage: string;
  veterinarian: string;
  cost: number;
  notes: string;
}

export const HealthRecordsManagement: React.FC = () => {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [selectedLivestockId, setSelectedLivestockId] = useState<number | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<HealthRecordFormData>({
    livestock_id: 0,
    record_date: new Date().toISOString().split('T')[0],
    health_status: 'HEALTHY',
    diagnosis: '',
    treatment: '',
    medication: '',
    dosage: '',
    veterinarian: '',
    cost: 0,
    notes: ''
  });

  const HEALTH_STATUS_OPTIONS = [
    'HEALTHY', 'SICK', 'INJURED', 'RECOVERING', 'CRITICAL', 'QUARANTINED'
  ];

  useEffect(() => {
    loadLivestock();
  }, []);

  useEffect(() => {
    if (selectedLivestockId) {
      loadHealthRecords(selectedLivestockId);
    } else {
      setHealthRecords([]);
    }
  }, [selectedLivestockId]);

  const loadLivestock = async () => {
    try {
      setLoading(true);
      const response = await livestockApi.getAll();
      setLivestock(response.data || []);
    } catch (err) {
      setError('Failed to load animals');
      console.error('Error loading livestock:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHealthRecords = async (livestockId: number) => {
    try {
      setLoading(true);
      const response = await healthRecordsApi.getByLivestock(livestockId);
      setHealthRecords(response.data || []);
    } catch (err) {
      setError('Failed to load health records');
      console.error('Error loading health records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLivestockChange = (event: SelectChangeEvent<number>) => {
    const value = event.target.value as number;
    setSelectedLivestockId(value);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field: keyof HealthRecordFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'cost' || field === 'livestock_id' ? 
        (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSelectChange = (field: keyof HealthRecordFormData) => (
    event: SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const openDialog = (record?: HealthRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        livestock_id: record.livestock_id,
        record_date: record.record_date.split('T')[0],
        health_status: record.health_status,
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        medication: record.medication || '',
        dosage: record.dosage || '',
        veterinarian: record.veterinarian || '',
        cost: record.cost || 0,
        notes: record.notes || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        livestock_id: selectedLivestockId || 0,
        record_date: new Date().toISOString().split('T')[0],
        health_status: 'HEALTHY',
        diagnosis: '',
        treatment: '',
        medication: '',
        dosage: '',
        veterinarian: '',
        cost: 0,
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.livestock_id) {
      setError('Please select an animal');
      return;
    }

    if (!formData.record_date || !formData.health_status) {
      setError('Record date and health status are required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingRecord) {
        await healthRecordsApi.update(editingRecord.id, formData);
        setSuccess('Health record updated successfully!');
      } else {
        await healthRecordsApi.create(formData);
        setSuccess('Health record created successfully!');
      }

      closeDialog();
      if (selectedLivestockId) {
        loadHealthRecords(selectedLivestockId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingRecord ? 'update' : 'create'} health record`);
      console.error('Error saving health record:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      await healthRecordsApi.delete(recordId);
      setSuccess('Health record deleted successfully!');
      if (selectedLivestockId) {
        loadHealthRecords(selectedLivestockId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete health record');
      console.error('Error deleting health record:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      HEALTHY: 'success.main',
      SICK: 'warning.main',
      INJURED: 'error.main',
      RECOVERING: 'info.main',
      CRITICAL: 'error.dark',
      QUARANTINED: 'warning.dark'
    };
    return colors[status] || 'text.primary';
  };

  if (loading && livestock.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AnimalIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Health Records Management
          </Typography>
          <Typography color="text.secondary">
            Track and manage animal health records
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

      <Grid container spacing={3}>
        {/* Animal Selection Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Select Animal
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Animal</InputLabel>
                <Select
                  value={selectedLivestockId || ''}
                  onChange={handleLivestockChange}
                  label="Select Animal"
                >
                  <MenuItem value="">
                    <em>Choose an animal...</em>
                  </MenuItem>
                  {livestock.map(animal => (
                    <MenuItem key={animal.id} value={animal.id}>
                      {animal.tag_number} - {animal.breed} ({animal.animal_type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedLivestockId && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog()}
                    fullWidth
                  >
                    Add Health Record
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {selectedLivestockId && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Health Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Records: {healthRecords.length}
                </Typography>
                {healthRecords.length > 0 && (
                  <Typography 
                    variant="body2" 
                    sx={{ color: getStatusColor(healthRecords[0].health_status) }}
                  >
                    Current Status: {healthRecords[0].health_status}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Health Records List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                <Typography variant="h6" color="primary">
                  Health Records
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedLivestockId ? `${healthRecords.length} records` : 'Select an animal to view records'}
                </Typography>
              </Box>

              {!selectedLivestockId ? (
                <Box textAlign="center" py={6}>
                  <AnimalIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.disabled" gutterBottom>
                    No Animal Selected
                  </Typography>
                  <Typography color="text.secondary">
                    Please select an animal from the dropdown to view and manage health records.
                  </Typography>
                </Box>
              ) : healthRecords.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <AnimalIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.disabled" gutterBottom>
                    No Health Records
                  </Typography>
                  <Typography color="text.secondary" mb={2}>
                    No health records found for this animal.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openDialog()}
                  >
                    Add First Health Record
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Diagnosis</TableCell>
                        <TableCell>Treatment</TableCell>
                        <TableCell>Veterinarian</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {healthRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.record_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Typography
                              sx={{ color: getStatusColor(record.health_status) }}
                              fontWeight="medium"
                            >
                              {record.health_status}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {record.diagnosis || '-'}
                          </TableCell>
                          <TableCell>
                            {record.treatment || '-'}
                          </TableCell>
                          <TableCell>
                            {record.veterinarian || '-'}
                          </TableCell>
                          <TableCell>
                            {record.cost ? `₨${record.cost}` : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => openDialog(record)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(record.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRecord ? 'Edit Health Record' : 'Add Health Record'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Record Date"
                  type="date"
                  value={formData.record_date}
                  onChange={handleInputChange('record_date')}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Health Status</InputLabel>
                  <Select
                    value={formData.health_status}
                    onChange={handleSelectChange('health_status')}
                    label="Health Status"
                  >
                    {HEALTH_STATUS_OPTIONS.map(status => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange('diagnosis')}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Treatment"
                  value={formData.treatment}
                  onChange={handleInputChange('treatment')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Medication"
                  value={formData.medication}
                  onChange={handleInputChange('medication')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dosage"
                  value={formData.dosage}
                  onChange={handleInputChange('dosage')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Veterinarian"
                  value={formData.veterinarian}
                  onChange={handleInputChange('veterinarian')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost (PKR)"
                  type="number"
                  value={formData.cost}
                  onChange={handleInputChange('cost')}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography> }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (editingRecord ? 'Update Record' : 'Create Record')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};