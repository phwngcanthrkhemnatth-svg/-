export type SkillLevel =
  | 'ไม่ระบุ'
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
  | 'มัธยมต้น'
  | 'มัธยมปลาย'
  | 'ปวช.'
  | 'ปวส.'
  | 'ปริญญาตรี'
  | 'บุคคลทั่วไป'
  | string;

export type LearningMode = 'Online' | 'On-site' | 'Both';
export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type ScheduleStatus = 'Upcoming' | 'Completed' | 'Cancelled';
export type ScheduleType = 'Online' | 'On-site';
export type ReportReason = 'เนื้อหาไม่เหมาะสม' | 'การหลอกลวง' | 'การคุกคาม' | 'Spam' | 'อื่น ๆ';
export type ReportStatus = 'Pending' | 'Reviewed' | 'Actioned' | 'Dismissed';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  uid?: string;
  userId?: string; // e.g. "SWP102548"
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  profileImage: string;
  photoURL?: string;
  bio: string;
  province?: string;
  location?: string;
  phone?: string;
  learningMode: LearningMode;
  rating: number;
  reviewCount: number;
  completedExchanges: number;
  isNewUser?: boolean;
  profileCompleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  isOnline?: boolean;
  status: 'active' | 'warned' | 'suspended';
  isDemo?: boolean;
  isBot?: boolean;
}

export interface SkillCategory {
  id: string;
  name: string;
  iconName: string;
  color: string;
  description: string;
  skills?: string[];
}

export interface Skill {
  id: string;
  skillId?: string;
  name: string;
  categoryId?: string;
  category?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  popular?: boolean;
}

export type SkillType = 'canTeach' | 'wantToLearn' | 'teach' | 'learn';

export interface UserSkill {
  id: string;
  userSkillId?: string;
  userId: string;
  skillId: string;
  skillName: string;
  category?: string;
  categoryName?: string;
  type: SkillType;
  level?: SkillLevel;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const isTeachSkill = (type?: string): boolean =>
  type === 'canTeach' || type === 'teach';

export const isLearnSkill = (type?: string): boolean =>
  type === 'wantToLearn' || type === 'learn';

// Social & Friends
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'Pending' | 'Accepted' | 'Rejected';

export interface FriendRequest {
  id: string;
  requestId?: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Friend {
  id: string;
  friendshipId?: string;
  user1Id: string;
  user2Id: string;
  userIds?: string[];
  createdAt: string;
  friend?: User;
}

export type Friendship = Friend;

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'self';

// Community & Posts
export type PostCategoryType =
  | 'แชร์ความรู้'
  | 'แนะนำวิชา'
  | 'เทคนิคการเรียน'
  | 'ผลงาน'
  | 'แหล่งเรียนรู้'
  | 'ขอคำแนะนำ'
  | 'ทั่วไป'
  | string;

export interface Post {
  id: string;
  postId?: string;
  authorId: string;
  authorUserId?: string;
  authorName: string;
  authorPhoto?: string;
  authorImage?: string;
  author?: User;
  title?: string;
  content: string;
  imageUrl?: string;
  skillTags?: string[];
  category?: string;
  postCategory?: PostCategoryType;
  likeCount: number;
  commentCount: number;
  likedByCurrentUser?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  commentId?: string;
  postId: string;
  userId?: string;
  authorId?: string;
  user?: User;
  authorName?: string;
  authorAvatar?: string;
  authorImage?: string;
  authorUserId?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExchangeRequest {
  id: string;
  requestId?: string;
  senderId: string;
  requesterId?: string;
  receiverId: string;
  offeredSkill: string;
  requestedSkill: string;
  offeredSkillId?: string;
  requestedSkillId?: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Chat {
  id: string;
  chatId?: string;
  participants: [string, string] | string[];
  participantIds?: string[];
  requestId?: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageTime?: string;
}

export interface Message {
  id: string;
  messageId?: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Schedule {
  id: string;
  userId: string; // creator
  partnerId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ScheduleType;
  location?: string;
  meetingLink?: string;
  status: ScheduleStatus;
  offeredSkill?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  skillName?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'request_received'
    | 'request_accepted'
    | 'request_rejected'
    | 'new_message'
    | 'schedule_reminder'
    | 'new_review'
    | 'friend_request'
    | 'friend_accepted'
    | 'post_like'
    | 'post_comment'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  linkAction?: string;
  metadata?: Record<string, any>;
}

export type PostReportReason =
  | 'เนื้อหาไม่เหมาะสม'
  | 'สแปม'
  | 'หลอกลวง'
  | 'ละเมิดลิขสิทธิ์'
  | 'คุกคามหรือกลั่นแกล้ง'
  | 'อื่น ๆ'
  | 'เนื้อหาอื่น ๆ';

export interface Report {
  id: string;
  reportId?: string;
  reporterId: string;
  reportedUserId?: string;
  postId?: string;
  reason: ReportReason | PostReportReason | string;
  details?: string;
  description?: string;
  status: ReportStatus | 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

export interface MatchResult {
  partner: User;
  matchScore: number;
  matchPercentage: number;
  isMutualMatch: boolean; // Both can teach what the other wants!
  mutualSkills: {
    theyCanTeachUs: string[];
    weCanTeachThem: string[];
  };
  otherTeachSkills: string[];
  otherLearnSkills: string[];
}

export type ViewType =
  | 'home'
  | 'login'
  | 'register'
  | 'profile-setup'
  | 'dashboard'
  | 'my-skills'
  | 'find-skills'
  | 'community'
  | 'friends'
  | 'matching'
  | 'requests'
  | 'chat'
  | 'schedule'
  | 'reviews'
  | 'notifications'
  | 'settings'
  | 'admin';
