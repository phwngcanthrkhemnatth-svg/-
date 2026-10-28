import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserSkill, Post, Comment } from '../types';
import { userService } from '../services/userService';
import { skillService } from '../services/skillService';
import { postService } from '../services/postService';
import { UserAvatar } from '../components/common/UserAvatar';
import { AppLogo } from '../components/common/AppLogo';
import { PostCard } from '../components/community/PostCard';
import { DeletePostConfirmModal } from '../components/modals/DeletePostConfirmModal';
import { INITIAL_CATEGORIES } from '../mock/initialData';
import {
  Sparkles,
  Search,
  BookOpen,
  ArrowRightLeft,
  Plus,
  Star,
  Users,
  Eye,
  CheckCircle2,
  Flame,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Clock,
  Send,
} from 'lucide-react';

const COMMUNITY_CATEGORIES = [
  'ทั้งหมด',
  'แชร์ความรู้',
  'แนะนำวิชา',
  'เทคนิคการเรียน',
  'ผลงาน',
  'ขอคำแนะนำ',
  'ทั่วไป',
];

export const HomeView: React.FC = () => {
  const {
    currentUser,
    setSelectedUserForProfileModal,
    setSelectedUserForRequestModal,
    setEditTargetPost,
    setReportTargetPost,
    setCurrentView,
    setIsCreatePostModalOpen,
    postFeedRefreshKey,
    triggerPostFeedRefresh,
    showToast,
  } = useApp();

  // Active view tab: 'feed' (โพสต์ล่าสุด) | 'members' (แนะนำโปรไฟล์ & คู่แลกเปลี่ยน)
  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed');

  // Posts Feed State
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [selectedPostCategory, setSelectedPostCategory] = useState<string>('ทั้งหมด');
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  // Likes & Comments local states
  const [likedPostsMap, setLikedPostsMap] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});

  // Users & Skills State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allSkills, setAllSkills] = useState<UserSkill[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Search & Category Filters for Members
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberCategory, setSelectedMemberCategory] = useState('All');
  const [matchFilter, setMatchFilter] = useState<'all' | 'mutual' | 'i-want-to-learn'>('all');

  // Function to load fresh posts from database
  const loadFeedPosts = useCallback(
    async (showRefreshingSpinner = true) => {
      if (showRefreshingSpinner) {
        setIsRefreshing(true);
      }
      setFeedError(null);

      try {
        const fetchedPosts = await postService.getPosts(
          selectedPostCategory === 'ทั้งหมด' ? undefined : selectedPostCategory,
          postSearchQuery
        );

        // Requirement 2: เรียงจากใหม่ไปเก่า (newest first)
        fetchedPosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPosts(fetchedPosts);
        setLastRefreshedAt(new Date());

        // Check liked status for current user
        if (currentUser) {
          const likedStatus: Record<string, boolean> = {};
          for (const p of fetchedPosts) {
            likedStatus[p.id] = await postService.isPostLikedByUser(p.id, currentUser.id);
          }
          setLikedPostsMap(likedStatus);
        }
      } catch (err: any) {
        console.error('Error fetching posts from Firestore database:', err);
        setFeedError(
          err?.message || 'ไม่สามารถโหลดข้อมูลโพสต์ล่าสุดจากฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
        );
        showToast('เกิดข้อผิดพลาดในการโหลดฟีดโพสต์');
      } finally {
        setFeedLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPostCategory, postSearchQuery, currentUser, showToast]
  );

  // Requirement 1 & 8: Reload post data from database whenever postFeedRefreshKey changes
  // (triggered when Home button is clicked, or after post creation/edit/deletion)
  useEffect(() => {
    loadFeedPosts(true);
    // Also reset to feed tab when user explicitly clicks Home
    setActiveTab('feed');
  }, [postFeedRefreshKey]);

  // Handle category/search changes in feed
  useEffect(() => {
    loadFeedPosts(false);
  }, [selectedPostCategory, postSearchQuery]);

  // Fetch users and skills
  const fetchUsersAndSkills = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [uList, sList] = await Promise.all([
        userService.getAllUsers(),
        skillService.getAllUserSkills(),
      ]);
      setAllUsers(uList);
      setAllSkills(sList);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndSkills();
  }, [fetchUsersAndSkills, postFeedRefreshKey]);

  // Fetch current user skills
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    skillService.getUserSkills(currentUser.id).then((skills) => {
      if (isMounted) setMySkills(skills);
    });
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Post Interactions: Like
  const handleToggleLike = async (postId: string) => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนกดถูกใจ');
      return;
    }

    try {
      const isCurrentlyLiked = !!likedPostsMap[postId];
      const newLikedStatus = await postService.toggleLike(postId, currentUser.id);

      setLikedPostsMap((prev) => ({ ...prev, [postId]: newLikedStatus }));
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const currentCount = p.likeCount || 0;
            return {
              ...p,
              likeCount: newLikedStatus
                ? currentCount + (isCurrentlyLiked ? 0 : 1)
                : Math.max(0, currentCount - 1),
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Post Interactions: Comments
  const handleToggleComments = async (postId: string) => {
    const isCurrentlyExpanded = !!expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !commentsMap[postId]) {
      try {
        const comments = await postService.getComments(postId);
        setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
      } catch (err) {
        console.error('Error loading comments:', err);
      }
    }
  };

  const handleAddComment = async (postId: string, contentText: string) => {
    if (!currentUser) {
      showToast('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น');
      return;
    }

    try {
      const targetPost = posts.find((p) => p.id === postId);
      const newComment = await postService.addComment(
        postId,
        currentUser.id,
        currentUser.name,
        currentUser.profileImage || '',
        contentText,
        targetPost?.authorId
      );

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentCount: (p.commentCount || 0) + 1,
            };
          }
          return p;
        })
      );

      showToast('แสดงความคิดเห็นเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error adding comment:', err);
      showToast('เกิดข้อผิดพลาดในการแสดงความคิดเห็น');
    }
  };

  const handleOpenProfile = (authorId: string) => {
    const target = allUsers.find((u) => u.id === authorId);
    if (target) {
      setSelectedUserForProfileModal(target);
    }
  };

  // Current user's teach and learn skill names
  const myTeachSkills = useMemo(
    () => mySkills.filter((s) => s.type === 'teach'),
    [mySkills]
  );
  const myLearnSkills = useMemo(
    () => mySkills.filter((s) => s.type === 'learn'),
    [mySkills]
  );

  const myTeachNames = useMemo(
    () => myTeachSkills.map((s) => s.skillName.toLowerCase().trim()),
    [myTeachSkills]
  );
  const myLearnNames = useMemo(
    () => myLearnSkills.map((s) => s.skillName.toLowerCase().trim()),
    [myLearnSkills]
  );

  // Map of skills grouped by userId
  const skillsByUserId = useMemo(() => {
    const map = new Map<string, { teach: UserSkill[]; learn: UserSkill[] }>();
    allSkills.forEach((s) => {
      if (!map.has(s.userId)) {
        map.set(s.userId, { teach: [], learn: [] });
      }
      const entry = map.get(s.userId)!;
      if (s.type === 'teach') entry.teach.push(s);
      else entry.learn.push(s);
    });
    return map;
  }, [allSkills]);

  // Enriched users list with skills and mutual match calculations
  const enrichedUsers = useMemo(() => {
    const otherUsers = allUsers.filter(
      (u) => u.id !== currentUser?.id && u.status !== 'suspended'
    );

    return otherUsers.map((user) => {
      const userSkillData = skillsByUserId.get(user.id) || { teach: [], learn: [] };
      const teachSkills = userSkillData.teach;
      const learnSkills = userSkillData.learn;

      const theyTeachIWant = teachSkills.filter((ts) =>
        myLearnNames.some(
          (mln) =>
            mln &&
            (ts.skillName.toLowerCase().includes(mln) || mln.includes(ts.skillName.toLowerCase()))
        )
      );

      const iTeachTheyWant = learnSkills.filter((ls) =>
        myTeachNames.some(
          (mtn) =>
            mtn &&
            (ls.skillName.toLowerCase().includes(mtn) || mtn.includes(ls.skillName.toLowerCase()))
        )
      );

      const isMutualMatch = theyTeachIWant.length > 0 && iTeachTheyWant.length > 0;
      const theyTeachWhatIWant = theyTeachIWant.length > 0;

      return {
        user,
        teachSkills,
        learnSkills,
        theyTeachIWant,
        iTeachTheyWant,
        isMutualMatch,
        theyTeachWhatIWant,
      };
    });
  }, [allUsers, currentUser, skillsByUserId, myTeachNames, myLearnNames]);

  // Filtered users according to search query, category, and match filter
  const filteredUsers = useMemo(() => {
    return enrichedUsers.filter((item) => {
      const { user, teachSkills, learnSkills, isMutualMatch, theyTeachWhatIWant } = item;

      if (matchFilter === 'mutual' && !isMutualMatch) return false;
      if (matchFilter === 'i-want-to-learn' && !theyTeachWhatIWant) return false;

      if (selectedMemberCategory !== 'All') {
        const hasCategory =
          teachSkills.some((s) => s.categoryName === selectedMemberCategory) ||
          learnSkills.some((s) => s.categoryName === selectedMemberCategory);
        if (!hasCategory) return false;
      }

      if (memberSearchQuery.trim()) {
        const query = memberSearchQuery.toLowerCase().trim();
        const nameMatch = user.name.toLowerCase().includes(query);
        const bioMatch = user.bio?.toLowerCase().includes(query) || false;
        const teachMatch = teachSkills.some((s) => s.skillName.toLowerCase().includes(query));
        const learnMatch = learnSkills.some((s) => s.skillName.toLowerCase().includes(query));
        if (!nameMatch && !bioMatch && !teachMatch && !learnMatch) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedUsers, memberSearchQuery, selectedMemberCategory, matchFilter]);

  // Mutual matches list for highlighted section
  const mutualMatches = useMemo(() => {
    return enrichedUsers.filter((item) => item.isMutualMatch);
  }, [enrichedUsers]);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header / Concept Banner */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-800/40">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <AppLogo size="xl" className="shrink-0 hidden sm:inline-flex drop-shadow-xl" />
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
                <AppLogo size="xs" className="w-3.5 h-3.5" />
                <span>SkillsWop แพลตฟอร์มแลกเปลี่ยนทักษะ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ยินดีต้อนรับ, คุณ{currentUser?.name || 'ผู้ใช้งาน'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                แลกเปลี่ยนทักษะและแบ่งปันความรู้กับเพื่อนๆ ในคอมมูนิตี้ SkillsWop อย่างเท่าเทียม
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  id="home-create-post-btn"
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-white/90 text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>สร้างโพสต์ใหม่</span>
                </button>
                <button
                  type="button"
                  id="home-refresh-feed-hero-btn"
                  onClick={() => triggerPostFeedRefresh()}
                  disabled={isRefreshing}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="โหลดข้อมูลโพสต์ล่าสุดจากฐานข้อมูล"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'กำลังรีเฟรช...' : 'รีเฟรชฟีด'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-200" />
                  <span>แนะนำสมาชิก ({allUsers.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Skill Summary of Current User */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 shrink-0 w-full md:w-80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                ทักษะที่คุณพร้อมสอน ({myTeachSkills.length})
              </span>
              <button
                type="button"
                onClick={() => setCurrentView('my-skills')}
                className="text-[11px] text-indigo-300 hover:text-white font-medium hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {myTeachSkills.length > 0 ? (
                myTeachSkills.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30"
                  >
                    {s.skillName}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">ยังไม่ได้ระบุทักษะที่พร้อมสอน</span>
              )}
              {myTeachSkills.length > 3 && (
                <span className="text-[11px] text-slate-400">+{myTeachSkills.length - 3}</span>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                ทักษะที่คุณอยากเรียน ({myLearnSkills.length})
              </span>
              <button
                type="button"
                onClick={() => setCurrentView('my-skills')}
                className="text-[11px] text-indigo-300 hover:text-white font-medium hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {myLearnSkills.length > 0 ? (
                myLearnSkills.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-medium border border-amber-500/30"
                  >
                    {s.skillName}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-400">ยังไม่ได้ระบุทักษะที่อยากเรียน</span>
              )}
              {myLearnSkills.length > 3 && (
                <span className="text-[11px] text-slate-400">+{myLearnSkills.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Post Creator Input Box */}
      {currentUser && (
        <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 sm:gap-4 transition-colors">
          <UserAvatar
            src={currentUser.profileImage}
            name={currentUser.name}
            size="md"
            className="shrink-0 ring-2 ring-indigo-500/20"
          />
          <button
            type="button"
            onClick={() => setIsCreatePostModalOpen(true)}
            className="flex-1 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-left px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center justify-between"
          >
            <span>คุณกำลังอยากเรียนรู้หรืออยากสอนอะไรในวันนี้? โพสต์เลย...</span>
            <Send className="w-4 h-4 text-indigo-500 dark:text-indigo-400 hidden sm:inline-block shrink-0 ml-2" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreatePostModalOpen(true)}
            className="px-4 py-2.5 sm:py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">สร้างโพสต์</span>
          </button>
        </section>
      )}

      {/* 3. Primary Navigation Tabs: ฟีดโพสต์ล่าสุด (Live Feed) vs แนะนำสมาชิก */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {/* Tab 1: ฟีดโพสต์ล่าสุด */}
          <button
            type="button"
            id="tab-home-feed"
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>ฟีดโพสต์ล่าสุด</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'feed'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {posts.length}
            </span>
          </button>

          {/* Tab 2: แนะนำสมาชิก & คู่แลกเปลี่ยน */}
          <button
            type="button"
            id="tab-home-members"
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>แนะนำสมาชิก</span>
            {mutualMatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                แมตช์ {mutualMatches.length}
              </span>
            )}
          </button>
        </div>

        {/* Refresh button & Live Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400">
          {lastRefreshedAt && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              อัปเดตล่าสุด: {lastRefreshedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            id="home-feed-refresh-btn"
            onClick={() => triggerPostFeedRefresh()}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="รีเฟรชฟีดโพสต์จากฐานข้อมูลใหม่"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังดึงข้อมูล...' : 'รีเฟรชฟีด'}</span>
          </button>
        </div>
      </div>

      {/* Requirement 5: สถานะกำลังโหลดระหว่างดึงข้อมูลโพสต์ */}
      {isRefreshing && (
        <div className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs animate-in fade-in duration-200">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>กำลังโหลดข้อมูลโพสต์ล่าสุดจากฐานข้อมูล...</span>
        </div>
      )}

      {/* Requirement 7: หากเกิดข้อผิดพลาด แสดงข้อความแจ้งเตือนที่เข้าใจง่าย */}
      {feedError && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-center space-y-2.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
              เกิดข้อผิดพลาดในการโหลดฟีดข้อมูล
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto mt-0.5">
              {feedError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadFeedPosts(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: ฟีดโพสต์ล่าสุด (LIVE POST FEED)                     */}
      {/* ========================================================= */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          {/* Post Feed Filters: Search & Categories */}
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={postSearchQuery}
                onChange={(e) => setPostSearchQuery(e.target.value)}
                placeholder="ค้นหาเนื้อหาโพสต์, แท็กทักษะ หรือชื่อผู้โพสต์..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-2xs"
              />
              {postSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPostSearchQuery('')}
                  className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {COMMUNITY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPostCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                    selectedPostCategory === cat
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Posts List or Loading */}
          {feedLoading && posts.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <span className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>กำลังดึงข้อมูลโพสต์ล่าสุดจากฐานข้อมูล...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {postSearchQuery || selectedPostCategory !== 'ทั้งหมด'
                    ? 'ไม่พบโพสต์ที่ตรงกับตัวกรองนี้'
                    : 'ยังไม่มีโพสต์ในฟีดขณะนี้'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {postSearchQuery || selectedPostCategory !== 'ทั้งหมด'
                    ? 'ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น'
                    : 'ร่วมเป็นคนแรกที่แชร์ความรู้หรือตามหาเพื่อนร่วมแลกเปลี่ยนทักษะกันเลย!'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างโพสต์แรกของคุณ</span>
                </button>
                {(postSearchQuery || selectedPostCategory !== 'ทั้งหมด') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostSearchQuery('');
                      setSelectedPostCategory('ทั้งหมด');
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isLiked={!!likedPostsMap[post.id]}
                  onToggleLike={handleToggleLike}
                  comments={commentsMap[post.id] || []}
                  isCommentsOpen={!!expandedComments[post.id]}
                  onToggleComments={handleToggleComments}
                  onAddComment={handleAddComment}
                  onEditPost={(p) => setEditTargetPost(p)}
                  onDeletePost={(p) => setPostToDelete(p)}
                  onReportPost={(p) => setReportTargetPost(p)}
                  onOpenProfile={handleOpenProfile}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: แนะนำสมาชิก & คู่แลกเปลี่ยน                          */}
      {/* ========================================================= */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Highlighted Mutual Matches (คู่แลกเปลี่ยนที่แมตช์ตรงกัน 100%) */}
          {mutualMatches.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>คู่แลกเปลี่ยนที่แมตช์ตรงกัน!</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                        {mutualMatches.length} คน
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      สมาชิกที่สอนวิชาที่คุณอยากเรียน และสนใจเรียนวิชาที่คุณพร้อมสอนพอดี
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mutualMatches.map(({ user, theyTeachIWant, iTeachTheyWant }) => (
                  <div
                    key={`mutual-${user.id}`}
                    className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/40 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-2xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>แมตช์ตรงกัน 100%</span>
                    </div>

                    <div className="space-y-4">
                      {/* User Profile Info */}
                      <div className="flex items-start gap-3.5 pr-24">
                        <UserAvatar
                          src={user.profileImage}
                          name={user.name}
                          size="md"
                          className="shrink-0 ring-2 ring-emerald-500/30"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {user.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {user.bio || 'สมาชิกคอมมูนิตี้ SkillsWop'}
                          </p>
                        </div>
                      </div>

                      {/* Mutual Match Explanation */}
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                          <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                          <span>จุดแลกเปลี่ยนที่ลงตัว:</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          • เขาพร้อมสอนคุณ:{' '}
                          <strong className="text-emerald-700 dark:text-emerald-300">
                            {theyTeachIWant.map((s) => s.skillName).join(', ')}
                          </strong>
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          • คุณพร้อมสอนเขา:{' '}
                          <strong className="text-indigo-700 dark:text-indigo-300">
                            {iTeachTheyWant.map((s) => s.skillName).join(', ')}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedUserForProfileModal(user)}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูโปรไฟล์</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUserForRequestModal(user)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shadow-emerald-500/25 transition-all cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>ขอแลกเปลี่ยน</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search & Filter Bar for Members */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="ค้นหาวิชา ทักษะ หรือชื่อสมาชิก..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-2xs"
                />
              </div>

              {/* Match Filter Tabs */}
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setMatchFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    matchFilter === 'all'
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setMatchFilter('mutual')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
                    matchFilter === 'mutual'
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>คู่ที่แมตช์ตรงกัน</span>
                  {mutualMatches.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMatchFilter('i-want-to-learn')}
                  className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    matchFilter === 'i-want-to-learn'
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  วิชาที่ฉันอยากเรียน
                </button>
              </div>
            </div>

            {/* Categories Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedMemberCategory('All')}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  selectedMemberCategory === 'All'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                หมวดหมู่ทั้งหมด
              </button>
              {INITIAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedMemberCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                    selectedMemberCategory === cat.name
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>

          {/* Members List */}
          {loadingUsers ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>กำลังโหลดรายชื่อสมาชิก...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                ลองเปลี่ยนคำค้นหา หรือกดล้างตัวกรองเพื่อดูสมาชิกทั้งหมดในระบบ
              </p>
              <button
                type="button"
                onClick={() => {
                  setMemberSearchQuery('');
                  setSelectedMemberCategory('All');
                  setMatchFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
              >
                ดูสมาชิกทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredUsers.map(({ user, teachSkills, learnSkills, isMutualMatch }) => (
                <div
                  key={user.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    {/* User Profile Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <UserAvatar src={user.profileImage} name={user.name} size="md" />
                          {user.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {user.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold mt-0.5">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{user.rating ? user.rating.toFixed(1) : '5.0'}</span>
                            <span className="text-slate-400 font-normal">
                              ({user.reviewCount || 0} รีวิว)
                            </span>
                          </div>
                        </div>
                      </div>

                      {isMutualMatch && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 shrink-0">
                          แมตช์ตรงกัน
                        </span>
                      )}
                    </div>

                    {/* Short Bio */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                      {user.bio || 'สวัสดี! ยินดีที่ได้รู้จักและพร้อมแลกเปลี่ยนทักษะกับทุกคนครับ/ค่ะ'}
                    </p>

                    {/* Skills Section: Teach & Learn */}
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          วิชาที่มี (พร้อมสอน):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {teachSkills.length > 0 ? (
                            teachSkills.slice(0, 3).map((s) => (
                              <span
                                key={s.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1"
                              >
                                <span>{s.skillName}</span>
                                {s.level && (
                                  <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 font-normal">
                                    • {s.level}
                                  </span>
                                )}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">ยังไม่ระบุ</span>
                          )}
                          {teachSkills.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium self-center">
                              +{teachSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          วิชาที่สนใจ (อยากเรียน):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {learnSkills.length > 0 ? (
                            learnSkills.slice(0, 3).map((s) => (
                              <span
                                key={s.id}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200/60 dark:border-amber-800"
                              >
                                {s.skillName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">ยังไม่ระบุ</span>
                          )}
                          {learnSkills.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium self-center">
                              +{learnSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForProfileModal(user)}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูโปรไฟล์</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUserForRequestModal(user)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>ขอแลกเปลี่ยน</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeletePostConfirmModal
        post={postToDelete}
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onPostDeleted={(postId) => {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
        }}
      />
    </div>
  );
};
