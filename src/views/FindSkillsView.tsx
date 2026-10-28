import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserSkill } from '../types';
import { userService } from '../services/userService';
import { skillService } from '../services/skillService';
import { INITIAL_CATEGORIES } from '../mock/initialData';
import { UserAvatar } from '../components/common/UserAvatar';
import { RatingStars } from '../components/common/RatingStars';
import { LearningModeBadge } from '../components/common/Badge';
import {
  Search,
  Sparkles,
  BookOpen,
  Send,
  Eye,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

export const FindSkillsView: React.FC = () => {
  const {
    currentUser,
    setSelectedUserForProfileModal,
    setSelectedUserForRequestModal,
  } = useApp();

  const [users, setUsers] = useState<User[]>([]);
  const [allSkills, setAllSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [uList, sList] = await Promise.all([
          userService.getAllUsers(),
          skillService.getAllUserSkills(),
        ]);
        setUsers(uList);
        setAllSkills(sList);
      } catch (err) {
        console.error('Error fetching find skills data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedMode('All');
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (currentUser && u.id === currentUser.id) return false;
      if (u.status === 'suspended') return false;

      // Filter by mode
      if (selectedMode !== 'All') {
        if (selectedMode === 'Online' && u.learningMode === 'On-site') return false;
        if (selectedMode === 'On-site' && u.learningMode === 'Online') return false;
      }

      // User's teach and learn skills
      const uSkills = allSkills.filter((s) => s.userId === u.id);
      const teachSkills = uSkills.filter((s) => s.type === 'teach');
      const learnSkills = uSkills.filter((s) => s.type === 'learn');

      // Filter by category
      if (selectedCategory !== 'All') {
        const hasCategory = teachSkills.some(
          (s) => (s.categoryName || (s as any).category) === selectedCategory
        );
        if (!hasCategory) return false;
      }

      // Filter by level
      if (selectedLevel !== 'All') {
        const hasLevel = teachSkills.some((s) => s.level === selectedLevel);
        if (!hasLevel) return false;
      }

      // Search query (matches name, bio, skill names)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchBio = (u.bio || '').toLowerCase().includes(q);
        const matchTeach = teachSkills.some((s) => s.skillName.toLowerCase().includes(q));
        const matchLearn = learnSkills.some((s) => s.skillName.toLowerCase().includes(q));

        if (!matchName && !matchBio && !matchTeach && !matchLearn) return false;
      }

      return true;
    });
  }, [
    users,
    allSkills,
    currentUser,
    searchQuery,
    selectedCategory,
    selectedLevel,
    selectedMode,
  ]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search className="w-6 h-6 text-indigo-600" />
          ค้นหาทักษะ (Explore Skills)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ค้นหาสมาชิกที่มีทักษะที่คุณอยากเรียนรู้ และแลกเปลี่ยนความรู้ซึ่งกันและกัน
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อทักษะ เช่น Photoshop, React, ภาษาอังกฤษ, เบเกอรี่ หรือค้นหาชื่อสมาชิก..."
            className="w-full pl-12 pr-12 py-3 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Filters Row: Category, Level, Learning Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <span>หมวดหมู่ทักษะ</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">ทุกหมวดหมู่</option>
              {INITIAL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              ระดับทักษะ
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">ทุกระดับทักษะ</option>
              <option value="Beginner">เริ่มต้น (Beginner)</option>
              <option value="Intermediate">ปานกลาง (Intermediate)</option>
              <option value="Advanced">เชี่ยวชาญ (Advanced)</option>
            </select>
          </div>

          {/* Learning Mode Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              รูปแบบการเรียน
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">ทุกรูปแบบ (Online / On-site)</option>
              <option value="Online">ออนไลน์เท่านั้น</option>
              <option value="On-site">พบเจอกัน (On-site)</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Action */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-500">
            พบสมาชิกทั้งหมด <strong className="text-slate-900 dark:text-slate-100">{filteredUsers.length}</strong> คน
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </div>

      {/* Users Results Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          กำลังค้นหาสมาชิกและทักษะ...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ลองเปลี่ยนคำค้นหา หรือเลือกจังหวัดอื่น เพื่อค้นหาเพื่อนร่วมแลกเปลี่ยนทักษะ
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900"
          >
            ล้างตัวกรองและดูทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((user) => {
            const userTeachSkills = allSkills.filter(
              (s) => s.userId === user.id && s.type === 'teach'
            );
            const userLearnSkills = allSkills.filter(
              (s) => s.userId === user.id && s.type === 'learn'
            );

            return (
              /* User Card */
              <div
                key={user.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Avatar, Name, Province */}
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      src={user.profileImage}
                      name={user.name}
                      size="md"
                      isOnline={user.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <LearningModeBadge mode={user.learningMode} />
                      </div>
                    </div>
                  </div>

                  {/* Rating & Exchange stats */}
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <RatingStars rating={user.rating} reviewCount={user.reviewCount} size="sm" />
                    <span className="text-[11px] text-slate-500">
                      แลกเปลี่ยนสำเร็จ <strong>{user.completedExchanges}</strong> ครั้ง
                    </span>
                  </div>

                  {/* Short Bio */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {user.bio || 'สมาชิก SkillsWop พร้อมแลกเปลี่ยนความรู้'}
                  </p>

                  {/* Skills tags with Level */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {/* Teach */}
                    <div>
                      <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        ทักษะที่พร้อมสอน ({userTeachSkills.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {userTeachSkills.slice(0, 3).map((sk) => (
                          <span
                            key={sk.id}
                            className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-100 dark:border-indigo-900 flex items-center gap-1"
                          >
                            <span>{sk.skillName}</span>
                            {sk.level && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-200/50 dark:bg-indigo-800/60 font-normal">
                                {sk.level}
                              </span>
                            )}
                          </span>
                        ))}
                        {userTeachSkills.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{userTeachSkills.length - 3}
                          </span>
                        )}
                        {userTeachSkills.length === 0 && (
                          <span className="text-[11px] text-slate-400">ยังไม่ได้ระบุ</span>
                        )}
                      </div>
                    </div>

                    {/* Learn */}
                    <div>
                      <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        อยากเรียนรู้ ({userLearnSkills.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {userLearnSkills.slice(0, 3).map((sk) => (
                          <span
                            key={sk.id}
                            className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-medium border border-purple-100 dark:border-purple-900"
                          >
                            {sk.skillName}
                          </span>
                        ))}
                        {userLearnSkills.length === 0 && (
                          <span className="text-[11px] text-slate-400">ยังไม่ได้ระบุ</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer: “ดูโปรไฟล์” และ “ส่งคำขอแลกเปลี่ยน” */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForProfileModal(user)}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    ดูโปรไฟล์
                  </button>
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => setSelectedUserForRequestModal(user)}
                      className="flex-1 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ส่งคำขอแลกเปลี่ยน
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
