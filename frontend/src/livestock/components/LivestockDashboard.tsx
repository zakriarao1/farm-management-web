import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Pets as AnimalsIcon,
  LocalHospital as HealthIcon,
  TrendingUp as StatsIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { livestockApi } from '../services/api';
import type { LivestockStats, HealthAlert } from '../types';

export const LivestockDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<LivestockStats | null>(null);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, alertsResponse] = await Promise.all([
        livestockApi.getLivestockStats(),
        livestockApi.getHealthAlerts()
      ]);
      
      setStats(statsResponse.data);
      setHealthAlerts(alertsResponse.data || []);
    } catch (error) {
      console.error('Failed to load livestock dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'warning' | 'success' | 'info';
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Livestock Management
          </Typography>
          <Typography color="text.secondary">
            Monitor and manage your animals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/livestock/animals/new')}
        >
          Add Animal
        </Button>
      </Box>

      {/* Health Alerts */}
      {healthAlerts.length > 0 && (
        <Alert 
          severity="warning" 
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/livestock/animals')}>
              View All
            </Button>
          }
        >
          {healthAlerts.length} health alert{healthAlerts.length !== 1 ? 's' : ''} need attention
        </Alert>
      )}

      {/* Stats Cards */}
      <Box 
        display="flex" 
        gap={3} 
        flexWrap="wrap" 
        sx={{ mb: 4 }}
      >
        <Box flex={1} minWidth={200}>
          <StatCard
            title="Total Animals"
            value={stats?.totalAnimals || 0}
            icon={<AnimalsIcon fontSize="large" />}
            color="primary"
          />
        </Box>
        <Box flex={1} minWidth={200}>
          <StatCard
            title="Health Alerts"
            value={stats?.healthAlerts || 0}
            icon={<HealthIcon fontSize="large" />}
            color="warning"
          />
        </Box>
        <Box flex={1} minWidth={200}>
          <StatCard
            title="Pregnant Animals"
            value={stats?.pregnantAnimals || 0}
            icon={<StatsIcon fontSize="large" />}
            color="success"
          />
        </Box>
        <Box flex={1} minWidth={200}>
          <StatCard
            title="Total Value"
            value={`$${(stats?.totalValue || 0).toLocaleString()}`}
            icon={<StatsIcon fontSize="large" />}
            color="info"
          />
        </Box>
      </Box>

      {/* Quick Actions and Distribution */}
      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        {/* Quick Actions Card */}
        <Box flex={1}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/livestock/animals')}
                  startIcon={<AnimalsIcon />}
                  fullWidth
                >
                  View All Animals
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/livestock/animals/new')}
                  startIcon={<AddIcon />}
                  fullWidth
                >
                  Add New Animal
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/livestock/health')}
                  startIcon={<HealthIcon />}
                  fullWidth
                >
                  Health Management
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Animal Distribution Card */}
        <Box flex={1}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Animal Distribution
              </Typography>
              {stats?.byType && Object.entries(stats.byType).map(([type, count]) => (
                <Box 
                  key={type} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="body2">{type}</Typography>
                  <Chip 
                    label={count.toString()} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
              {(!stats?.byType || Object.keys(stats.byType).length === 0) && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No animal distribution data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};