const notificationService = require('../services/notification.service');

async function getNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getNotificationsForUser(req.user._id, {
      limit: Number(req.query.limit) || 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
};
