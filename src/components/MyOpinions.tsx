import React, { useState, useMemo } from 'react';
import {
  FolderHeart,
  PlusCircle,
  Edit3,
  Trash2,
  ThumbsUp,
  Clock,
  Sparkles,
  BookOpen,
  Cpu,
  Users,
  Film,
  Lightbulb,
  HelpCircle,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Opinion, CategoryType, CATEGORIES } from '../types';
import { updateOpinion, deleteOpinion } from '../services/opinionService';

interface MyOpinionsProps {
  opinions: Opinion[];
  onNavigateToSubmit: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MyOpinions: React.FC<MyOpinionsProps> = ({
  opinions,
  onNavigateToSubmit,
  onShowToast
}) => {
  const { currentUser } = useAuth();

  const [editingOpinion, setEditingOpinion] = useState<Opinion | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryType>('Technology');
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter only opinions belonging to current user
  const userOpinions = useMemo(() => {
    if (!currentUser) return [];
    return opinions.filter((op) => op.userId === currentUser.uid);
  }, [opinions, currentUser]);

  const totalLikes = useMemo(() => {
    return userOpinions.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);
  }, [userOpinions]);

  const handleStartEdit = (op: Opinion) => {
    setEditingOpinion(op);
    setEditTitle(op.title);
    setEditCategory(op.category);
    setEditContent(op.content);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpinion) return;

    if (editTitle.trim().length < 3) {
      onShowToast('Title must be at least 3 characters.', 'error');
      return;
    }
    if (editContent.trim().length < 10) {
      onShowToast('Content must be at least 10 characters.', 'error');
      return;
    }

    try {
      setSavingEdit(true);
      await updateOpinion(editingOpinion.id, {
        title: editTitle.trim(),
        category: editCategory,
        content: editContent.trim()
      });
      setEditingOpinion(null);
      onShowToast('Opinion successfully updated in cloud database!', 'success');
    } catch {
      onShowToast('Failed to update opinion.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOpinion(deleteId);
      setDeleteId(null);
      onShowToast('Opinion permanently deleted.', 'success');
    } catch {
      onShowToast('Failed to delete opinion.', 'error');
    }
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Education':
        return <BookOpen className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Technology':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case 'Society':
        return <Users className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Entertainment':
        return <Film className="w-3.5 h-3.5 text-pink-400" />;
      case 'Personal Opinion':
        return <Lightbulb className="w-3.5 h-3.5 text-amber-400" />;
      case 'Other':
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-8">
      {/* Header and Summary Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FolderHeart className="w-8 h-8 text-cyan-400" />
            <span>My Submitted Opinions</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, review, edit, or remove your personal opinions saved on the cloud
          </p>
        </div>

        <button
          onClick={onNavigateToSubmit}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 self-start sm:self-auto transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New</span>
        </button>
      </div>

      {/* Quick Personal Engagement Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Published</p>
            <p className="text-2xl font-bold text-white">{userOpinions.length}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Upvotes Received</p>
            <p className="text-2xl font-bold text-white">{totalLikes}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Latest Submission</p>
            <p className="text-sm font-semibold text-white truncate">
              {userOpinions.length > 0
                ? new Date(userOpinions[0].createdAt).toLocaleDateString()
                : 'None yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Opinions List */}
      {userOpinions.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <FolderHeart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No Opinions Published Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2 mb-6">
            You haven't submitted any opinions yet. Share your thoughts on tech, education, or society today!
          </p>
          <button
            onClick={onNavigateToSubmit}
            className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            Create Your First Opinion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userOpinions.map((op) => (
            <div
              key={op.id}
              className="glass-panel rounded-3xl p-5 sm:p-6 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-white/10 text-xs font-semibold text-slate-200">
                    {getCategoryIcon(op.category)}
                    <span>{op.category}</span>
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Submitted: {new Date(op.createdAt).toLocaleString()}</span>
                  </span>
                  {op.updatedAt && (
                    <span className="text-[11px] text-cyan-400/80">
                      (Edited {new Date(op.updatedAt).toLocaleDateString()})
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {op.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {op.content}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-cyan-300">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{op.likesCount || 0} Upvotes</span>
                  </span>
                  {op.imageUrl && <span className="text-slate-400">• Includes image attachment</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => handleStartEdit(op)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setDeleteId(op.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Opinion Modal */}
      {editingOpinion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl relative">
            <button
              onClick={() => setEditingOpinion(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Edit Your Opinion</h3>
            <p className="text-xs text-slate-400 mb-6">
              Update title, category, and content. Changes will synchronize with the cloud database.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CategoryType)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm text-white bg-[#0b102c]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#080D24]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Detailed Opinion Text
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full glass-input rounded-xl p-3.5 text-sm text-white resize-y"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingOpinion(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm glass-panel-elevated rounded-3xl p-6 text-center border border-rose-500/40 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete This Opinion?</h3>
            <p className="text-xs text-slate-300 mt-1 mb-5">
              This opinion will be permanently removed from Kishore Opinion.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
