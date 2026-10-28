import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';
import { INITIAL_USERS } from '../mock/initialData';

const USERS_COLLECTION = 'users';

// Helper to generate a unique SWP-prefixed 6-digit User ID
export function generatePublicUserId(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const num = (Math.abs(hash) % 900000) + 100000;
    return `SWP${num}`;
  }
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SWP${randomNum}`;
}

export const userService = {
  // Fetch all users from Firestore, with fallback and merging with initial users
  async getAllUsers(): Promise<User[]> {
    try {
      const usersCol = collection(db, USERS_COLLECTION);
      const snapshot = await getDocs(usersCol);
      const usersMap = new Map<string, User>();

      // Seed initial users into the map first
      INITIAL_USERS.forEach((u) => {
        usersMap.set(u.id, u);
      });

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        const generatedUserId = data.userId || generatePublicUserId(id);
        usersMap.set(id, {
          id,
          userId: generatedUserId,
          uid: data.uid || id,
          name: data.name || data.displayName || 'ไม่ระบุชื่อ',
          displayName: data.displayName || data.name || 'ไม่ระบุชื่อ',
          email: data.email || '',
          role: data.role || 'user',
          profileImage:
            data.profileImage ||
            data.photoURL ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name || id)}`,
          photoURL: data.photoURL || data.profileImage,
          bio: data.bio || '',
          location: data.location || data.province || 'กรุงเทพมหานคร',
          province: data.province || data.location || 'กรุงเทพมหานคร',
          phone: data.phone || '',
          learningMode: data.learningMode || 'Both',
          rating: typeof data.rating === 'number' ? data.rating : 5.0,
          reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
          completedExchanges:
            typeof data.completedExchanges === 'number' ? data.completedExchanges : 0,
          isNewUser: data.isNewUser !== undefined ? data.isNewUser : false,
          profileCompleted: data.profileCompleted !== undefined ? data.profileCompleted : true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt || data.updatedAt || data.createdAt || new Date().toISOString(),
          isOnline: data.isOnline ?? false,
          status: data.status || 'active',
          isBot: data.isBot ?? false,
          isDemo: data.isDemo ?? false,
        });
      });

      return Array.from(usersMap.values());
    } catch (error) {
      console.error('Error in userService.getAllUsers:', error);
      return INITIAL_USERS;
    }
  },

  // Get user profile by ID or UID
  async getUserById(id: string): Promise<User | null> {
    if (!id) return null;
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId || generatePublicUserId(docSnap.id),
          uid: data.uid || docSnap.id,
          name: data.name || data.displayName || 'ไม่ระบุชื่อ',
          displayName: data.displayName || data.name || 'ไม่ระบุชื่อ',
          email: data.email || '',
          role: data.role || 'user',
          profileImage:
            data.profileImage ||
            data.photoURL ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name || docSnap.id)}`,
          photoURL: data.photoURL || data.profileImage,
          bio: data.bio || '',
          location: data.location || data.province || 'กรุงเทพมหานคร',
          province: data.province || data.location || 'กรุงเทพมหานคร',
          phone: data.phone || '',
          learningMode: data.learningMode || 'Both',
          rating: typeof data.rating === 'number' ? data.rating : 5.0,
          reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
          completedExchanges:
            typeof data.completedExchanges === 'number' ? data.completedExchanges : 0,
          isNewUser: data.isNewUser !== undefined ? data.isNewUser : false,
          profileCompleted: data.profileCompleted !== undefined ? data.profileCompleted : true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt || data.updatedAt || data.createdAt || new Date().toISOString(),
          isOnline: data.isOnline ?? false,
          status: data.status || 'active',
          isBot: data.isBot ?? false,
          isDemo: data.isDemo ?? false,
        };
      }

      // Check in mock initial users
      const mockUser = INITIAL_USERS.find(
        (u) => u.id === id || u.uid === id || u.userId?.toLowerCase() === id.toLowerCase()
      );
      if (mockUser) {
        return {
          ...mockUser,
          isNewUser: false,
          profileCompleted: true,
        };
      }

      // Query by uid field just in case
      const q = query(collection(db, USERS_COLLECTION), where('uid', '==', id));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        const data = firstDoc.data();
        return {
          id: firstDoc.id,
          userId: data.userId || generatePublicUserId(firstDoc.id),
          uid: data.uid || firstDoc.id,
          name: data.name || data.displayName || 'ไม่ระบุชื่อ',
          displayName: data.displayName || data.name || 'ไม่ระบุชื่อ',
          email: data.email || '',
          role: data.role || 'user',
          profileImage:
            data.profileImage ||
            data.photoURL ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name || firstDoc.id)}`,
          photoURL: data.photoURL || data.profileImage,
          bio: data.bio || '',
          location: data.location || data.province || 'กรุงเทพมหานคร',
          province: data.province || data.location || 'กรุงเทพมหานคร',
          phone: data.phone || '',
          learningMode: data.learningMode || 'Both',
          rating: typeof data.rating === 'number' ? data.rating : 5.0,
          reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 0,
          completedExchanges:
            typeof data.completedExchanges === 'number' ? data.completedExchanges : 0,
          isNewUser: data.isNewUser !== undefined ? data.isNewUser : false,
          profileCompleted: data.profileCompleted !== undefined ? data.profileCompleted : true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt || data.updatedAt || data.createdAt || new Date().toISOString(),
          isOnline: data.isOnline ?? false,
          status: data.status || 'active',
          isBot: data.isBot ?? false,
          isDemo: data.isDemo ?? false,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error in userService.getUserById(${id}):`, error);
      const fallback = INITIAL_USERS.find((u) => u.id === id);
      return fallback ? { ...fallback, isNewUser: false, profileCompleted: true } : null;
    }
  },

  // Find user strictly by public User ID (e.g. SWP102548, case-insensitive)
  async getUserByPublicUserId(publicUserId: string): Promise<User | null> {
    const cleanId = publicUserId.trim().toUpperCase();
    if (!cleanId) return null;

    try {
      const q = query(
        collection(db, USERS_COLLECTION),
        where('userId', '==', cleanId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return this.getUserById(snap.docs[0].id);
      }
    } catch (e) {
      console.warn('Error querying by public userId in firestore:', e);
    }

    // Fallback search in all users
    const all = await this.getAllUsers();
    return all.find((u) => u.userId?.toUpperCase() === cleanId) || null;
  },

  // Create new user profile document in Firestore
  async createUser(user: User): Promise<User> {
    const userId = user.uid || user.id;
    const publicUserId = user.userId || generatePublicUserId(userId);
    const now = new Date().toISOString();
    const userData = {
      uid: userId,
      userId: publicUserId,
      name: user.name || user.displayName || 'ผู้ใช้งาน SkillsWop',
      displayName: user.displayName || user.name || 'ผู้ใช้งาน SkillsWop',
      email: user.email || '',
      profileImage: user.profileImage || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userId)}`,
      photoURL: user.photoURL || user.profileImage,
      bio: user.bio || '',
      location: user.location || user.province || 'กรุงเทพมหานคร',
      province: user.province || user.location || 'กรุงเทพมหานคร',
      phone: user.phone || '',
      role: user.role || 'user',
      learningMode: user.learningMode || 'Both',
      rating: user.rating ?? 5.0,
      reviewCount: user.reviewCount ?? 0,
      completedExchanges: user.completedExchanges ?? 0,
      isNewUser: user.isNewUser !== undefined ? user.isNewUser : true,
      profileCompleted: user.profileCompleted !== undefined ? user.profileCompleted : false,
      createdAt: user.createdAt || now,
      updatedAt: now,
      lastLoginAt: user.lastLoginAt || now,
      isOnline: true,
      status: user.status || 'active',
      isBot: user.isBot ?? false,
      isDemo: user.isDemo ?? false,
    };

    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, userData, { merge: true });

    return {
      ...user,
      id: userId,
      uid: userId,
      userId: publicUserId,
      name: userData.name,
      displayName: userData.displayName,
      profileImage: userData.profileImage,
      photoURL: userData.photoURL,
      isNewUser: userData.isNewUser,
      profileCompleted: userData.profileCompleted,
      createdAt: userData.createdAt,
      lastLoginAt: userData.lastLoginAt,
      updatedAt: now,
    };
  },

  // Update existing user profile document in Firestore
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const userRef = doc(db, USERS_COLLECTION, id);
    const now = new Date().toISOString();

    const updatePayload: Record<string, any> = {
      ...data,
      updatedAt: now,
    };

    if (data.province && !data.location) {
      updatePayload.location = data.province;
    }
    if (data.location && !data.province) {
      updatePayload.province = data.location;
    }

    try {
      await setDoc(userRef, updatePayload, { merge: true });
    } catch (e) {
      console.warn('Could not update doc in Firestore:', e);
    }

    const updated = await this.getUserById(id);
    if (!updated) {
      throw new Error('User not found after update');
    }
    return updated;
  },

  // Search users by query (by SWP UserID, name, bio, or province)
  async searchUsers(queryStr: string): Promise<User[]> {
    const all = await this.getAllUsers();
    const q = queryStr.trim().toLowerCase();
    if (!q) return all;

    return all.filter((u) => {
      const matchUserId = u.userId?.toLowerCase().includes(q);
      const matchName = u.name.toLowerCase().includes(q);
      const matchBio = u.bio?.toLowerCase().includes(q);
      const matchProvince = u.province?.toLowerCase().includes(q);
      return matchUserId || matchName || matchBio || matchProvince;
    });
  },

  // Set user account status (e.g. active, warned, suspended)
  async setUserStatus(id: string, status: 'active' | 'warned' | 'suspended'): Promise<void> {
    await this.updateUser(id, { status });
  },
};
