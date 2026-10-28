import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ProvinceSelect } from '../components/common/ProvinceSelect';
import { LearningMode, UserSkill } from '../types';
import { UserAvatar } from '../components/common/UserAvatar';
import { skillService, normalizeSkillType } from '../services/skillService';
import { SkillLevelBadge } from '../components/common/Badge';
import { SkillFormModal } from '../components/skills/SkillFormModal';
import { DeleteSkillModal } from '../components/skills/DeleteSkillModal';
import {
  User,
  Sparkles,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Save,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  Lock,
  LogOut,
  Camera,
  CheckCircle,
  Trash2,
  Edit2,
} from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, resetPassword, logout, showToast, setCurrentView } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [province, setProvince] = useState(
    currentUser?.province || currentUser?.location || 'กรุงเทพมหานคร'
  );
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [learningMode, setLearningMode] = useState<LearningMode>(
    currentUser?.learningMode || 'Online'
  );
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '');

  // Skills
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // Skill Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [formDefaultType, setFormDefaultType] = useState<'canTeach' | 'wantToLearn'>('canTeach');

  // Skill Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<UserSkill | null>(null);
  const [isDeletingSkill, setIsDeletingSkill] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize state when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setBio(currentUser.bio || '');
      setProvince(currentUser.province || currentUser.location || 'กรุงเทพมหานคร');
      setPhone(currentUser.phone || '');
      setLearningMode(currentUser.learningMode || 'Both');
      setProfileImage(currentUser.profileImage || '');
    }
  }, [currentUser]);

  // Fetch current user's skills
  useEffect(() => {
    if (!currentUser) return;
    const fetchSkills = async () => {
      setSkillsLoading(true);
      try {
        const skills = await skillService.getUserSkills(currentUser.id);
        setUserSkills(skills);
      } catch (err) {
        console.error('Error fetching user skills:', err);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
  }, [currentUser]);

  if (!currentUser) return null;

  const teachSkills = userSkills.filter((s) => normalizeSkillType(s.type) === 'canTeach');
  const learnSkills = userSkills.filter((s) => normalizeSkillType(s.type) === 'wantToLearn');

  const handleOpenAddSkill = (type: 'canTeach' | 'wantToLearn' = 'canTeach') => {
    setEditingSkill(null);
    setFormDefaultType(type);
    setIsFormModalOpen(true);
  };

  const handleOpenEditSkill = (skill: UserSkill) => {
    setEditingSkill(skill);
    setFormDefaultType(normalizeSkillType(skill.type));
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteSkill = (skill: UserSkill) => {
    setSkillToDelete(skill);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteSkill = async () => {
    if (!skillToDelete) return;
    const targetId = skillToDelete.userSkillId || skillToDelete.id;
    setIsDeletingSkill(true);
    try {
      await skillService.deleteUserSkill(targetId);
      setUserSkills((prev) => prev.filter((s) => s.userSkillId !== targetId && s.id !== targetId));
      showToast('ลบทักษะสำเร็จ');
      setIsDeleteModalOpen(false);
      setSkillToDelete(null);
    } catch (err) {
      console.error('Error deleting skill:', err);
      showToast('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsDeletingSkill(false);
    }
  };

  const handleSkillSaved = (savedSkill: UserSkill, isEdit: boolean) => {
    if (isEdit) {
      setUserSkills((prev) =>
        prev.map((s) =>
          (s.userSkillId === savedSkill.userSkillId || s.id === savedSkill.userSkillId)
            ? savedSkill
            : s
        )
      );
      showToast('แก้ไขทักษะสำเร็จ');
    } else {
      setUserSkills((prev) => [savedSkill, ...prev]);
      showToast('เพิ่มทักษะสำเร็จ');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result;
      if (typeof result === 'string') {
        setProfileImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        province: province || 'กรุงเทพมหานคร',
        location: province || 'กรุงเทพมหานคร',
        phone: phone.trim(),
        learningMode,
        profileImage,
      });
      setIsEditing(false);
      showToast('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว ✅');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(currentUser.name);
    setBio(currentUser.bio || '');
    setProvince(currentUser.province || currentUser.location || 'กรุงเทพมหานคร');
    setPhone(currentUser.phone || '');
    setLearningMode(currentUser.learningMode || 'Both');
    setProfileImage(currentUser.profileImage || '');
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) {
      showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setPasswordLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        showToast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย 🔒');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        await resetPassword(currentUser.email);
        showToast(`ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยัง ${currentUser.email} แล้ว`);
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      if (err.code === 'auth/requires-recent-login') {
        await resetPassword(currentUser.email);
        showToast('ส่งอีเมลรีเซ็ตรหัสผ่านไปยังกล่องข้อความของคุณแล้ว');
      } else {
        showToast(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const getLearningModeLabel = (mode: LearningMode) => {
    if (mode === 'Online') return 'ออนไลน์ (Online)';
    if (mode === 'On-site') return 'พบกันสถานที่จริง (On-site)';
    return 'ได้ทั้งสองรูปแบบ (Online & On-site)';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            โปรไฟล์ของฉัน (My Profile)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            จัดการข้อมูลส่วนตัว ทักษะที่คุณเปิดสอน และทักษะที่ต้องการเรียนรู้
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            id="btn-edit-profile-top"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            แก้ไขโปรไฟล์
          </button>
        )}
      </div>

      {/* ส่วนบน: ข้อมูลโปรไฟล์ / โหมดดูข้อมูล หรือ แก้ไข */}
      {!isEditing ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="relative mx-auto sm:mx-0 shrink-0">
              <UserAvatar
                src={currentUser.profileImage}
                name={currentUser.name}
                size="xl"
                className="ring-4 ring-indigo-50 dark:ring-indigo-950/60"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {currentUser.email}
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {/* แสดงจังหวัดชัดเจน */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-100 dark:border-indigo-900">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    {currentUser.province || currentUser.location || 'กรุงเทพมหานคร'}
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                    {getLearningModeLabel(currentUser.learningMode)}
                  </span>
                </div>
              </div>

              {/* คำแนะนำตัว (Bio) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  คำแนะนำตัว
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl">
                  {currentUser.bio || 'ยังไม่มีคำแนะนำตัว แตะ "แก้ไขโปรไฟล์" เพื่อเขียนคำแนะนำตัวของคุณ'}
                </p>
              </div>

              {currentUser.phone && (
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  เบอร์ติดต่อ: <strong className="text-slate-700 dark:text-slate-300">{currentUser.phone}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Form แก้ไขโปรไฟล์ */
        <form
          onSubmit={handleSaveProfile}
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              แก้ไขข้อมูลโปรไฟล์
            </h2>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* รูปโปรไฟล์ */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <UserAvatar
                src={profileImage}
                name={name}
                size="xl"
                className="ring-4 ring-indigo-100 dark:ring-indigo-950"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                URL รูปโปรไฟล์ หรือแตะไอคอนกล้องเพื่ออัปโหลด
              </label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ชื่อ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ชื่อ-นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ระบุชื่อของคุณ"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* เบอร์โทร */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>เบอร์โทรศัพท์ (ถ้ามี)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* จังหวัด - SEARCHABLE DROPDOWN 77 PROVINCES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ProvinceSelect
                label="จังหวัดของคุณ (ครบทั้ง 77 จังหวัด)"
                value={province}
                onChange={setProvince}
                required
              />
            </div>

            {/* รูปแบบการแลกเปลี่ยน */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รูปแบบการแลกเปลี่ยนที่สะดวก
              </label>
              <select
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as LearningMode)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Online">Online (ออนไลน์เท่านั้น)</option>
                <option value="On-site">On-site (พบกันสถานที่จริง)</option>
                <option value="Both">Both (ได้ทั้งสองรูปแบบ)</option>
              </select>
            </div>
          </div>

          {/* คำแนะนำตัว */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              คำแนะนำตัว (Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="แนะนำตัวเอง ประสบการณ์ ทักษะที่เชี่ยวชาญ และความตั้งใจในการแลกเปลี่ยนความรู้..."
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* ปุ่มบันทึก & ยกเลิก */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโปรไฟล์'}
            </button>
          </div>
        </form>
      )}

      {/* ส่วนทักษะ: ทักษะที่มี & ทักษะที่ต้องการเรียนรู้ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ทักษะที่มี (พร้อมสอน) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">ทักษะที่มี (พร้อมสอน)</h3>
                  <p className="text-[11px] text-slate-400">ระบุระดับความเชี่ยวชาญ</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-profile-add-teach-skill"
                onClick={() => handleOpenAddSkill('canTeach')}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + เพิ่มทักษะ
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {skillsLoading ? (
                <p className="text-xs text-slate-400 text-center py-4">กำลังโหลดข้อมูลทักษะ...</p>
              ) : teachSkills.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <p>ยังไม่มีทักษะที่คุณพร้อมสอน</p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddSkill('canTeach')}
                    className="mt-2 text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    + เพิ่มทักษะที่คุณชำนาญ
                  </button>
                </div>
              ) : (
                teachSkills.map((sk) => {
                  const targetId = sk.userSkillId || sk.id;
                  return (
                    <div
                      key={targetId}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {sk.skillName}
                          </p>
                          <SkillLevelBadge level={sk.level} />
                        </div>
                        {sk.categoryName && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sk.categoryName}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          id={`btn-profile-edit-teach-${targetId}`}
                          onClick={() => handleOpenEditSkill(sk)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-indigo-500" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          id={`btn-profile-delete-teach-${targetId}`}
                          onClick={() => handleOpenDeleteSkill(sk)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('my-skills')}
            className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            จัดการทักษะที่พร้อมสอนทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ทักษะที่ต้องการเรียนรู้ (อยากเรียน) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">ทักษะที่ต้องการเรียนรู้</h3>
                  <p className="text-[11px] text-slate-400">เป้าหมายการพัฒนาตนเอง</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-profile-add-learn-skill"
                onClick={() => handleOpenAddSkill('wantToLearn')}
                className="text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + เพิ่มทักษะ
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {skillsLoading ? (
                <p className="text-xs text-slate-400 text-center py-4">กำลังโหลดข้อมูลทักษะ...</p>
              ) : learnSkills.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  <p>ยังไม่มีทักษะที่คุณต้องการเรียนรู้</p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddSkill('wantToLearn')}
                    className="mt-2 text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    + เพิ่มทักษะที่คุณสนใจ
                  </button>
                </div>
              ) : (
                learnSkills.map((sk) => {
                  const targetId = sk.userSkillId || sk.id;
                  return (
                    <div
                      key={targetId}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {sk.skillName}
                          </p>
                          <SkillLevelBadge level={sk.level} />
                        </div>
                        {sk.categoryName && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sk.categoryName}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          id={`btn-profile-edit-learn-${targetId}`}
                          onClick={() => handleOpenEditSkill(sk)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-indigo-500" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          type="button"
                          id={`btn-profile-delete-learn-${targetId}`}
                          onClick={() => handleOpenDeleteSkill(sk)}
                          className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentView('my-skills')}
            className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            จัดการทักษะที่ต้องการเรียนรู้ทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
        userId={currentUser.id}
      />

      {/* Modal ยืนยันการลบทักษะ */}
      <DeleteSkillModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSkillToDelete(null);
        }}
        onConfirm={handleConfirmDeleteSkill}
        skillName={skillToDelete?.skillName || ''}
        isDeleting={isDeletingSkill}
      />

      {/* ส่วนความปลอดภัย & ออกจากระบบ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              ความปลอดภัยและบัญชี (Firebase Auth)
            </h3>
          </div>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-lg">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            เปลี่ยนรหัสผ่าน
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="ยืนยันรหัสผ่านใหม่"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading || !newPassword}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {passwordLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  );
};
