import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAvatar } from '../common/UserAvatar';
import { DemoUserSwitcher } from '../common/DemoUserSwitcher';
import { AppLogo } from '../common/AppLogo';
import {
  Sparkles,
  Bell,
  MessageSquare,
  Menu,
  X,
  Compass,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  Settings,
  ArrowLeftRight,
  LogIn,
  UserPlus,
  Flame,
  Users,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    goToHome,
    unreadNotificationsCount,
    unreadMessagesCount,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useApp();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Slogan */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="nav-logo"
            onClick={() => (currentUser ? goToHome() : setCurrentView('login'))}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <AppLogo size="md" className="shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SkillsWop
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800">
                  TH
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 font-normal">
                แลกเปลี่ยนทักษะ เรียนรู้สิ่งใหม่ เติบโตไปด้วยกัน
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Navigation according to Auth Status */}
        {currentUser ? (
          /* ========================================================= */
          /* LOGGED IN NAVIGATION:                                     */
          /* หน้าหลัก, ค้นหาทักษะ, คำขอแลกเปลี่ยน, แชต, ตารางนัดหมาย,  */
          /* การแจ้งเตือน, โปรไฟล์                                      */
          /* ========================================================= */
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {/* 1. หน้าหลัก */}
            <button
              type="button"
              id="nav-link-home"
              onClick={() => goToHome()}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>หน้าหลัก</span>
            </button>

            {/* ชุมชน & ฟีด */}
            <button
              type="button"
              id="nav-link-community"
              onClick={() => setCurrentView('community')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'community'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500" />
              <span>ชุมชน</span>
            </button>

            {/* เพื่อน & สมาชิก */}
            <button
              type="button"
              id="nav-link-friends"
              onClick={() => setCurrentView('friends')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'friends'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>เพื่อน</span>
            </button>

            {/* 2. ค้นหาทักษะ */}
            <button
              type="button"
              id="nav-link-find-skills"
              onClick={() => setCurrentView('find-skills')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'find-skills'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>ค้นหาทักษะ</span>
            </button>

            {/* 3. คำขอแลกเปลี่ยน */}
            <button
              type="button"
              id="nav-link-requests"
              onClick={() => setCurrentView('requests')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'requests'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>คำขอแลกเปลี่ยน</span>
            </button>

            {/* 4. แชต */}
            <button
              type="button"
              id="nav-link-chat"
              onClick={() => setCurrentView('chat')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer relative ${
                currentView === 'chat'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>แชต</span>
              {unreadMessagesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* 5. การแจ้งเตือน */}
            <button
              type="button"
              id="nav-link-notifications"
              onClick={() => setCurrentView('notifications')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer relative ${
                currentView === 'notifications'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>การแจ้งเตือน</span>
              {unreadNotificationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* 6. โปรไฟล์ */}
            <button
              type="button"
              id="nav-link-profile"
              onClick={() => setCurrentView('settings')}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'settings'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>โปรไฟล์</span>
            </button>
          </nav>
        ) : (
          /* ========================================================= */
          /* PUBLIC NAVIGATION (ยังไม่ Login):                            */
          /* หน้าแรก, เข้าสู่ระบบ, สมัครสมาชิก                           */
          /* ========================================================= */
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              id="nav-link-home"
              onClick={() => setCurrentView('home')}
              className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/60'
                  : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              หน้าแรก
            </button>
          </nav>
        )}

        {/* Right Section: Auth buttons / User avatar menu / Demo Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo User Switcher */}
          <DemoUserSwitcher />

          {currentUser ? (
            /* Logged in User Profile Dropdown */
            <div className="relative">
              <button
                type="button"
                id="btn-nav-profile"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 transition-all cursor-pointer"
              >
                <UserAvatar
                  src={currentUser.profileImage}
                  name={currentUser.name}
                  size="sm"
                  isOnline={currentUser.isOnline}
                />
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {currentUser.role === 'admin' ? '🛡️ ผู้ดูแลระบบ' : '🎓 สมาชิก'}
                        </span>
                        {currentUser.province && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            📍 {currentUser.province}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1 text-xs text-slate-700 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => {
                          goToHome();
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        หน้าหลัก
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentView('settings');
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        โปรไฟล์ & ตั้งค่าบัญชี
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentView('admin');
                            setIsProfileOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-indigo-600 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          ระบบผู้ดูแล (Admin)
                        </button>
                      )}
                    </div>

                    {/* Logout Button in User Menu */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        type="button"
                        id="btn-nav-logout"
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Unauthenticated Action Buttons: เข้าสู่ระบบ / สมัครสมาชิก */
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-nav-login"
                onClick={() => setCurrentView('login')}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </button>

              <button
                type="button"
                id="btn-nav-register"
                onClick={() => setCurrentView('register')}
                className="px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-xs shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>สมัครสมาชิก</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle button (only when logged in to toggle sidebar, or for guest links) */}
          {currentUser ? (
            <button
              type="button"
              id="btn-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="เมนูหลัก"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};
