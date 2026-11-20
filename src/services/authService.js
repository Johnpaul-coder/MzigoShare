import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
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
    emailVerified: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile);

  // Send verification email to the user's inbox
  await sendEmailVerification(cred.user);

  // Sign out immediately so they must verify & sign in
  await signOut(auth);
  return profile;
}

export async function signInUser(email, password) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth is not configured.');
  }

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

  if (!cred.user.emailVerified) {
    await signOut(auth);
    throw new Error('UNVERIFIED_EMAIL');
  }

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

export async function resendVerificationEmail(email, password) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (!cred.user.emailVerified) {
    await sendEmailVerification(cred.user);
  }
  await signOut(auth);
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
    if (!firebaseUser || !firebaseUser.emailVerified) {
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