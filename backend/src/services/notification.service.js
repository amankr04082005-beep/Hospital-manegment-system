const Notification = require('../models/Notification');
const { emitToRoom } = require('./socket.service');

async function createNotification({ userId, type = 'system', title, message, data }) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    data,
    isRead: false,
  });

  emitToRoom(`room:user:${userId}`, 'notification:new', {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });

  return notification;
}

async function getNotificationsForUser(userId, { limit = 50 } = {}) {
  return Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
}

async function markNotificationRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
}

async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllRead,
};
