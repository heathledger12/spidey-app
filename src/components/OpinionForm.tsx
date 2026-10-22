import React, { useState } from 'react';
import {
  Send,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  BookOpen,
  Cpu,
  Users,
  Film,
  Lightbulb,
  HelpCircle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CategoryType, CATEGORIES } from '../types';
import { createOpinion } from '../services/opinionService';

interface OpinionFormProps {
  onSuccess: (opinionId: string) => void;
  onNavigateToMyOpinions: () => void;
  onNavigateToHome: () => void;
}

export const OpinionForm: React.FC<OpinionFormProps> = ({
  onSuccess,
  onNavigateToMyOpinions,
  onNavigateToHome
}) => {
  const { currentUser, userProfile } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('Technology');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successSubmittedId, setSuccessSubmittedId] = useState<string | null>(null);

  const authorName = userProfile?.displayName || currentUser?.displayName || 'Kishore Contributor';
  const authorEmail = currentUser?.email || '';

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Education':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'Technology':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'Society':
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'Entertainment':
        return <Film className="w-4 h-4 text-pink-400" />;
      case 'Personal Opinion':
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
      case 'Other':
      default:
        return <HelpCircle className="w-4 h-4 text-purple-400" />;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Limit to 1.5MB for Firestore storage safety
    if (file.size > 1.5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 1.5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setTitle('');
    setCategory('Technology');
    setContent('');
    setImagePreview(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      setErrorMsg('You must be signed in to submit an opinion.');
      return;
    }

    if (title.trim().length < 3) {
      setErrorMsg('Opinion title must be at least 3 characters.');
      return;
    }
    if (title.trim().length > 200) {
      setErrorMsg('Opinion title cannot exceed 200 characters.');
      return;
    }

    if (content.trim().length < 10) {
      setErrorMsg('Detailed opinion text must be at least 10 characters.');
      return;
    }
    if (content.trim().length > 10000) {
      setErrorMsg('Detailed opinion text cannot exceed 10,000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const newId = await createOpinion({
        userId: currentUser.uid,
        authorName,
        authorPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        authorEmail,
        title: title.trim(),
        category,
        content: content.trim(),
        imageUrl: imagePreview || undefined,
        likesCount: 0,
        likedBy: [],
        createdAt: new Date().toISOString()
      });

      setSuccessSubmittedId(newId);
      onSuccess(newId);
      handleClear();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish opinion to cloud database.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Success Modal Overlay */}
      {successSubmittedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 sm:p-8 text-center border border-cyan-500/30 shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 glow-cyan">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Opinion Published!
            </h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Your opinion has been permanently saved to the cloud database and is now live for the community and administrators to review.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setSuccessSubmittedId(null);
                  onNavigateToMyOpinions();
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>View My Opinions</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSuccessSubmittedId(null);
                  onNavigateToHome();
                }}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-white/10 transition-colors"
              >
                Browse Public Feed
              </button>

              <button
                onClick={() => setSuccessSubmittedId(null)}
                className="text-xs text-slate-400 hover:text-cyan-300 mt-2 py-1"
              >
                Submit Another Opinion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Form Title & Subtitle */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Submit an Opinion
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Voice your thoughts, ideas, and perspectives to the Kishore Opinion community
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Automatically Obtained User Info (Read-only badge) */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={userProfile?.photoURL || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`}
                alt="Author"
                className="w-10 h-10 rounded-full object-cover border border-cyan-500/40 bg-slate-950"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Submitter Identity
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    <Lock className="w-3 h-3" /> Auto-Verified
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {authorName} <span className="text-xs text-slate-400 font-normal">({authorEmail})</span>
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 self-start sm:self-center">
              UID: <code className="text-cyan-300 font-mono">{currentUser?.uid.slice(0, 10)}...</code>
            </span>
          </div>

          {/* Opinion Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-200">
                Opinion Title <span className="text-cyan-400">*</span>
              </label>
              <span className={`text-xs ${title.length > 200 ? 'text-rose-400' : 'text-slate-400'}`}>
                {title.length} / 200
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Why Artificial Intelligence Must Complement Human Creativity"
              className="w-full glass-input rounded-2xl px-4 py-3 text-sm sm:text-base text-white placeholder-slate-500"
              required
              maxLength={200}
            />
          </div>

          {/* Opinion Category Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2.5">
              Category <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-900/60 border border-white/10 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Opinion Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-200">
                Detailed Opinion <span className="text-cyan-400">*</span>
              </label>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
                <span>•</span>
                <span className={content.length > 10000 ? 'text-rose-400' : ''}>
                  {content.length} / 10,000 chars
                </span>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Express your viewpoint, provide background context, rationale, and constructive solutions..."
              rows={8}
              className="w-full glass-input rounded-2xl p-4 text-sm text-white placeholder-slate-500 resize-y leading-relaxed"
              required
              maxLength={10000}
            />
          </div>

          {/* Optional Image Attachment */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Optional Image Attachment
            </label>
            
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 max-h-72 group">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 text-rose-300 hover:text-rose-100 border border-rose-500/40 hover:bg-rose-900/80 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40 group">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-2">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Click or drag image to attach
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP, GIF up to 1.5MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Actions (Submit & Clear) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Cloud Database...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Opinion</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 hover:text-white border border-violet-500/30 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Form</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
