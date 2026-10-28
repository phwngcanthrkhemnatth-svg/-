import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MatchResult } from '../types';
import { matchService } from '../services/matchService';
import { UserAvatar } from '../components/common/UserAvatar';
import { RatingStars } from '../components/common/RatingStars';
import { LearningModeBadge } from '../components/common/Badge';
import {
  Flame,
  Sparkles,
  BookOpen,
  MapPin,
  Send,
  Eye,
  ArrowRightLeft,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const MatchingView: React.FC = () => {
  const {
    currentUser,
    setSelectedUserForProfileModal,
    setSelectedUserForRequestModal,
  } = useApp();

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const fetchMatches = async () => {
      setLoading(true);
      const list = await matchService.getMatchesForUser(currentUser.id);
      setMatches(list);
      setLoading(false);
    };

    fetchMatches();
  }, [currentUser]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>อัลกอริทึมจับคู่อัจฉริยะ (Mutual Match Engine)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            ระบบจับคู่ทักษะ (Skill Matching)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เรียงลำดับตามความเข้ากันได้แบบสองทาง (Mutual Compatibility) จากมากไปน้อย
          </p>
        </div>
      </div>

      {/* How match works banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">จับคู่สมบูรณ์แบบ (Mutual Match):</span>{' '}
            ระบบให้คะแนนสูงสุดเมื่อเขาสามารถสอนสิ่งที่คุณอยากเรียน และเขาก็อยากเรียนสิ่งที่คุณสอนได้พอดี!
          </div>
        </div>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 hidden sm:inline">
          พบ {matches.length} คู่ที่ตรงกัน
        </span>
      </div>

      {/* Match Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {matches.map((item) => {
          const isHighMatch = item.matchPercentage >= 80;
          return (
            <div
              key={item.partner.id}
              className={`p-6 rounded-3xl bg-white dark:bg-slate-800/90 border transition-all hover:shadow-lg flex flex-col justify-between ${
                isHighMatch
                  ? 'border-amber-300/80 dark:border-amber-600/50 shadow-xs'
                  : 'border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                {/* Header: User & Match % Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <UserAvatar
                      src={item.partner.profileImage}
                      name={item.partner.name}
                      size="lg"
                      isOnline={item.partner.isOnline}
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {item.partner.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.partner.province}
                        </span>
                        <span>•</span>
                        <LearningModeBadge mode={item.partner.learningMode} />
                      </div>
                      <div className="mt-1">
                        <RatingStars rating={item.partner.rating} reviewCount={item.partner.reviewCount} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Percentage score pill */}
                  <div className="text-right shrink-0">
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl text-xs font-black shadow-xs ${
                        isHighMatch
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20 animate-pulse'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{item.matchPercentage}% Match</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHighMatch
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${item.matchPercentage}%` }}
                  />
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.partner.bio}
                </p>

                {/* Mutual Skill Breakdown Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  {/* They teach us */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ทักษะที่เขาสอนได้ & คุณอยากเรียน:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.mutualSkills.theyCanTeachUs.length > 0 ? (
                        item.mutualSkills.theyCanTeachUs.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {item.otherTeachSkills.slice(0, 2).join(', ') || 'ไม่มีที่ระบุ'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* We teach them */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                      <span>ทักษะที่คุณสอนได้ & เขาอยากเรียน:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.mutualSkills.weCanTeachThem.length > 0 ? (
                        item.mutualSkills.weCanTeachThem.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {item.otherLearnSkills.slice(0, 2).join(', ') || 'ไม่มีที่ระบุ'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForProfileModal(item.partner)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  ดูโปรไฟล์
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserForRequestModal(item.partner)}
                  className="flex-1 py-2.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  ส่งคำขอแลกเปลี่ยน
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {matches.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            ยังไม่มีคู่ Match ที่ตรงกับเงื่อนไข
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองเพิ่มทักษะที่คุณอยากเรียนรู้หรือทักษะที่คุณสามารถสอนเพิ่มเติมในหน้า "ทักษะของฉัน"
          </p>
        </div>
      )}
    </div>
  );
};
