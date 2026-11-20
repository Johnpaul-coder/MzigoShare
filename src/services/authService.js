import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

export async function signUpUser({ fullName, phone, village, email, password }) {
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
    role: 'farmer',
    email: email.trim().toLowerCase(),
    emailVerified: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), profile);
  await sendEmailVerification(cred.user);
  await signOut(auth);
  return profile;
}

export async function createDriverAccountByAdmin({
  fullName,
  phone,
  email,
  password,
  licenseNo,
  nationalId,
  assignedTruckPlate,
}) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth is not configured.');
  }

  const secondaryName = 'DriverProvisioner';
  const existing = getApps().find((a) => a.name === secondaryName);
  if (existing) {
    await deleteApp(existing);
  }

  const secondaryApp = initializeApp(auth.app.options, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim().toLowerCase(),
      password
    );
    await updateProfile(cred.user, { displayName: fullName.trim() });

    const profile = {
      uid: cred.user.uid,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      role: 'driver',
      licenseNo: (licenseNo || '').trim().toUpperCase(),
      nationalId: (nationalId || '').trim(),
      assignedTruckPlate: (assignedTruckPlate || '').trim().toUpperCase(),
      createdByAdmin: true,
      status: 'active',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), profile);
    await signOut(secondaryAuth);
    return profile;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function signInUser(email, password) {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth is not configured.');
  }

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  const profile = snap.exists() ? snap.data() : null;

  const bypassVerification =
    profile?.role === 'driver' || profile?.role === 'admin' || profile?.createdByAdmin === true;

  if (!cred.user.emailVerified && !bypassVerification) {
    await signOut(auth);
    throw new Error('UNVERIFIED_EMAIL');
  }

  return (
    profile || {
      uid: cred.user.uid,
      fullName: cred.user.displayName || email.split('@')[0],
      email: cred.user.email,
      role: 'farmer',
      phone: '',
      village: '',
    }
  );
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
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        const bypassVerification =
          data.role === 'driver' || data.role === 'admin' || data.createdByAdmin === true;

        if (!firebaseUser.emailVerified && !bypassVerification) {
          callback(null);
          return;
        }
        callback(data);
      } else {
        if (!firebaseUser.emailVerified) {
          callback(null);
          return;
        }
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
      callback(null);
    }
  });
}