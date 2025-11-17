import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Pets as AnimalIcon,
  LocalHospital as HealthIcon,
  Favorite as BreedingIcon,
  Scale as WeightIcon,
  CalendarToday as DateIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { livestockApi } from '../services/api';
import type { Livestock, HealthRecord, BreedingRecord } from '../types';
import { HealthRecords } from './HealthRecords';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`livestock-tabpanel-${index}`}
      aria-labelledby={`livestock-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const LivestockDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [tabValue, setTabValue] = useState(0);

  const [animal, setAnimal] = useState<Livestock | null>(null);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadAnimalData(parseInt(id));
    }
  }, [id]);

  const loadAnimalData = async (animalId: number) => {
    try {
      setLoading(true);
      const [animalResponse, healthResponse, breedingResponse] = await Promise.all([
        livestockApi.getById(animalId),
        livestockApi.getHealthRecords(animalId),
        livestockApi.getBreedingRecords(animalId),
      ]);

      setAnimal(animalResponse.data);
      setHealthRecords(healthResponse.data || []);
      setBreedingRecords(breedingResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load animal data');
      console.error('Error loading animal details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning'| 'error' | 'info' | 'default'> = {
      CHICKENS: 'primary',
      GOATS: 'success',
      SHEEP: 'warning',
      COWS: 'error',
      BUFFALOES: 'info',
      OTHER: 'secondary',
    };
    return colors[type] || 'default';
  };

  const handleEdit = () => {
    if (animal) {
      navigate(`/livestock/animals/${animal.id}/edit`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !animal) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Animal not found'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/livestock/animals')}>
          Back to Animals
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/livestock/animals')}>
            Back
          </Button>
          <AnimalIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {animal.tag_number}
            </Typography>
            <Typography color="text.secondary">
              {animal.breed} • {animal.animal_type}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Edit Animal
        </Button>
      </Box>

      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        {/* Sidebar - Basic Info */}
        <Box width={{ xs: '100%', md: 350 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AnimalIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Type" 
                    secondary={
                      <Chip 
                        label={animal.animal_type} 
                        size="small" 
                        color={getTypeColor(animal.animal_type)}
                        variant="outlined"
                      />
                    } 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <AnimalIcon color="action" />
                  </ListItemIcon>
                  <ListItemText primary="Breed" secondary={animal.breed || 'Not specified'} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <AnimalIcon color="action" />
                  </ListItemIcon>
                  <ListItemText primary="Gender" secondary={animal.gender} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <DateIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Date of Birth" 
                    secondary={animal.date_of_birth ? 
                      new Date(animal.date_of_birth).toLocaleDateString() : 'Not specified'
                    } 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <DateIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Purchase Date" 
                    secondary={animal.purchase_date ? 
                      new Date(animal.purchase_date).toLocaleDateString() : 'Not specified'
                    } 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <MoneyIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Purchase Price" 
                    secondary={animal.purchase_price ? `₨${animal.purchase_price.toLocaleString()}` : 'Not specified'}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <WeightIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Current Weight" 
                    secondary={animal.current_weight ? `${animal.current_weight} kg` : 'Not specified'} 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="action" />
                  </ListItemIcon>
                  <ListItemText primary="Location" secondary={animal.location || 'Not specified'} />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <AnimalIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Flock" 
                    secondary={animal.flock_name || 'No Flock'} 
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <HealthIcon color="action" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Status" 
                    secondary={
                      <Chip 
                        label={animal.status} 
                        size="small" 
                        color={getStatusColor(animal.status)}
                      />
                    } 
                  />
                </ListItem>
              </List>

              {animal.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {animal.notes}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Main Content - Tabs */}
        <Box flex={1}>
          <Paper>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="livestock tabs">
              <Tab label="Health Records" icon={<HealthIcon />} iconPosition="start" />
              <Tab label="Breeding History" icon={<BreedingIcon />} iconPosition="start" />
            </Tabs>

            {/* Health Records Tab */}
            <TabPanel value={tabValue} index={0}>
              <HealthRecords 
                livestockId={animal.id}
                healthRecords={healthRecords}
                onRecordAdded={() => loadAnimalData(animal.id)}
              />
            </TabPanel>

            {/* Breeding Records Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Breeding History</Typography>
                <Button variant="outlined" size="small">
                  Add Breeding Record
                </Button>
              </Box>
              
              {breedingRecords.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No breeding records found
                </Typography>
              ) : (
                <List>
                  {breedingRecords.map((record) => (
                    <ListItem key={record.id} divider>
                      <ListItemText
                        primary={`Breeding on ${new Date(record.breeding_date).toLocaleDateString()}`}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Status: <Chip 
                                label={record.status} 
                                size="small" 
                                color={record.status === 'SUCCESSFUL' ? 'success' : record.status === 'FAILED' ? 'error' : 'warning'}
                              />
                            </Typography>
                            {record.expected_birth_date && (
                              <Typography variant="body2">
                                Expected: {new Date(record.expected_birth_date).toLocaleDateString()}
                              </Typography>
                            )}
                            {record.notes && (
                              <Typography variant="body2">Notes: {record.notes}</Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};