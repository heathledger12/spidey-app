export type CategoryType =
  | 'Education'
  | 'Technology'
  | 'Society'
  | 'Entertainment'
  | 'Personal Opinion'
  | 'Other';

export const CATEGORIES: CategoryType[] = [
  'Education',
  'Technology',
  'Society',
  'Entertainment',
  'Personal Opinion',
  'Other'
];

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: 'user' | 'admin';
  theme?: 'dark' | 'light';
  emailNotifications?: boolean;
  publicProfile?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Opinion {
  id: string;
  userId: string;
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  title: string;
  category: CategoryType;
  content: string;
  imageUrl?: string;
  likesCount: number;
  likedBy: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'system' | 'opinion' | 'security';
}
