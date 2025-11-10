import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  type ChipProps, // ✅ Import ChipProps for proper typing
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { notificationService, type Notification } from '../services/notificationService';

export const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotificationsUpdate = (updatedNotifications: Notification[]) => {
      setNotifications(updatedNotifications);
    };

    notificationService.addListener(handleNotificationsUpdate);
    return () => notificationService.removeListener(handleNotificationsUpdate);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <SuccessIcon color="success" />;
      case 'ERROR': return <ErrorIcon color="error" />;
      case 'WARNING': return <WarningIcon color="warning" />;
      case 'INFO': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  // ✅ Use proper TypeScript type instead of 'any'
  const getNotificationColor = (type: string): ChipProps['color'] => {
    switch (type) {
      case 'SUCCESS': return 'success';
      case 'ERROR': return 'error';
      case 'WARNING': return 'warning';
      case 'INFO': return 'info';
      default: return 'default';
    }
  };

  const open = Boolean(anchorEl);
  const unreadCount = notificationService.getUnreadCount();

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 360, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            {notifications.length > 0 && (
              <Button size="small" onClick={() => notificationService.markAllAsRead()}>
                Mark all as read
              </Button>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No notifications
            </Typography>
          ) : (
            <>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {notifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    divider
                    sx={{
                      opacity: notification.read ? 0.7 : 1,
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type}
                            size="small"
                            color={getNotificationColor(notification.type)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {notification.timestamp.toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  size="small"
                  onClick={() => {
                    notifications.forEach(notif => notificationService.removeNotification(notif.id));
                  }}
                >
                  Clear All
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};