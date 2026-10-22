import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  ThumbsUp,
  Download,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  Calendar,
  Eye,
  LogOut,
  AlertTriangle,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext';
import { Opinion, UserProfile, CategoryType, CATEGORIES } from '../types';
import {
  deleteOpinion,
  clearAllOpinions,
  fetchAllUsers,
  exportOpinionsToCSV,
  fetchOpinions
} from '../services/opinionService';

interface AdminDashboardProps {
  opinions: Opinion[];
  onRefreshOpinions: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateHome: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  opinions,
  onRefreshOpinions,
  onShowToast,
  onNavigateHome
}) => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    loginWithEmail,
    verifyAdminKey,
    logout,
    adminOverrideActive,
    setAdminOverrideActive
  } = useAuth();

  // Admin access gate states
  const [adminPassphrase, setAdminPassphrase] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard states
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'opinions' | 'users'>('opinions');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Modals
  const [selectedOpinionDetails, setSelectedOpinionDetails] = useState<Opinion | null>(null);
  const [opinionToDelete, setOpinionToDelete] = useState<Opinion | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllConfirmationText, setClearAllConfirmationText] = useState('');
  const [clearing, setClearing] = useState(false);

  // Load registered users when admin access is confirmed
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await fetchAllUsers();
      setUsersList(users);
    } catch {
      // Fallback: collect unique authors from opinions
      const uniqueUsers: UserProfile[] = [];
      const seen = new Set<string>();
      opinions.forEach((op) => {
        if (!seen.has(op.userId)) {
          seen.add(op.userId);
          uniqueUsers.push({
            uid: op.userId,
            displayName: op.authorName,
            email: op.authorEmail || 'N/A',
            role: op.authorEmail === ADMIN_EMAIL ? 'admin' : 'user',
            createdAt: op.createdAt
          });
        }
      });
      setUsersList(uniqueUsers);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, opinions.length]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshOpinions();
      await loadUsers();
      onShowToast('Dashboard data synchronized with cloud database.', 'success');
    } catch {
      onShowToast('Could not refresh data.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoggingIn(true);
    try {
      await loginWithEmail(loginEmail.trim(), loginPassword);
      onShowToast('Signed in successfully.', 'success');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handlePassphraseUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const success = verifyAdminKey(adminPassphrase);
    if (success) {
      onShowToast('Administrator access granted!', 'success');
    } else {
      setAuthError('Invalid administrator security key.');
    }
  };

  const handleAdminLogout = async () => {
    sessionStorage.removeItem('kishore_admin_authorized');
    setAdminOverrideActive(false);
    await logout();
    onNavigateHome();
  };

  const handleDeleteOpinionConfirm = async () => {
    if (!opinionToDelete) return;
    try {
      await deleteOpinion(opinionToDelete.id);
      setOpinionToDelete(null);
      if (selectedOpinionDetails?.id === opinionToDelete.id) {
        setSelectedOpinionDetails(null);
      }
      onShowToast('Opinion removed by Administrator.', 'success');
    } catch {
      onShowToast('Failed to delete opinion.', 'error');
    }
  };

  const handleClearAllConfirm = async () => {
    if (clearAllConfirmationText.trim().toUpperCase() !== 'CONFIRM DELETE ALL') {
      onShowToast('Please type "CONFIRM DELETE ALL" exactly.', 'error');
      return;
    }

    try {
      setClearing(true);
      const count = await clearAllOpinions();
      setShowClearAllModal(false);
      setClearAllConfirmationText('');
      onShowToast(`All ${count} opinions cleared successfully from database.`, 'info');
      await handleManualRefresh();
    } catch {
      onShowToast('Failed to clear database.', 'error');
    } finally {
      setClearing(false);
    }
  };

  // Filtered opinions for admin
  const filteredOpinions = useMemo(() => {
    return opinions.filter((op) => {
      // Category filter
      if (selectedCategory !== 'All' && op.category !== selectedCategory) {
        return false;
      }

      // Date range filter
      if (dateFilter !== 'all') {
        const opTime = new Date(op.createdAt).getTime();
        const now = Date.now();
        const diffHours = (now - opTime) / (1000 * 60 * 60);

        if (dateFilter === 'today' && diffHours > 24) return false;
        if (dateFilter === '7days' && diffHours > 24 * 7) return false;
        if (dateFilter === '30days' && diffHours > 24 * 30) return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = op.title.toLowerCase().includes(q);
        const matchContent = op.content.toLowerCase().includes(q);
        const matchAuthor = op.authorName.toLowerCase().includes(q);
        const matchUid = op.userId.toLowerCase().includes(q);
        const matchEmail = (op.authorEmail || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchAuthor || matchUid || matchEmail;
      }

      return true;
    });
  }, [opinions, selectedCategory, dateFilter, searchQuery]);

  // Aggregate stats
  const totalOpinions = opinions.length;
  const totalUsersCount = Math.max(usersList.length, 1);
  const totalLikes = opinions.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);

  // If user is not authorized as Admin, render the Secure Admin Gateway
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fadeIn">
        <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-purple-500/30 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-4 glow-violet">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Administrator Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
            This area is strictly restricted to Kishore Opinion administrators. Ordinary users cannot access this dashboard.
          </p>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs mb-4 text-left">
              {authError}
            </div>
          )}

          {currentUser ? (
            /* Logged in as non-admin: Enter Admin Passkey */
            <form onSubmit={handlePassphraseUnlock} className="space-y-4 text-left">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300">
                Logged in as: <span className="font-semibold text-white">{currentUser.email}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter Administrator Security Key
                </label>
                <input
                  type="password"
                  value={adminPassphrase}
                  onChange={(e) => setAdminPassphrase(e.target.value)}
                  placeholder="Enter administrator passkey..."
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default developer key: <code className="text-cyan-300 font-mono">kishore2026</code>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Admin Authorization</span>
              </button>
            </form>
          ) : (
            /* Not logged in: Admin Sign-In */
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="kishorekumar1432006@gmail.com"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {loggingIn ? 'Authenticating...' : 'Sign In as Administrator'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={onNavigateHome}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              Return to Public Home Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-purple-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Privileged Administrator Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Kishore Opinion Admin Control Center
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Live moderation, user management, cloud sync, and platform exports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold transition-colors"
              title="Refresh cloud data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={() => exportOpinionsToCSV(opinions)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
              title="Download all opinions as CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-colors"
              title="Purge all opinions with strong confirmation"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Opinions</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-white/10"
              title="Exit admin mode"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Admin Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Registered Users</p>
            <p className="text-2xl font-bold text-white">{totalUsersCount}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Opinions</p>
            <p className="text-2xl font-bold text-white">{totalOpinions}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Upvotes</p>
            <p className="text-2xl font-bold text-white">{totalLikes}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Filtered Results</p>
            <p className="text-2xl font-bold text-white">{filteredOpinions.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Opinions vs Users */}
      <div className="flex border-b border-white/10 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('opinions')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'opinions' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Opinions Moderation ({opinions.length})</span>
          {activeTab === 'opinions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors relative flex items-center gap-2 ${
            activeTab === 'users' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Users ({totalUsersCount})</span>
          {activeTab === 'users' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'opinions' ? (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, user ID, or content..."
                className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="glass-input rounded-xl px-3 py-2 text-xs text-white bg-[#0b102c]"
                >
                  <option value="All" className="bg-[#080D24]">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#080D24]">{c}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="glass-input rounded-xl px-3 py-2 text-xs text-white bg-[#0b102c]"
                >
                  <option value="all" className="bg-[#080D24]">All Time</option>
                  <option value="today" className="bg-[#080D24]">Past 24 Hours</option>
                  <option value="7days" className="bg-[#080D24]">Past 7 Days</option>
                  <option value="30days" className="bg-[#080D24]">Past 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Opinions Table */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-white/10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Title & Preview</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Submitter Name & UID</th>
                    <th className="px-5 py-3.5">Submission Date</th>
                    <th className="px-5 py-3.5 text-center">Likes</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOpinions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                        No opinions match the specified admin filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOpinions.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <p className="font-bold text-white truncate text-sm">{op.title}</p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{op.content}</p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-900 border border-white/10 text-cyan-300">
                            {op.category}
                          </span>
                        </td>

                        <td className="px-5 py-4 max-w-[180px]">
                          <p className="font-semibold text-white truncate">{op.authorName}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate" title={op.userId}>
                            {op.userId.slice(0, 12)}...
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-slate-300">
                          {new Date(op.createdAt).toLocaleDateString()} <span className="text-[10px] text-slate-500">{new Date(op.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>

                        <td className="px-5 py-4 text-center font-bold text-cyan-300">
                          {op.likesCount || 0}
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setSelectedOpinionDetails(op)}
                            className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 transition-colors"
                            title="View complete details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setOpinionToDelete(op)}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors"
                            title="Delete opinion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Registered Users Table */
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">User UID</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Registered At</th>
                  <th className="px-5 py-3.5 text-center">Opinions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersList.map((usr) => {
                  const userOpCount = opinions.filter((o) => o.userId === usr.uid).length;
                  return (
                    <tr key={usr.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={usr.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${usr.uid}`}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover border border-white/10 bg-slate-900"
                          />
                          <span className="font-bold text-white">{usr.displayName}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                        {usr.uid}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {usr.email}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          usr.role === 'admin'
                            ? 'bg-purple-900/50 text-purple-300 border border-purple-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {usr.role || 'user'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {new Date(usr.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-cyan-300">
                        {userOpCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Opinion Details Modal */}
      {selectedOpinionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-purple-500/30 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedOpinionDetails(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Detailed Inspection</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {selectedOpinionDetails.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs mb-6">
              <div>
                <span className="text-slate-400">Submitter Name:</span>{' '}
                <span className="font-semibold text-white">{selectedOpinionDetails.authorName}</span>
              </div>
              <div>
                <span className="text-slate-400">Submitter Email:</span>{' '}
                <span className="font-semibold text-cyan-300">{selectedOpinionDetails.authorEmail || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">Submitter UID:</span>{' '}
                <code className="text-purple-300 font-mono">{selectedOpinionDetails.userId}</code>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <span className="font-semibold text-white">{selectedOpinionDetails.category}</span>
              </div>
              <div>
                <span className="text-slate-400">Created At:</span>{' '}
                <span className="text-slate-200">{new Date(selectedOpinionDetails.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedOpinionDetails.imageUrl && (
              <div className="rounded-2xl overflow-hidden mb-6 border border-white/10 max-h-80 bg-slate-950">
                <img
                  src={selectedOpinionDetails.imageUrl}
                  alt={selectedOpinionDetails.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-6">
              {selectedOpinionDetails.content}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Engagement: <strong className="text-cyan-300">{selectedOpinionDetails.likesCount || 0}</strong> upvotes
              </span>

              <button
                onClick={() => {
                  setOpinionToDelete(selectedOpinionDetails);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Opinion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Inappropriate Opinion Modal */}
      {opinionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel-elevated rounded-3xl p-6 text-center border border-rose-500/40 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Inappropriate Opinion?</h3>
            <p className="text-xs text-slate-300 mt-1 mb-5">
              Confirm deletion of "{opinionToDelete.title}". This will permanently purge this opinion from the shared cloud database.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpinionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOpinionConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Opinions Modal with 2-Step Typing */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 sm:p-8 text-center border border-rose-500/50 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Clear All Cloud Opinions?</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              WARNING: This will permanently purge ALL submitted opinions across every user from the Cloud Firestore database.
            </p>

            <div className="mb-6 text-left">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type <span className="text-rose-400 font-mono">CONFIRM DELETE ALL</span> to proceed:
              </label>
              <input
                type="text"
                value={clearAllConfirmationText}
                onChange={(e) => setClearAllConfirmationText(e.target.value)}
                placeholder="CONFIRM DELETE ALL"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowClearAllModal(false);
                  setClearAllConfirmationText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearAllConfirmationText.trim().toUpperCase() !== 'CONFIRM DELETE ALL' || clearing}
                onClick={handleClearAllConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-rose-600/25"
              >
                {clearing ? 'Clearing...' : 'Purge All Database Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
