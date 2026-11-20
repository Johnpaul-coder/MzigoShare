import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  addDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

export function subscribeToPools(callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, 'truckPools');
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

export async function createTruckPool(poolData) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const maxCapacityKg = Number(poolData.maxCapacityKg);
  const baseTruckCost = Number(poolData.baseTruckCost);

  const newPool = {
    origin: poolData.origin.trim(),
    destination: poolData.destination.trim(),
    corridor: `${poolData.origin.trim()} ➔ ${poolData.destination.trim()}`,
    produceType: poolData.produceType.trim(),
    vehicleType: poolData.vehicleType.trim(),
    maxCapacityKg,
    currentWeightKg: 0,
    baseTruckCost,
    middlemanPricePerKg: Number(poolData.middlemanPricePerKg),
    processorPricePerKg: Number(poolData.processorPricePerKg),
    departureWindow: poolData.departureWindow.trim(),
    hubRoute: [poolData.origin.trim(), poolData.destination.trim()],
    bookings: [],
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'truckPools'), newPool);
  return docRef.id;
}

export async function joinTruckPool(poolId, booking) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const poolRef = doc(db, 'truckPools', poolId);
  const poolSnap = await getDoc(poolRef);

  if (!poolSnap.exists()) {
    throw new Error('Selected truck pool no longer exists.');
  }

  const poolData = poolSnap.data();
  const remainingKg = Math.max(poolData.maxCapacityKg - poolData.currentWeightKg, 0);
  const acceptedWeight = Math.min(Number(booking.weightKg), remainingKg);

  if (acceptedWeight <= 0) {
    throw new Error('This truck pool is already at 100% capacity.');
  }

  const newBooking = {
    id: `bk-${Date.now()}`,
    farmerName: booking.farmerName.trim(),
    village: booking.village.trim(),
    phone: booking.phone ? booking.phone.trim() : '',
    weightKg: acceptedWeight,
    channel: booking.channel,
    paid: true,
    timestamp: new Date().toISOString(),
  };

  await updateDoc(poolRef, {
    currentWeightKg: poolData.currentWeightKg + acceptedWeight,
    bookings: arrayUnion(newBooking),
  });
}