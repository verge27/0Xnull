import { useState, useEffect, useCallback } from 'react';

export interface CreatorNotification {
  id: string;
  type: 'paid_message' | 'content_request' | 'new_subscriber' | 'tip';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, unknown>;
}

const STORAGE_KEY_PREFIX = 'creator_notifications_';
const MAX_NOTIFICATIONS = 50;

export const useCreatorNotifications = (creatorId: string | undefined) => {
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage
  useEffect(() => {
    if (!creatorId) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${creatorId}`);
      if (stored) {
        const parsed: CreatorNotification[] = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [creatorId]);

  // Save notifications to localStorage
  const saveNotifications = useCallback((newNotifications: CreatorNotification[]) => {
    if (!creatorId) return;

    // Keep only the latest MAX_NOTIFICATIONS
    const trimmed = newNotifications.slice(0, MAX_NOTIFICATIONS);
    setNotifications(trimmed);
    setUnreadCount(trimmed.filter(n => !n.read).length);

    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${creatorId}`, JSON.stringify(trimmed));
    } catch (err) {
      console.error('Failed to save notifications:', err);
    }
  }, [creatorId]);

  // Add a new notification
  const addNotification = useCallback((
    type: CreatorNotification['type'],
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) => {
    const newNotification: CreatorNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      data,
    };

    const updated = [newNotification, ...notifications];
    saveNotifications(updated);

    return newNotification;
  }, [notifications, saveNotifications]);

  // Mark a notification as read
  const markAsRead = useCallback((notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Delete a notification
  const deleteNotification = useCallback((notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updated);
  }, [notifications, saveNotifications]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    saveNotifications([]);
  }, [saveNotifications]);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};

// Helper to trigger notifications from anywhere in the app
// This stores to the creator's notification list
export const triggerCreatorNotification = (
  creatorId: string,
  type: CreatorNotification['type'],
  title: string,
  message: string,
  data?: Record<string, unknown>
) => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${creatorId}`);
    const existing: CreatorNotification[] = stored ? JSON.parse(stored) : [];

    const newNotification: CreatorNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
      data,
    };

    const updated = [newNotification, ...existing].slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${creatorId}`, JSON.stringify(updated));

    // Dispatch custom event for real-time updates within the same tab
    window.dispatchEvent(new CustomEvent('creator-notification', {
      detail: { creatorId, notification: newNotification }
    }));

    return newNotification;
  } catch (err) {
    console.error('Failed to trigger notification:', err);
    return null;
  }
};
