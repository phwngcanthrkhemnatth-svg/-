import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment, User } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Edit3,
  Trash2,
  Flag,
  Send,
  Clock,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  onToggleLike: (postId: string) => void;
  comments: Comment[];
  isCommentsOpen: boolean;
  onToggleComments: (postId: string) => void;
  onAddComment: (postId: string, text: string) => Promise<void>;
  onEditPost: (post: Post) => void;
  onDeletePost: (post: Post) => void;
  onReportPost: (post: Post) => void;
  onOpenProfile: (authorId: string) => void;
}

// Helper to format Thai relative time
function formatThaiTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return new Date(isoString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  } catch {
    return 'เมื่อไม่นานมานี้';
  }
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isLiked,
  onToggleLike,
  comments,
  isCommentsOpen,
  onToggleComments,
  onAddComment,
  onEditPost,
  onDeletePost,
  onReportPost,
  onOpenProfile,
}) => {
  const { currentUser, showToast, allUsers } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser?.id === post.authorId;

  // Find author user details if available
  const authorUser = allUsers.find((u) => u.id === post.authorId);
  const authorUserId =
    post.authorUserId ||
    authorUser?.publicUserId ||
    (post.authorId === 'demo-bot' ? 'SWP000001' : `SWP${post.authorId.slice(-6)}`);

  const authorPhoto =
    post.authorPhoto ||
    post.authorImage ||
    authorUser?.profileImage ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.authorName || 'SWP')}`;

  const isEdited =
    post.updatedAt &&
    post.createdAt &&
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 2000;

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/#post-${post.id}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('คัดลอกลิงก์โพสต์เรียบร้อยแล้ว');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('ไม่สามารถคัดลอกลิงก์ได้');
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await onAddComment(post.id, commentText.trim());
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <article
      id={`post-${post.id}`}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6 space-y-4 text-slate-900 dark:text-slate-100"
    >
      {/* 1. Header: Author info, ID badge, Time, Category, and 3-dots Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Profile Photo - Clickable to open profile */}
          <button
            type="button"
            onClick={() => onOpenProfile(post.authorId)}
            className="relative shrink-0 rounded-2xl overflow-hidden ring-2 ring-slate-100 dark:ring-slate-800 hover:ring-indigo-500 transition-all cursor-pointer"
            title="ดูโปรไฟล์ผู้โพสต์"
          >
            <img
              src={authorPhoto}
              alt={post.authorName}
              className="w-11 h-11 object-cover bg-slate-100 dark:bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(post.authorName || 'U')}`;
              }}
            />
          </button>

          {/* Author Name, ID, Time */}
          <div className="space-y-0.5">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onOpenProfile(post.authorId)}
                className="font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
              >
                {post.authorName}
              </button>

              {/* User ID Badge */}
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px] font-semibold tracking-wide">
                {authorUserId}
              </span>

              {post.authorId === 'demo-bot' && (
                <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                  BOT
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatThaiTime(post.createdAt)}
              </span>
              {isEdited && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  (แก้ไขแล้ว)
                </span>
              )}
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                {post.category || post.postCategory || 'ทั่วไป'}
              </span>
            </div>
          </div>
        </div>

        {/* 3-dots Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="เมนูจัดการโพสต์"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEditPost(post);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>แก้ไขโพสต์</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeletePost(post);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบโพสต์</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReportPost(post);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>รายงานโพสต์</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Post Title */}
      {post.title && (
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
          {post.title}
        </h3>
      )}

      {/* 3. Post Content */}
      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
        {post.content}
      </div>

      {/* 4. Attached Image */}
      {post.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 max-h-96 bg-slate-100 dark:bg-slate-800">
          <img
            src={post.imageUrl}
            alt={post.title || 'รูปภาพประกอบโพสต์'}
            className="w-full h-auto max-h-96 object-cover hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      {/* 5. Skill Tags */}
      {post.skillTags && post.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.skillTags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-medium border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 6. Interaction Bar: Like, Comment count, Share */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              isLiked
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-500' : ''}`} />
            <span>{post.likeCount || 0}</span>
          </button>

          {/* Comments Button */}
          <button
            type="button"
            onClick={() => onToggleComments(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              isCommentsOpen
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentCount || comments.length || 0}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="คัดลอกลิงก์โพสต์"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>แชร์</span>
            </>
          )}
        </button>
      </div>

      {/* 7. Expanded Comments Section */}
      {isCommentsOpen && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* New Comment Input */}
          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="เขียนความคิดเห็นของคุณ..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors cursor-pointer"
              title="ส่งความคิดเห็น"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.authorName || 'สมาชิก'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatThaiTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-slate-400">
              ยังไม่มีความคิดเห็น เป็นคนแรกที่เริ่มพูดคุยกัน!
            </div>
          )}
        </div>
      )}
    </article>
  );
};
