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
import { Schedule, ScheduleStatus, ScheduleType } from '../types';
import { notificationService } from './notificationService';

const SCHEDULES_COLLECTION = 'schedules';

export const scheduleService = {
  // Get all schedules for a user (either creator or partner)
  async getSchedulesForUser(userId: string): Promise<Schedule[]> {
    if (!userId) return [];
    try {
      const qUser = query(
        collection(db, SCHEDULES_COLLECTION),
        where('userId', '==', userId)
      );
      const qPartner = query(
        collection(db, SCHEDULES_COLLECTION),
        where('partnerId', '==', userId)
      );

      const [snapUser, snapPartner] = await Promise.all([
        getDocs(qUser),
        getDocs(qPartner),
      ]);

      const mapDoc = (d: any): Schedule => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          partnerId: data.partnerId,
          title: data.title || 'นัดหมายแลกเปลี่ยนทักษะ',
          date: data.date || '',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          type: data.type || 'Online',
          location: data.location || '',
          meetingLink: data.meetingLink || '',
          status: data.status || 'Upcoming',
          offeredSkill: data.offeredSkill || '',
          createdAt: data.createdAt || new Date().toISOString(),
        };
      };

      const set = new Map<string, Schedule>();
      snapUser.docs.forEach((d) => set.set(d.id, mapDoc(d)));
      snapPartner.docs.forEach((d) => set.set(d.id, mapDoc(d)));

      const schedules = Array.from(set.values());
      schedules.sort(
        (a, b) => new Date(`${a.date} ${a.startTime}`).getTime() - new Date(`${b.date} ${b.startTime}`).getTime()
      );
      return schedules;
    } catch (error) {
      console.error('Error in getSchedulesForUser:', error);
      return [];
    }
  },

  // Create a new schedule session in Firestore
  async createSchedule(data: {
    userId: string;
    partnerId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: ScheduleType;
    location?: string;
    meetingLink?: string;
    offeredSkill?: string;
  }): Promise<Schedule> {
    const id = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const scheduleData = {
      id,
      ...data,
      status: 'Upcoming' as ScheduleStatus,
      createdAt: now,
    };

    const docRef = doc(db, SCHEDULES_COLLECTION, id);
    await setDoc(docRef, scheduleData);

    await notificationService.createNotification(
      data.partnerId,
      'schedule_reminder',
      'มีการนัดหมายแลกเปลี่ยนทักษะใหม่',
      `นัดหมาย: "${data.title}" ในวันที่ ${data.date} เวลา ${data.startTime} - ${data.endTime} น.`,
      'schedule'
    );

    return scheduleData;
  },

  // Update schedule status in Firestore
  async updateScheduleStatus(id: string, status: ScheduleStatus): Promise<Schedule> {
    const docRef = doc(db, SCHEDULES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Schedule not found');

    await updateDoc(docRef, { status });
    const updatedSnap = await getDoc(docRef);
    const data = updatedSnap.data() as any;

    if (status === 'Completed') {
      await notificationService.createNotification(
        data.partnerId,
        'new_review',
        'การแลกเปลี่ยนเสร็จสมบูรณ์แล้ว ✨',
        `คุณสามารถให้คะแนนและรีวิวเซสชัน "${data.title}" ได้แล้ว`,
        'reviews'
      );
    }

    return {
      id: updatedSnap.id,
      ...data,
    };
  },
};
