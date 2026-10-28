import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Skill, SkillCategory, UserSkill, SkillLevel, SkillType } from '../types';
import { INITIAL_CATEGORIES, INITIAL_USER_SKILLS } from '../mock/initialData';

const SKILLS_COLLECTION = 'skills';
const USER_SKILLS_COLLECTION = 'userSkills';
const DELETED_SKILLS_STORAGE_KEY = 'skillswop_deleted_user_skills';

// Helper to get locally tracked deleted skill IDs so initial mock items don't resurrect
function getDeletedSkillIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_SKILLS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function recordDeletedSkillId(id: string) {
  try {
    const set = getDeletedSkillIds();
    set.add(id);
    localStorage.setItem(DELETED_SKILLS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to save deleted skill id to storage', e);
  }
}

function clearDeletedSkillId(id: string) {
  try {
    const set = getDeletedSkillIds();
    set.delete(id);
    localStorage.setItem(DELETED_SKILLS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to unmark deleted skill id', e);
  }
}

// Normalize type to 'canTeach' or 'wantToLearn'
export function normalizeSkillType(type?: string): 'canTeach' | 'wantToLearn' {
  if (type === 'teach' || type === 'canTeach') return 'canTeach';
  return 'wantToLearn';
}

export const SKILL_LEVEL_OPTIONS = [
  'ไม่ระบุ',
  'ระดับเริ่มต้น (Beginner)',
  'ระดับปานกลาง (Intermediate)',
  'ระดับเชี่ยวชาญ (Advanced)',
  'ระดับผู้เชี่ยวชาญ (Expert)',
  'มัธยมต้น',
  'มัธยมปลาย',
  'ปวช.',
  'ปวส.',
  'ปริญญาตรี',
  'บุคคลทั่วไป',
];

export const skillService = {
  // Get skill categories
  async getCategories(): Promise<SkillCategory[]> {
    return INITIAL_CATEGORIES;
  },

  // Get master skills catalog from Firestore
  async getSkills(): Promise<Skill[]> {
    try {
      const skillsCol = collection(db, SKILLS_COLLECTION);
      const snapshot = await getDocs(skillsCol);
      const skills: Skill[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        skills.push({
          id: d.id,
          skillId: data.skillId || d.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          categoryId: data.categoryId || data.category || '',
          createdBy: data.createdBy || '',
          createdAt: data.createdAt || new Date().toISOString(),
          popular: data.popular ?? false,
        });
      });
      return skills;
    } catch (error) {
      console.error('Error fetching skills:', error);
      return [];
    }
  },

  // Add new skill to master catalog in Firestore
  async addMasterSkill(
    name: string,
    category: string,
    description: string = '',
    createdBy: string = ''
  ): Promise<Skill> {
    const skillId = `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const skillRef = doc(db, SKILLS_COLLECTION, skillId);

    const skillData = {
      skillId,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      createdBy,
      createdAt: now,
    };

    await setDoc(skillRef, skillData);

    return {
      id: skillId,
      ...skillData,
      categoryId: category,
      popular: false,
    };
  },

  // Get user skills for a specific user from Firestore
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    if (!userId) return [];
    const deletedIds = getDeletedSkillIds();
    const skillsMap = new Map<string, UserSkill>();

    // 1. First add initial mock skills for this user if not deleted
    INITIAL_USER_SKILLS
      .filter((s) => s.userId === userId && !deletedIds.has(s.id) && !deletedIds.has(s.userSkillId || ''))
      .forEach((s) => {
        const normType = normalizeSkillType(s.type);
        const uSkill: UserSkill = {
          id: s.id,
          userSkillId: s.userSkillId || s.id,
          userId: s.userId,
          skillId: s.skillId || s.id,
          skillName: s.skillName,
          category: s.category || s.categoryName || 'ทั่วไป',
          categoryName: s.categoryName || s.category || 'ทั่วไป',
          type: normType,
          level: s.level || 'ไม่ระบุ',
          description: s.description || '',
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
        };
        skillsMap.set(uSkill.userSkillId, uSkill);
      });

    // 2. Fetch real data from Firestore
    try {
      const q = query(
        collection(db, USER_SKILLS_COLLECTION),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);

      snapshot.forEach((d) => {
        const data = d.data();
        const userSkillId = data.userSkillId || d.id;
        if (deletedIds.has(userSkillId) || deletedIds.has(d.id)) {
          return;
        }

        const normType = normalizeSkillType(data.type);
        const userSkill: UserSkill = {
          id: d.id,
          userSkillId: userSkillId,
          userId: data.userId || userId,
          skillId: data.skillId || d.id,
          skillName: data.skillName || '',
          category: data.category || data.categoryName || 'ทั่วไป',
          categoryName: data.categoryName || data.category || 'ทั่วไป',
          type: normType,
          level: data.level || 'ไม่ระบุ',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
        };
        skillsMap.set(userSkillId, userSkill);
      });
    } catch (error) {
      console.warn(`Firestore getUserSkills query failed for ${userId}:`, error);
    }

    return Array.from(skillsMap.values());
  },

  // Get all user skills from Firestore (for searching, matching, and discovery)
  async getAllUserSkills(): Promise<UserSkill[]> {
    const deletedIds = getDeletedSkillIds();
    const skillsMap = new Map<string, UserSkill>();

    // Initial mock base
    INITIAL_USER_SKILLS
      .filter((s) => !deletedIds.has(s.id) && !deletedIds.has(s.userSkillId || ''))
      .forEach((s) => {
        const normType = normalizeSkillType(s.type);
        const uSkill: UserSkill = {
          id: s.id,
          userSkillId: s.userSkillId || s.id,
          userId: s.userId,
          skillId: s.skillId || s.id,
          skillName: s.skillName,
          category: s.category || s.categoryName || 'ทั่วไป',
          categoryName: s.categoryName || s.category || 'ทั่วไป',
          type: normType,
          level: s.level || 'ไม่ระบุ',
          description: s.description || '',
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
        };
        skillsMap.set(uSkill.userSkillId, uSkill);
      });

    try {
      const snapshot = await getDocs(collection(db, USER_SKILLS_COLLECTION));
      snapshot.forEach((d) => {
        const data = d.data();
        const userSkillId = data.userSkillId || d.id;
        if (deletedIds.has(userSkillId) || deletedIds.has(d.id)) {
          return;
        }

        const normType = normalizeSkillType(data.type);
        skillsMap.set(userSkillId, {
          id: d.id,
          userSkillId: userSkillId,
          userId: data.userId,
          skillId: data.skillId || d.id,
          skillName: data.skillName || '',
          category: data.category || data.categoryName || 'ทั่วไป',
          categoryName: data.categoryName || data.category || 'ทั่วไป',
          type: normType,
          level: data.level || 'ไม่ระบุ',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
        });
      });
    } catch (error) {
      console.warn('Error in getAllUserSkills:', error);
    }

    return Array.from(skillsMap.values());
  },

  // Add user skill to Firestore with duplicate protection
  async addUserSkill(payload: {
    userId: string;
    skillName: string;
    type: 'canTeach' | 'wantToLearn' | 'teach' | 'learn';
    category?: string;
    categoryName?: string;
    level?: SkillLevel;
    description?: string;
  }): Promise<UserSkill> {
    const { userId, skillName, level, description } = payload;
    const cleanName = skillName.trim();
    if (!cleanName) {
      throw new Error('กรุณาระบุชื่อทักษะ');
    }
    if (!userId) {
      throw new Error('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบก่อน');
    }

    const normType = normalizeSkillType(payload.type);
    const cleanCategory = (payload.category || payload.categoryName || 'ทั่วไป').trim();
    const cleanDesc = (description || '').trim();
    const cleanLevel = level || 'ไม่ระบุ';

    // Check for duplicate skill under the same user and type
    const existingList = await this.getUserSkills(userId);
    const isDuplicate = existingList.some(
      (s) =>
        s.type === normType &&
        s.skillName.toLowerCase().trim() === cleanName.toLowerCase()
    );

    if (isDuplicate) {
      const typeLabel = normType === 'canTeach' ? 'พร้อมสอน' : 'อยากเรียน';
      throw new Error(`คุณมีทักษะ "${cleanName}" ในหมวดทักษะที่${typeLabel}อยู่แล้ว ไม่สามารถเพิ่มซ้ำได้`);
    }

    const userSkillId = `usk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const skillId = `sk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const data: UserSkill = {
      id: userSkillId,
      userSkillId,
      userId,
      skillId,
      skillName: cleanName,
      category: cleanCategory,
      categoryName: cleanCategory,
      type: normType,
      level: cleanLevel,
      description: cleanDesc,
      createdAt: now,
      updatedAt: now,
    };

    // Unmark from deleted storage if reused
    clearDeletedSkillId(userSkillId);

    // Save to Firestore
    try {
      const docRef = doc(db, USER_SKILLS_COLLECTION, userSkillId);
      await setDoc(docRef, data);
    } catch (err) {
      console.warn('Firestore setDoc userSkills note:', err);
      // Even if Firestore rule restricts unauthenticated guest, data object is returned for local state
    }

    // Auto-register to master catalog
    try {
      const allSkills = await this.getSkills();
      const exists = allSkills.some(
        (s) => s.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (!exists) {
        await this.addMasterSkill(cleanName, cleanCategory, cleanDesc, userId);
      }
    } catch (e) {
      console.warn('Could not auto-register master skill:', e);
    }

    return data;
  },

  // Update user skill in Firestore with duplicate check
  async updateUserSkill(
    userSkillId: string,
    updates: {
      skillName?: string;
      category?: string;
      categoryName?: string;
      type?: 'canTeach' | 'wantToLearn' | 'teach' | 'learn';
      level?: SkillLevel;
      description?: string;
    }
  ): Promise<UserSkill> {
    if (!userSkillId) {
      throw new Error('ไม่พบรหัสทักษะที่ต้องการแก้ไข (userSkillId)');
    }

    const now = new Date().toISOString();
    const docRef = doc(db, USER_SKILLS_COLLECTION, userSkillId);
    let existingDoc: any = null;

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        existingDoc = snap.data();
      }
    } catch (err) {
      console.warn('Could not fetch doc by id:', err);
    }

    // If not found directly by doc id, search by userSkillId field
    if (!existingDoc) {
      try {
        const q = query(
          collection(db, USER_SKILLS_COLLECTION),
          where('userSkillId', '==', userSkillId)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          existingDoc = qSnap.docs[0].data();
        }
      } catch (err) {
        console.warn('Query by userSkillId failed:', err);
      }
    }

    const targetUserId = existingDoc?.userId || '';
    const normType = updates.type ? normalizeSkillType(updates.type) : (existingDoc ? normalizeSkillType(existingDoc.type) : 'canTeach');

    // Duplicate check if skillName is updated
    if (updates.skillName && targetUserId) {
      const cleanNewName = updates.skillName.trim().toLowerCase();
      const userSkills = await this.getUserSkills(targetUserId);
      const isDup = userSkills.some(
        (s) =>
          s.userSkillId !== userSkillId &&
          s.id !== userSkillId &&
          s.type === normType &&
          s.skillName.trim().toLowerCase() === cleanNewName
      );
      if (isDup) {
        throw new Error(`คุณมีทักษะชื่อ "${updates.skillName.trim()}" ในรายการแล้ว ไม่สามารถตั้งชื่อซ้ำได้`);
      }
    }

    const updatePayload: Record<string, any> = {
      updatedAt: now,
    };

    if (updates.skillName !== undefined) {
      updatePayload.skillName = updates.skillName.trim();
    }
    if (updates.category !== undefined || updates.categoryName !== undefined) {
      const cat = (updates.category || updates.categoryName || '').trim();
      updatePayload.category = cat;
      updatePayload.categoryName = cat;
    }
    if (updates.type !== undefined) {
      updatePayload.type = normType;
    }
    if (updates.level !== undefined) {
      updatePayload.level = updates.level;
    }
    if (updates.description !== undefined) {
      updatePayload.description = updates.description.trim();
    }

    try {
      await setDoc(docRef, updatePayload, { merge: true });
    } catch (err) {
      console.warn('Firestore setDoc merge error:', err);
    }

    // Re-fetch or compose updated record
    return {
      id: userSkillId,
      userSkillId,
      userId: targetUserId,
      skillId: existingDoc?.skillId || userSkillId,
      skillName: updatePayload.skillName || existingDoc?.skillName || '',
      category: updatePayload.category || existingDoc?.category || 'ทั่วไป',
      categoryName: updatePayload.categoryName || existingDoc?.categoryName || 'ทั่วไป',
      type: updatePayload.type || normType,
      level: updatePayload.level || existingDoc?.level || 'ไม่ระบุ',
      description: updatePayload.description !== undefined ? updatePayload.description : (existingDoc?.description || ''),
      createdAt: existingDoc?.createdAt || now,
      updatedAt: now,
    };
  },

  // Delete user skill from Firestore permanently using exact Document ID / userSkillId
  async deleteUserSkill(userSkillId: string): Promise<void> {
    if (!userSkillId || typeof userSkillId !== 'string') {
      throw new Error('ไม่พบรหัสทักษะที่ต้องการลบ (userSkillId is missing or invalid)');
    }

    // 1. Immediately record in deleted storage to prevent initial mock resurrection
    recordDeletedSkillId(userSkillId);

    // 2. Delete document from Firestore by direct doc ID
    try {
      const directDocRef = doc(db, USER_SKILLS_COLLECTION, userSkillId);
      await deleteDoc(directDocRef);
    } catch (error) {
      console.warn(`Direct deleteDoc for ${userSkillId} note:`, error);
    }

    // 3. Also query by userSkillId field in case doc ID differs from userSkillId
    try {
      const q = query(
        collection(db, USER_SKILLS_COLLECTION),
        where('userSkillId', '==', userSkillId)
      );
      const snapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach((d) => {
        deletePromises.push(deleteDoc(d.ref));
      });
      await Promise.all(deletePromises);
    } catch (error) {
      console.warn(`Query-based deleteDoc for ${userSkillId} note:`, error);
    }
  },

  // Alias for backwards compatibility
  async removeUserSkill(userSkillId: string): Promise<void> {
    return this.deleteUserSkill(userSkillId);
  },
};
