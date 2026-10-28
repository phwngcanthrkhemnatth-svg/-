import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Notification } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  // Get notifications for user from Firestore
  async getNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const notifs: Notification[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        notifs.push({
          id: d.id,
          userId: data.userId,
          type: data.type || 'system',
          title: data.title || '',
          message: data.message || '',
          read: data.read ?? false,
          createdAt: data.createdAt || new Date().toISOString(),
          linkAction: data.linkAction,
          metadata: data.metadata,
        });
      });
      notifs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return notifs;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Subscribe to real-time notifications for user
  subscribeToNotifications(
    userId: string,
    callback: (notifs: Notification[]) => void
  ): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          notifs.push({
            id: d.id,
            userId: data.userId,
            type: data.type || 'system',
            title: data.title || '',
            message: data.message || '',
            read: data.read ?? false,
            createdAt: data.createdAt || new Date().toISOString(),
            linkAction: data.linkAction,
            metadata: data.metadata,
          });
        });
        notifs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(notifs);
      },
      (error) => {
        console.error('Error subscribing to notifications:', error);
      }
    );
  },

  // Get count of unread notifications
  async getUnreadCount(userId: string): Promise<number> {
    const list = await this.getNotifications(userId);
    return list.filter((n) => !n.read).length;
  },

  // Mark single notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications for user as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const promises: Promise<void>[] = [];
      snapshot.forEach((d) => {
        if (!d.data().read) {
          promises.push(updateDoc(doc(db, NOTIFICATIONS_COLLECTION, d.id), { read: true }));
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Create new notification in Firestore
  async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    linkAction?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const notifData = {
      id: notifId,
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: now,
      linkAction: linkAction || '',
      metadata: metadata || {},
    };

    try {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, notifId);
      await setDoc(docRef, notifData);
    } catch (error) {
      console.error('Error creating notification:', error);
    }

    return notifData;
  },
};
