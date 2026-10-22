import React from 'react';
import { Bell, X, CheckCheck, Trash2, Sparkles, ThumbsUp, ShieldCheck } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'opinion':
        return <ThumbsUp className="w-4 h-4 text-cyan-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel-elevated rounded-3xl p-6 sm:p-7 border border-white/15 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Notifications</h3>
              <p className="text-xs text-slate-400">Updates, platform alerts, and community engagement</p>
            </div>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear list</span>
            </button>
          </div>
        )}

        <div className="mt-4 max-h-80 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No new notifications</p>
              <p className="text-xs text-slate-500 mt-1">You are all caught up!</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  item.read
                    ? 'bg-slate-900/50 border-white/5 opacity-75'
                    : 'bg-cyan-500/10 border-cyan-500/30'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900 border border-white/10 shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-white">{item.title}</p>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{item.date}</p>
                </div>
                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
