import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Friend, FriendRequest } from '../types';
import { INITIAL_FRIENDS, INITIAL_FRIEND_REQUESTS } from '../mock/initialData';
import { notificationService } from './notificationService';
import { userService } from './userService';

const FRIENDS_COLLECTION = 'friends';
const FRIEND_REQUESTS_COLLECTION = 'friendRequests';

// Local cache to ensure seamless demo experience even before first Firestore write
let localFriends: Friend[] = [...INITIAL_FRIENDS];
let localFriendRequests: FriendRequest[] = [...INITIAL_FRIEND_REQUESTS];

export const friendService = {
  // Get all confirmed friendships for a user
  async getFriends(userId: string): Promise<Friend[]> {
    if (!userId) return [];
    try {
      const q1 = query(collection(db, FRIENDS_COLLECTION), where('user1Id', '==', userId));
      const q2 = query(collection(db, FRIENDS_COLLECTION), where('user2Id', '==', userId));

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const friendsMap = new Map<string, Friend>();

      snap1.forEach((d) => {
        const data = d.data();
        friendsMap.set(d.id, {
          id: d.id,
          user1Id: data.user1Id,
          user2Id: data.user2Id,
          createdAt: data.createdAt,
        });
      });

      snap2.forEach((d) => {
        const data = d.data();
        friendsMap.set(d.id, {
          id: d.id,
          user1Id: data.user1Id,
          user2Id: data.user2Id,
          createdAt: data.createdAt,
        });
      });

      // Include local friends if not already in Firestore
      localFriends
        .filter((f) => f.user1Id === userId || f.user2Id === userId)
        .forEach((f) => {
          if (!friendsMap.has(f.id)) {
            friendsMap.set(f.id, f);
          }
        });

      return Array.from(friendsMap.values());
    } catch (error) {
      console.warn('Error fetching friends from Firestore, using local data:', error);
      return localFriends.filter((f) => f.user1Id === userId || f.user2Id === userId);
    }
  },

  // Get incoming pending friend requests
  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, FRIEND_REQUESTS_COLLECTION),
        where('receiverId', '==', userId),
        where('status', '==', 'Pending')
      );
      const snap = await getDocs(q);
      const reqMap = new Map<string, FriendRequest>();

      snap.forEach((d) => {
        const data = d.data();
        reqMap.set(d.id, {
          id: d.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      // Merge local pending requests
      localFriendRequests
        .filter((r) => r.receiverId === userId && r.status === 'Pending')
        .forEach((r) => {
          if (!reqMap.has(r.id)) {
            reqMap.set(r.id, r);
          }
        });

      return Array.from(reqMap.values());
    } catch (error) {
      console.warn('Error fetching friend requests, using local data:', error);
      return localFriendRequests.filter(
        (r) => r.receiverId === userId && r.status === 'Pending'
      );
    }
  },

  // Get sent pending friend requests
  async getSentRequests(userId: string): Promise<FriendRequest[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, FRIEND_REQUESTS_COLLECTION),
        where('senderId', '==', userId),
        where('status', '==', 'Pending')
      );
      const snap = await getDocs(q);
      const reqMap = new Map<string, FriendRequest>();

      snap.forEach((d) => {
        const data = d.data();
        reqMap.set(d.id, {
          id: d.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      localFriendRequests
        .filter((r) => r.senderId === userId && r.status === 'Pending')
        .forEach((r) => {
          if (!reqMap.has(r.id)) {
            reqMap.set(r.id, r);
          }
        });

      return Array.from(reqMap.values());
    } catch (error) {
      console.warn('Error fetching sent requests, using local data:', error);
      return localFriendRequests.filter((r) => r.senderId === userId && r.status === 'Pending');
    }
  },

  // Check friendship status between two users
  async getFriendshipStatus(
    currentUserId: string,
    targetUserId: string
  ): Promise<'none' | 'friends' | 'pending_sent' | 'pending_received'> {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      return 'none';
    }

    // Check friends
    const friends = await this.getFriends(currentUserId);
    const isFriend = friends.some(
      (f) =>
        (f.user1Id === currentUserId && f.user2Id === targetUserId) ||
        (f.user2Id === currentUserId && f.user1Id === targetUserId)
    );
    if (isFriend) return 'friends';

    // Check sent requests
    const sent = await this.getSentRequests(currentUserId);
    if (sent.some((r) => r.receiverId === targetUserId)) return 'pending_sent';

    // Check incoming requests
    const incoming = await this.getPendingRequests(currentUserId);
    if (incoming.some((r) => r.senderId === targetUserId)) return 'pending_received';

    return 'none';
  },

  // Send a friend request
  async sendFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<{ success: boolean; message: string; autoAccepted?: boolean }> {
    if (!senderId || !receiverId) {
      return { success: false, message: 'ข้อมูลไม่ครบถ้วน' };
    }
    if (senderId === receiverId) {
      return { success: false, message: 'ไม่สามารถส่งคำขอเป็นเพื่อนให้ตัวเองได้' };
    }

    const currentStatus = await this.getFriendshipStatus(senderId, receiverId);
    if (currentStatus === 'friends') {
      return { success: false, message: 'คุณเป็นเพื่อนกันอยู่แล้ว' };
    }
    if (currentStatus === 'pending_sent') {
      return { success: false, message: 'คุณได้ส่งคำขอเป็นเพื่อนไปแล้ว รอการตอบรับ' };
    }
    if (currentStatus === 'pending_received') {
      // Receiver has already sent a request, auto-accept!
      const pending = await this.getPendingRequests(senderId);
      const req = pending.find((r) => r.senderId === receiverId);
      if (req) {
        await this.respondFriendRequest(req.id, 'Accepted', receiverId, senderId);
        return { success: true, message: 'ตอบรับคำขอและเป็นเพื่อนกันเรียบร้อยแล้ว!', autoAccepted: true };
      }
    }

    // Special handling for Demo Bot: Instantly auto-accepts friend request!
    if (receiverId === 'demo-bot') {
      const now = new Date().toISOString();
      const friendId = `fr-bot-${Date.now()}`;
      const newFriendship: Friend = {
        id: friendId,
        user1Id: senderId,
        user2Id: receiverId,
        createdAt: now,
      };

      try {
        await setDoc(doc(db, FRIENDS_COLLECTION, friendId), newFriendship);
      } catch (e) {
        console.warn('Saving bot friend locally:', e);
      }
      localFriends.push(newFriendship);

      await notificationService.createNotification(
        senderId,
        'friend_accepted',
        'SkillsWop Demo Bot ได้ตอบรับคำขอเป็นเพื่อนแล้ว!',
        'ยินดีที่ได้เป็นเพื่อนกันครับ! คุณสามารถทักแชตพูดคุยหรือส่งคำขอแลกเปลี่ยนวิชากับผมได้ตลอดเวลา',
        'friends'
      );

      return {
        success: true,
        message: 'SkillsWop Demo Bot ตอบรับคำขอเป็นเพื่อนของคุณทันที!',
        autoAccepted: true,
      };
    }

    // Normal user request
    const requestId = `freq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newRequest: FriendRequest = {
      id: requestId,
      senderId,
      receiverId,
      status: 'Pending',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, FRIEND_REQUESTS_COLLECTION, requestId), newRequest);
    } catch (e) {
      console.warn('Saving friend request locally:', e);
    }
    localFriendRequests.push(newRequest);

    // Notify receiver
    const sender = await userService.getUserById(senderId);
    await notificationService.createNotification(
      receiverId,
      'friend_request',
      'มีคำขอเป็นเพื่อนใหม่',
      `${sender?.name || 'มีผู้ใช้งาน'} ได้ส่งคำขอเป็นเพื่อนถึงคุณ`,
      'friends'
    );

    return { success: true, message: 'ส่งคำขอเป็นเพื่อนเรียบร้อยแล้ว' };
  },

  // Respond to friend request (Accept / Reject)
  async respondFriendRequest(
    requestId: string,
    action: 'Accepted' | 'Rejected',
    senderId: string,
    receiverId: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // Update in Firestore
    try {
      const reqRef = doc(db, FRIEND_REQUESTS_COLLECTION, requestId);
      await updateDoc(reqRef, { status: action, respondedAt: now });
    } catch (e) {
      console.warn('Could not update friend request in Firestore:', e);
    }

    // Update in local array
    const localReq = localFriendRequests.find((r) => r.id === requestId);
    if (localReq) {
      localReq.status = action;
    }

    // If accepted, create friend record
    if (action === 'Accepted') {
      const friendId = `fr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const friendship: Friend = {
        id: friendId,
        user1Id: senderId,
        user2Id: receiverId,
        createdAt: now,
      };

      try {
        await setDoc(doc(db, FRIENDS_COLLECTION, friendId), friendship);
      } catch (e) {
        console.warn('Could not save friendship in Firestore:', e);
      }
      localFriends.push(friendship);

      // Notify sender that their request was accepted
      const receiver = await userService.getUserById(receiverId);
      await notificationService.createNotification(
        senderId,
        'friend_accepted',
        'คำขอเป็นเพื่อนได้รับการตอบรับ',
        `${receiver?.name || 'เพื่อนใหม่'} ได้ตอบรับคำขอเป็นเพื่อนของคุณแล้ว คุณสามารถทักทายในแชตได้ทันที`,
        'friends'
      );
    }
  },

  // Remove friendship
  async removeFriend(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      const friends = await this.getFriends(currentUserId);
      const friendship = friends.find(
        (f) =>
          (f.user1Id === currentUserId && f.user2Id === targetUserId) ||
          (f.user2Id === currentUserId && f.user1Id === targetUserId)
      );

      if (friendship) {
        try {
          await deleteDoc(doc(db, FRIENDS_COLLECTION, friendship.id));
        } catch (e) {
          console.warn('Could not delete friendship from Firestore:', e);
        }
        localFriends = localFriends.filter((f) => f.id !== friendship.id);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  },
};
