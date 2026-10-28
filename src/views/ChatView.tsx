import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Chat, Message, User } from '../types';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { UserAvatar } from '../components/common/UserAvatar';
import {
  MessageSquare,
  Send,
  Sparkles,
  Clock,
  CheckCheck,
  Search,
  ArrowLeft,
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const { currentUser, activeChatId, setActiveChatId, showToast } = useApp();

  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all users from Firestore for user info mapping
  useEffect(() => {
    userService.getAllUsers().then(setAllUsers);
  }, []);

  // Real-time subscription to user chats in Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = chatService.subscribeToUserChats(currentUser.id, (userChats) => {
      setChats(userChats);
      if (!activeChatId && userChats.length > 0) {
        setActiveChatId(userChats[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeChatId, setActiveChatId]);

  // Real-time subscription to active chat messages in Firestore
  useEffect(() => {
    if (!activeChatId) return;

    const unsubscribe = chatService.subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      if (currentUser) {
        chatService.markAsRead(activeChatId, currentUser.id);
      }
    });

    return () => unsubscribe();
  }, [activeChatId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) return null;

  const activeChat = chats.find((c) => c.id === activeChatId);
  const activePartnerId = activeChat?.participants.find((p) => p !== currentUser.id);
  const activePartner = allUsers.find((u) => u.id === activePartnerId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentText.trim() || !activeChatId) return;

    const text = currentText.trim();
    setCurrentText('');

    try {
      await chatService.sendMessage(activeChatId, currentUser.id, text);
    } catch (err: any) {
      console.error('Error sending message:', err);
      showToast('ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const filteredChats = chats.filter((c) => {
    const partnerId = c.participants.find((p) => p !== currentUser.id);
    const partner = allUsers.find((u) => u.id === partnerId);
    if (!partner) return true;
    return partner.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Left Column: Chat List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200/80 dark:border-slate-800 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              ข้อความสนทนา
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {chats.length} การสนทนา
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อคู่สนทนา..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* List of chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              ยังไม่มีประวัติการสนทนา เมื่อมีคำขอแลกเปลี่ยนทักษะที่ได้รับการตอบรับ ห้องแชทจะปรากฏที่นี่โดยอัตโนมัติ
            </div>
          ) : (
            filteredChats.map((chat) => {
              const partnerId = chat.participants.find((p) => p !== currentUser.id);
              const partner = allUsers.find((u) => u.id === partnerId);
              const isSelected = chat.id === activeChatId;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <UserAvatar
                    src={partner?.profileImage}
                    name={partner?.name || 'User'}
                    size="md"
                    isOnline={partner?.isOnline}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs truncate font-medium ${
                          isSelected
                            ? 'text-indigo-900 dark:text-indigo-200 font-bold'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {partner?.name || 'คู่สนทนา'}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {chat.lastMessageTime || (chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {chat.lastMessage || 'เริ่มต้นการสนทนา...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Chat */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/60 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChat && activePartner ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 px-4 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <UserAvatar
                  src={activePartner.profileImage}
                  name={activePartner.name}
                  size="md"
                  isOnline={activePartner.isOnline}
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {activePartner.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{activePartner.location || activePartner.province}</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      แลกเปลี่ยนแบบ {activePartner.learningMode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center my-2">
                <span className="px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[10px] text-slate-500 font-medium">
                  เริ่มการสนทนาแลกเปลี่ยนทักษะผ่านระบบ SkillsWop
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const timeDisplay = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <UserAvatar
                        src={activePartner.profileImage}
                        name={activePartner.name}
                        size="xs"
                      />
                    )}
                    <div
                      className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs space-y-1 ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700 shadow-xs'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 text-[10px] ${
                          isMe ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        <span>{timeDisplay}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder={`พิมพ์ข้อความถึงคุณ ${activePartner.name}...`}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!currentText.trim()}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 shadow-md shadow-indigo-500/20 transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              เลือกบทสนทนาจากรายการทางซ้าย
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              หรือเริ่มส่งคำขอแลกเปลี่ยนใหม่เพื่อเริ่มพูดคุยกับคู่จับคู่ที่คุณสนใจ
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
