import NotificationModel from "./notification.repository.js";
import AppError from "../../common/utilities/error.js";
import { createNotifFormat } from "../../common/dtos/notification.js";

// Trace point: getUserNotifications()
export const getUserNotifications = async (userId) => {
  return await NotificationModel.findByUserId(userId);
};

// Trace point: getNotification()
export const getNotification = async (id) => {
  const notif = await NotificationModel.findById(id);

  if (!notif) throw new AppError("Notification not found", 404);

  return notif;
};

// Trace point: getAdminNotifications()
export const getAdminNotifications = async () => {
  return await NotificationModel.findAdminNotifications();
};

// Trace point: createNotification()
export const createNotification = async (data) => {
  const notif = await NotificationModel.create(data);
  return notif;
};

// Trace point: markNotificationAsRead()
export const markNotificationAsRead = async (id) => {
  const notif = await NotificationModel.markAsRead(id);

  if (!notif) throw new AppError("Notification not found", 404);

  return notif;
};

// Trace point: markAllNotificationsAsRead()
export const markAllNotificationsAsRead = async (user) => {
  if (user.role === "admin") {
    return await NotificationModel.markAllAsReadForAdmin();
  }

  return await NotificationModel.markAllAsReadForUser(user.id);
};

// Trace point: deleteNotification()
export const deleteNotification = async (id) => {
  const result = await NotificationModel.delete(id);
  return result;
};

// Trace point: deleteAllNotifications()
export const deleteAllNotifications = async (user) => {
  if (user.role === "admin") {
    return await NotificationModel.deleteAllForAdmin();
  }

  return await NotificationModel.deleteAllForUser(user.id);
};

// Trace point: createOrderNotif()
export const createOrderNotif = async (orderId, userId) => {
  const notifications = [];

  if (userId) {
    notifications.push(
      createNotifFormat({
        user_id: userId,
        target_role: "customer",
        message: `Your order #${orderId} has been placed successfully!`,
        type: "order",
      })
    );
  }

  notifications.push(
    createNotifFormat({
      user_id: null,
      target_role: "admin",
      message: `New order #${orderId} has been placed!`,
      type: "order",
    })
  );

  return await NotificationModel.bulkCreate(notifications, null); 
};

// Trace point: createPaymentNotif()
export const createPaymentNotif = async (orderId, userId) => {
  const notifications = [];

  if (userId) {
    notifications.push(
      createNotifFormat({
        user_id: userId,
        target_role: "customer",
        message: `Payment Successful for order #${orderId}! Thank you for your purchase!`,
        type: "payment",
      })
    );
  }

  notifications.push(
    createNotifFormat({
      user_id: null,
      target_role: "admin",
      message: `New payment received for order #${orderId}!`,
      type: "payment",
    })
  );

  return await NotificationModel.bulkCreate(notifications); 
};

// Trace point: customNotification()
export const customNotification = async (message, type, target_role, user_id = null) => {
  const notifData = createNotifFormat({
    user_id,
    target_role,
    message,
    type
  });
  return await NotificationModel.create(notifData);
};

// Trace point: handleCustomerUpdateNotification()
export const handleCustomerUpdateNotification = async (orderId, userid, status) => {
  let message = "";
  if (status === "shipped") {
    message = `Your order #${orderId} has been shipped. Track your package for updates.`;
  } else if (status === "accepted") {
    message = `Your order #${orderId} has been accepted and is being processed.`;
  } else if (status === "cancelled") {
    message = `Your order #${orderId} has been cancelled. If you have any questions, contact support.`;
  } else if (status === "refund") {
    message = `Your order #${orderId} has been successfully refunded. The amount should reflect in your account within 5-7 business days.`;
  } else if (status === "request_refund") {
    message = `Your refund request for order #${orderId} has been received. Our team will review it and get back to you shortly.`;
  }

  if (message) {
    await customNotification(message, "order", "customer", userid);
  }
}

// Trace point: handleAdminUpdateNotification()
export const handleAdminUpdateNotification = async (orderId, status) => {
  let message = "";
  if (status === "completed") {
    message = `Order #${orderId} has been completed successfully.`;
  } else if (status === "request_refund") {
    message = `Order #${orderId} has a refund request`;
  }

  if (message) {
    await customNotification(message, "order", "admin");
  }
}
