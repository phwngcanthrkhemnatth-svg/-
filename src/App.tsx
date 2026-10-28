import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Toast } from './components/common/Toast';
import { SplashScreen } from './components/common/SplashScreen';
import { UserProfileModal } from './components/modals/UserProfileModal';
import { SendRequestModal } from './components/modals/SendRequestModal';
import { ReportUserModal } from './components/modals/ReportUserModal';
import { CreatePostModal } from './components/modals/CreatePostModal';
import { EditPostModal } from './components/modals/EditPostModal';
import { ReportPostModal } from './components/modals/ReportPostModal';

// Views
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ProfileSetupView } from './views/ProfileSetupView';
import { MySkillsView } from './views/MySkillsView';
import { FindSkillsView } from './views/FindSkillsView';
import { MatchingView } from './views/MatchingView';
import { ExchangeRequestsView } from './views/ExchangeRequestsView';
import { ChatView } from './views/ChatView';
import { ReviewsView } from './views/ReviewsView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { CommunityView } from './views/CommunityView';
import { FriendsView } from './views/FriendsView';

const MainLayout: React.FC = () => {
  const {
    currentView,
    currentUser,
    isAuthLoading,
    isCreatePostModalOpen,
    setIsCreatePostModalOpen,
    editTargetPost,
    setEditTargetPost,
    reportTargetPost,
    setReportTargetPost,
  } = useApp();
  const [showSplash, setShowSplash] = useState(true);

  // App launch splash screen duration (1.2s authentic app feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isAuthLoading) {
    return <SplashScreen />;
  }

  const isPublicPage =
    currentView === 'login' ||
    currentView === 'register' ||
    currentView === 'profile-setup';

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'dashboard':
        return <HomeView />;
      case 'login':
        return <LoginView />;
      case 'register':
        return <RegisterView />;
      case 'profile-setup':
        return <ProfileSetupView />;
      case 'my-skills':
        return <MySkillsView />;
      case 'find-skills':
        return <FindSkillsView />;
      case 'community':
        return <CommunityView />;
      case 'friends':
        return <FriendsView />;
      case 'matching':
        return <MatchingView />;
      case 'requests':
        return <ExchangeRequestsView />;
      case 'chat':
        return <ChatView />;
      case 'reviews':
        return <ReviewsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      case 'admin':
        return <AdminDashboardView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Render Sidebar only when user is logged in & not on public standalone landing */}
        {currentUser && !isPublicPage && <Sidebar />}

        {/* Dynamic View Container */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 lg:p-8 min-w-0 ${
            !isPublicPage ? 'pb-24 md:pb-8' : ''
          }`}
        >
          {renderView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Interactive Global Modals */}
      <UserProfileModal />
      <SendRequestModal />
      <ReportUserModal />
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
      />
      <EditPostModal
        post={editTargetPost}
        isOpen={!!editTargetPost}
        onClose={() => setEditTargetPost(null)}
      />
      <ReportPostModal
        post={reportTargetPost}
        isOpen={!!reportTargetPost}
        onClose={() => setReportTargetPost(null)}
      />

      {/* Reactive Toast */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
