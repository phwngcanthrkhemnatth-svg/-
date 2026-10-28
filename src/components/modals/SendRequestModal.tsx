import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserSkill, isTeachSkill } from '../../types';
import { skillService } from '../../services/skillService';
import { exchangeRequestService } from '../../services/exchangeRequestService';
import { UserAvatar } from '../common/UserAvatar';
import { X, Send, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SendRequestModal: React.FC = () => {
  const {
    selectedUserForRequestModal,
    setSelectedUserForRequestModal,
    currentUser,
    showToast,
    setCurrentView,
  } = useApp();

  const recipient = selectedUserForRequestModal;

  const [myTeachSkills, setMyTeachSkills] = useState<UserSkill[]>([]);
  const [partnerTeachSkills, setPartnerTeachSkills] = useState<UserSkill[]>([]);
  const [selectedOfferedSkill, setSelectedOfferedSkill] = useState('');
  const [selectedRequestedSkill, setSelectedRequestedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser || !recipient) return;

    Promise.all([
      skillService.getUserSkills(currentUser.id),
      skillService.getUserSkills(recipient.id),
    ]).then(([mySkills, pSkills]) => {
      const myTeach = mySkills.filter((s) => isTeachSkill(s.type));
      const partnerTeach = pSkills.filter((s) => isTeachSkill(s.type));

      setMyTeachSkills(myTeach);
      setPartnerTeachSkills(partnerTeach);

      if (myTeach.length > 0) setSelectedOfferedSkill(myTeach[0].skillName);
      if (partnerTeach.length > 0) setSelectedRequestedSkill(partnerTeach[0].skillName);

      setMessage(
        `สวัสดีครับ/ค่ะ คุณ${recipient.name.split(' ')[0]} ผม/ฉัน สนใจอยากแลกเปลี่ยนทักษะกับคุณ สะดวกพูดคุยและแลกเปลี่ยนความรู้ทางออนไลน์ร่วมกันครับ`
      );
    });
  }, [currentUser, recipient]);

  if (!recipient || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferedSkill || !selectedRequestedSkill) {
      showToast('กรุณาเลือกทักษะที่ต้องการแลกเปลี่ยนทั้งสองฝ่าย');
      return;
    }

    setIsSubmitting(true);
    try {
      await exchangeRequestService.sendRequest(
        currentUser.id,
        recipient.id,
        selectedOfferedSkill,
        selectedRequestedSkill,
        message
      );

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      showToast(`ส่งคำขอแลกเปลี่ยนทักษะไปยังคุณ ${recipient.name} เรียบร้อยแล้ว! 🚀`);
      setSelectedUserForRequestModal(null);
      setCurrentView('requests');
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการส่งคำขอ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              ส่งคำขอแลกเปลี่ยนทักษะ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แลกเปลี่ยนความรู้ซึ่งกันและกันโดยไม่มีค่าใช้จ่าย
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedUserForRequestModal(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target partner banner */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <UserAvatar src={recipient.profileImage} name={recipient.name} size="md" />
            <div>
              <div className="text-xs text-slate-400">ส่งคำขอถึง</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {recipient.name}
              </div>
              <div className="text-[11px] text-slate-500">{recipient.province}</div>
            </div>
          </div>

          {/* Skill exchange selector pairing */}
          <div className="space-y-3">
            {/* 1. Skill I offer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                ทักษะที่คุณจะสอนให้เขา (Offered Skill)
              </label>
              {myTeachSkills.length > 0 ? (
                <select
                  value={selectedOfferedSkill}
                  onChange={(e) => setSelectedOfferedSkill(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  {myTeachSkills.map((s) => (
                    <option key={s.id} value={s.skillName}>
                      {s.skillName} ({s.level || 'Intermediate'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-rose-500 p-2 bg-rose-50 rounded-lg">
                  คุณยังไม่ได้เพิ่มทักษะที่คุณสอนได้ กรุณาเพิ่มทักษะในหน้า "ทักษะของฉัน" ก่อน
                </div>
              )}
            </div>

            <div className="flex items-center justify-center -my-1 text-slate-400">
              <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <ArrowRight className="w-4 h-4 text-indigo-600 rotate-90 sm:rotate-0" />
              </div>
            </div>

            {/* 2. Skill I want to learn */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                ทักษะที่คุณต้องการให้เขาสอนคุณ (Requested Skill)
              </label>
              {partnerTeachSkills.length > 0 ? (
                <select
                  value={selectedRequestedSkill}
                  onChange={(e) => setSelectedRequestedSkill(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  {partnerTeachSkills.map((s) => (
                    <option key={s.id} value={s.skillName}>
                      {s.skillName} ({s.level || 'Intermediate'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-500 p-2 bg-slate-100 rounded-lg">
                  ผู้ใช้ยังไม่ได้ระบุทักษะที่สามารถสอน
                </div>
              )}
            </div>
          </div>

          {/* Message input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ข้อความแนะนำตัวและเป้าหมายการแลกเปลี่ยน
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="พิมพ์ข้อความแนะนำตัว เป้าหมาย หรือเวลาที่สะดวก..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedUserForRequestModal(null)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || myTeachSkills.length === 0}
              className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'กำลังส่งคำขอ...' : 'ยืนยันและส่งคำขอ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
