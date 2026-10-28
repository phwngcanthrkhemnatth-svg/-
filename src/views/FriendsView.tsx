import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { User, Friend, FriendRequest, UserSkill, SkillCategory } from '../types';
import { friendService } from '../services/friendService';
import { skillService } from '../services/skillService';
import { chatService } from '../services/chatService';
import { UserAvatar } from '../components/common/UserAvatar';
import { RatingStars } from '../components/common/RatingStars';
import { SkillLevelBadge, LearningModeBadge } from '../components/common/Badge';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  MessageSquare,
  ArrowLeftRight,
  MapPin,
  Sparkles,
  BookOpen,
  Check,
  X,
  UserMinus,
  Filter,
  Bot,
  ExternalLink,
} from 'lucide-react';

export const FriendsView: React.FC = () => {
  const {
    currentUser,
    setCurrentView,
    setSelectedUserForProfileModal,
    setSelectedUserForRequestModal,
    setActiveChatId,
    allUsers,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my-friends' | 'pending' | 'sent' | 'discover'>('my-friends');
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [userSkillsMap, setUserSkillsMap] = useState<Record<string, UserSkill[]>>({});
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Member Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState('all');

  // Friendship status map for discover tab (targetUserId -> status)
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, string>>({});

  const loadSocialData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [friends, pending, sent, allSkills, cats] = await Promise.all([
        friendService.getFriends(currentUser.id),
        friendService.getPendingRequests(currentUser.id),
        friendService.getSentRequests(currentUser.id),
        skillService.getAllUserSkills(),
        skillService.getCategories(),
      ]);

      setFriendsList(friends);
      setPendingRequests(pending);
      setSentRequests(sent);
      setCategories(cats);

      // Group skills by user
      const skillsGroup: Record<string, UserSkill[]> = {};
      allSkills.forEach((s) => {
        if (!skillsGroup[s.userId]) skillsGroup[s.userId] = [];
        skillsGroup[s.userId].push(s);
      });
      setUserSkillsMap(skillsGroup);

      // Build status map for all other users
      const statuses: Record<string, string> = {};
      for (const u of allUsers) {
        if (u.id !== currentUser.id) {
          statuses[u.id] = await friendService.getFriendshipStatus(currentUser.id, u.id);
        }
      }
      setFriendshipStatuses(statuses);
    } catch (err) {
      console.error('Error loading friends data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, allUsers]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  // Handle Send Friend Request
  const handleSendFriendRequest = async (targetUser: User) => {
    if (!currentUser) return;
    try {
      const res = await friendService.sendFriendRequest(currentUser.id, targetUser.id);
      showToast(res.message);
      loadSocialData();
    } catch (err) {
      console.error('Error sending friend request:', err);
      showToast('เกิดข้อผิดพลาดในการส่งคำขอ');
    }
  };

  // Handle Accept / Reject Friend Request
  const handleRespondRequest = async (req: FriendRequest, action: 'Accepted' | 'Rejected') => {
    if (!currentUser) return;
    try {
      await friendService.respondFriendRequest(req.id, action, req.senderId, currentUser.id);
      showToast(
        action === 'Accepted'
          ? 'ตอบรับคำขอและเป็นเพื่อนกันเรียบร้อยแล้ว!'
          : 'ปฏิเสธคำขอเป็นเพื่อนเรียบร้อย'
      );
      loadSocialData();
    } catch (err) {
      console.error('Error responding request:', err);
      showToast('เกิดข้อผิดพลาดในการตอบรับคำขอ');
    }
  };

  // Handle Unfriend
  const handleRemoveFriend = async (targetUser: User) => {
    if (!currentUser) return;
    if (!window.confirm(`คุณต้องการลบ ${targetUser.name} ออกจากรายชื่อเพื่อนใช่หรือไม่?`)) {
      return;
    }
    try {
      await friendService.removeFriend(currentUser.id, targetUser.id);
      showToast(`ลบ ${targetUser.name} ออกจากเพื่อนแล้ว`);
      loadSocialData();
    } catch (err) {
      console.error('Error removing friend:', err);
      showToast('เกิดข้อผิดพลาดในการลบเพื่อน');
    }
  };

  // Direct Message Button -> opens chat directly
  const handleStartChat = async (targetUser: User) => {
    if (!currentUser) return;
    try {
      const chat = await chatService.getOrCreateChat(currentUser.id, targetUser.id);
      setActiveChatId(chat.id);
      setCurrentView('chat');
    } catch (err) {
      console.error('Error starting chat:', err);
      setCurrentView('chat');
    }
  };

  // Get Friend user objects for current user
  const confirmedFriendUsers: User[] = friendsList
    .map((f) => {
      const friendId = f.user1Id === currentUser?.id ? f.user2Id : f.user1Id;
      return allUsers.find((u) => u.id === friendId || u.uid === friendId);
    })
    .filter((u): u is User => !!u);

  // Filter Discover Members
  const filteredUsers = allUsers.filter((u) => {
    if (u.id === currentUser?.id) return false;

    // Search query (matches User ID like SWP..., name, bio, or skill name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = u.userId?.toLowerCase().includes(q);
      const matchName = u.name.toLowerCase().includes(q);
      const matchBio = u.bio?.toLowerCase().includes(q);
      const userSkills = userSkillsMap[u.id] || [];
      const matchSkills = userSkills.some((s) => s.skillName.toLowerCase().includes(q));

      if (!matchId && !matchName && !matchBio && !matchSkills) {
        return false;
      }
    }

    // Filter by learning mode
    if (selectedMode !== 'all' && u.learningMode !== selectedMode && u.learningMode !== 'Both') {
      return false;
    }

    // Filter by province
    if (selectedProvince !== 'all' && (u.province || u.location) !== selectedProvince) {
      return false;
    }

    // Filter by skill category
    if (selectedCategory !== 'ทั้งหมด') {
      const userSkills = userSkillsMap[u.id] || [];
      const matchCat = userSkills.some(
        (s) => s.categoryName === selectedCategory
      );
      if (!matchCat) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Social Learning Network
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            เพื่อนและชุมชนสมาชิก SkillsWop
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            ค้นหาเพื่อนที่มีความสนใจร่วมกัน เชื่อมต่อเป็นเพื่อน และร่วมแลกเปลี่ยนทักษะความรู้ไปด้วยกัน
          </p>
        </div>

        {/* User's Own Public ID Badge */}
        {currentUser && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              ID
            </div>
            <div>
              <div className="text-[11px] text-indigo-200">รหัสสมาชิกของคุณ</div>
              <div className="font-mono text-base font-black tracking-wider text-white">
                {currentUser.userId || 'SWP100001'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          id="tab-my-friends"
          onClick={() => setActiveTab('my-friends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'my-friends'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>เพื่อนของฉัน</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
            {confirmedFriendUsers.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-pending-requests"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 relative ${
            activeTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>คำขอที่รอตอบรับ</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-sent-requests"
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'sent'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <span>คำขอที่ส่งไป</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
            {sentRequests.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-discover-members"
          onClick={() => setActiveTab('discover')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'discover'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>ค้นหาเพื่อนและสมาชิกใหม่</span>
        </button>
      </div>

      {/* TAB 1: MY FRIENDS */}
      {activeTab === 'my-friends' && (
        <div className="space-y-4">
          {confirmedFriendUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  ยังไม่มีเพื่อนในรายชื่อ
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  เริ่มสร้างเครือข่ายการเรียนรู้ด้วยการค้นหาสมาชิก หรือแอด Demo Bot เพื่อทดลองแลกเปลี่ยนทักษะได้เลย!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                ค้นหาเพื่อนใหม่
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedFriendUsers.map((friend) => {
                const skills = userSkillsMap[friend.id] || [];
                const teachSkills = skills.filter((s) => s.type === 'teach');

                return (
                  <div
                    key={friend.id}
                    id={`friend-card-${friend.id}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Top info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedUserForProfileModal(friend)}
                          >
                            <UserAvatar
                              src={friend.profileImage}
                              name={friend.name}
                              size="lg"
                              isOnline={friend.isOnline}
                            />
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedUserForProfileModal(friend)}
                              className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 text-left line-clamp-1"
                            >
                              {friend.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                                {friend.userId || 'SWP000000'}
                              </span>
                              {friend.isBot && (
                                <span className="text-[10px] text-purple-600 font-medium">
                                  🤖 Bot
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{friend.province || 'กรุงเทพมหานคร'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {friend.bio && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2.5">
                          {friend.bio}
                        </p>
                      )}

                      {/* Teach Skills Preview */}
                      {teachSkills.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            พร้อมสอน ({teachSkills.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {teachSkills.slice(0, 3).map((sk) => (
                              <span
                                key={sk.id}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium"
                              >
                                {sk.skillName}
                              </span>
                            ))}
                            {teachSkills.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{teachSkills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartChat(friend)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>ส่งข้อความ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedUserForRequestModal(friend)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="ขอแลกเปลี่ยนทักษะ"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ขอแลกวิชา</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(friend)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="ลบเพื่อน"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING INCOMING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-2">
              <Check className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                ไม่มีคำขอเป็นเพื่อนที่รอการตอบรับ
              </h3>
              <p className="text-xs text-slate-500">
                เมื่อมีสมาชิกส่งคำขอเป็นเพื่อนถึงคุณ จะแสดงในหน้านี้ทันที
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => {
                const sender = allUsers.find(
                  (u) => u.id === req.senderId || u.uid === req.senderId
                );
                if (!sender) return null;

                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUserForProfileModal(sender)}
                      >
                        <UserAvatar
                          src={sender.profileImage}
                          name={sender.name}
                          size="lg"
                        />
                      </button>
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedUserForProfileModal(sender)}
                          className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 text-left"
                        >
                          {sender.name}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                            {sender.userId || 'SWP000000'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          ส่งคำขอเมื่อ {new Date(req.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(req, 'Accepted')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>ตอบรับ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondRequest(req, 'Rejected')}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="ปฏิเสธ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SENT REQUESTS */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 text-xs">
              ยังไม่มีคำขอเป็นเพื่อนที่คุณส่งออกไป
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentRequests.map((req) => {
                const receiver = allUsers.find(
                  (u) => u.id === req.receiverId || u.uid === req.receiverId
                );
                if (!receiver) return null;

                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={receiver.profileImage}
                        name={receiver.name}
                        size="md"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {receiver.name}
                        </h4>
                        <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                          {receiver.userId || 'SWP000000'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60">
                      รอการตอบรับ
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DISCOVER & SEARCH ALL MEMBERS */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเพื่อนด้วย User ID (เช่น SWP100001), ชื่อ, หรือชื่อทักษะ..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ทั้งหมด">🌟 ทุกหมวดหมู่ทักษะ</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>

              {/* Mode Filter */}
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">📍 ทุกรูปแบบการเรียน</option>
                <option value="Online">🌐 ออนไลน์ (Online)</option>
                <option value="Onsite">🤝 เจอตัวจริง (Onsite)</option>
                <option value="Both">✨ ทั้งออนไลน์และเจอตัวจริง</option>
              </select>

              {/* Province filter */}
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">🗺️ ทุกจังหวัด</option>
                <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
                <option value="เชียงใหม่">เชียงใหม่</option>
                <option value="นนทบุรี">นนทบุรี</option>
                <option value="ชลบุรี">ชลบุรี</option>
                <option value="ขอนแก่น">ขอนแก่น</option>
                <option value="ภูเก็ต">ภูเก็ต</option>
              </select>
            </div>
          </div>

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
              </div>
            ) : (
              filteredUsers.map((user) => {
                const skills = userSkillsMap[user.id] || [];
                const teachSkills = skills.filter((s) => s.type === 'teach');
                const learnSkills = skills.filter((s) => s.type === 'learn');
                const status = friendshipStatuses[user.id] || 'none';

                return (
                  <div
                    key={user.id}
                    id={`user-card-${user.id}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow space-y-3"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedUserForProfileModal(user)}
                          >
                            <UserAvatar
                              src={user.profileImage}
                              name={user.name}
                              size="lg"
                              isOnline={user.isOnline}
                            />
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedUserForProfileModal(user)}
                              className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 text-left line-clamp-1"
                            >
                              {user.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                                {user.userId || 'SWP000000'}
                              </span>
                              {user.isBot && (
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.2 rounded">
                                  🤖 AI Bot
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{user.province || 'กรุงเทพมหานคร'}</span>
                              <span>•</span>
                              <LearningModeBadge mode={user.learningMode} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2.5">
                        {user.bio || 'สมาชิกชุมชน SkillsWop'}
                      </p>

                      {/* Skills summary */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        {teachSkills.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              พร้อมสอน:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {teachSkills.slice(0, 2).map((sk) => (
                                <span
                                  key={sk.id}
                                  className="px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/60 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium"
                                >
                                  {sk.skillName}
                                </span>
                              ))}
                              {teachSkills.length > 2 && (
                                <span className="text-[10px] text-slate-400 self-center">
                                  +{teachSkills.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {learnSkills.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              อยากเรียน:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {learnSkills.slice(0, 2).map((sk) => (
                                <span
                                  key={sk.id}
                                  className="px-2 py-0.5 rounded-md bg-purple-50/80 dark:bg-purple-950/60 text-[10px] text-purple-700 dark:text-purple-300 font-medium"
                                >
                                  {sk.skillName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      {/* Friend Status Dynamic Button */}
                      {status === 'friends' ? (
                        <div className="flex items-center gap-1">
                          <span className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>เป็นเพื่อนแล้ว</span>
                          </span>
                        </div>
                      ) : status === 'pending_sent' ? (
                        <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                          รอการตอบรับ
                        </span>
                      ) : status === 'pending_received' ? (
                        <span className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold">
                          มีคำขอรอตอบรับ
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendFriendRequest(user)}
                          className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>เพิ่มเพื่อน</span>
                        </button>
                      )}

                      {/* Direct Message button */}
                      <button
                        type="button"
                        onClick={() => handleStartChat(user)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                        title="ส่งข้อความ"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Exchange Request button */}
                      <button
                        type="button"
                        onClick={() => setSelectedUserForRequestModal(user)}
                        className="py-1.5 px-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ขอแลกวิชา</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
