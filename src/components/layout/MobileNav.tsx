import React from 'react';
import { useApp } from '../../context/AppContext';
import { ViewType } from '../../types';
import {
  Home,
  Compass,
  ArrowLeftRight,
  MessageSquare,
  User,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentView, setCurrentView, goToHome, unreadMessagesCount, currentUser } = useApp();

  if (
    !currentUser ||
    currentView === 'login' ||
    currentView === 'register'
  ) {
    return null;
  }

  // Mobile Bottom Navigation: Most frequent tasks for on-the-go usage
  const tabs: {
    id: ViewType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'find-skills', label: 'ค้นหา', icon: Compass },
    { id: 'requests', label: 'คำขอ', icon: ArrowLeftRight },
    { id: 'chat', label: 'แชต', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'settings', label: 'โปรไฟล์', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-1 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            id={`mobile-nav-${tab.id}`}
            onClick={() => {
              if (tab.id === 'home') {
                goToHome();
              } else {
                setCurrentView(tab.id);
              }
            }}
            className={`relative flex flex-col items-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px] rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
