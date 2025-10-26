// frontend/components/Layout.tsx

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  IconButton,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Agriculture as CropIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Analytics as AnalyticsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Pets as LivestockIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../src/services/authService';
import { NotificationBell } from './NotificationBell';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'All Crops', icon: <CropIcon />, path: '/crops' },
    { text: 'Livestock', icon: <LivestockIcon />, path: '/livestock' },
    { text: 'Add Crop', icon: <AddIcon />, path: '/crops/new' },
    { text: 'Reports', icon: <AnalyticsIcon />, path: '/reports' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary">
          🌱 Farm Manager
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        {/* Logout button */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'white',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'primary.main',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography 
            variant="h4" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Rao Sons Cattle Farm Mitha Tiwana
          </Typography>
          
          {/* Add Notification Bell */}
          <NotificationBell />
          
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />} 
            sx={{ 
              ml: 1,
              fontSize: { xs: '0.8rem', sm: '0.9rem' }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};