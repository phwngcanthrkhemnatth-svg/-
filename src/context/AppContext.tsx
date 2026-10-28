import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ViewType, Post } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { chatService } from '../services/chatService';

interface AppContextType {
  currentUser: User | null;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  goToHome: () => void;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  allUsers: User[];
  isAuthLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password?: string,
    province?: string,
    profileImage?: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  completeUserProfile: () => Promise<void>;
  selectedUserForProfileModal: User | null;
  setSelectedUserForProfileModal: (user: User | null) => void;
  selectedUserForRequestModal: User | null;
  setSelectedUserForRequestModal: (user: User | null) => void;
  selectedUserForReportModal: User | null;
  setSelectedUserForReportModal: (user: User | null) => void;
  reportTargetPost: Post | null;
  setReportTargetPost: (post: Post | null) => void;
  editTargetPost: Post | null;
  setEditTargetPost: (post: Post | null) => void;
  isCreatePostModalOpen: boolean;
  setIsCreatePostModalOpen: (open: boolean) => void;
  postFeedRefreshKey: number;
  triggerPostFeedRefresh: () => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Pages that can be accessed without logging in
const PUBLIC_VIEWS: ViewType[] = ['login', 'register'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentViewState] = useState<ViewType>('home');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedUserForProfileModal, setSelectedUserForProfileModal] = useState<User | null>(null);
  const [selectedUserForRequestModal, setSelectedUserForRequestModal] = useState<User | null>(null);
  const [selectedUserForReportModal, setSelectedUserForReportModal] = useState<User | null>(null);
  const [reportTargetPost, setReportTargetPost] = useState<Post | null>(null);
  const [editTargetPost, setEditTargetPost] = useState<Post | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [postFeedRefreshKey, setPostFeedRefreshKey] = useState(0);

  const triggerPostFeedRefresh = useCallback(() => {
    setPostFeedRefreshKey((k) => k + 1);
  }, []);

  const setCurrentView = useCallback(
    (view: ViewType) => {
      setCurrentViewState(view);
      if (view === 'home' || view === 'dashboard') {
        setPostFeedRefreshKey((k) => k + 1);
      }
    },
    []
  );

  const goToHome = useCallback(() => {
    setCurrentViewState('home');
    setPostFeedRefreshKey((k) => k + 1);
    setIsMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // Fetch all users list from Firestore
  const loadUsers = useCallback(async () => {
    try {
      const users = await userService.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }, []);

  // Listen to Firebase Authentication state
  useEffect(() => {
    setIsAuthLoading(true);
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    loadUsers();

    return () => unsubscribe();
  }, [loadUsers]);

  // Route protection:
  // - If user not logged in: only allow 'login', 'register'
  // - If user is logged in: redirect away from 'login' / 'register' to 'home' (หน้าหลัก)
  useEffect(() => {
    if (!isAuthLoading) {
      if (!currentUser && !PUBLIC_VIEWS.includes(currentView)) {
        setCurrentView('login');
      } else if (currentUser && (currentView === 'login' || currentView === 'register')) {
        setCurrentView('home');
      }
    }
  }, [currentView, currentUser, isAuthLoading]);

  // Subscribe to real-time notifications and chats when user is logged in
  useEffect(() => {
    if (!currentUser) {
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    // 1. Subscribe to notifications
    const unsubNotifs = notificationService.subscribeToNotifications(
      currentUser.id,
      (notifs) => {
        const unread = notifs.filter((n) => !n.read).length;
        setUnreadNotificationsCount(unread);
      }
    );

    // 2. Subscribe to user chats to calculate unread message count
    const unsubChats = chatService.subscribeToUserChats(
      currentUser.id,
      async (chats) => {
        let totalUnread = 0;
        for (const chat of chats) {
          const msgs = await chatService.getMessages(chat.id);
          totalUnread += msgs.filter((m) => m.senderId !== currentUser.id && !m.read).length;
        }
        setUnreadMessagesCount(totalUnread);
      }
    );

    return () => {
      unsubNotifs();
      unsubChats();
    };
  }, [currentUser]);

  const login = async (email: string, password?: string) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    await loadUsers();
    if (user.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
    showToast(`ยินดีต้อนรับ คุณ${user.name}! เข้าสู่ระบบเรียบร้อย`);
  };

  const loginWithGoogle = async () => {
    const { user } = await authService.loginWithGoogle();
    setCurrentUser(user);
    await loadUsers();
    if (user.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('home');
    }
    showToast(`ยินดีต้อนรับ คุณ${user.name}! เข้าสู่ระบบด้วย Google เรียบร้อย`);
  };

  const completeUserProfile = async () => {
    if (!currentUser) return;
    const updated = await userService.updateUser(currentUser.id, {
      isNewUser: false,
      profileCompleted: true,
    });
    setCurrentUser(updated);
    await loadUsers();
  };

  const register = async (
    name: string,
    email: string,
    password?: string,
    province?: string,
    profileImage?: string
  ) => {
    const user = await authService.register(name, email, password, province, profileImage);
    setCurrentUser(user);
    await loadUsers();
    setCurrentView('home');
    showToast(`ยินดีต้อนรับ คุณ${user.name}! สมัครสมาชิกสำเร็จ`);
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
    showToast(`ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง ${email} เรียบร้อยแล้ว กรุณาตรวจสอบอีเมล`);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setCurrentUser(null);
    setCurrentView('login');
    setUnreadNotificationsCount(0);
    setUnreadMessagesCount(0);
    setSelectedUserForProfileModal(null);
    setSelectedUserForRequestModal(null);
    setSelectedUserForReportModal(null);
    setActiveChatId(null);
    setIsMobileMenuOpen(false);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Developer switch for testing profiles (if needed)
  const switchUser = async (userId: string) => {
    const user = await userService.getUserById(userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('home');
      }
      showToast(`สลับเป็นบัญชี: คุณ${user.name}`);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = await userService.updateUser(currentUser.id, data);
    setCurrentUser(updated);
    await loadUsers();
    showToast('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentView,
        setCurrentView,
        goToHome,
        unreadNotificationsCount,
        unreadMessagesCount,
        allUsers,
        isAuthLoading,
        login,
        loginWithGoogle,
        register,
        resetPassword,
        logout,
        switchUser,
        updateProfile,
        completeUserProfile,
        selectedUserForProfileModal,
        setSelectedUserForProfileModal,
        selectedUserForRequestModal,
        setSelectedUserForRequestModal,
        selectedUserForReportModal,
        setSelectedUserForReportModal,
        reportTargetPost,
        setReportTargetPost,
        editTargetPost,
        setEditTargetPost,
        isCreatePostModalOpen,
        setIsCreatePostModalOpen,
        postFeedRefreshKey,
        triggerPostFeedRefresh,
        activeChatId,
        setActiveChatId,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toastMessage,
        showToast,
        theme,
        setTheme,
        refreshData: loadUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
