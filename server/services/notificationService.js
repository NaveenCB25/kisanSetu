const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPushNotification } = require('../config/firebase');

/**
 * Notification Service — abstraction layer supporting:
 * 1. In-app notifications (MongoDB)
 * 2. Firebase push notifications
 * 3. SMS stub (pluggable for feature-phone farmers)
 */
class NotificationService {
  constructor(io) {
    this.io = io;
  }

  /**
   * Send a notification to a user
   */
  async send({ userId, title, message, type = 'general', relatedBooking = null }) {
    try {
      // 1. Save in-app notification
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        relatedBooking,
      });

      // 2. Emit via Socket.IO for real-time delivery
      if (this.io) {
        this.io.to(`user:${userId}`).emit('notification:new', {
          _id: notification._id,
          title,
          message,
          type,
          relatedBooking,
          isRead: false,
          createdAt: notification.createdAt,
        });
      }

      // 3. Firebase push notification
      const user = await User.findById(userId);
      if (user && user.fcmToken) {
        await sendPushNotification(user.fcmToken, title, message, {
          type,
          bookingId: relatedBooking ? relatedBooking.toString() : '',
        });
        notification.isPushed = true;
        await notification.save();
      }

      // 4. SMS stub — plug in Twilio, MSG91, etc. here
      await this.sendSMS(user?.mobile, `${title}: ${message}`);

      return notification;
    } catch (error) {
      console.error('NotificationService error:', error.message);
      return null;
    }
  }

  /**
   * SMS stub — for feature-phone farmers
   * Replace with actual SMS provider (Twilio, MSG91, etc.)
   */
  async sendSMS(mobile, message) {
    if (!mobile) return;
    console.log(`📱 SMS stub → ${mobile}: ${message}`);
    // TODO: Integrate with SMS gateway
    // Example:
    // await twilioClient.messages.create({
    //   body: message,
    //   to: `+91${mobile}`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });
    return true;
  }

  /**
   * Send notification to multiple users
   */
  async sendBulk(userIds, { title, message, type = 'general', relatedBooking = null }) {
    const promises = userIds.map((userId) =>
      this.send({ userId, title, message, type, relatedBooking })
    );
    return Promise.allSettled(promises);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ user: userId }),
    ]);
    return { notifications, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    return Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, isRead: false });
  }
}

module.exports = NotificationService;
