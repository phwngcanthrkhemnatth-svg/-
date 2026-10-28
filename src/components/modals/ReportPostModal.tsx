import React, { useState } from 'react';
import { Flag, X, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Post, PostReportReason } from '../../types';
import { reportService } from '../../services/reportService';
import { useApp } from '../../context/AppContext';

interface ReportPostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS: PostReportReason[] = [
  'เนื้อหาไม่เหมาะสม',
  'สแปม',
  'หลอกลวง',
  'ละเมิดลิขสิทธิ์',
  'คุกคามหรือกลั่นแกล้ง',
  'เนื้อหาอื่น ๆ',
];

export const ReportPostModal: React.FC<ReportPostModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const { currentUser, showToast } = useApp();
  const [reason, setReason] = useState<PostReportReason>('เนื้อหาไม่เหมาะสม');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !post) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('กรุณาเข้าสู่ระบบก่อนส่งรายงาน');
      return;
    }

    // Cannot report own post
    if (currentUser.id === post.authorId) {
      setError('คุณไม่สามารถรายงานโพสต์ของตนเองได้');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await reportService.submitReport(
        currentUser.id,
        post.authorId,
        reason,
        details.trim(),
        post.id
      );

      // Exact Thai success message required by spec
      showToast('ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลชุมชน');
      setDetails('');
      setReason('เนื้อหาไม่เหมาะสม');
      onClose();
    } catch (err: any) {
      console.error('Error submitting post report:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการส่งรายงาน กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                รายงานโพสต์
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รายงานโพสต์ที่ไม่เหมาะสมหรือละเมิดกฎชุมชน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Post Snippet */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              โพสต์ที่รายงาน
            </span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {post.title || post.content.slice(0, 50)}
            </p>
            <span className="text-[11px] text-slate-500">
              โดย {post.authorName} ({post.authorUserId || 'สมาชิก'})
            </span>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              เหตุผลในการรายงาน <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    reason === r
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-900 dark:text-red-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-red-600 w-4 h-4"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="โปรดอธิบายเพิ่มเติมเกี่ยวกับปัญหาที่พบ เพื่อให้ทีมงานตรวจสอบได้อย่างถูกต้องและรวดเร็ว..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังส่ง...</span>
                </>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>ส่งรายงาน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
