import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportReason } from '../../types';
import { reportService } from '../../services/reportService';
import { UserAvatar } from '../common/UserAvatar';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';

export const ReportUserModal: React.FC = () => {
  const {
    selectedUserForReportModal,
    setSelectedUserForReportModal,
    currentUser,
    showToast,
  } = useApp();

  const reportedUser = selectedUserForReportModal;

  const [reason, setReason] = useState<ReportReason>('เนื้อหาไม่เหมาะสม');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportedUser || !currentUser) return null;

  const reasons: ReportReason[] = [
    'เนื้อหาไม่เหมาะสม',
    'การหลอกลวง',
    'การคุกคาม',
    'Spam',
    'อื่น ๆ',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('กรุณาระบุรายละเอียดการรายงาน');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportService.submitReport(
        currentUser.id,
        reportedUser.id,
        reason,
        description
      );

      showToast('รายงานของคุณถูกส่งถึงผู้ดูแลระบบแล้ว ขอบคุณที่ช่วยดูแลชุมชน SkillSwap ครับ 🛡️');
      setSelectedUserForReportModal(null);
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400 text-sm">
            <ShieldAlert className="w-4 h-4" />
            รายงานผู้ใช้งานต่อผู้ดูแลระบบ
          </div>
          <button
            type="button"
            onClick={() => setSelectedUserForReportModal(null)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <UserAvatar src={reportedUser.profileImage} name={reportedUser.name} size="md" />
            <div>
              <div className="text-xs text-slate-400">ผู้ใช้ที่ถูกรายงาน</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {reportedUser.name}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              สาเหตุการรายงาน
            </label>
            <div className="space-y-1.5">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    reason === r
                      ? 'border-rose-500 bg-rose-50/70 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุพฤติกรรมหรือข้อความที่ไม่เหมาะสมเพื่อให้เจ้าหน้าที่ตรวจสอบ..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedUserForReportModal(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังส่งรายงาน...' : 'ยืนยันการรายงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
