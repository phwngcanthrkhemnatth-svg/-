import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserSkill } from '../types';
import { skillService, normalizeSkillType } from '../services/skillService';
import { SkillLevelBadge } from '../components/common/Badge';
import { SkillFormModal } from '../components/skills/SkillFormModal';
import { DeleteSkillModal } from '../components/skills/DeleteSkillModal';
import {
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MySkillsView: React.FC = () => {
  const { currentUser, showToast } = useApp();

  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'teach' | 'learn'>('all');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [formDefaultType, setFormDefaultType] = useState<'canTeach' | 'wantToLearn'>('canTeach');

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<UserSkill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user skills
  const loadSkills = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const list = await skillService.getUserSkills(currentUser.id);
      setSkills(list);
    } catch (err) {
      console.error('Error loading skills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [currentUser?.id]);

  // Handlers for Add/Edit
  const handleOpenAdd = (type: 'canTeach' | 'wantToLearn' = 'canTeach') => {
    setEditingSkill(null);
    setFormDefaultType(type);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (skill: UserSkill) => {
    setEditingSkill(skill);
    setFormDefaultType(normalizeSkillType(skill.type));
    setIsFormModalOpen(true);
  };

  const handleSkillSaved = (savedSkill: UserSkill, isEdit: boolean) => {
    if (isEdit) {
      setSkills((prev) =>
        prev.map((s) =>
          (s.userSkillId === savedSkill.userSkillId || s.id === savedSkill.userSkillId)
            ? savedSkill
            : s
        )
      );
      showToast('แก้ไขทักษะสำเร็จ');
    } else {
      setSkills((prev) => [savedSkill, ...prev]);
      showToast('เพิ่มทักษะสำเร็จ');
    }
    // Re-sync with Firestore quietly
    loadSkills();
  };

  // Handlers for Delete
  const handleOpenDelete = (skill: UserSkill) => {
    setSkillToDelete(skill);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete) return;
    const targetId = skillToDelete.userSkillId || skillToDelete.id;
    setIsDeleting(true);

    try {
      // 1. Delete from Firestore permanently
      await skillService.deleteUserSkill(targetId);

      // 2. Immediately update local state without refreshing
      setSkills((prev) =>
        prev.filter((s) => s.userSkillId !== targetId && s.id !== targetId)
      );

      showToast('ลบทักษะสำเร็จ');
      setIsDeleteModalOpen(false);
      setSkillToDelete(null);
    } catch (err) {
      console.error('Error deleting skill:', err);
      showToast('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter skills
  const teachSkills = skills.filter((s) => normalizeSkillType(s.type) === 'canTeach');
  const learnSkills = skills.filter((s) => normalizeSkillType(s.type) === 'wantToLearn');

  const filteredSkills = skills.filter((s) => {
    const normType = normalizeSkillType(s.type);
    if (activeTab === 'teach' && normType !== 'canTeach') return false;
    if (activeTab === 'learn' && normType !== 'wantToLearn') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.skillName.toLowerCase().includes(q);
      const matchCat = (s.category || s.categoryName || '').toLowerCase().includes(q);
      const matchDesc = (s.description || '').toLowerCase().includes(q);
      return matchName || matchCat || matchDesc;
    }
    return true;
  });

  return (
    <div id="view-my-skills" className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>ระบบจัดการทักษะผู้ใช้งาน</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ทักษะของฉัน (My Skills)
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl">
              จัดการทักษะที่คุณพร้อมแบ่งปันความรู้ และทักษะที่คุณอยากเรียนรู้ เพื่อให้ระบบค้นหาและแนะนำคู่แลกเปลี่ยนออนไลน์ที่ตรงใจ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-add-skill-teach-top"
              onClick={() => handleOpenAdd('canTeach')}
              className="px-4 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มทักษะพร้อมสอน</span>
            </button>
            <button
              type="button"
              id="btn-add-skill-learn-top"
              onClick={() => handleOpenAdd('wantToLearn')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มทักษะอยากเรียน</span>
            </button>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center sm:text-left">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] text-indigo-300 block font-medium">พร้อมสอนทั้งหมด</span>
            <span className="text-xl font-black text-white">{teachSkills.length} ทักษะ</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] text-emerald-300 block font-medium">อยากเรียนทั้งหมด</span>
            <span className="text-xl font-black text-white">{learnSkills.length} ทักษะ</span>
          </div>
          <div className="hidden sm:block bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] text-slate-300 block font-medium">รวมในระบบ</span>
            <span className="text-xl font-black text-white">{skills.length} รายการ</span>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            id="tab-skills-all"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({skills.length})
          </button>
          <button
            type="button"
            id="tab-skills-teach"
            onClick={() => setActiveTab('teach')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'teach'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>พร้อมสอน ({teachSkills.length})</span>
          </button>
          <button
            type="button"
            id="tab-skills-learn"
            onClick={() => setActiveTab('learn')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'learn'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>อยากเรียน ({learnSkills.length})</span>
          </button>
        </div>

        {/* Search Input & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-my-skills"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือหมวดหมู่ทักษะ..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <button
            type="button"
            id="btn-add-skill-main"
            onClick={() => handleOpenAdd(activeTab === 'learn' ? 'wantToLearn' : 'canTeach')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ เพิ่มทักษะ</span>
            <span className="sm:hidden">+ เพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            กำลังโหลดข้อมูลทักษะของคุณจาก Firebase Firestore...
          </p>
        </div>
      ) : filteredSkills.length === 0 ? (
        /* Empty State ภาษาไทย */
        <div
          id="empty-state-my-skills"
          className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? 'ไม่พบทักษะที่ตรงกับคำค้นหา' : 'ยังไม่มีข้อมูลทักษะในหมวดนี้'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              {searchQuery
                ? 'ลองตรวจสอบการสะกด หรือค้นหาด้วยคำอื่น หรือคลิกปุ่มเพิ่มทักษะใหม่ด้านล่าง'
                : 'เริ่มต้นเพิ่มทักษะที่คุณชำนาญพร้อมสอน หรือทักษะที่คุณใฝ่ฝันอยากเรียนรู้ เพื่อเปิดประตูสู่การแลกเปลี่ยนความรู้ออนไลน์'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              id="btn-empty-add-teach"
              onClick={() => handleOpenAdd('canTeach')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มทักษะพร้อมสอน</span>
            </button>
            <button
              type="button"
              id="btn-empty-add-learn"
              onClick={() => handleOpenAdd('wantToLearn')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มทักษะอยากเรียน</span>
            </button>
          </div>
        </div>
      ) : (
        /* Skill Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skill) => {
            const isTeach = normalizeSkillType(skill.type) === 'canTeach';
            const userSkillId = skill.userSkillId || skill.id;

            return (
              <div
                key={userSkillId}
                id={`skill-card-${userSkillId}`}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Type Badge & Category */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        isTeach
                          ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                      }`}
                    >
                      {isTeach ? (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>ทักษะที่พร้อมสอน</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3 h-3" />
                          <span>ทักษะที่อยากเรียน</span>
                        </>
                      )}
                    </span>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span>{skill.category || skill.categoryName || 'ทั่วไป'}</span>
                    </span>
                  </div>

                  {/* Skill Name */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {skill.skillName}
                  </h3>

                  {/* Level Badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <SkillLevelBadge level={skill.level} />
                  </div>

                  {/* Description */}
                  {skill.description ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                      {skill.description}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mt-2.5">
                      ไม่มีรายละเอียดเพิ่มเติม
                    </p>
                  )}
                </div>

                {/* Card Footer: Action Buttons (แก้ไข & ลบ) */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    รหัส: {userSkillId.substring(0, 10)}...
                  </span>

                  <div className="flex items-center gap-2">
                    {/* ปุ่มแก้ไข */}
                    <button
                      type="button"
                      id={`btn-edit-skill-${userSkillId}`}
                      onClick={() => handleOpenEdit(skill)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลทักษะนี้"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>แก้ไข</span>
                    </button>

                    {/* ปุ่มลบ */}
                    <button
                      type="button"
                      id={`btn-delete-skill-${userSkillId}`}
                      onClick={() => handleOpenDelete(skill)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="ลบทักษะนี้ออกจากระบบ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal เพิ่ม / แก้ไขทักษะ */}
      <SkillFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingSkill(null);
        }}
        onSaved={handleSkillSaved}
        initialData={editingSkill}
        defaultType={formDefaultType}
        userId={currentUser?.id || ''}
      />

      {/* Modal ยืนยันการลบ */}
      <DeleteSkillModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSkillToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        skillName={skillToDelete?.skillName || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};
