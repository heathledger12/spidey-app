import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Fingerprint,
  Edit2,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogOut,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  Camera,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PersonalAccountProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onLogoutSuccess: () => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aura',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nova',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Kishore',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Pulse',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zenith'
];

export const PersonalAccount: React.FC<PersonalAccountProps> = ({
  onShowToast,
  onLogoutSuccess
}) => {
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    changePassword,
    deleteUserAccount,
    logout,
    isAdmin
  } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedPhoto, setSelectedPhoto] = useState(userProfile?.photoURL || currentUser?.photoURL || AVATAR_PRESETS[0]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>((userProfile?.theme as 'dark' | 'light') || 'dark');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(userProfile?.emailNotifications ?? true);
  const [publicProfile, setPublicProfile] = useState<boolean>(userProfile?.publicProfile ?? true);

  // Copy UID feedback
  const [copiedUid, setCopiedUid] = useState(false);

  // Delete account confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!currentUser) return null;

  const handleCopyUid = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      onShowToast('Unique User ID copied to clipboard!', 'success');
      setTimeout(() => setCopiedUid(false), 2500);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      onShowToast('Avatar image must be under 1.5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      onShowToast('Display name cannot be empty.', 'error');
      return;
    }

    try {
      setSavingProfile(true);
      await updateUserProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: selectedPhoto
      });
      setIsEditingProfile(false);
      onShowToast('Personal profile updated successfully!', 'success');
    } catch {
      onShowToast('Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      onShowToast('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast('Passwords do not match.', 'error');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      onShowToast('Password successfully changed!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password. You may need to re-login.';
      onShowToast(msg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleNotifications = async () => {
    const newVal = !emailNotifications;
    setEmailNotifications(newVal);
    try {
      await updateUserProfile({ emailNotifications: newVal });
      onShowToast(`Email notifications ${newVal ? 'enabled' : 'disabled'}.`, 'info');
    } catch {
      setEmailNotifications(!newVal);
      onShowToast('Could not save notification setting.', 'error');
    }
  };

  const handleTogglePrivacy = async () => {
    const newVal = !publicProfile;
    setPublicProfile(newVal);
    try {
      await updateUserProfile({ publicProfile: newVal });
      onShowToast(`Profile visibility set to ${newVal ? 'Public' : 'Private'}.`, 'info');
    } catch {
      setPublicProfile(!newVal);
      onShowToast('Could not update privacy setting.', 'error');
    }
  };

  const handleToggleTheme = async () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    try {
      await updateUserProfile({ theme: next });
      onShowToast(`Theme preference updated to ${next} mode.`, 'info');
    } catch {
      setThemeMode(themeMode);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteInputText.trim().toUpperCase() !== 'DELETE') {
      onShowToast('Please type DELETE to confirm.', 'error');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteUserAccount();
      setShowDeleteModal(false);
      onShowToast('Account permanently deleted.', 'info');
      onLogoutSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account.';
      onShowToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn space-y-8">
      {/* Account Header Card */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <img
              src={userProfile?.photoURL || currentUser.photoURL || selectedPhoto}
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-cyan-400/60 shadow-xl shadow-cyan-500/20 bg-slate-900"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`;
              }}
            />
            {isEditingProfile && (
              <label className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                <Camera className="w-6 h-6 text-cyan-400" />
                <span className="text-[10px] mt-1 font-semibold">Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {userProfile?.displayName || currentUser.displayName || 'Kishore Contributor'}
                </h1>
                <p className="text-sm text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>{currentUser.email}</span>
                </p>
              </div>

              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors self-center sm:self-start"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl italic">
              "{userProfile?.bio || 'Passionate contributor sharing opinions and perspectives on Kishore Opinion.'}"
            </p>

            {/* Unique User ID with Copy Option */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Fingerprint className="w-4 h-4 text-purple-400" />
                <span>Unique User ID:</span>
              </span>
              <code className="text-xs font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10 text-cyan-300">
                {currentUser.uid}
              </code>
              <button
                onClick={handleCopyUid}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Copy User ID"
              >
                {copiedUid ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Modal / Inline Editor */}
      {isEditingProfile && (
        <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-cyan-500/30 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-cyan-400" />
              <span>Edit Personal Profile</span>
            </h3>
            <button
              onClick={() => setIsEditingProfile(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bio / Headline
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share your interests, perspectives, or professional background..."
                className="w-full glass-input rounded-xl p-3 text-sm text-white resize-y"
              />
            </div>

            {/* Avatar Preset Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Choose an Avatar or Upload Above
              </label>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhoto(preset)}
                    className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform ${
                      selectedPhoto === preset
                        ? 'border-cyan-400 scale-110 shadow-md shadow-cyan-500/30'
                        : 'border-white/15 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover bg-slate-900" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Password Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Password & Security</h3>
              <p className="text-xs text-slate-400">Keep your account protected with a strong password</p>
            </div>
          </div>

          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
          >
            {isChangingPassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {isChangingPassword && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-4 border-t border-white/10 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/25"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      {/* Account Settings & Preferences */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <span>Account Settings & Preferences</span>
        </h3>

        <div className="space-y-4 divide-y divide-white/10">
          {/* Notification Settings */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-semibold text-white">Email Notifications</p>
              <p className="text-xs text-slate-400">Receive opinion interaction alerts and digest updates</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                emailNotifications ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Privacy Settings */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-semibold text-white">Public Profile Visibility</p>
              <p className="text-xs text-slate-400">Allow community members to view your author profile page</p>
            </div>
            <button
              onClick={handleTogglePrivacy}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                publicProfile ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  publicProfile ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dark / Light Mode */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-semibold text-white">Theme Mode</p>
              <p className="text-xs text-slate-400">
                Current: <span className="text-cyan-300 capitalize">{themeMode} Mode</span>
              </p>
            </div>
            <button
              onClick={handleToggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10"
            >
              {themeMode === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>Toggle Theme</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions & Danger Zone */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-rose-500/20 bg-rose-950/10 space-y-6">
        <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <span>Account Actions & Danger Zone</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Logout from Kishore Opinion</p>
            <p className="text-xs text-slate-400">Safely terminate your current session on this device</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              onLogoutSuccess();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Log Out</span>
          </button>
        </div>

        <div className="pt-4 border-t border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-rose-300">Delete Account</p>
            <p className="text-xs text-slate-400">Permanently delete your profile and account credentials</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Account Modal with Confirmation Word */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-elevated rounded-3xl p-6 sm:p-8 text-center border border-rose-500/40 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Delete Account Permanently?</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This action cannot be undone. All your account settings and profile data will be permanently purged.
            </p>

            <div className="mb-6 text-left">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Type <span className="text-rose-400 font-mono">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                placeholder="DELETE"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteInputText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccountConfirm}
                disabled={deleteInputText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-rose-600/25"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
