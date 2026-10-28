import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Post, Comment, PostCategoryType } from '../types';
import { postService } from '../services/postService';
import { PostCard } from '../components/community/PostCard';
import { DeletePostConfirmModal } from '../components/modals/DeletePostConfirmModal';
import {
  Sparkles,
  Plus,
  Search,
  Flame,
  Clock,
  Filter,
  Bot,
  MessageSquare,
  RefreshCw,
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

export const CommunityView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    setSelectedUserForProfileModal,
    setEditTargetPost,
    setReportTargetPost,
    setIsCreatePostModalOpen,
    postFeedRefreshKey,
    showToast,
  } = useApp();

  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedSort, setFeedSort] = useState<'latest' | 'popular'>('latest');
  const [loading, setLoading] = useState(true);

  // Active comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [likedPostsMap, setLikedPostsMap] = useState<Record<string, boolean>>({});

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  // Load posts
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPosts = await postService.getPosts(
        selectedCategory === 'ทั้งหมด' ? undefined : selectedCategory,
        searchQuery
      );

      // Apply sort
      if (feedSort === 'popular') {
        fetchedPosts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      } else {
        fetchedPosts.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      setPosts(fetchedPosts);

      // Check liked status
      if (currentUser) {
        const likedStatus: Record<string, boolean> = {};
        for (const p of fetchedPosts) {
          likedStatus[p.id] = await postService.isPostLikedByUser(p.id, currentUser.id);
        }
        setLikedPostsMap(likedStatus);
      }
    } catch (err) {
      console.error('Error loading community posts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, feedSort, currentUser, postFeedRefreshKey]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle Like
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

  // Toggle comments expand and load comments
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

  // Add a new comment
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
      showToast('เกิดข้อผิดพลาดในการส่งความคิดเห็น');
    }
  };

  // Open Author Profile Modal
  const handleOpenProfile = (authorId: string) => {
    const foundUser = allUsers.find((u) => u.id === authorId);
    if (foundUser) {
      setSelectedUserForProfileModal(foundUser);
    } else {
      // If author not in allUsers (e.g. demo bot or guest), create a preview stub
      setSelectedUserForProfileModal({
        id: authorId,
        publicUserId: authorId === 'demo-bot' ? 'SWP000001' : `SWP${authorId.slice(-6)}`,
        name: authorId === 'demo-bot' ? 'SkillsWop Demo Bot' : 'สมาชิกในชุมชน',
        email: 'bot@skillswop.local',
        bio: 'ระบบผู้ช่วยและสมาชิกแบ่งปันความรู้แห่ง SkillsWop',
        rating: 5,
        ratingCount: 1,
        matchCount: 1,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* 1. Header Banner with "สร้างโพสต์" Button */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Social Learning Community</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ชุมชนและการแบ่งปันความรู้
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            พื้นที่แลกเปลี่ยนทักษะ แบ่งปันเทคนิคการเรียนรู้ เผยแพร่ผลงาน และตามหาเพื่อนที่มีเป้าหมายเดียวกัน
          </p>
        </div>

        {/* Action Button: Create Post */}
        <div className="shrink-0 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCreatePostModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-white/90 text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            title="สร้างโพสต์ใหม่"
          >
            <Plus className="w-5 h-5 text-indigo-600" />
            <span>สร้างโพสต์</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Post Trigger Bar (Social Input Box) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
        <div className="shrink-0">
          <img
            src={
              currentUser?.profileImage ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`
            }
            alt={currentUser?.name || 'User'}
            className="w-10 h-10 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-100 dark:ring-slate-800"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsCreatePostModalOpen(true)}
          className="flex-1 text-left px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
        >
          {currentUser?.name
            ? `คุณ ${currentUser.name} วันนี้อยากแบ่งปันความรู้อะไรบ้าง?`
            : 'แบ่งปันความรู้หรือมองหาวิชาที่อยากแลกเปลี่ยน...'}
        </button>

        <button
          type="button"
          onClick={() => setIsCreatePostModalOpen(true)}
          className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="สร้างโพสต์ทันที"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">สร้างโพสต์</span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาโพสต์ หัวข้อ เนื้อหา หรือแท็กทักษะ..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setFeedSort('latest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                feedSort === 'latest'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>ล่าสุด</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedSort('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                feedSort === 'popular'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>ยอดนิยม</span>
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {COMMUNITY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Posts Feed List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <span className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>กำลังโหลดโพสต์ในชุมชน...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              ยังไม่มีโพสต์ในหมวดหมู่นี้
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              เริ่มต้นแบ่งปันความรู้หรือประสบการณ์ของคุณกับเพื่อนๆ ในชุมชน SkillsWop ได้เลยตอนนี้!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatePostModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างโพสต์แรกของคุณ</span>
          </button>
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

      {/* Delete Confirmation Modal */}
      <DeletePostConfirmModal
        post={postToDelete}
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
      />
    </div>
  );
};
