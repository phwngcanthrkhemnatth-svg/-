import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProvinceSelect } from '../components/common/ProvinceSelect';
import { LearningMode } from '../types';
import { UserAvatar } from '../components/common/UserAvatar';
import { Sparkles, ArrowRight, Camera, Upload, Phone, MapPin } from 'lucide-react';

export const ProfileSetupView: React.FC = () => {
  const { currentUser, updateProfile, setCurrentView } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [province, setProvince] = useState(currentUser?.province || currentUser?.location || 'กรุงเทพมหานคร');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [learningMode, setLearningMode] = useState<LearningMode>(currentUser?.learningMode || 'Both');
  const [profileImage, setProfileImage] = useState(
    currentUser?.profileImage ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        name,
        bio,
        province,
        location: province,
        phone,
        learningMode,
        profileImage,
      });
      setCurrentView('my-skills');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ตั้งค่าโปรไฟล์ผู้ใช้งาน SkillsWop</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">ข้อมูลส่วนตัวของคุณ</h2>
          <p className="text-xs text-slate-500 mt-1">
            ข้อมูลนี้จะบันทึกลงใน Firestore Collection `users` เพื่อให้สมาชิกคนอื่นรู้จักและแลกเปลี่ยนทักษะกับคุณ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar selector */}
          <div className="text-center space-y-3">
            <div className="inline-block relative group">
              <UserAvatar src={profileImage} name={name} size="xl" className="ring-4 ring-indigo-100 dark:ring-indigo-950" />
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                เลือกรูปสำเร็จรูป หรืออัปโหลดรูปจากเครื่องของคุณ
              </label>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProfileImage(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                      profileImage === url ? 'border-indigo-600 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อ-นามสกุล / ชื่อเล่น
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>เบอร์โทรศัพท์ (ถ้ามี สำหรับการติดต่อประสานงาน)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              เกี่ยวกับตัวคุณ (Bio แนะนำตัว ความสนใจ และเป้าหมายการแลกเปลี่ยน)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="บอกเล่าประสบการณ์ ความเชี่ยวชาญ หรือสิ่งที่อยากเรียนรู้เพิ่มเติม..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Province & Learning Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ProvinceSelect
                label="จังหวัดของคุณ (ครบ 77 จังหวัด)"
                value={province}
                onChange={setProvince}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                รูปแบบการแลกเปลี่ยนที่สะดวก
              </label>
              <select
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as LearningMode)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Online">Online (ออนไลน์เท่านั้น)</option>
                <option value="On-site">On-site (พบกันสถานที่จริง)</option>
                <option value="Both">Both (ได้ทั้งสองรูปแบบ)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>กำลังบันทึกข้อมูล...</span>
              ) : (
                <>
                  <span>บันทึกและไปจัดการทักษะของฉัน (My Skills)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
