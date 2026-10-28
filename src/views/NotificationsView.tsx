import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Notification } from '../types';
import { notificationService } from '../services/notificationService';
import {
  Bell,
  CheckCheck,
  ArrowRightLeft,
  CheckCircle,
  MessageSquare,
  Calendar,
  Star,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { currentUser, setCurrentView, showToast } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await notificationService.getNotifications(currentUser.id);
    setNotifications(list);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(currentUser.id);
    showToast('ทำเครื่องหมายอ่านแล้วทั้งหมด');
    loadNotifications();
  };

  const handleItemClick = async (item: Notification) => {
    await notificationService.markAsRead(item.id);
    loadNotifications();

    if (item.linkAction) {
      if (item.linkAction.includes('request')) setCurrentView('requests');
      else if (item.linkAction.includes('chat')) setCurrentView('chat');
      else if (item.linkAction.includes('schedule')) setCurrentView('schedule');
      else if (item.linkAction.includes('review')) setCurrentView('reviews');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'request_received':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
      case 'request_accepted':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'schedule_reminder':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'new_review':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'system':
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            การแจ้งเตือน (Notifications)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            อัปเดตคำขอแลกเปลี่ยน และข้อความใหม่ของคุณ
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600" />
            อ่านแล้วทั้งหมด
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
              !item.read
                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-900/60 shadow-xs'
                : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-xs ${
                      !item.read
                        ? 'font-bold text-slate-900 dark:text-slate-100'
                        : 'font-semibold text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.message}
                </p>
                <div className="text-[10px] text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              ไม่มีการแจ้งเตือนในขณะนี้
            </h3>
            <p className="text-xs text-slate-500">
              เมื่อมีคู่สนทนาส่งคำขอแลกเปลี่ยน หรือข้อความแชท คุณจะเห็นการแจ้งเตือนที่นี่
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
