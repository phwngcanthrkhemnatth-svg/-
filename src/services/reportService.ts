import { Report, ReportReason, ReportStatus } from '../types';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { userService } from './userService';

const REPORTS_COLLECTION = 'reports';

export const reportService = {
  // Fetch all reports from Firestore
  async getAll(): Promise<Report[]> {
    try {
      const q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      if (snap.empty) return [];
      return snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Report, 'id'>),
      }));
    } catch (error) {
      console.error('Error fetching reports from Firestore:', error);
      // Fallback read without order if index is building
      try {
        const snap = await getDocs(collection(db, REPORTS_COLLECTION));
        return snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Report, 'id'>),
        }));
      } catch (innerError) {
        console.error('Inner error fetching reports:', innerError);
        return [];
      }
    }
  },

  // Local set of reported items in session to prevent duplicate spam
  localReportedSet: new Set<string>(),

  // Check if user has already reported this post
  async hasUserReportedPost(reporterId: string, postId: string): Promise<boolean> {
    const key = `${reporterId}_${postId}`;
    if (this.localReportedSet.has(key)) return true;

    try {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('reporterId', '==', reporterId),
        where('postId', '==', postId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        this.localReportedSet.add(key);
        return true;
      }
    } catch (e) {
      console.warn('Could not check reports in Firestore:', e);
    }
    return false;
  },

  // Submit a report to Firestore
  async submitReport(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    details: string,
    postId?: string
  ): Promise<Report> {
    if (postId) {
      const alreadyReported = await this.hasUserReportedPost(reporterId, postId);
      if (alreadyReported) {
        throw new Error('คุณได้ส่งรายงานโพสต์นี้ไปแล้ว ขอบคุณที่ช่วยดูแลชุมชน');
      }
    }

    try {
      const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, REPORTS_COLLECTION, reportId);
      const newReport: Report = {
        id: reportId,
        reportId: reportId,
        reporterId,
        reportedUserId: reportedUserId || '',
        postId: postId || '',
        reason,
        details: details.trim(),
        description: details.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await setDoc(docRef, newReport);

      if (postId) {
        this.localReportedSet.add(`${reporterId}_${postId}`);
      }

      return newReport;
    } catch (error) {
      console.error('Error creating report in Firestore:', error);
      throw error;
    }
  },

  // Update report status
  async updateReportStatus(
    id: string,
    status: ReportStatus,
    adminNotes?: string,
    actionOnUser?: 'warn' | 'suspend' | 'restore'
  ): Promise<Report> {
    try {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      const updatePayload: Record<string, any> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (adminNotes !== undefined) {
        updatePayload.adminNotes = adminNotes;
      }
      await updateDoc(docRef, updatePayload);

      const snap = await getDoc(docRef);
      const updatedData = {
        id: snap.id,
        ...(snap.data() as Omit<Report, 'id'>),
      };

      if (actionOnUser && updatedData.reportedUserId) {
        const reportedUserId = updatedData.reportedUserId;
        if (actionOnUser === 'warn') {
          await userService.setUserStatus(reportedUserId, 'warned');
        } else if (actionOnUser === 'suspend') {
          await userService.setUserStatus(reportedUserId, 'suspended');
        } else if (actionOnUser === 'restore') {
          await userService.setUserStatus(reportedUserId, 'active');
        }
      }

      return updatedData;
    } catch (error) {
      console.error(`Error updating report ${id} in Firestore:`, error);
      throw error;
    }
  },
};
