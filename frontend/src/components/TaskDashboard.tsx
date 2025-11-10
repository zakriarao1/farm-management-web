// frontend/components/TaskDashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Notifications as NotificationsIcon } from '@mui/icons-material';
import { taskApi } from '../services/api';
import type { Task } from '../types';

export const TaskDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getUpcoming(7);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const generateHarvestReminders = async () => {
    try {
      setLoading(true);
      const response = await taskApi.generateHarvestReminders();
      alert(`Generated ${response.data.remindersCreated} harvest reminders`);
      loadTasks(); // Reload tasks
    } catch (error) {
      console.error('Failed to generate reminders:', error);
      setError('Failed to generate harvest reminders');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Task Management</Typography>
        <Button
          startIcon={<NotificationsIcon />}
          onClick={generateHarvestReminders}
          variant="contained"
          color="primary"
          disabled={loading}
          size="small"
        >
          {loading ? 'Generating...' : 'Harvest Reminders'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Upcoming Tasks ({tasks.length})
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={() => window.location.href = '/tasks'}
              >
                Add Task
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {tasks.map((task) => (
                  <ListItem 
                    key={task.id} 
                    divider
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 2,
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                          {task.title}
                        </Typography>
                        <Chip 
                          label={task.status} 
                          color={getStatusColor(task.status)}
                          size="small"
                        />
                      </Box>
                      
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          {task.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip 
                          label={task.taskType} 
                          variant="outlined" 
                          size="small" 
                        />
                        <Chip 
                          label={task.priority} 
                          color={getPriorityColor(task.priority)} 
                          size="small" 
                        />
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Typography>
                        {task.daysUntilDue !== undefined && (
                          <Chip 
                            label={`${task.daysUntilDue} days`} 
                            variant="outlined"
                            size="small"
                            color={task.daysUntilDue <= 1 ? 'error' : task.daysUntilDue <= 3 ? 'warning' : 'default'}
                          />
                        )}
                        {task.cropName && (
                          <Chip 
                            label={task.cropName} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
                {tasks.length === 0 && !loading && (
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No upcoming tasks. Tasks due in the next 7 days will appear here.
                  </Typography>
                )}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
