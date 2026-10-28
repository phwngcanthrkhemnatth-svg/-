import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { UserSkill, SkillLevel } from '../../types';
import { skillService, SKILL_LEVEL_OPTIONS, normalizeSkillType } from '../../services/skillService';

interface SkillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (skill: UserSkill, isEdit: boolean) => void;
  initialData?: UserSkill | null;
  defaultType?: 'canTeach' | 'wantToLearn';
  userId: string;
}

const CATEGORY_OPTIONS = [
  'ทั่วไป',
  'เทคโนโลยี & การเขียนโปรแกรม',
  'ภาษา & การสื่อสาร',
  'การออกแบบ & ศิลปะ',
  'ดนตรี & การแสดง',
  'อาหาร & เบเกอรี่',
  'ธุรกิจ & การตลาด',
  'ถ่ายภาพ & วิดีโอ',
  'สุขภาพ & การออกกำลังกาย',
  'งานช่าง & งานฝีมือ',
  'วิชาการ & ติวสอบ',
];

const POPULAR_SKILL_SUGGESTIONS: Record<string, string[]> = {
  'เทคโนโลยี & การเขียนโปรแกรม': ['React', 'TypeScript', 'Python', 'Web Development', 'SQL', 'Node.js', 'Flutter'],
  'ภาษา & การสื่อสาร': ['ภาษาอังกฤษ สนทนาทั่วไป', 'ภาษาญี่ปุ่น N5-N3', 'ภาษาจีน HSK', 'ภาษาเกาหลี', 'การนำเสนอ Public Speaking'],
  'การออกแบบ & ศิลปะ': ['Figma UI/UX', 'Adobe Photoshop', 'Illustrator', 'วาดรูป Digital Art', 'Canva for Work'],
  'อาหาร & เบเกอรี่': ['การทำเบเกอรี่พื้นฐาน', 'การชงกาแฟ Espresso & Drip', 'อาหารไทยต้นตำรับ', 'อาหารคลีนเพื่อสุขภาพ'],
  'ดนตรี & การแสดง': ['กีตาร์โปร่งสำหรับผู้เริ่มต้น', 'เปียโนพื้นฐาน', 'การร้องเพลงสากล', 'อูคูเลเล่'],
  'ถ่ายภาพ & วิดีโอ': ['การตัดต่อ Premiere Pro & CapCut', 'ถ่ายภาพบุคคล Portrait', 'เทคนิคจัดแสงวิดีโอ'],
};

export const SkillFormModal: React.FC<SkillFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData = null,
  defaultType = 'canTeach',
  userId,
}) => {
  const isEdit = Boolean(initialData);

  const [skillName, setSkillName] = useState('');
  const [type, setType] = useState<'canTeach' | 'wantToLearn'>('canTeach');
  const [category, setCategory] = useState('ทั่วไป');
  const [level, setLevel] = useState<SkillLevel>('ไม่ระบุ');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with initialData when opened or changed
  useEffect(() => {
    if (initialData) {
      setSkillName(initialData.skillName || '');
      setType(normalizeSkillType(initialData.type));
      setCategory(initialData.category || initialData.categoryName || 'ทั่วไป');
      setLevel(initialData.level || 'ไม่ระบุ');
      setDescription(initialData.description || '');
    } else {
      setSkillName('');
      setType(defaultType);
      setCategory('ทั่วไป');
      setLevel('ไม่ระบุ');
      setDescription('');
    }
    setErrorMessage(null);
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      setErrorMessage('กรุณาระบุชื่อทักษะ');
      return;
    }
    if (!userId) {
      setErrorMessage('ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isEdit && initialData) {
        const userSkillId = initialData.userSkillId || initialData.id;
        const updated = await skillService.updateUserSkill(userSkillId, {
          skillName: skillName.trim(),
          category: category.trim(),
          type,
          level,
          description: description.trim(),
        });
        onSaved(updated, true);
      } else {
        const created = await skillService.addUserSkill({
          userId,
          skillName: skillName.trim(),
          category: category.trim(),
          type,
          level,
          description: description.trim(),
        });
        onSaved(created, false);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving skill:', err);
      setErrorMessage(err?.message || 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestions = POPULAR_SKILL_SUGGESTIONS[category] || [];

  return (
    <div
      id="modal-skill-form"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-skill-form-content"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          id="btn-close-skill-modal"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? 'แก้ไขทักษะ' : '+ เพิ่มทักษะใหม่'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEdit
                ? 'ปรับปรุงรายละเอียดทักษะของคุณในระบบ'
                : 'ระบุทักษะที่คุณพร้อมแบ่งปันหรืออยากเรียนรู้จากสมาชิกคนอื่น'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ประเภททักษะ: พร้อมสอน หรือ อยากเรียน */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ประเภททักษะ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="btn-select-type-teach"
                onClick={() => setType('canTeach')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'canTeach'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    type === 'canTeach' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'
                  }`}
                >
                  {type === 'canTeach' && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                ทักษะที่พร้อมสอน
              </button>

              <button
                type="button"
                id="btn-select-type-learn"
                onClick={() => setType('wantToLearn')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'wantToLearn'
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    type === 'wantToLearn' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-400'
                  }`}
                >
                  {type === 'wantToLearn' && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                ทักษะที่อยากเรียน
              </button>
            </div>
          </div>

          {/* ชื่อทักษะ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ชื่อทักษะ <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">พิมพ์ทักษะเองได้อิสระ</span>
            </div>
            <input
              type="text"
              id="input-skill-name"
              required
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="เช่น การสนทนาภาษาอังกฤษ, React Native, ถ่ายภาพอาหาร..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-hidden"
            />

            {/* Quick Suggestions based on Category */}
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 mr-1">ทักษะยอดนิยม:</span>
                {suggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setSkillName(sug)}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* หมวดหมู่ & ระดับ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* หมวดหมู่ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                หมวดหมู่ทักษะ
              </label>
              <select
                id="select-skill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* ระดับทักษะ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ระดับทักษะ
              </label>
              <select
                id="select-skill-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as SkillLevel)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {SKILL_LEVEL_OPTIONS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* รายละเอียดเพิ่มเติม */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              id="textarea-skill-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุหัวข้อที่เน้น เช่น แลกเปลี่ยนการทำสไลด์นำเสนอ, สอนตั้งแต่ปูพื้นฐาน, หรือเป้าหมายที่อยากเรียนรู้..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="btn-cancel-skill-form"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              id="btn-submit-skill-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : isEdit ? (
                'บันทึกการแก้ไข'
              ) : (
                '+ เพิ่มทักษะ'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
