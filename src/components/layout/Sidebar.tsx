import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewType } from '../../types';
import { AppLogo } from '../common/AppLogo';
import {
  LayoutDashboard,
  Compass,
  ArrowLeftRight,
  MessageSquare,
  Calendar,
  Bell,
  User,
  Sparkles,
  BookOpen,
  Flame,
  Star,
  LogOut,
  Shield,
  X,
  Users,
  Plus,
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    goToHome,
    unreadNotificationsCount,
    unreadMessagesCount,
    currentUser,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsCreatePostModalOpen,
  } = useApp();

  const primaryNavItems: NavItem[] = [
    { id: 'home', label: 'หน้าหลัก', icon: LayoutDashboard },
    { id: 'community', label: 'ชุมชนและฟีด', icon: Flame },
    { id: 'friends', label: 'เพื่อนและสมาชิก', icon: Users },
    { id: 'find-skills', label: 'ค้นหาทักษะ', icon: Compass },
    { id: 'requests', label: 'คำขอแลกเปลี่ยน', icon: ArrowLeftRight },
    { id: 'chat', label: 'แชต', icon: MessageSquare, badgeCount: unreadMessagesCount },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell, badgeCount: unreadNotificationsCount },
    { id: 'settings', label: 'โปรไฟล์', icon: User },
  ];

  // Secondary tools
  const secondaryNavItems: NavItem[] = [
    { id: 'my-skills', label: 'ทักษะของฉัน', icon: BookOpen },
    { id: 'reviews', label: 'รีวิว & ความคิดเห็น', icon: Star },
  ];

  const handleNavClick = (viewId: ViewType) => {
    if (viewId === 'home') {
      goToHome();
    } else {
      setCurrentView(viewId);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 z-50 md:z-30 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-transform duration-200 ease-in-out shrink-0 flex flex-col justify-between ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" showText showBadge />
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {/* Quick Create Post Action Button */}
          <button
            type="button"
            id="sidebar-create-post-btn"
            onClick={() => {
              setIsCreatePostModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างโพสต์</span>
          </button>

          {/* Main Group */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              เมนูหลัก
            </div>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badgeCount !== undefined && item.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-indigo-700'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Group */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              เครื่องมือเพิ่มเติม
            </div>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Admin link if user is admin */}
          {currentUser?.role === 'admin' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                id="sidebar-nav-admin"
                onClick={() => handleNavClick('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>แผงควบคุมระบบ (Admin)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          {currentUser && (
            <button
              type="button"
              id="sidebar-logout"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          )}

          <div className="px-3 text-[10px] text-slate-400">
            SkillsWop Platform TH v1.0
          </div>
        </div>
      </aside>
    </>
  );
};
