import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
} from '@mui/material';
import { Person, Save, Key } from '@mui/icons-material';

export const UserProfile: React.FC = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current user data
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const { name, email } = JSON.parse(userData);
      setUser(prev => ({ ...prev, name, email }));
    }
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // API call to update profile
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.newPassword !== user.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // API call to change password
      setMessage('Password changed successfully!');
      setUser(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        User Profile
      </Typography>

      {message && (
        <Alert severity={message.includes('Failed') ? 'error' : 'success'} sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
              <Person fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h6">{user.name}</Typography>
              <Typography color="text.secondary">{user.email}</Typography>
            </Box>
          </Box>

          <form onSubmit={handleProfileUpdate}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <TextField
              fullWidth
              label="Full Name"
              value={user.name}
              onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={user.email}
              onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <form onSubmit={handlePasswordChange}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <TextField
              fullWidth
              label="Current Password"
              type="password"
              value={user.currentPassword}
              onChange={(e) => setUser(prev => ({ ...prev, currentPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={user.newPassword}
              onChange={(e) => setUser(prev => ({ ...prev, newPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={user.confirmPassword}
              onChange={(e) => setUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
              margin="normal"
            />
            <Button
              type="submit"
              variant="outlined"
              startIcon={<Key />}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};