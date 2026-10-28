import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserSkill, Review, Post } from '../../types';
import { skillService } from '../../services/skillService';
import { reviewService } from '../../services/reviewService';
import { friendService } from '../../services/friendService';
import { chatService } from '../../services/chatService';
import { postService } from '../../services/postService';
import { UserAvatar } from '../common/UserAvatar';
import { RatingStars } from '../common/RatingStars';
import { SkillLevelBadge, LearningModeBadge } from '../common/Badge';
import {
  X,
  MapPin,
  Send,
  ShieldAlert,
  Sparkles,
  BookOpen,
  MessageSquare,
  Award,
  UserPlus,
  UserCheck,
  Clock,
  Copy,
  Check,
  UserMinus,
  FileText,
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const {
    selectedUserForProfileModal,
    setSelectedUserForProfileModal,
    setSelectedUserForRequestModal,
    setSelectedUserForReportModal,
    setActiveChatId,
    setCurrentView,
    currentUser,
    showToast,
  } = useApp();

  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<
    'none' | 'friends' | 'pending_sent' | 'pending_received'
  >('none');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const user = selectedUserForProfileModal;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      skillService.getUserSkills(user.id),
      reviewService.getReviewsForUser(user.id),
      currentUser ? friendService.getFriendshipStatus(currentUser.id, user.id) : 'none',
      postService.getPosts().then((all) => all.filter((p) => p.authorId === user.id)),
    ]).then(([sList, rList, status, posts]) => {
      setSkills(sList);
      setReviews(rList);
      setFriendshipStatus(status as any);
      setUserPosts(posts);
      setLoading(false);
    });
  }, [user, currentUser]);

  if (!user) return null;

  const teachSkills = skills.filter((s) => s.type === 'teach');
  const learnSkills = skills.filter((s) => s.type === 'learn');
  const isMe = currentUser?.id === user.id;

  const handleCopyId = () => {
    if (user.userId) {
      navigator.clipboard?.writeText(user.userId);
      setCopiedId(true);
      showToast(`คัดลอกรหัสผู้ใช้ ${user.userId} แล้ว`);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มเพื่อน');
      return;
    }
    const res = await friendService.sendFriendRequest(currentUser.id, user.id);
    showToast(res.message);
    if (res.autoAccepted) {
      setFriendshipStatus('friends');
    } else if (res.success) {
      setFriendshipStatus('pending_sent');
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUser) return;
    if (!window.confirm(`คุณต้องการลบ ${user.name} ออกจากเพื่อนใช่หรือไม่?`)) return;
    await friendService.removeFriend(currentUser.id, user.id);
    setFriendshipStatus('none');
    showToast(`ลบ ${user.name} ออกจากเพื่อนแล้ว`);
  };

  const handleStartDirectChat = async () => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนเริ่มสนทนา');
      return;
    }
    try {
      const chat = await chatService.getOrCreateChat(currentUser.id, user.id);
      setActiveChatId(chat.id);
      setSelectedUserForProfileModal(null);
      setCurrentView('chat');
    } catch (e) {
      console.error('Error opening chat:', e);
      setCurrentView('chat');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header Cover */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 relative shrink-0">
          <button
            type="button"
            onClick={() => setSelectedUserForProfileModal(null)}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors backdrop-blur-xs"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar and Primary Info */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16">
            <div className="flex items-end gap-4">
              <UserAvatar
                src={user.profileImage}
                name={user.name}
                size="xl"
                isOnline={user.isOnline}
                className="ring-4 ring-white dark:ring-slate-900 rounded-full"
              />
              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {user.name}
                  </h3>
                  {user.status === 'warned' && (
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      ถูกตักเตือน
                    </span>
                  )}
                  {user.isBot && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      🤖 AI Demo Bot
                    </span>
                  )}
                </div>

                {/* SWP User ID Badge with Copy Button */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                    ID: {user.userId || 'SWP100001'}
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-0.5 hover:text-indigo-900 dark:hover:text-indigo-200"
                      title="คัดลอก User ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.province || user.location || 'กรุงเทพมหานคร'}
                  </span>
                  <span>•</span>
                  <LearningModeBadge mode={user.learningMode} />
                </div>
              </div>
            </div>

            {/* Rating summary */}
            <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <RatingStars rating={user.rating} reviewCount={user.reviewCount} size="md" />
              <div className="text-right border-l pl-3 border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {user.completedExchanges} ครั้ง
                </div>
                <div className="text-[10px] text-slate-400">แลกเปลี่ยนสำเร็จ</div>
              </div>
            </div>
          </div>

          {/* Social Action Buttons Bar in Modal */}
          {!isMe && currentUser && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-indigo-50/50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100/60 dark:border-slate-800">
              {/* Friend Status Button */}
              {friendshipStatus === 'friends' ? (
                <div className="flex items-center gap-1">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    เป็นเพื่อนกันแล้ว
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveFriend}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    title="ลบเพื่อน"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ) : friendshipStatus === 'pending_sent' ? (
                <span className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  รอการตอบรับคำขอ
                </span>
              ) : (
                <button
                  type="button"
                  id="modal-btn-add-friend"
                  onClick={handleSendFriendRequest}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>เพิ่มเพื่อน</span>
                </button>
              )}

              {/* Message button */}
              <button
                type="button"
                id="modal-btn-message"
                onClick={handleStartDirectChat}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>ส่งข้อความ</span>
              </button>

              {/* Exchange button */}
              <button
                type="button"
                id="modal-btn-send-request-top"
                onClick={() => {
                  setSelectedUserForRequestModal(user);
                  setSelectedUserForProfileModal(null);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งคำขอแลกวิชา</span>
              </button>
            </div>
          )}

          {/* Bio */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              เกี่ยวกับผู้ใช้งาน (Bio)
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              {user.bio || 'ยังไม่ได้ระบุข้อมูลเกี่ยวกับตนเอง'}
            </p>
          </div>

          {/* Skills Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teach Skills */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                ทักษะที่สามารถสอน ({teachSkills.length})
              </div>
              <div className="space-y-2">
                {teachSkills.length > 0 ? (
                  teachSkills.map((sk) => (
                    <div
                      key={sk.id}
                      className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-indigo-100/60 dark:border-slate-700 flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          {sk.skillName}
                        </span>
                        {sk.categoryName && (
                          <span className="text-[10px] text-slate-400">{sk.categoryName}</span>
                        )}
                      </div>
                      <SkillLevelBadge level={sk.level} />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่มีข้อมูลทักษะที่สอน</p>
                )}
              </div>
            </div>

            {/* Learn Skills */}
            <div className="bg-purple-50/60 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-200">
                <BookOpen className="w-4 h-4 text-purple-600" />
                ทักษะที่ต้องการเรียนรู้ ({learnSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {learnSkills.length > 0 ? (
                  learnSkills.map((sk) => (
                    <span
                      key={sk.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-700 dark:text-purple-300 shadow-xs"
                    >
                      {sk.skillName}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">ยังไม่มีข้อมูลทักษะที่ต้องการเรียน</p>
                )}
              </div>
            </div>
          </div>

          {/* User's Recent Community Posts */}
          {userPosts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                โพสต์ที่แชร์ในชุมชน ({userPosts.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {post.category}
                      </span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              รีวิวและความคิดเห็น ({reviews.length})
            </h4>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <RatingStars rating={rev.rating} size="sm" showCount={false} />
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic">"{rev.comment}"</p>
                    {rev.skillName && (
                      <span className="inline-block text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                        ทักษะ: {rev.skillName}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-2">ยังไม่มีรีวิวสำหรับผู้ใช้งานนี้</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {!isMe && (
            <button
              type="button"
              onClick={() => {
                setSelectedUserForReportModal(user);
                setSelectedUserForProfileModal(null);
              }}
              className="text-xs font-medium text-rose-500 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              รายงานผู้ใช้งาน
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setSelectedUserForProfileModal(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              ปิดหน้าต่าง
            </button>

            {!isMe && currentUser && (
              <button
                type="button"
                id="modal-btn-send-request"
                onClick={() => {
                  setSelectedUserForRequestModal(user);
                  setSelectedUserForProfileModal(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                ส่งคำขอแลกเปลี่ยนทักษะ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

