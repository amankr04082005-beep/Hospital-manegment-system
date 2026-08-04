import api from './api';

export async function getNotifications(limit = 50) {
  const { data } = await api.get('/notifications', { params: { limit } });
  return data.data;
}

export async function markNotificationRead(notificationId) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/notifications/read-all');
  return data.data;
}
