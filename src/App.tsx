import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { OpinionForm } from './components/OpinionForm';
import { MyOpinions } from './components/MyOpinions';
import { PersonalAccount } from './components/PersonalAccount';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Opinion, NotificationItem } from './types';
import { subscribeToOpinions, fetchOpinions, createOpinion } from './services/opinionService';
import { Sparkles, Heart, Shield } from 'lucide-react';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Welcome to Kishore Opinion',
    message: 'Explore diverse perspectives, express opinions, and engage with the community.',
    date: 'Just now',
    read: false,
    type: 'system'
  },
  {
    id: 'notif-2',
    title: 'Platform Cloud Synchronization',
    message: 'All opinions are stored securely in Cloud Firestore with role-based moderation.',
    date: '10 mins ago',
    read: false,
    type: 'security'
  }
];

const SEED_OPINIONS: Omit<Opinion, 'id'>[] = [
  {
    userId: 'seed-kishore-user',
    authorName: 'Kishore Kumar',
    authorPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kishore',
    authorEmail: 'kishorekumar1432006@gmail.com',
    title: 'The Inevitable Convergence of Artificial Intelligence and Human Insight',
    category: 'Technology',
    content:
      'Artificial intelligence is not replacing human thought—it is amplifying our capacity to discern patterns, build ambitious software, and solve foundational climate and medical challenges. The most critical skill of the next decade will not be rote mechanics, but structured reasoning, empathy, and ethical stewardship.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    likesCount: 24,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
  },
  {
    userId: 'seed-ananya',
    authorName: 'Ananya Sharma',
    authorPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ananya',
    authorEmail: 'ananya.sharma@example.com',
    title: 'Reimagining Higher Education for the 21st Century',
    category: 'Education',
    content:
      'Curriculums that demand memorization are relics of the industrial era. Modern education must focus on peer problem solving, interdisciplinary research, and experiential apprenticeships. When students solve real problems with modern tools, learning becomes lifelong and deeply motivating.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    likesCount: 18,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  },
  {
    userId: 'seed-marcus',
    authorName: 'Marcus Vance',
    authorPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=Marcus',
    authorEmail: 'marcus.v@example.com',
    title: 'Digital Communities vs. Civic Disconnect: Can Social Tech Heal Society?',
    category: 'Society',
    content:
      'While global platforms connect billions, local civic participation has fragmented. We need digital town halls that promote constructive deliberation rather than viral outrage. The future of democratic society relies on designing platforms that prioritize consensus building and mutual understanding.',
    likesCount: 12,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  }
];

function MainContent() {
  const { currentUser } = useAuth();

  // Navigation tab state with URL hash synchronization
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return ['home', 'submit', 'my-opinions', 'account', 'admin'].includes(hash) ? hash : 'home';
  });

  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loadingOpinions, setLoadingOpinions] = useState(true);

  // Modals & UI States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'login' | 'register'>('login');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync activeTab with URL hash and browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'submit', 'my-opinions', 'account', 'admin'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = `#${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Real-time opinions subscription from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToOpinions(
      (newOpinions) => {
        if (newOpinions.length === 0) {
          // If the cloud database has no submitted opinions yet, show default demo opinions in the UI
          setOpinions(
            SEED_OPINIONS.map((s, idx) => ({
              ...s,
              id: `demo-${idx}`
            }))
          );
        } else {
          setOpinions(newOpinions);
        }
        setLoadingOpinions(false);
      },
      () => {
        // Fallback to demo opinions if network fails
        setOpinions(
          SEED_OPINIONS.map((s, idx) => ({
            ...s,
            id: `demo-${idx}`
          }))
        );
        setLoadingOpinions(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const refreshOpinionsManual = async () => {
    try {
      const refreshed = await fetchOpinions();
      setOpinions(refreshed);
    } catch {
      // Keep existing
    }
  };

  const handleOpinionSubmitted = (newId: string) => {
    showToast('Your opinion has been published to the cloud database!', 'success');
    // Add real notification
    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      title: 'Opinion Published',
      message: 'Your opinion has been successfully saved to the cloud.',
      date: 'Just now',
      read: false,
      type: 'opinion'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#080D24] text-slate-100 font-['Poppins',sans-serif]">
      {/* Toast Alert Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Main Responsive Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={changeTab}
        onOpenAuth={() => {
          setAuthDefaultMode('login');
          setAuthModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Tab Routing */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <HomeDashboard
            opinions={opinions}
            onNavigateToSubmit={() => changeTab('submit')}
            onNavigateToMyOpinions={() => changeTab('my-opinions')}
            onNavigateToAccount={() => changeTab('account')}
            onOpenSettings={() => setSettingsModalOpen(true)}
            onOpenNotifications={() => setNotificationsModalOpen(true)}
            onOpenAuth={() => {
              setAuthDefaultMode('login');
              setAuthModalOpen(true);
            }}
            onShowToast={showToast}
            onEditOpinion={() => changeTab('my-opinions')}
          />
        )}

        {activeTab === 'submit' && (
          <OpinionForm
            onSuccess={handleOpinionSubmitted}
            onNavigateToMyOpinions={() => changeTab('my-opinions')}
            onNavigateToHome={() => changeTab('home')}
          />
        )}

        {activeTab === 'my-opinions' && (
          <MyOpinions
            opinions={opinions}
            onNavigateToSubmit={() => changeTab('submit')}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'account' && (
          <PersonalAccount
            onShowToast={showToast}
            onLogoutSuccess={() => {
              changeTab('home');
              showToast('Logged out successfully.', 'info');
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            opinions={opinions}
            onRefreshOpinions={refreshOpinionsManual}
            onShowToast={showToast}
            onNavigateHome={() => changeTab('home')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 glass-panel py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#080D24] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Kishore Opinion</p>
              <p className="text-[11px] text-slate-400">A Modern Cloud-Powered Discourse Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button onClick={() => changeTab('home')} className="hover:text-cyan-300 transition-colors">
              Home
            </button>
            <button onClick={() => changeTab('submit')} className="hover:text-cyan-300 transition-colors">
              Submit Opinion
            </button>
            <button onClick={() => changeTab('my-opinions')} className="hover:text-cyan-300 transition-colors">
              My Opinions
            </button>
            <button onClick={() => changeTab('account')} className="hover:text-cyan-300 transition-colors">
              Personal Account
            </button>
            <button onClick={() => changeTab('admin')} className="hover:text-purple-300 transition-colors flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-400" />
              <span>Admin Portal</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center md:text-right">
            <span>Built with Firestore &amp; Firebase Auth</span>
            <span className="block text-slate-600">© 2026 Kishore Opinion. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authDefaultMode}
        onSuccessNotification={(msg) => showToast(msg, 'success')}
      />

      {/* Notifications Drawer/Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          showToast('All notifications marked as read.', 'info');
        }}
        onClearAll={() => {
          setNotifications([]);
          showToast('Notifications cleared.', 'info');
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onNavigateToAccount={() => changeTab('account')}
        onShowToast={showToast}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
