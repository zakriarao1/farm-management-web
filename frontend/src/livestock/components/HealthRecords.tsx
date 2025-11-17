import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalHospital as HealthIcon,
} from '@mui/icons-material';
import { healthRecordsApi } from '../services/api'; // Use healthRecordsApi instead of livestockApi
import type { HealthRecord } from '../types';

interface HealthRecordsProps {
  livestockId: number;
  healthRecords: HealthRecord[];
  onRecordAdded: (record: HealthRecord) => void;
}

// Health status options matching your backend
const HEALTH_STATUS_OPTIONS = [
  'HEALTHY', 'SICK', 'INJURED', 'RECOVERING', 'CRITICAL', 'QUARANTINED'
];

export const HealthRecords: React.FC<HealthRecordsProps> = ({
  livestockId,
  healthRecords,
  onRecordAdded,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    health_status: 'HEALTHY',
    diagnosis: '',
    treatment: '',
    medication: '',
    dosage: '',
    veterinarian: '',
    cost: 0,
    notes: '',
  });

  const handleOpenDialog = (record?: HealthRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        record_date: record.record_date.split('T')[0],
        health_status: record.health_status,
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        medication: record.medication || '',
        dosage: record.dosage || '',
        veterinarian: record.veterinarian || '',
        cost: record.cost || 0,
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({
        record_date: new Date().toISOString().split('T')[0],
        health_status: 'HEALTHY',
        diagnosis: '',
        treatment: '',
        medication: '',
        dosage: '',
        veterinarian: '',
        cost: 0,
        notes: '',
      });
    }
    setDialogOpen(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setError('');
  };

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'cost' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSelectChange = (field: keyof typeof formData) => (
    event: SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.health_status || !formData.record_date) {
      setError('Health status and date are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const requestData = {
        livestock_id: livestockId,
        ...formData
      };

      if (editingRecord) {
        await healthRecordsApi.update(editingRecord.id, requestData);
      } else {
        const response = await healthRecordsApi.create(requestData);
        onRecordAdded(response.data);
      }

      handleCloseDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save health record');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      setError('');
      await healthRecordsApi.delete(recordId);
      // Reload the data by calling the parent's refresh
      onRecordAdded({} as HealthRecord); // This will trigger a reload in the parent
    } catch (err) {
      setError('Failed to delete health record');
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: 'success' | 'warning' | 'error' | 'info' | 'primary' } = {
      HEALTHY: 'success',
      SICK: 'warning',
      INJURED: 'error',
      RECOVERING: 'info',
      CRITICAL: 'error',
      QUARANTINED: 'warning'
    };
    return statusMap[status] || 'primary';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Health Records</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Health Record
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {healthRecords.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <HealthIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Health Records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add the first health record for this animal.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Health Status</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell>Medication</TableCell>
                <TableCell>Veterinarian</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {healthRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    {new Date(record.record_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.health_status}
                      color={getStatusColor(record.health_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{record.diagnosis || 'N/A'}</TableCell>
                  <TableCell>{record.treatment || 'N/A'}</TableCell>
                  <TableCell>
                    {record.medication ? (
                      <Box>
                        <Typography variant="body2">{record.medication}</Typography>
                        {record.dosage && (
                          <Typography variant="caption" color="text.secondary">
                            {record.dosage}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>{record.veterinarian || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      ₨{record.cost?.toLocaleString() || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(record)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRecord ? 'Edit Health Record' : 'Add Health Record'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Record Date"
                type="date"
                value={formData.record_date}
                onChange={handleInputChange('record_date')}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
              />
              
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
              
              <TextField
                label="Diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange('diagnosis')}
                fullWidth
                multiline
                rows={2}
                placeholder="Describe the diagnosis"
              />
              
              <TextField
                label="Treatment"
                value={formData.treatment}
                onChange={handleInputChange('treatment')}
                fullWidth
                multiline
                rows={2}
                placeholder="Describe the treatment provided"
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Medication"
                  value={formData.medication}
                  onChange={handleInputChange('medication')}
                  fullWidth
                  placeholder="Medication name"
                />
                <TextField
                  label="Dosage"
                  value={formData.dosage}
                  onChange={handleInputChange('dosage')}
                  fullWidth
                  placeholder="e.g., 10mg daily"
                />
              </Box>
              
              <TextField
                label="Veterinarian"
                value={formData.veterinarian}
                onChange={handleInputChange('veterinarian')}
                fullWidth
                placeholder="Veterinarian name"
              />
              
              <TextField
                label="Cost (PKR)"
                type="number"
                value={formData.cost}
                onChange={handleInputChange('cost')}
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
              />
              
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                multiline
                rows={3}
                fullWidth
                placeholder="Additional notes about the health record..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading || !formData.health_status || !formData.record_date}
            >
              {loading ? 'Saving...' : (editingRecord ? 'Update Record' : 'Add Record')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};