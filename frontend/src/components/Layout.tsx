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
import { authService } from '../services/authService';
import { NotificationBell } from './NotificationBell';

// Import your logo
import farmLogo from '../assets/farm-logo.png';

// --- CUSTOM COLORS BASED ON LOGO ---
const LOGO_PRIMARY_BROWN = '#C1A16C'; 
const LOGO_SECONDARY_DARK = '#333333';
const LOGO_ACCENT_GOLD = '#E4C697'; 
// ---

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
      {/* --- DRAWER HEADER: Full Cover Logo --- */}
      <Box 
        sx={{ 
          width: '100%',
          height: '64px', // Same height as main header
          backgroundColor: LOGO_SECONDARY_DARK,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          m: 0,
          overflow: 'hidden',
        }}
      >
        {/* Logo that covers entire sidebar header */}
        <Box 
          component="img"
          src={farmLogo}
          alt="Rao Sons Farm Logo"
          sx={{
            width: '100%', // Full width of sidebar
            height: '100%', // Full height of header (64px)
            objectFit: 'cover', // Cover the entire area, may crop image
            display: 'block',
            m: 0,
            p: 0,
          }}
        />
      </Box>
      {/* --- END DRAWER HEADER --- */}
      
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
                  backgroundColor: LOGO_PRIMARY_BROWN,
                  color: LOGO_SECONDARY_DARK,
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: LOGO_ACCENT_GOLD,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path 
                    ? LOGO_SECONDARY_DARK
                    : LOGO_PRIMARY_BROWN,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
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
          backgroundColor: LOGO_SECONDARY_DARK,
          height: '64px', // Fixed height to match sidebar logo
        }}
      >
        <Toolbar sx={{ height: '64px', minHeight: '64px !important', p: 0 }}>
          {isMobile && (
            <IconButton 
              color="inherit" 
              onClick={handleDrawerToggle} 
              sx={{ 
                mr: 2,
                color: LOGO_ACCENT_GOLD,
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Main Header Logo - Also covers full width and height */}
          <Box 
            sx={{
              flexGrow: 1,
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              backgroundColor: LOGO_SECONDARY_DARK,
              overflow: 'hidden',
            }}
          >
            <Box 
              component="img"
              src={farmLogo}
              alt="Rao Sons Farm Logo"
              sx={{
                height: '100%', // Full height of header
                maxWidth: '100%', // Don't exceed container width
                objectFit: 'contain', // Show full logo without cropping
                display: 'block',
                ...(isMobile ? {
                  maxHeight: '50px', // Slightly smaller on mobile
                } : {
                  width: 'auto', // Maintain aspect ratio on desktop
                  maxWidth: '300px', // Limit width on desktop
                })
              }}
            />
          </Box>
          
          <NotificationBell />
          
          <Button 
            color="inherit"
            onClick={handleLogout} 
            startIcon={<LogoutIcon />} 
            sx={{ 
              ml: 1,
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              color: LOGO_ACCENT_GOLD,
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