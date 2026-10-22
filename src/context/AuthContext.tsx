import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile } from '../types';

export const ADMIN_EMAIL = 'kishorekumar1432006@gmail.com';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithDemo: (asAdmin?: boolean) => Promise<void>;
  verifyAdminKey: (passkey: string) => boolean;
  adminOverrideActive: boolean;
  setAdminOverrideActive: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminOverrideActive, setAdminOverrideActive] = useState<boolean>(() => {
    return sessionStorage.getItem('kishore_admin_authorized') === 'true';
  });

  // Fetch or sync user profile from Firestore
  const fetchProfile = async (user: User, fallbackName?: string): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      const isSystemAdminEmail = (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile: UserProfile = {
          uid: user.uid,
          displayName: data.displayName || user.displayName || fallbackName || 'User',
          email: user.email || data.email || '',
          photoURL: data.photoURL || user.photoURL || '',
          bio: data.bio || '',
          role: isSystemAdminEmail ? 'admin' : (data.role || 'user'),
          theme: data.theme || 'dark',
          emailNotifications: data.emailNotifications ?? true,
          publicProfile: data.publicProfile ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt
        };
        setUserProfile(profile);
        return profile;
      } else {
        // Create initial profile in Firestore
        const resolvedName = fallbackName || user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: resolvedName,
          email: user.email || '',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          bio: 'Passionate contributor sharing opinions and perspectives.',
          role: isSystemAdminEmail ? 'admin' : 'user',
          theme: 'dark',
          emailNotifications: true,
          publicProfile: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);

        // Also if system admin, register admin doc
        if (isSystemAdminEmail) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              uid: user.uid,
              email: user.email,
              role: 'superadmin',
              grantedAt: new Date().toISOString()
            });
          } catch (e) {
            console.warn('System admin registration note:', e);
          }
        }

        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore profile sync note:', err);
      // Fallback local representation
      const fallback: UserProfile = {
        uid: user.uid,
        displayName: fallbackName || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        email: user.email || '',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
        theme: 'dark',
        emailNotifications: true,
        publicProfile: true,
        createdAt: new Date().toISOString()
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await fetchProfile(cred.user);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      try {
        await updateProfile(cred.user, { displayName: name });
      } catch (err) {
        console.warn('Could not set displayName on auth user:', err);
      }
    }
    await fetchProfile(cred.user, name);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await fetchProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changePassword = async (newPass: string) => {
    if (!auth.currentUser) throw new Error('No authenticated user session found.');
    await updatePassword(auth.currentUser, newPass);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Not logged in');
    const userDocRef = doc(db, 'users', currentUser.uid);

    if (data.displayName && data.displayName !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: data.displayName });
    }
    if (data.photoURL && data.photoURL !== currentUser.photoURL) {
      await updateProfile(currentUser, { photoURL: data.photoURL });
    }

    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(userDocRef, payload);
    setUserProfile((prev) => (prev ? { ...prev, ...payload } : null));
  };

  const deleteUserAccount = async () => {
    if (!currentUser) throw new Error('Not logged in');
    const uid = currentUser.uid;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch {
      // Continue even if remote doc deletion fails
    }
    await deleteUser(currentUser);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const logout = async () => {
    sessionStorage.removeItem('kishore_admin_authorized');
    setAdminOverrideActive(false);
    await signOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const verifyAdminKey = (passkey: string): boolean => {
    // Secret verification phrase for Kishore Opinion platform administrator
    const valid = passkey.trim() === 'kishore2026' || passkey.trim() === 'KishoreOpinion@2026';
    if (valid) {
      sessionStorage.setItem('kishore_admin_authorized', 'true');
      setAdminOverrideActive(true);
    }
    return valid;
  };

  const loginWithDemo = async (asAdmin: boolean = false) => {
    const demoUser = {
      uid: asAdmin ? 'demo-admin-kishore' : 'demo-user-123',
      displayName: asAdmin ? 'Kishore Kumar (Admin)' : 'Kishore Contributor',
      email: asAdmin ? ADMIN_EMAIL : 'contributor@example.com',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${asAdmin ? 'Kishore' : 'Contributor'}`,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    const demoProfile: UserProfile = {
      uid: demoUser.uid,
      displayName: demoUser.displayName || 'Demo User',
      email: demoUser.email || '',
      photoURL: demoUser.photoURL || '',
      bio: asAdmin ? 'Kishore Opinion Platform Administrator' : 'Passionate contributor sharing opinions and perspectives.',
      role: asAdmin ? 'admin' : 'user',
      theme: 'dark',
      emailNotifications: true,
      publicProfile: true,
      createdAt: new Date().toISOString()
    };

    setCurrentUser(demoUser);
    setUserProfile(demoProfile);
    if (asAdmin) {
      sessionStorage.setItem('kishore_admin_authorized', 'true');
      setAdminOverrideActive(true);
    }
  };

  const isEmailAdmin =
    (currentUser?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    userProfile?.role === 'admin';

  const isAdmin = isEmailAdmin || adminOverrideActive;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithDemo,
        resetPassword,
        changePassword,
        updateUserProfile,
        deleteUserAccount,
        logout,
        refreshProfile,
        verifyAdminKey,
        adminOverrideActive,
        setAdminOverrideActive
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
