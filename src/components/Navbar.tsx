import React, { useState } from 'react';
import {
  MessageSquare,
  PlusCircle,
  FolderHeart,
  User as UserIcon,
  Settings as SettingsIcon,
  Bell,
  ShieldAlert,
  LogOut,
  LogIn,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenSettings,
  onOpenNotifications,
  unreadNotificationsCount
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: MessageSquare, requiresAuth: false },
    { id: 'submit', label: 'Submit Opinion', icon: PlusCircle, requiresAuth: true },
    { id: 'my-opinions', label: 'My Opinions', icon: FolderHeart, requiresAuth: true },
    { id: 'account', label: 'My Account', icon: UserIcon, requiresAuth: true },
  ];

  const handleNavClick = (tabId: string, requiresAuth: boolean) => {
    if (requiresAuth && !currentUser) {
      onOpenAuth();
      return;
    }
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('home', false)}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 transform group-hover:scale-105">
              <div className="w-full h-full bg-[#080D24] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent">
                  Kishore Opinion
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 uppercase tracking-widest hidden sm:inline-block">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Express Perspectives. Empower Ideas.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id, link.requiresAuth)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Admin Dashboard shortcut if admin */}
            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin', true)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm shadow-purple-500/25'
                    : 'text-purple-300 hover:text-purple-100 hover:bg-purple-900/30 border border-purple-500/20'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & Auth Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 border border-white/5 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-300" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-400 rounded-full ring-2 ring-[#080D24] animate-pulse" />
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 border border-white/5 transition-colors hidden sm:block"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-slate-300" />
            </button>

            {/* Auth Button or User Profile Dropdown */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-800/70 border border-white/10 hover:border-cyan-500/40 transition-all duration-200 focus:outline-none"
                >
                  <img
                    src={userProfile?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border border-cyan-400/50 bg-slate-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`;
                    }}
                  />
                  <span className="text-xs font-medium text-slate-200 hidden sm:inline-block max-w-[100px] truncate">
                    {userProfile?.displayName || currentUser.displayName || 'Account'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel-elevated rounded-2xl p-2 z-50 border border-white/15 animate-fadeIn">
                    <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {userProfile?.displayName || currentUser.displayName || 'Kishore User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                      {isAdmin && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3 text-purple-400" /> Authorized Admin
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleNavClick('account', true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-cyan-400" />
                      <span>My Profile & Account</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('submit', true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>Submit New Opinion</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('my-opinions', true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <FolderHeart className="w-4 h-4 text-pink-400" />
                      <span>My Published Opinions</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNavClick('admin', true)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-900/40 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-purple-400" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <div className="border-t border-white/10 my-1 pt-1">
                      <button
                        onClick={async () => {
                          setUserDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl md:hidden text-slate-300 hover:text-white hover:bg-slate-800/60 border border-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel-elevated border-b border-white/10 px-4 pt-3 pb-6 animate-fadeIn">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id, link.requiresAuth)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 text-cyan-400" />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => handleNavClick('admin', true)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                    : 'text-purple-300 hover:bg-purple-900/30'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                <span>Admin Dashboard</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNotifications();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800/60"
            >
              <Bell className="w-5 h-5 text-cyan-400" />
              <span>Notifications {unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettings();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800/60"
            >
              <SettingsIcon className="w-5 h-5 text-slate-400" />
              <span>Platform Settings</span>
            </button>

            {currentUser && (
              <button
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-rose-300 hover:bg-rose-950/40 mt-2 border-t border-white/10"
              >
                <LogOut className="w-5 h-5 text-rose-400" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
