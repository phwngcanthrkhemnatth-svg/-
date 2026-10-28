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
import { db } from './firebase';
import { Post, PostLike, Comment } from '../types';
import {
  INITIAL_POSTS,
  INITIAL_POST_LIKES,
  INITIAL_COMMENTS,
} from '../mock/initialData';
import { notificationService } from './notificationService';

const POSTS_COLLECTION = 'posts';
const POST_LIKES_COLLECTION = 'postLikes';
const COMMENTS_COLLECTION = 'comments';

// Local caches for instant client responsiveness
let localPosts: Post[] = [...INITIAL_POSTS];
let localLikes: PostLike[] = [...INITIAL_POST_LIKES];
let localComments: Comment[] = [...INITIAL_COMMENTS];
const deletedPostIds = new Set<string>();

// Read deleted post ids from localStorage if available
try {
  const savedDeleted = localStorage.getItem('swp_deleted_post_ids');
  if (savedDeleted) {
    const ids = JSON.parse(savedDeleted);
    if (Array.isArray(ids)) {
      ids.forEach((id: string) => deletedPostIds.add(id));
    }
  }
} catch (e) {
  // ignore
}

export const postService = {
  // Fetch all posts with optional category filter and keyword search directly from Firestore
  async getPosts(categoryFilter?: string, searchQuery?: string): Promise<Post[]> {
    try {
      const postsCol = collection(db, POSTS_COLLECTION);
      const snapshot = await getDocs(postsCol);
      const postsMap = new Map<string, Post>();

      // Seed local posts (excluding deleted)
      localPosts.forEach((p) => {
        if (!deletedPostIds.has(p.id)) {
          postsMap.set(p.id, p);
        }
      });

      // Overlay Firestore data
      snapshot.forEach((docSnap) => {
        if (deletedPostIds.has(docSnap.id)) {
          return;
        }
        const data = docSnap.data();
        postsMap.set(docSnap.id, {
          id: docSnap.id,
          postId: data.postId || docSnap.id,
          authorId: data.authorId,
          authorUserId: data.authorUserId || '',
          authorName: data.authorName || 'สมาชิก SkillsWop',
          authorPhoto: data.authorPhoto || data.authorImage || '',
          authorImage: data.authorPhoto || data.authorImage || '',
          title: data.title || '',
          category: data.category || 'ทั่วไป',
          content: data.content || '',
          imageUrl: data.imageUrl,
          skillTags: data.skillTags || [],
          likeCount: typeof data.likeCount === 'number' ? data.likeCount : 0,
          commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      let posts = Array.from(postsMap.values()).filter((p) => !deletedPostIds.has(p.id));

      // Synchronize in-memory cache
      localPosts = [...posts];

      // Filter by category if specified
      if (categoryFilter && categoryFilter !== 'ทั้งหมด') {
        posts = posts.filter((p) => p.category === categoryFilter);
      }

      // Filter by search query if specified
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        posts = posts.filter(
          (p) =>
            p.content.toLowerCase().includes(q) ||
            p.authorName.toLowerCase().includes(q) ||
            p.skillTags?.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      // Sort strictly by createdAt descending (newest first)
      posts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return posts;
    } catch (error) {
      console.warn('Error fetching posts from Firestore, using local data:', error);
      let posts = localPosts.filter((p) => !deletedPostIds.has(p.id));
      if (categoryFilter && categoryFilter !== 'ทั้งหมด') {
        posts = posts.filter((p) => p.category === categoryFilter);
      }
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        posts = posts.filter(
          (p) =>
            p.content.toLowerCase().includes(q) ||
            p.authorName.toLowerCase().includes(q) ||
            p.skillTags?.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      posts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return posts;
    }
  },

  // Create a new post
  async createPost(
    postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likeCount' | 'commentCount'>
  ): Promise<Post> {
    const postId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newPost: Post = {
      id: postId,
      postId: postId,
      ...postData,
      authorPhoto: postData.authorPhoto || postData.authorImage || '',
      authorImage: postData.authorPhoto || postData.authorImage || '',
      likeCount: 0,
      commentCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, POSTS_COLLECTION, postId), newPost);
    } catch (e) {
      console.warn('Could not save post to Firestore, saving locally:', e);
    }

    localPosts.unshift(newPost);
    return newPost;
  },

  // Update an existing post
  async updatePost(postId: string, data: Partial<Post>): Promise<Post> {
    const now = new Date().toISOString();
    const updatePayload = {
      ...data,
      updatedAt: now,
    };

    try {
      await updateDoc(doc(db, POSTS_COLLECTION, postId), updatePayload);
    } catch (e) {
      console.warn('Could not update post in Firestore:', e);
    }

    const index = localPosts.findIndex((p) => p.id === postId);
    if (index !== -1) {
      localPosts[index] = { ...localPosts[index], ...updatePayload };
      return localPosts[index];
    }

    throw new Error('ไม่พบโพสต์ที่ต้องการแก้ไข');
  },

  // Delete a post
  async deletePost(postId: string): Promise<void> {
    deletedPostIds.add(postId);
    try {
      localStorage.setItem('swp_deleted_post_ids', JSON.stringify(Array.from(deletedPostIds)));
    } catch (e) {
      // ignore
    }

    try {
      await deleteDoc(doc(db, POSTS_COLLECTION, postId));
    } catch (e) {
      console.warn('Could not delete post from Firestore:', e);
    }

    localPosts = localPosts.filter((p) => p.id !== postId);
    localLikes = localLikes.filter((l) => l.postId !== postId);
    localComments = localComments.filter((c) => c.postId !== postId);
  },

  // Check if current user liked a post
  async isPostLikedByUser(postId: string, userId: string): Promise<boolean> {
    if (!postId || !userId) return false;
    try {
      const q = query(
        collection(db, POST_LIKES_COLLECTION),
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) return true;
    } catch (e) {
      // Check local cache
    }
    return localLikes.some((l) => l.postId === postId && l.userId === userId);
  },

  // Toggle like on a post
  async toggleLikePost(
    postId: string,
    userId: string,
    authorId?: string
  ): Promise<{ liked: boolean; count: number }> {
    const alreadyLiked = await this.isPostLikedByUser(postId, userId);
    const postRef = doc(db, POSTS_COLLECTION, postId);

    if (alreadyLiked) {
      // Remove like
      try {
        const q = query(
          collection(db, POST_LIKES_COLLECTION),
          where('postId', '==', postId),
          where('userId', '==', userId)
        );
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(doc(db, POST_LIKES_COLLECTION, d.id));
        });
      } catch (e) {
        console.warn('Could not delete like in Firestore:', e);
      }

      localLikes = localLikes.filter((l) => !(l.postId === postId && l.userId === userId));

      const postIndex = localPosts.findIndex((p) => p.id === postId);
      let count = 0;
      if (postIndex !== -1) {
        localPosts[postIndex].likeCount = Math.max(0, (localPosts[postIndex].likeCount || 1) - 1);
        count = localPosts[postIndex].likeCount;
        try {
          await updateDoc(postRef, { likeCount: count });
        } catch (e) {}
      }

      return { liked: false, count };
    } else {
      // Add like
      const likeId = `like-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newLike: PostLike = {
        id: likeId,
        postId,
        userId,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, POST_LIKES_COLLECTION, likeId), newLike);
      } catch (e) {
        console.warn('Could not save like in Firestore:', e);
      }

      localLikes.push(newLike);

      const postIndex = localPosts.findIndex((p) => p.id === postId);
      let count = 1;
      if (postIndex !== -1) {
        localPosts[postIndex].likeCount = (localPosts[postIndex].likeCount || 0) + 1;
        count = localPosts[postIndex].likeCount;
        try {
          await updateDoc(postRef, { likeCount: count });
        } catch (e) {}
      }

      // Notify post author if not self
      if (authorId && authorId !== userId) {
        await notificationService.createNotification(
          authorId,
          'post_like',
          'มีคนถูกใจโพสต์ของคุณ',
          'มีผู้ใช้งานถูกใจโพสต์ที่คุณแบ่งปันในชุมชน',
          'community'
        );
      }

      return { liked: true, count };
    }
  },

  // Alias for toggleLikePost
  async toggleLike(
    postId: string,
    userId: string,
    authorId?: string
  ): Promise<boolean> {
    const res = await this.toggleLikePost(postId, userId, authorId);
    return res.liked;
  },

  // Get comments for a post
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId)
      );
      const snap = await getDocs(q);
      const cmtMap = new Map<string, Comment>();

      localComments
        .filter((c) => c.postId === postId)
        .forEach((c) => cmtMap.set(c.id, c));

      snap.forEach((d) => {
        const data = d.data();
        cmtMap.set(d.id, {
          id: d.id,
          postId: data.postId,
          authorId: data.authorId,
          authorName: data.authorName,
          authorImage: data.authorImage,
          content: data.content,
          createdAt: data.createdAt,
        });
      });

      const list = Array.from(cmtMap.values());
      list.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return list;
    } catch (e) {
      console.warn('Error fetching comments from Firestore:', e);
      const list = localComments.filter((c) => c.postId === postId);
      list.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return list;
    }
  },

  // Add comment to a post
  async addComment(
    postId: string,
    authorId: string,
    authorName: string,
    authorImage: string,
    content: string,
    postAuthorId?: string
  ): Promise<Comment> {
    const commentId = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newComment: Comment = {
      id: commentId,
      postId,
      authorId,
      authorName,
      authorImage,
      content: content.trim(),
      createdAt: now,
    };

    try {
      await setDoc(doc(db, COMMENTS_COLLECTION, commentId), newComment);
    } catch (e) {
      console.warn('Could not save comment to Firestore:', e);
    }

    localComments.push(newComment);

    // Increment commentCount on post
    const postIndex = localPosts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      localPosts[postIndex].commentCount = (localPosts[postIndex].commentCount || 0) + 1;
      try {
        await updateDoc(doc(db, POSTS_COLLECTION, postId), {
          commentCount: localPosts[postIndex].commentCount,
        });
      } catch (e) {}
    }

    // Send notification to post author if not self
    if (postAuthorId && postAuthorId !== authorId) {
      await notificationService.createNotification(
        postAuthorId,
        'post_comment',
        'มีความคิดเห็นใหม่ในโพสต์ของคุณ',
        `${authorName}: ${content.trim().substring(0, 40)}${content.length > 40 ? '...' : ''}`,
        'community'
      );
    }

    return newComment;
  },

  // Delete a comment
  async deleteComment(commentId: string, postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
    } catch (e) {
      console.warn('Could not delete comment in Firestore:', e);
    }

    localComments = localComments.filter((c) => c.id !== commentId);

    const postIndex = localPosts.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      localPosts[postIndex].commentCount = Math.max(0, (localPosts[postIndex].commentCount || 1) - 1);
      try {
        await updateDoc(doc(db, POSTS_COLLECTION, postId), {
          commentCount: localPosts[postIndex].commentCount,
        });
      } catch (e) {}
    }
  },
};
