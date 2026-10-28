import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Post } from '../../types';
import { postService } from '../../services/postService';
import { useApp } from '../../context/AppContext';

interface DeletePostConfirmModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onPostDeleted?: (postId: string) => void;
}

export const DeletePostConfirmModal: React.FC<DeletePostConfirmModalProps> = ({
  post,
  isOpen,
  onClose,
  onPostDeleted,
}) => {
  const { showToast, triggerPostFeedRefresh } = useApp();
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !post) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postService.deletePost(post.id);
      showToast('ลบโพสต์เรียบร้อยแล้ว');
      triggerPostFeedRefresh();
      if (onPostDeleted) onPostDeleted(post.id);
      onClose();
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('เกิดข้อผิดพลาดในการลบโพสต์');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {post.title ? `"${post.title}"` : 'โพสต์นี้'} จะถูกลบถาวรออกจากระบบรวมถึงความคิดเห็นและจำนวน Like ทั้งหมด
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {deleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังลบ...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันการลบ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
