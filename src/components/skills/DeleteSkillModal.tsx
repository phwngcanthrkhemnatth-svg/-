import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  skillName: string;
  isDeleting?: boolean;
}

export const DeleteSkillModal: React.FC<DeleteSkillModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  skillName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-delete-skill"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-delete-skill-content"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          id="btn-close-delete-modal"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              คุณต้องการลบทักษะนี้ใช่หรือไม่?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              การดำเนินการนี้จะลบรายการออกจากโปรไฟล์ของคุณ
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 mb-6">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            ทักษะที่จะลบ: <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">"{skillName}"</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            id="btn-cancel-delete-skill"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            id="btn-confirm-delete-skill"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                ยืนยันการลบ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
