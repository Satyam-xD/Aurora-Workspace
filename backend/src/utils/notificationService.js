import Notification from '../models/Notification.js';

/**
 * Creates notifications for multiple users and emits socket events if possible
 * @param {Array<string>} recipientIds - Array of user IDs to receive the notification
 * @param {Object} data - Notification data (title, description, type, link, sender)
 * @param {Object} io - Socket.io instance (optional)
 */
export const createNotifications = async (recipientIds, data, io = null) => {
    try {
        const notifications = recipientIds.map(recipientId => ({
            recipient: recipientId,
            ...data
        }));

        const savedNotifications = await Notification.insertMany(notifications);

        if (io) {
            savedNotifications.forEach(notif => {
                io.to(notif.recipient.toString()).emit('newNotification', notif);
            });
        }

        return savedNotifications;
    } catch (error) {
        console.error('Error creating notifications:', error);
        throw error;
    }
};

/**
 * Creates a notification for a single user
 */
export const createNotification = async (recipientId, data, io = null) => {
    return createNotifications([recipientId], data, io);
};
