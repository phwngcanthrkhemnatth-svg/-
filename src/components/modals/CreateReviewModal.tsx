import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { reviewService } from '../../services/reviewService';
import { UserAvatar } from '../common/UserAvatar';
import { X, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: User;
  skillName?: string;
  onReviewed?: () => void;
}

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  isOpen,
  onClose,
  partner,
  skillName,
  onReviewed,
}) => {
  const { currentUser, showToast } = useApp();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('กรุณากรอกความคิดเห็นเกี่ยวกับการแลกเปลี่ยนทักษะ');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewService.addReview({
        reviewerId: currentUser.id,
        reviewedUserId: partner.id,
        rating,
        comment: comment.trim(),
        skillName,
      });

      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      showToast(`ส่งรีวิวและให้คะแนนคุณ ${partner.name} เรียบร้อยแล้ว! ⭐`);
      onReviewed?.();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการส่งรีวิว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            ให้คะแนนและรีวิวคู่แลกเปลี่ยน
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Partner Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <UserAvatar src={partner.profileImage} name={partner.name} size="md" />
            <div>
              <div className="text-xs text-slate-400">คุณกำลังรีวิวให้กับ</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {partner.name}
              </div>
              {skillName && (
                <div className="text-xs text-indigo-600 font-medium">
                  ทักษะที่ได้เรียนรู้: {skillName}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Star Rating */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              ความพึงพอใจโดยรวม
            </label>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-hidden"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating ?? rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-bold text-amber-500">
              {rating === 5 && 'ยอดเยี่ยมมาก! ได้ประโยชน์สูงสุด'}
              {rating === 4 && 'ดีมาก แนะนำเลย'}
              {rating === 3 && 'ปานกลาง มีประโยชน์'}
              {rating === 2 && 'พอใช้ ปรับปรุงได้'}
              {rating === 1 && 'ต้องปรับปรุง'}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ความคิดเห็นของคุณ
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เล่าประสบการณ์การแลกเปลี่ยน การสอน ความเป็นมิตร และคำแนะนำ..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังส่งรีวิว...' : 'บันทึกรีวิว'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
