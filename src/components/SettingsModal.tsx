import React from 'react';
import { Settings, X, Moon, Sun, Bell, Shield, User, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAccount: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToAccount,
  onShowToast
}) => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();

  if (!isOpen) return null;

  const currentTheme = userProfile?.theme || 'dark';
  const emailNotifs = userProfile?.emailNotifications ?? true;
  const isPublic = userProfile?.publicProfile ?? true;

  const handleToggleTheme = async (theme: 'dark' | 'light') => {
    try {
      await updateUserProfile({ theme });
      onShowToast(`Theme switched to ${theme} mode.`, 'info');
    } catch {
      onShowToast('Could not save theme preference.', 'error');
    }
  };

  const handleToggleNotifs = async () => {
    try {
      await updateUserProfile({ emailNotifications: !emailNotifs });
      onShowToast(`Notifications ${!emailNotifs ? 'enabled' : 'disabled'}.`, 'info');
    } catch {
      onShowToast('Could not update notification setting.', 'error');
    }
  };

  const handleTogglePublic = async () => {
    try {
      await updateUserProfile({ publicProfile: !isPublic });
      onShowToast(`Public profile ${!isPublic ? 'enabled' : 'hidden'}.`, 'info');
    } catch {
      onShowToast('Could not update privacy setting.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 sm:p-7 border border-white/15 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Platform Settings</h3>
            <p className="text-xs text-slate-400">Configure your preferences and experience</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-white/10 text-xs">
          {/* Theme setting */}
          <div className="pt-2">
            <label className="block text-slate-300 font-semibold mb-2">Theme Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  currentTheme === 'dark'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">Deep Navy</span>
              </button>

              <button
                onClick={() => handleToggleTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  currentTheme === 'light'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Light Slate</span>
              </button>
            </div>
          </div>

          {/* Notifications setting */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Email Notifications</p>
              <p className="text-slate-400 text-[11px]">Receive digest and upvote alerts</p>
            </div>
            <button
              onClick={handleToggleNotifs}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                emailNotifs ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  emailNotifs ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Privacy setting */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Public Profile</p>
              <p className="text-slate-400 text-[11px]">Allow author profile to be visible publicly</p>
            </div>
            <button
              onClick={handleTogglePublic}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${
                isPublic ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Account shortcuts */}
          {currentUser && (
            <div className="pt-4 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAccount();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Manage Personal Account</span>
                </span>
                <span className="text-[10px] text-slate-400">UID: {currentUser.uid.slice(0, 6)}...</span>
              </button>

              <button
                onClick={async () => {
                  onClose();
                  await logout();
                  onShowToast('You have been logged out.', 'info');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 font-medium flex items-center justify-center gap-2 border border-rose-500/20"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-500">
            Kishore Opinion v2.0 • Cloud Firestore Platform
          </p>
        </div>
      </div>
    </div>
  );
};
