import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Review, User } from '../types';
import { reviewService } from '../services/reviewService';
import { userService } from '../services/userService';
import { UserAvatar } from '../components/common/UserAvatar';
import { RatingStars } from '../components/common/RatingStars';
import { Star, Award, MessageSquare, ThumbsUp } from 'lucide-react';

export const ReviewsView: React.FC = () => {
  const { currentUser } = useApp();

  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchReviews = async () => {
      setLoading(true);
      const [received, all, users] = await Promise.all([
        reviewService.getReviewsForUser(currentUser.id),
        reviewService.getAll(),
        userService.getAllUsers(),
      ]);

      setReceivedReviews(received);
      setGivenReviews(all.filter((r) => r.reviewerId === currentUser.id));
      setAllUsers(users);
      setLoading(false);
    };

    fetchReviews();
  }, [currentUser]);

  if (!currentUser) return null;

  const currentList = activeTab === 'received' ? receivedReviews : givenReviews;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          คะแนนและรีวิว (Reviews & Rating)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ความคิดเห็นและคะแนนความพึงพอใจจากการแลกเปลี่ยนทักษะกับสมาชิกในชุมชน
        </p>
      </div>

      {/* Summary Rating Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="text-center sm:text-left">
            <div className="text-4xl sm:text-5xl font-black">{currentUser.rating.toFixed(1)}</div>
            <div className="text-xs text-amber-100 mt-0.5">จากเต็ม 5.0 คะแนน</div>
          </div>

          <div className="border-l border-white/20 pl-5 space-y-1">
            <RatingStars rating={currentUser.rating} size="lg" showCount={false} />
            <p className="text-xs text-amber-100">
              ได้รับรีวิวทั้งหมด <strong>{currentUser.reviewCount}</strong> รายการ
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl text-xs space-y-1 self-start sm:self-center border border-white/20">
          <div className="font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-200" />
            การันตีความน่าเชื่อถือ
          </div>
          <p className="text-amber-100 text-[11px]">
            แลกเปลี่ยนสำเร็จ {currentUser.completedExchanges} ครั้ง ปลอดภัย 100%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'received'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          รีวิวที่ได้รับ ({receivedReviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('given')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'given'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          รีวิวที่คุณเขียนให้ผู้อื่น ({givenReviews.length})
        </button>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentList.map((rev) => {
          const targetUserId = activeTab === 'received' ? rev.reviewerId : rev.reviewedUserId;
          const targetUser = allUsers.find((u) => u.id === targetUserId);
          if (!targetUser) return null;

          return (
            <div
              key={rev.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={targetUser.profileImage}
                    name={targetUser.name}
                    size="sm"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {activeTab === 'received' ? targetUser.name : `รีวิวให้คุณ ${targetUser.name}`}
                    </h3>
                    <div className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <RatingStars rating={rev.rating} size="sm" showCount={false} />
              </div>

              {rev.skillName && (
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                  ทักษะที่เกี่ยวข้อง: {rev.skillName}
                </div>
              )}

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl">
                "{rev.comment}"
              </p>
            </div>
          );
        })}
      </div>

      {currentList.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Star className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            ยังไม่มีรีวิวในหมวดนี้
          </h3>
          <p className="text-xs text-slate-500">
            เมื่อเสร็จสิ้นการแลกเปลี่ยนทักษะ คุณและคู่แลกเปลี่ยนจะสามารถเขียนรีวิวให้กันได้
          </p>
        </div>
      )}
    </div>
  );
};
