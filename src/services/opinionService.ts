import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Opinion, UserProfile } from '../types';

const OPINIONS_COLLECTION = 'opinions';
const USERS_COLLECTION = 'users';

/**
 * Real-time listener for all opinions, ordered by newest first
 */
export function subscribeToOpinions(
  callback: (opinions: Opinion[]) => void,
  onError?: (err: unknown) => void
) {
  try {
    const q = query(collection(db, OPINIONS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const opinions: Opinion[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          opinions.push({
            id: docSnap.id,
            userId: data.userId || '',
            authorName: data.authorName || 'Anonymous',
            authorPhoto: data.authorPhoto || '',
            authorEmail: data.authorEmail || '',
            title: data.title || '',
            category: data.category || 'Other',
            content: data.content || '',
            imageUrl: data.imageUrl || '',
            likesCount: typeof data.likesCount === 'number' ? data.likesCount : (data.likedBy?.length || 0),
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt
          });
        });
        callback(opinions);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, OPINIONS_COLLECTION);
      }
    );
  } catch (error) {
    if (onError) onError(error);
    handleFirestoreError(error, OperationType.GET, OPINIONS_COLLECTION);
  }
}

/**
 * Fetch opinions once
 */
export async function fetchOpinions(): Promise<Opinion[]> {
  try {
    const q = query(collection(db, OPINIONS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const opinions: Opinion[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      opinions.push({
        id: docSnap.id,
        userId: data.userId || '',
        authorName: data.authorName || 'Anonymous',
        authorPhoto: data.authorPhoto || '',
        authorEmail: data.authorEmail || '',
        title: data.title || '',
        category: data.category || 'Other',
        content: data.content || '',
        imageUrl: data.imageUrl || '',
        likesCount: typeof data.likesCount === 'number' ? data.likesCount : (data.likedBy?.length || 0),
        likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt
      });
    });
    return opinions;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, OPINIONS_COLLECTION);
  }
}

/**
 * Create a new opinion
 */
export async function createOpinion(opinionData: Omit<Opinion, 'id'>): Promise<string> {
  const newDocRef = doc(collection(db, OPINIONS_COLLECTION));
  try {
    const payload = {
      ...opinionData,
      id: newDocRef.id,
      likesCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString()
    };
    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${OPINIONS_COLLECTION}/${newDocRef.id}`);
  }
}

/**
 * Update an existing opinion
 */
export async function updateOpinion(
  opinionId: string,
  updatedFields: Partial<Pick<Opinion, 'title' | 'category' | 'content' | 'imageUrl'>>
): Promise<void> {
  const docRef = doc(db, OPINIONS_COLLECTION, opinionId);
  try {
    await updateDoc(docRef, {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${OPINIONS_COLLECTION}/${opinionId}`);
  }
}

/**
 * Delete an opinion
 */
export async function deleteOpinion(opinionId: string): Promise<void> {
  const docRef = doc(db, OPINIONS_COLLECTION, opinionId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OPINIONS_COLLECTION}/${opinionId}`);
  }
}

/**
 * Toggle like on an opinion
 */
export async function toggleLikeOpinion(
  opinionId: string,
  userId: string,
  hasLiked: boolean
): Promise<void> {
  const docRef = doc(db, OPINIONS_COLLECTION, opinionId);
  try {
    if (hasLiked) {
      await updateDoc(docRef, {
        likedBy: arrayRemove(userId),
        likesCount: increment(-1)
      });
    } else {
      await updateDoc(docRef, {
        likedBy: arrayUnion(userId),
        likesCount: increment(1)
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${OPINIONS_COLLECTION}/${opinionId}`);
  }
}

/**
 * Fetch all registered users for Admin
 */
export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        displayName: data.displayName || 'Unnamed User',
        email: data.email || '',
        photoURL: data.photoURL || '',
        bio: data.bio || '',
        role: data.role || 'user',
        theme: data.theme || 'dark',
        emailNotifications: data.emailNotifications ?? true,
        publicProfile: data.publicProfile ?? true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt
      });
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
  }
}

/**
 * Clear all opinions (Admin only)
 */
export async function clearAllOpinions(): Promise<number> {
  try {
    const snapshot = await getDocs(collection(db, OPINIONS_COLLECTION));
    if (snapshot.empty) return 0;
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return snapshot.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, OPINIONS_COLLECTION);
  }
}

/**
 * Export opinions array to downloadable CSV
 */
export function exportOpinionsToCSV(opinions: Opinion[]) {
  const headers = ['ID', 'Title', 'Category', 'Author Name', 'Author Email', 'Likes', 'Date Created', 'Content'];
  
  const rows = opinions.map((op) => [
    `"${op.id}"`,
    `"${(op.title || '').replace(/"/g, '""')}"`,
    `"${op.category}"`,
    `"${(op.authorName || '').replace(/"/g, '""')}"`,
    `"${(op.authorEmail || '').replace(/"/g, '""')}"`,
    op.likesCount || 0,
    `"${op.createdAt ? new Date(op.createdAt).toLocaleString() : ''}"`,
    `"${(op.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `kishore_opinion_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
