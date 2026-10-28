import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Chat, Message } from '../types';
import { notificationService } from './notificationService';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

export const chatService = {
  // Get all chats where user is a participant
  async getUserChats(userId: string): Promise<Chat[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, CHATS_COLLECTION),
        where('participantIds', 'array-contains', userId)
      );
      const snapshot = await getDocs(q);
      const chats: Chat[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const participants = (data.participantIds || data.participants || []) as [string, string];
        chats.push({
          id: d.id,
          chatId: data.chatId || d.id,
          participants,
          participantIds: data.participantIds || data.participants,
          requestId: data.requestId || '',
          lastMessage: data.lastMessage || 'เริ่มต้นการสนทนาแลกเปลี่ยนทักษะ',
          lastMessageAt: data.lastMessageAt || data.createdAt || '',
          lastMessageTime: data.lastMessageTime || (data.lastMessageAt ? new Date(data.lastMessageAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'เพิ่งเริ่ม'),
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort in memory by lastMessageAt descending
      chats.sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
        return timeB - timeA;
      });

      return chats;
    } catch (error) {
      console.error('Error fetching user chats:', error);
      return [];
    }
  },

  // Subscribe to real-time chats for a user
  subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, CHATS_COLLECTION),
      where('participantIds', 'array-contains', userId)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const chats: Chat[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const participants = (data.participantIds || data.participants || []) as [string, string];
          chats.push({
            id: d.id,
            chatId: data.chatId || d.id,
            participants,
            participantIds: data.participantIds || data.participants,
            requestId: data.requestId || '',
            lastMessage: data.lastMessage || '',
            lastMessageAt: data.lastMessageAt || data.createdAt || '',
            lastMessageTime: data.lastMessageTime || (data.lastMessageAt ? new Date(data.lastMessageAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''),
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        chats.sort((a, b) => {
          const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
          const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
          return timeB - timeA;
        });
        callback(chats);
      },
      (err) => {
        console.error('Error in subscribeToUserChats:', err);
      }
    );
  },

  // Get or create chat between two users
  async getOrCreateChat(userA: string, userB: string, requestId: string = ''): Promise<Chat> {
    try {
      const q = query(
        collection(db, CHATS_COLLECTION),
        where('participantIds', 'array-contains', userA)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const pIds: string[] = data.participantIds || data.participants || [];
        if (pIds.includes(userB)) {
          return {
            id: docSnap.id,
            chatId: data.chatId || docSnap.id,
            participants: [userA, userB],
            participantIds: [userA, userB],
            requestId: data.requestId || requestId,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt,
            lastMessageTime: data.lastMessageTime,
            createdAt: data.createdAt,
          };
        }
      }
    } catch (e) {
      console.warn('Error checking existing chat, creating new:', e);
    }

    const chatId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const chatData = {
      chatId,
      participantIds: [userA, userB],
      participants: [userA, userB],
      requestId,
      lastMessage: 'เริ่มต้นการสนทนาแลกเปลี่ยนทักษะ',
      lastMessageAt: now,
      createdAt: now,
    };

    const docRef = doc(db, CHATS_COLLECTION, chatId);
    await setDoc(docRef, chatData);

    return {
      id: chatId,
      ...chatData,
    };
  },

  // Get messages for a chat
  async getMessages(chatId: string): Promise<Message[]> {
    if (!chatId) return [];
    try {
      const q = query(
        collection(db, MESSAGES_COLLECTION),
        where('chatId', '==', chatId)
      );
      const snapshot = await getDocs(q);
      const msgs: Message[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        msgs.push({
          id: d.id,
          messageId: data.messageId || d.id,
          chatId: data.chatId,
          senderId: data.senderId,
          content: data.content,
          createdAt: data.createdAt,
          read: data.read ?? false,
        });
      });
      // Sort chronologically
      msgs.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return msgs;
    } catch (error) {
      console.error(`Error in getMessages(${chatId}):`, error);
      return [];
    }
  },

  // Real-time subscription to chat messages
  subscribeToMessages(
    chatId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    if (!chatId) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, MESSAGES_COLLECTION),
      where('chatId', '==', chatId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          msgs.push({
            id: d.id,
            messageId: data.messageId || d.id,
            chatId: data.chatId,
            senderId: data.senderId,
            content: data.content,
            createdAt: data.createdAt,
            read: data.read ?? false,
          });
        });
        msgs.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        callback(msgs);
      },
      (error) => {
        console.error(`Error subscribing to messages for chat ${chatId}:`, error);
      }
    );
  },

  // Send a message
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const msgData = {
      messageId,
      chatId,
      senderId,
      content: content.trim(),
      createdAt: now,
      read: false,
    };

    const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
    await setDoc(msgRef, msgData);

    // Update parent chat
    try {
      const chatRef = doc(db, CHATS_COLLECTION, chatId);
      const chatSnap = await getDoc(chatRef);
      const timeStr = new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
      await updateDoc(chatRef, {
        lastMessage: content.trim(),
        lastMessageAt: now,
        lastMessageTime: `${timeStr} น.`,
      });

      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const participantIds: string[] = chatData.participantIds || chatData.participants || [];
        const recipientId = participantIds.find((p) => p !== senderId);
        if (recipientId) {
          notificationService.createNotification(
            recipientId,
            'new_message',
            'มีข้อความใหม่',
            content.length > 50 ? `${content.substring(0, 50)}...` : content,
            'chat'
          );
        }
      }
    } catch (e) {
      console.warn('Could not update chat last message:', e);
    }

    return {
      id: messageId,
      ...msgData,
    };
  },

  // Mark all incoming messages in a chat as read
  async markAsRead(chatId: string, currentUserId: string): Promise<void> {
    try {
      const q = query(
        collection(db, MESSAGES_COLLECTION),
        where('chatId', '==', chatId)
      );
      const snapshot = await getDocs(q);
      const batchPromises: Promise<void>[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.senderId !== currentUserId && !data.read) {
          batchPromises.push(updateDoc(doc(db, MESSAGES_COLLECTION, d.id), { read: true }));
        }
      });
      await Promise.all(batchPromises);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },
};
