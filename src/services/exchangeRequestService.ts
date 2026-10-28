import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { ExchangeRequest, RequestStatus } from '../types';
import { notificationService } from './notificationService';
import { chatService } from './chatService';
import { userService } from './userService';

const REQUESTS_COLLECTION = 'exchangeRequests';

export const exchangeRequestService = {
  // Fetch all exchange requests across system (for admin dashboard & statistics)
  async getAll(): Promise<ExchangeRequest[]> {
    try {
      const snap = await getDocs(collection(db, REQUESTS_COLLECTION));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          requestId: data.requestId || d.id,
          senderId: data.requesterId || data.senderId || '',
          requesterId: data.requesterId || data.senderId || '',
          receiverId: data.receiverId || '',
          offeredSkill: data.offeredSkill || data.offeredSkillId || '',
          requestedSkill: data.requestedSkill || data.requestedSkillId || '',
          offeredSkillId: data.offeredSkillId || data.offeredSkill || '',
          requestedSkillId: data.requestedSkillId || data.requestedSkill || '',
          message: data.message || '',
          status: data.status || 'pending',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error fetching all requests:', error);
      return [];
    }
  },

  // Fetch all requests where user is requester or receiver
  async getRequestsForUser(userId: string): Promise<{
    sent: ExchangeRequest[];
    received: ExchangeRequest[];
  }> {
    if (!userId) return { sent: [], received: [] };

    try {
      // Query where requesterId or senderId == userId
      const qSent = query(
        collection(db, REQUESTS_COLLECTION),
        where('requesterId', '==', userId)
      );
      // Query where receiverId == userId
      const qReceived = query(
        collection(db, REQUESTS_COLLECTION),
        where('receiverId', '==', userId)
      );

      const [snapSent, snapReceived] = await Promise.all([
        getDocs(qSent),
        getDocs(qReceived),
      ]);

      const mapDoc = (d: any): ExchangeRequest => {
        const data = d.data();
        return {
          id: d.id,
          requestId: data.requestId || d.id,
          senderId: data.requesterId || data.senderId || '',
          requesterId: data.requesterId || data.senderId || '',
          receiverId: data.receiverId || '',
          offeredSkill: data.offeredSkill || data.offeredSkillId || '',
          requestedSkill: data.requestedSkill || data.requestedSkillId || '',
          offeredSkillId: data.offeredSkillId || data.offeredSkill || '',
          requestedSkillId: data.requestedSkillId || data.requestedSkill || '',
          message: data.message || '',
          status: data.status || 'pending',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt,
        };
      };

      const sent = snapSent.docs.map(mapDoc);
      const received = snapReceived.docs.map(mapDoc);

      return { sent, received };
    } catch (error) {
      console.error('Error fetching exchange requests:', error);
      return { sent: [], received: [] };
    }
  },

  // Send a new exchange request
  async sendRequest(
    senderId: string,
    receiverId: string,
    offeredSkill: string,
    requestedSkill: string,
    message: string
  ): Promise<ExchangeRequest> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const sender = await userService.getUserById(senderId);

    const newReqData: Omit<ExchangeRequest, 'id'> = {
      requestId,
      senderId,
      requesterId: senderId,
      receiverId,
      offeredSkillId: offeredSkill,
      requestedSkillId: requestedSkill,
      offeredSkill,
      requestedSkill,
      message: message.trim() || 'สวัสดีครับ/ค่ะ สนใจอยากแลกเปลี่ยนทักษะด้วยกันครับ',
      status: 'pending' as RequestStatus,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await setDoc(docRef, newReqData);

    // Create notification for receiver
    await notificationService.createNotification(
      receiverId,
      'request_received',
      'มีคำขอแลกเปลี่ยนทักษะใหม่',
      `${sender?.name || 'ผู้ใช้งาน'} ส่งคำขอแลกเปลี่ยน: ${offeredSkill} แลกกับ ${requestedSkill}`,
      'requests'
    );

    return {
      id: requestId,
      ...newReqData,
    };
  },

  // Accept an exchange request
  async acceptRequest(requestId: string): Promise<ExchangeRequest> {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('ไม่พบคำขอแลกเปลี่ยนนี้');

    const data = snap.data();
    const now = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'accepted',
      updatedAt: now,
    });

    const requesterId = data.requesterId || data.senderId;
    const receiverId = data.receiverId;

    // 1. Create or open chat between participants
    await chatService.getOrCreateChat(requesterId, receiverId, requestId);

    // 2. Notify sender that request was accepted
    const receiver = await userService.getUserById(receiverId);
    await notificationService.createNotification(
      requesterId,
      'request_accepted',
      'คำขอแลกเปลี่ยนได้รับการตอบรับแล้ว 🎉',
      `${receiver?.name || 'คู่แลกเปลี่ยน'} ได้ยอมรับคำขอของคุณแล้ว ตอนนี้คุณสามารถเริ่มส่งข้อความคุยกันได้เลย!`,
      'chat'
    );

    return {
      id: requestId,
      requestId,
      senderId: requesterId,
      requesterId,
      receiverId,
      offeredSkill: data.offeredSkill,
      requestedSkill: data.requestedSkill,
      message: data.message,
      status: 'accepted',
      createdAt: data.createdAt,
      updatedAt: now,
    };
  },

  // Reject an exchange request
  async rejectRequest(requestId: string): Promise<ExchangeRequest> {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('ไม่พบคำขอแลกเปลี่ยนนี้');

    const data = snap.data();
    const now = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'rejected',
      updatedAt: now,
    });

    const requesterId = data.requesterId || data.senderId;
    const receiver = await userService.getUserById(data.receiverId);

    await notificationService.createNotification(
      requesterId,
      'request_rejected',
      'คำขอแลกเปลี่ยนไม่ได้รับการตอบรับ',
      `${receiver?.name || 'คู่แลกเปลี่ยน'} ได้ปฏิเสธคำขอแลกเปลี่ยนของคุณในครั้งนี้`,
      'requests'
    );

    return {
      id: requestId,
      requestId,
      senderId: requesterId,
      requesterId,
      receiverId: data.receiverId,
      offeredSkill: data.offeredSkill,
      requestedSkill: data.requestedSkill,
      message: data.message,
      status: 'rejected',
      createdAt: data.createdAt,
      updatedAt: now,
    };
  },

  // Cancel an exchange request (by requester)
  async cancelRequest(requestId: string): Promise<void> {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  },

  // Complete an exchange
  async completeExchange(requestId: string, currentUserId: string): Promise<void> {
    const docRef = doc(db, REQUESTS_COLLECTION, requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data();
    await updateDoc(docRef, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });

    const requesterId = data.requesterId || data.senderId;
    const partnerId = requesterId === currentUserId ? data.receiverId : requesterId;

    // Increment completedExchanges count for both
    try {
      const user1 = await userService.getUserById(currentUserId);
      const user2 = await userService.getUserById(partnerId);
      if (user1) {
        await userService.updateUser(currentUserId, {
          completedExchanges: (user1.completedExchanges || 0) + 1,
        });
      }
      if (user2) {
        await userService.updateUser(partnerId, {
          completedExchanges: (user2.completedExchanges || 0) + 1,
        });
      }
    } catch (e) {
      console.warn('Could not update user exchange count:', e);
    }
  },
};
