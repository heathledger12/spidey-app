import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  PlusCircle,
  FolderHeart,
  Search,
  ThumbsUp,
  Share2,
  Calendar,
  Tag,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Cpu,
  Users,
  Film,
  Lightbulb,
  HelpCircle,
  Clock,
  User,
  ShieldCheck,
  Maximize2,
  X,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Opinion, CategoryType, CATEGORIES } from '../types';
import { toggleLikeOpinion, deleteOpinion } from '../services/opinionService';

interface HomeDashboardProps {
  opinions: Opinion[];
  onNavigateToSubmit: () => void;
  onNavigateToMyOpinions: () => void;
  onNavigateToAccount: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onEditOpinion?: (opinion: Opinion) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  opinions,
  onNavigateToSubmit,
  onNavigateToMyOpinions,
  onNavigateToAccount,
  onOpenSettings,
  onOpenNotifications,
  onOpenAuth,
  onShowToast,
  onEditOpinion
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const [selectedOpinionForModal, setSelectedOpinionForModal] = useState<Opinion | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Friend';

  // Compute stats
  const myOpinionsCount = useMemo(() => {
    if (!currentUser) return 0;
    return opinions.filter((op) => op.userId === currentUser.uid).length;
  }, [opinions, currentUser]);

  const totalLikes = useMemo(() => {
    return opinions.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);
  }, [opinions]);

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Education':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'Technology':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'Society':
        return <Users className="w-3.5 h-3.5" />;
      case 'Entertainment':
        return <Film className="w-3.5 h-3.5" />;
      case 'Personal Opinion':
        return <Lightbulb className="w-3.5 h-3.5" />;
      case 'Other':
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'Education':
        return 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30';
      case 'Technology':
        return 'text-blue-300 bg-blue-950/60 border-blue-500/30';
      case 'Society':
        return 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30';
      case 'Entertainment':
        return 'text-pink-300 bg-pink-950/60 border-pink-500/30';
      case 'Personal Opinion':
        return 'text-amber-300 bg-amber-950/60 border-amber-500/30';
      case 'Other':
      default:
        return 'text-purple-300 bg-purple-950/60 border-purple-500/30';
    }
  };

  // Filter and sort opinions
  const filteredOpinions = useMemo(() => {
    let result = [...opinions];

    if (selectedCategory !== 'All') {
      result = result.filter((op) => op.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (op) =>
          op.title.toLowerCase().includes(q) ||
          op.content.toLowerCase().includes(q) ||
          op.authorName.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'likes') {
      result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [opinions, selectedCategory, searchQuery, sortBy]);

  const handleLike = async (op: Opinion) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const hasLiked = op.likedBy?.includes(currentUser.uid) || false;
    try {
      await toggleLikeOpinion(op.id, currentUser.uid, hasLiked);
      onShowToast(hasLiked ? 'Upvote removed' : 'Opinion upvoted!', 'info');
    } catch {
      onShowToast('Could not update upvote.', 'error');
    }
  };

  const handleShare = (op: Opinion) => {
    const text = `Read "${op.title}" by ${op.authorName} on Kishore Opinion!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} \n\n${window.location.origin}`);
      onShowToast('Direct opinion share link copied to clipboard!', 'success');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOpinion(id);
      setDeleteConfirmationId(null);
      if (selectedOpinionForModal?.id === id) {
        setSelectedOpinionForModal(null);
      }
      onShowToast('Opinion deleted successfully.', 'success');
    } catch {
      onShowToast('Failed to delete opinion.', 'error');
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-10">
      
      {/* Hero Welcome Banner */}
      <div className="relative glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-white/10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Cloud Discourse</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {getGreeting()},{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              Welcome to <span className="text-white font-medium">Kishore Opinion</span>. Publish your perspectives on technology, education, society, and culture, and engage in meaningful discourse.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={currentUser ? onNavigateToSubmit : onOpenAuth}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit an Opinion</span>
              </button>

              {currentUser && (
                <button
                  onClick={onNavigateToMyOpinions}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 hover:text-white border border-violet-500/30 text-sm font-semibold transition-colors"
                >
                  <FolderHeart className="w-4 h-4 text-violet-400" />
                  <span>My Opinions ({myOpinionsCount})</span>
                </button>
              )}

              <button
                onClick={currentUser ? onNavigateToAccount : onOpenAuth}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Personal Account</span>
              </button>
            </div>
          </div>

          {/* User Profile Card & Quick Stats */}
          <div className="lg:w-80 glass-panel rounded-2xl p-5 border border-white/10 shrink-0">
            {currentUser ? (
              <div>
                <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
                  <img
                    src={userProfile?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`}
                    alt="User Avatar"
                    className="w-12 h-12 rounded-full object-cover border border-cyan-400/50 bg-slate-900"
                  />
                  <div className="truncate">
                    <p className="text-sm font-bold text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-300 font-semibold mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-purple-400" /> Administrator
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                    <p className="text-xs text-slate-400">My Opinions</p>
                    <p className="text-lg font-bold text-cyan-300">{myOpinionsCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                    <p className="text-xs text-slate-400">Total Live</p>
                    <p className="text-lg font-bold text-purple-300">{opinions.length}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs">
                  <button
                    onClick={onOpenSettings}
                    className="text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    Settings Menu
                  </button>
                  <button
                    onClick={logout}
                    className="text-rose-400 hover:text-rose-300 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Join Kishore Opinion</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Sign in or create a profile to submit opinions, upvote ideas, and manage your account.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-md shadow-cyan-500/20"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Opinions</p>
            <p className="text-2xl font-bold text-white">{opinions.length}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Upvotes</p>
            <p className="text-2xl font-bold text-white">{totalLikes}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Categories</p>
            <p className="text-2xl font-bold text-white">{CATEGORIES.length}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
            <FolderHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">My Submissions</p>
            <p className="text-2xl font-bold text-white">{myOpinionsCount}</p>
          </div>
        </div>
      </div>

      {/* Main Opinions Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Recently Submitted Opinions</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredOpinions.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Explore diverse perspectives from voices across the platform
            </p>
          </div>

          {/* Search Bar & Sorter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opinions or authors..."
                className="w-full glass-input rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  sortBy === 'newest' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('likes')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  sortBy === 'likes' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top Liked
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Opinions Cards Feed */}
        {filteredOpinions.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Opinions Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
              {searchQuery || selectedCategory !== 'All'
                ? 'No opinions match your current search or category filter. Try clearing filters.'
                : 'Be the first to submit an opinion to Kishore Opinion and inspire the community!'}
            </p>
            <button
              onClick={currentUser ? onNavigateToSubmit : onOpenAuth}
              className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25"
            >
              Submit First Opinion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpinions.map((op) => {
              const hasLiked = currentUser && op.likedBy?.includes(currentUser.uid);
              const isOwner = currentUser && op.userId === currentUser.uid;

              return (
                <article
                  key={op.id}
                  className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col justify-between hover:border-cyan-500/30 hover:shadow-xl transition-all duration-300 group relative"
                >
                  <div>
                    {/* Header: Author & Category */}
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={op.authorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${op.userId}`}
                          alt={op.authorName}
                          className="w-9 h-9 rounded-full object-cover border border-white/15 bg-slate-950 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${op.userId}`;
                          }}
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{op.authorName}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatDate(op.createdAt)}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${getCategoryColor(
                          op.category
                        )}`}
                      >
                        {getCategoryIcon(op.category)}
                        <span>{op.category}</span>
                      </span>
                    </div>

                    {/* Image Attachment (if present) */}
                    {op.imageUrl && (
                      <div
                        onClick={() => setSelectedOpinionForModal(op)}
                        className="rounded-2xl overflow-hidden mb-3.5 max-h-48 cursor-pointer relative group/img border border-white/10 bg-slate-950"
                      >
                        <img
                          src={op.imageUrl}
                          alt={op.title}
                          className="w-full h-48 object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <h3
                      onClick={() => setSelectedOpinionForModal(op)}
                      className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 cursor-pointer mb-2"
                    >
                      {op.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      {op.content}
                    </p>
                  </div>

                  {/* Card Footer: Likes, Share, Quick Actions */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(op)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                          hasLiked
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                            : 'bg-slate-900/60 text-slate-400 hover:text-white border-white/5 hover:bg-slate-800'
                        }`}
                        title="Upvote opinion"
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? 'text-cyan-400 fill-cyan-400/20' : ''}`} />
                        <span className="font-semibold">{op.likesCount || 0}</span>
                      </button>

                      <button
                        onClick={() => handleShare(op)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                        title="Share opinion"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {(isOwner || isAdmin) && (
                        <div className="flex items-center gap-1">
                          {isOwner && onEditOpinion && (
                            <button
                              onClick={() => onEditOpinion(op)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                              title="Edit my opinion"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmationId(op.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete opinion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedOpinionForModal(op)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs flex items-center gap-1"
                      >
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Opinion Full Details Modal */}
      {selectedOpinionForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-white/15 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedOpinionForModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={selectedOpinionForModal.authorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedOpinionForModal.userId}`}
                alt={selectedOpinionForModal.authorName}
                className="w-12 h-12 rounded-full object-cover border border-cyan-400/50 bg-slate-900"
              />
              <div>
                <p className="text-base font-bold text-white">{selectedOpinionForModal.authorName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{formatDate(selectedOpinionForModal.createdAt)}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getCategoryColor(selectedOpinionForModal.category)}`}>
                    {selectedOpinionForModal.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-snug">
              {selectedOpinionForModal.title}
            </h2>

            {/* Attached Image if present */}
            {selectedOpinionForModal.imageUrl && (
              <div className="rounded-2xl overflow-hidden mb-6 border border-white/15 max-h-96 bg-slate-950">
                <img
                  src={selectedOpinionForModal.imageUrl}
                  alt={selectedOpinionForModal.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Content text */}
            <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-6">
              {selectedOpinionForModal.content}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLike(selectedOpinionForModal)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
                >
                  <ThumbsUp className="w-4 h-4 text-cyan-400" />
                  <span>{selectedOpinionForModal.likesCount || 0} Upvotes</span>
                </button>

                <button
                  onClick={() => handleShare(selectedOpinionForModal)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {(currentUser?.uid === selectedOpinionForModal.userId || isAdmin) && (
                <button
                  onClick={() => setDeleteConfirmationId(selectedOpinionForModal.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel-elevated rounded-3xl p-6 text-center border border-rose-500/40 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete Opinion?</h3>
            <p className="text-xs text-slate-300 mt-1 mb-5">
              This action cannot be undone. The opinion will be permanently removed from the cloud database.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmationId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
