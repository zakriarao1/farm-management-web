export interface Notification {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Auto-remove success messages after 5 seconds
    if (newNotification.type === 'SUCCESS') {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 5000);
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(notif => notif.id !== id);
    this.notifyListeners();
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    this.notifyListeners();
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(notif => ({ ...notif, read: true }));
    this.notifyListeners();
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(notif => !notif.read).length;
  }

  addListener(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Pre-defined notification creators
  success(title: string, message: string) {
    this.addNotification({ type: 'SUCCESS', title, message });
  }

  error(title: string, message: string) {
    this.addNotification({ type: 'ERROR', title, message });
  }

  warning(title: string, message: string) {
    this.addNotification({ type: 'WARNING', title, message });
  }

  info(title: string, message: string) {
    this.addNotification({ type: 'INFO', title, message });
  }
}

export const notificationService = new NotificationService();