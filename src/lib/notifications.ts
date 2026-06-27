class NotificationManager {
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendLocal(title: string, body: string, iconUrl: string = '/icon.svg') {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    if (Notification.permission === 'default') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if (Notification.permission === 'granted') {
      // Try using service worker registration for native system style background notifications
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body,
            icon: iconUrl,
            badge: iconUrl,
            vibrate: [200, 100, 200],
            tag: 'prepai-reminder',
            renotify: true,
            data: {
              url: '/dashboard'
            }
          } as any);
          return;
        } catch (e) {
          console.warn('Failed to send notification via Service Worker, falling back to standard notification', e);
        }
      }

      // Fallback
      new Notification(title, {
        body,
        icon: iconUrl
      });
    }
  }
}

export const notifications = new NotificationManager();
