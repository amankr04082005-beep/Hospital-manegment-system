import { useEffect, useState } from 'react';
import { Card, Button, EmptyState } from '../../components/common/ui';
import * as notificationService from '../../services/notification.service';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    notificationService
      .getNotifications()
      .then((items) => setNotifications(items))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkRead(id) {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications((items) =>
        items.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
    } catch {
      // ignore, user can refresh later
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    } catch {
      // ignore
    }
  }

  const unreadCount = (notifications || []).filter((item) => !item.isRead).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Notifications</h1>
          <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
            Keep track of appointment updates, prescription sharing, and other system alerts.
          </p>
        </div>
        <div>
          <Button variant="secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      </div>

      {loading && <p style={{ color: 'var(--ink-soft)' }}>Loading notifications…</p>}

      {!loading && (!notifications || notifications.length === 0) && (
        <EmptyState title="No notifications yet" description="Notifications will appear here when there are appointment or prescription updates." />
      )}

      {!loading && notifications && notifications.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              style={{ opacity: notification.isRead ? 0.7 : 1, borderColor: notification.isRead ? 'var(--border)' : 'var(--teal-dark)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{notification.title}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-soft)' }}>{notification.message}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {format(new Date(notification.createdAt), 'PPP p')}
                  </div>
                  {!notification.isRead && (
                    <Button variant="secondary" size="sm" onClick={() => handleMarkRead(notification._id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
