import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Schedule, User } from '../types';
import { scheduleService } from '../services/scheduleService';
import { userService } from '../services/userService';
import { UserAvatar } from '../components/common/UserAvatar';
import { ScheduleStatusBadge, LearningModeBadge } from '../components/common/Badge';
import { CreateScheduleModal } from '../components/modals/CreateScheduleModal';
import { CreateReviewModal } from '../components/modals/CreateReviewModal';
import {
  Calendar,
  Clock,
  MapPin,
  Link2,
  Plus,
  CheckCircle,
  XCircle,
  ExternalLink,
  Star,
  Users,
} from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Review Modal state
  const [reviewPartner, setReviewPartner] = useState<User | null>(null);
  const [reviewSkill, setReviewSkill] = useState<string | undefined>(undefined);

  const loadSchedules = async () => {
    if (!currentUser) return;
    const [list, users] = await Promise.all([
      scheduleService.getSchedulesForUser(currentUser.id),
      userService.getAllUsers(),
    ]);
    setSchedules(list);
    setAllUsers(users);
  };

  useEffect(() => {
    loadSchedules();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleMarkCompleted = async (scheduleId: string, partner: User) => {
    await scheduleService.updateScheduleStatus(scheduleId, 'Completed');
    showToast('บันทึกการแลกเปลี่ยนเสร็จสิ้นแล้ว! เชิญให้คะแนนและรีวิวคู่แลกเปลี่ยนครับ ⭐');
    await loadSchedules();
    setReviewPartner(partner);
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการยกเลิกนัดหมายนี้?')) return;
    await scheduleService.updateScheduleStatus(scheduleId, 'Cancelled');
    showToast('ยกเลิกนัดหมายแล้ว');
    loadSchedules();
  };

  const filtered = schedules.filter((s) => s.status === activeTab);
  const eligiblePartners = allUsers.filter((u) => u.id !== currentUser.id);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            นัดหมายการแลกเปลี่ยน (Schedule)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            จัดการวัน เวลา ลิงก์ห้องประชุม และสถานที่นัดพบสำหรับการแลกเปลี่ยนทักษะ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          สร้างนัดหมายใหม่
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {(['Upcoming', 'Completed', 'Cancelled'] as const).map((tab) => {
          const count = schedules.filter((s) => s.status === tab).length;
          const labels = {
            Upcoming: 'กำลังจะมาถึง',
            Completed: 'เสร็จสิ้นแล้ว',
            Cancelled: 'ยกเลิกแล้ว',
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {labels[tab]} ({count})
            </button>
          );
        })}
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const partnerId = item.userId === currentUser.id ? item.partnerId : item.userId;
          const partner = allUsers.find((u) => u.id === partnerId);
          if (!partner) return null;

          return (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {new Date(item.date).toLocaleDateString('th-TH', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.startTime} - {item.endTime} น.
                      </span>
                    </div>
                  </div>

                  <ScheduleStatusBadge status={item.status} />
                </div>

                {/* Partner snippet */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <UserAvatar src={partner.profileImage} name={partner.name} size="sm" />
                  <div className="text-xs">
                    <div className="text-[10px] text-slate-400">คู่แลกเปลี่ยน</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {partner.name}
                    </div>
                  </div>
                </div>

                {/* Mode location or link */}
                <div className="text-xs p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40 space-y-1">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    {item.type === 'Online' ? (
                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    รูปแบบ: {item.type}
                  </div>
                  {item.meetingLink ? (
                    <a
                      href={item.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1 truncate block"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {item.meetingLink}
                    </a>
                  ) : item.location ? (
                    <p className="text-slate-600 dark:text-slate-300">{item.location}</p>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                {item.status === 'Upcoming' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCancelSchedule(item.id)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                    >
                      ยกเลิกนัดหมาย
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(item.id, partner)}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      เรียนจบแล้ว (Mark Completed)
                    </button>
                  </>
                )}

                {item.status === 'Completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewPartner(partner);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    เขียนรีวิวให้คะแนน
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            ไม่มีนัดหมายในหมวดนี้
          </h3>
          <p className="text-xs text-slate-500">
            คุณสามารถคลิกปุ่ม "สร้างนัดหมายใหม่" เพื่อกำหนดเวลาแลกเปลี่ยนกับสมาชิก
          </p>
        </div>
      )}

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        partners={eligiblePartners}
        onCreated={() => loadSchedules()}
      />

      {/* Review Modal */}
      {reviewPartner && (
        <CreateReviewModal
          isOpen={!!reviewPartner}
          onClose={() => setReviewPartner(null)}
          partner={reviewPartner}
          skillName={reviewSkill}
          onReviewed={() => loadSchedules()}
        />
      )}
    </div>
  );
};
