import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

export async function signUpUser({ fullName, phone, village, role, email, password }) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth is not configured.');
  }

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: fullName.trim() });

  const profile = {
    uid: cred.user.uid,
    fullName: fullName.trim(),
    phone: phone.trim(),
    village: village.trim(),
    role, // 'farmer' | 'hub_agent' | 'processor'
    email: email.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile);
  return profile;
}

export async function signInUser(email, password) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth is not configured.');
  }

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  return snap.exists()
    ? snap.data()
    : {
        uid: cred.user.uid,
        fullName: cred.user.displayName || email.split('@')[0],
        email: cred.user.email,
        role: 'farmer',
        phone: '',
        village: '',
      };
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuth(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback({
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || firebaseUser.email,
          email: firebaseUser.email,
          role: 'farmer',
          phone: '',
          village: '',
        });
      }
    } catch {
      callback({
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || firebaseUser.email,
        email: firebaseUser.email,
        role: 'farmer',
      });
    }
  });
}