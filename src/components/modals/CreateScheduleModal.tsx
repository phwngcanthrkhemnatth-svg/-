import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, ScheduleType } from '../../types';
import { scheduleService } from '../../services/scheduleService';
import { UserAvatar } from '../common/UserAvatar';
import { X, Calendar, Clock, MapPin, Link2 } from 'lucide-react';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: User[];
  defaultPartnerId?: string;
  onCreated?: () => void;
}

export const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  isOpen,
  onClose,
  partners,
  defaultPartnerId,
  onCreated,
}) => {
  const { currentUser, showToast } = useApp();

  const [partnerId, setPartnerId] = useState(defaultPartnerId || (partners[0]?.id || ''));
  const [title, setTitle] = useState('นัดหมายแลกเปลี่ยนทักษะ SkillSwap');
  const [date, setDate] = useState('2026-03-15');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [type, setType] = useState<ScheduleType>('Online');
  const [location, setLocation] = useState('True Digital Park, สุขุมวิท 101');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/skillswap-session');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) {
      alert('กรุณาเลือกคู่แลกเปลี่ยน');
      return;
    }

    setIsSubmitting(true);
    try {
      await scheduleService.createSchedule({
        userId: currentUser.id,
        partnerId,
        title,
        date,
        startTime,
        endTime,
        type,
        location: type === 'On-site' ? location : undefined,
        meetingLink: type === 'Online' ? meetingLink : undefined,
      });

      showToast('สร้างนัดหมายสำเร็จ และส่งการแจ้งเตือนไปยังคู่แลกเปลี่ยนแล้ว! 📅');
      onCreated?.();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการสร้างนัดหมาย');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
            <Calendar className="w-4 h-4 text-indigo-600" />
            สร้างนัดหมายการแลกเปลี่ยนใหม่
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Select Partner */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              คู่แลกเปลี่ยนทักษะ
            </label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.province})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              หัวข้อนัดหมาย
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แลกเปลี่ยน Photoshop & English"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                วันที่
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เวลาเริ่ม
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                สิ้นสุด
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              รูปแบบการพบกัน
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('Online')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'Online'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                ออนไลน์ (Online)
              </button>
              <button
                type="button"
                onClick={() => setType('On-site')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'On-site'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                พบกันสถานที่จริง (On-site)
              </button>
            </div>
          </div>

          {/* Conditional URL or Location */}
          {type === 'Online' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-blue-500" />
                ลิงก์ห้องประชุม (Google Meet / Zoom / Discord)
              </label>
              <input
                type="url"
                required
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                สถานที่นัดพบ
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น ร้านกาแฟ คาเฟ่ หรือ Co-working space"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'สร้างนัดหมาย'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
