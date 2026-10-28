import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExchangeRequest, User } from '../types';
import { exchangeRequestService } from '../services/exchangeRequestService';
import { userService } from '../services/userService';
import { UserAvatar } from '../components/common/UserAvatar';
import { RequestStatusBadge } from '../components/common/Badge';
import {
  ArrowLeftRight,
  Send,
  Inbox,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';

export const ExchangeRequestsView: React.FC = () => {
  const {
    currentUser,
    setCurrentView,
    setActiveChatId,
    showToast,
    setSelectedUserForProfileModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [receivedRequests, setReceivedRequests] = useState<ExchangeRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ExchangeRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    if (!currentUser) return;
    setLoading(true);
    const [{ sent, received }, users] = await Promise.all([
      exchangeRequestService.getRequestsForUser(currentUser.id),
      userService.getAllUsers(),
    ]);
    setReceivedRequests(received);
    setSentRequests(sent);
    setAllUsers(users);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  if (!currentUser) return null;

  const handleAccept = async (req: ExchangeRequest) => {
    try {
      await exchangeRequestService.acceptRequest(req.id);
      showToast('ยอมรับคำขอแลกเปลี่ยนแล้ว! สามารถเริ่มแชทได้ทันที 🎉');
      await loadRequests();
      setCurrentView('chat');
    } catch (err: any) {
      showToast(err?.message || 'ไม่สามารถยอมรับคำขอได้');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await exchangeRequestService.rejectRequest(requestId);
      showToast('ปฏิเสธคำขอแล้ว');
      loadRequests();
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      await exchangeRequestService.cancelRequest(requestId);
      showToast('ยกเลิกคำขอแล้ว');
      loadRequests();
    } catch (err: any) {
      showToast(err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  const currentList = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
          จัดการคำขอแลกเปลี่ยน (Exchange Requests)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ตรวจสอบคำขอแลกเปลี่ยนทักษะ ตอบรับเพื่อเปิดห้องแชทและเริ่มแลกเปลี่ยนความรู้ออนไลน์
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'received'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          คำขอที่ได้รับ ({receivedRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sent'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          คำขอที่ส่งไป ({sentRequests.length})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {currentList.map((req) => {
          const partnerId = activeTab === 'received' ? req.senderId : req.receiverId;
          const partner = allUsers.find((u) => u.id === partnerId);
          if (!partner) return null;

          return (
            <div
              key={req.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              {/* Partner and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <UserAvatar
                    src={partner.profileImage}
                    name={partner.name}
                    size="md"
                    isOnline={partner.isOnline}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUserForProfileModal(partner)}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                      >
                        {partner.name}
                      </button>
                      <span className="text-xs text-slate-400">({partner.province})</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ส่งเมื่อ: {new Date(req.createdAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>

                <div className="self-start sm:self-center">
                  <RequestStatusBadge status={req.status} />
                </div>
              </div>

              {/* Exchange Skill Details Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    {activeTab === 'received' ? '✨ เขาจะสอนให้คุณ:' : '✨ คุณจะสอนให้เขา:'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {req.offeredSkill}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
                    {activeTab === 'received' ? '📚 เขาอยากเรียนจากคุณ:' : '📚 คุณอยากเรียนจากเขา:'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {req.requestedSkill}
                  </span>
                </div>
              </div>

              {/* Message */}
              {req.message && (
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 p-3 rounded-xl italic">
                  "{req.message}"
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {activeTab === 'received' && req.status === 'Pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      ปฏิเสธคำขอ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(req)}
                      className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      ยอมรับคำขอ (เปิดห้องแชท)
                    </button>
                  </>
                )}

                {activeTab === 'sent' && req.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(req.id)}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  >
                    ยกเลิกคำขอ
                  </button>
                )}

                {req.status === 'Accepted' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentView('chat')}
                      className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      ไปที่ห้องแชท
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentList.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            {activeTab === 'received' ? 'ไม่มีคำขอที่ได้รับ' : 'ไม่มีคำขอที่คุณส่งไป'}
          </h3>
          <p className="text-xs text-slate-500">
            ค้นหาทักษะที่คุณสนใจในหน้าค้นหาหรือหน้าระบบจับคู่ แล้วเริ่มส่งคำขอได้เลย
          </p>
        </div>
      )}
    </div>
  );
};
