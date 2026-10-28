import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, ShieldAlert, ArrowLeftRight, ChevronDown, Check } from 'lucide-react';

export const DemoUserSwitcher: React.FC = () => {
  const { currentUser, allUsers, switchUser, setCurrentView } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const demoUsers = [
    { id: 'user-current', label: 'สมชาย (ผู้เรียน/ผู้สอนหลัก)', badge: 'Photoshop ↔ English' },
    { id: 'user-2', label: 'พิมพ์ชนก Pim (คู่ Match 98%)', badge: 'English ↔ Photoshop' },
    { id: 'user-3', label: 'ณัฐพงษ์ Nat (Developer)', badge: 'React ↔ Premiere Pro' },
    { id: 'user-4', label: 'วิภาดา Dao (Baker)', badge: 'เบเกอรี่ ↔ Photoshop' },
    { id: 'user-admin', label: 'ผู้ดูแลระบบ (Admin)', badge: 'แอดมินจัดการระบบ' },
  ];

  return (
    <div className="relative z-50">
      <button
        type="button"
        id="btn-demo-switcher"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-900/90 text-white hover:bg-slate-800 rounded-full shadow-md backdrop-blur-xs transition-all border border-slate-700/60"
        title="สลับบัญชีทดสอบระบบสองฝ่าย (Real-time Simulation)"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span className="hidden sm:inline text-slate-300">ทดสอบในบทบาท:</span>
        <span className="font-semibold text-indigo-300 truncate max-w-[140px]">
          {currentUser ? currentUser.name.split(' ')[0] : 'ไม่ได้เข้าสู่ระบบ'}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                โหมดทดสอบสองฝ่าย (Demo Switcher)
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                เลือกสลับผู้ใช้เพื่อทดสอบการตอบรับคำขอ, ตอบแชท และสิทธิ์ Admin
              </p>
            </div>

            <div className="space-y-1">
              {demoUsers.map((item) => {
                const isSelected = currentUser?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      switchUser(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-900 font-semibold dark:bg-indigo-950/60 dark:text-indigo-200'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {item.id === 'user-admin' ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        ) : null}
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal block">
                        {item.badge}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {currentUser?.role === 'admin' && (
              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('admin');
                    setIsOpen(false);
                  }}
                  className="w-full text-center py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                >
                  เปิดหน้า Admin Dashboard
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
