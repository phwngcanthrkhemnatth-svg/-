import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { Review } from '../types';
import { userService } from './userService';
import { notificationService } from './notificationService';

const REVIEWS_COLLECTION = 'reviews';

export const reviewService = {
  // Get all reviews for a reviewed user from Firestore
  async getReviewsForUser(userId: string): Promise<Review[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, REVIEWS_COLLECTION),
        where('reviewedUserId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const reviews: Review[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        reviews.push({
          id: d.id,
          reviewerId: data.reviewerId,
          reviewedUserId: data.reviewedUserId,
          rating: typeof data.rating === 'number' ? data.rating : 5,
          comment: data.comment || '',
          skillName: data.skillName || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      reviews.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return reviews;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  // Get all reviews
  async getAll(): Promise<Review[]> {
    try {
      const snapshot = await getDocs(collection(db, REVIEWS_COLLECTION));
      const reviews: Review[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        reviews.push({
          id: d.id,
          reviewerId: data.reviewerId,
          reviewedUserId: data.reviewedUserId,
          rating: data.rating,
          comment: data.comment,
          skillName: data.skillName,
          createdAt: data.createdAt,
        });
      });
      return reviews;
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      return [];
    }
  },

  // Add review to Firestore and update user rating
  async addReview(data: {
    reviewerId: string;
    reviewedUserId: string;
    rating: number;
    comment: string;
    skillName?: string;
  }): Promise<Review> {
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const reviewData = {
      id: reviewId,
      ...data,
      createdAt: now,
    };

    const docRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await setDoc(docRef, reviewData);

    // Recalculate reviewed user rating
    try {
      const targetReviews = await this.getReviewsForUser(data.reviewedUserId);
      const sum = targetReviews.reduce((acc, r) => acc + r.rating, 0);
      const count = targetReviews.length || 1;
      const avg = Number((sum / count).toFixed(1));

      const user = await userService.getUserById(data.reviewedUserId);
      if (user) {
        await userService.updateUser(data.reviewedUserId, {
          rating: avg,
          reviewCount: targetReviews.length,
          completedExchanges: (user.completedExchanges || 0) + 1,
        });
      }

      const reviewer = await userService.getUserById(data.reviewerId);
      await notificationService.createNotification(
        data.reviewedUserId,
        'new_review',
        'คุณได้รับรีวิวและความคิดเห็นใหม่ ⭐',
        `${reviewer?.name || 'คู่แลกเปลี่ยน'} ได้ให้คะแนน ${data.rating} ดาว: "${data.comment}"`,
        'reviews'
      );
    } catch (e) {
      console.warn('Could not update user rating:', e);
    }

    return reviewData;
  },
};
