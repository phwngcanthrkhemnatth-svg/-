import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { userService } from './userService';
import { User } from '../types';

export const authService = {
  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      try {
        let profile = await userService.getUserById(firebaseUser.uid);
        if (!profile) {
          // If Firestore doc doesn't exist yet, bootstrap it
          profile = await userService.createUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ผู้ใช้งาน SkillsWop',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ผู้ใช้งาน SkillsWop',
            email: firebaseUser.email || '',
            role: 'user',
            profileImage:
              firebaseUser.photoURL ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
            photoURL: firebaseUser.photoURL || undefined,
            bio: 'สวัสดี! ฉันเป็นสมาชิกใหม่ของ SkillsWop',
            location: 'กรุงเทพมหานคร',
            province: 'กรุงเทพมหานคร',
            phone: '',
            learningMode: 'Online',
            rating: 5.0,
            reviewCount: 0,
            completedExchanges: 0,
            isNewUser: true,
            profileCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            isOnline: true,
            status: 'active',
          });
        }
        callback(profile);
      } catch (err) {
        console.error('Error fetching user profile in auth state change:', err);
        callback(null);
      }
    });
  },

  // Google sign in using Firebase Authentication
  async loginWithGoogle(): Promise<{ user: User; isNew: boolean }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const uid = firebaseUser.uid;
      const now = new Date().toISOString();

      // Check if user already exists in Firestore
      const existingUser = await userService.getUserById(uid);

      if (existingUser) {
        // User already has an account - do NOT create duplicate, update lastLoginAt
        const updated = await userService.updateUser(uid, {
          lastLoginAt: now,
          isOnline: true,
          photoURL: existingUser.photoURL || firebaseUser.photoURL || undefined,
        });
        return { user: updated, isNew: updated.isNewUser ?? false };
      }

      // Brand new user from Google
      const photoURL =
        firebaseUser.photoURL ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uid)}`;
      const displayName =
        firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'ผู้ใช้งาน SkillsWop';

      const newUser = await userService.createUser({
        id: uid,
        uid: uid,
        name: displayName,
        displayName: displayName,
        email: firebaseUser.email || '',
        role: 'user',
        profileImage: photoURL,
        photoURL: photoURL,
        bio: 'สวัสดี! ฉันเพิ่งเข้าร่วมคอมมูนิตี้ SkillsWop',
        location: 'กรุงเทพมหานคร',
        province: 'กรุงเทพมหานคร',
        phone: '',
        learningMode: 'Online',
        rating: 5.0,
        reviewCount: 0,
        completedExchanges: 0,
        isNewUser: true,
        profileCompleted: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        isOnline: true,
        status: 'active',
      });

      return { user: newUser, isNew: true };
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('หน้าต่างเข้าสู่ระบบ Google ถูกปิดก่อนทำรายการเสร็จสิ้น');
      } else if (err.code === 'auth/popup-blocked') {
        throw new Error('เบราว์เซอร์บล็อกหน้าต่างป็อปอัป กรุณาอนุญาตป็อปอัปแล้วลองใหม่อีกครั้ง');
      } else if (err.code === 'auth/cancelled-popup-request') {
        throw new Error('มีการยกเลิกคำขอเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        throw new Error('มีบัญชีนี้ในระบบแล้วด้วยวิธีการเข้าสู่ระบบอื่น');
      } else if (err.code === 'auth/network-request-failed') {
        throw new Error('เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      } else if (err.code === 'auth/operation-not-allowed') {
        throw new Error('ยังไม่ได้เปิดใช้งาน Google Sign-in ใน Firebase Console > Authentication > Sign-in method');
      }
      throw new Error(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    }
  },

  // Get current logged-in user profile
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    return userService.getUserById(firebaseUser.uid);
  },

  // Sign in with email and password
  async login(email: string, password?: string): Promise<User> {
    if (!email || !password) {
      throw new Error('กรุณากรอกทั้งอีเมลและรหัสผ่าน');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = await userService.getUserById(cred.user.uid);
      if (!user) {
        // Create user doc if missing
        return await userService.createUser({
          id: cred.user.uid,
          uid: cred.user.uid,
          name: cred.user.displayName || email.split('@')[0],
          email: cred.user.email || email,
          role: 'user',
          profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cred.user.uid)}`,
          bio: 'สวัสดี! ฉันเป็นสมาชิกของ SkillsWop',
          location: 'กรุงเทพมหานคร',
          province: 'กรุงเทพมหานคร',
          phone: '',
          learningMode: 'Both',
          rating: 5.0,
          reviewCount: 0,
          completedExchanges: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isOnline: true,
          status: 'active',
        });
      }

      if (user.status === 'suspended') {
        await signOut(auth);
        throw new Error('บัญชีนี้ถูกระงับการใช้งานชั่วคราวโดยผู้ดูแลระบบ');
      }

      return user;
    } catch (err: any) {
      console.error('Firebase Auth login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err.code === 'auth/operation-not-allowed') {
        throw new Error('ยังไม่ได้เปิดใช้งาน Email/Password ใน Firebase Console > Authentication > Sign-in method');
      } else if (err.code === 'auth/too-many-requests') {
        throw new Error('มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง');
      }
      throw new Error(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  },

  // Register new account with email and password
  async register(
    name: string,
    email: string,
    password?: string,
    province: string = 'กรุงเทพมหานคร',
    profileImage?: string
  ): Promise<User> {
    if (!email || !password) {
      throw new Error('กรุณากรอกข้อมูลอีเมลและรหัสผ่านให้ครบถ้วน');
    }
    if (password.length < 6) {
      throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;
      const now = new Date().toISOString();
      const selectedProvince = province.trim() || 'กรุงเทพมหานคร';
      const selectedAvatar =
        profileImage?.trim() ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim() || uid)}`;

      // Create profile in Firestore users collection using UID as document ID
      // CRITICAL: NEVER store password in Firestore
      const newUser: User = {
        id: uid,
        uid: uid,
        name: name.trim() || email.split('@')[0],
        displayName: name.trim() || email.split('@')[0],
        email: email.trim(),
        role: 'user',
        profileImage: selectedAvatar,
        photoURL: selectedAvatar,
        bio: 'สวัสดี! ฉันเป็นสมาชิกใหม่ของ SkillsWop กำลังตื่นเต้นที่จะได้แลกเปลี่ยนทักษะกับทุกคน',
        location: selectedProvince,
        province: selectedProvince,
        phone: '',
        learningMode: 'Online',
        rating: 5.0,
        reviewCount: 0,
        completedExchanges: 0,
        isNewUser: true,
        profileCompleted: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        isOnline: true,
        status: 'active',
      };

      await userService.createUser(newUser);
      return newUser;
    } catch (err: any) {
      console.error('Firebase Auth register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      } else if (err.code === 'auth/operation-not-allowed') {
        throw new Error('ยังไม่ได้เปิดใช้งาน Email/Password ใน Firebase Console > Authentication > Sign-in method');
      }
      throw new Error(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    }
  },

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    if (!email) {
      throw new Error('กรุณากรอกอีเมลเพื่อขอรีเซ็ตรหัสผ่าน');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Firebase Auth resetPassword error:', err);
      if (err.code === 'auth/user-not-found') {
        throw new Error('ไม่พบผู้ใช้งานด้วยอีเมลนี้ในระบบ');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      }
      throw new Error(err.message || 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้');
    }
  },

  // Sign out from Firebase
  async logout(): Promise<void> {
    await signOut(auth);
  },
};
