import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  getDoc,
  runTransaction,
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

export function subscribeToDrivers(callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, 'drivers');
  return onSnapshot(colRef, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

export async function registerDriver(driverData) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const newDriver = {
    fullName: driverData.fullName.trim(),
    phone: driverData.phone.trim(),
    licenseNo: driverData.licenseNo.trim().toUpperCase(),
    vehiclePlate: driverData.vehiclePlate.trim().toUpperCase(),
    vehicleType: driverData.vehicleType.trim(),
    maxCapacityKg: Number(driverData.maxCapacityKg) || 1000,
    status: 'Available',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'drivers'), newDriver);
  return docRef.id;
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
    distanceKm: Number(poolData.distanceKm) || 0,
    produceType: poolData.produceType.trim(),
    vehicleType: poolData.vehicleType.trim(),
    driverId: poolData.driverId || null,
    driverName: poolData.driverName || 'Unassigned',
    driverPhone: poolData.driverPhone || '',
    vehiclePlate: poolData.vehiclePlate || 'Pending Plate',
    tripStatus: 'Awaiting Cargo',
    maxCapacityKg,
    currentWeightKg: 0,
    baseTruckCost,
    middlemanPricePerKg: Number(poolData.middlemanPricePerKg),
    processorPricePerKg: Number(poolData.processorPricePerKg),
    departureWindow: poolData.departureWindow.trim(),
    hubRoute: [poolData.origin.trim(), poolData.destination.trim()],
    bookings: [],
    createdBy: poolData.createdBy || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'truckPools'), newPool);
  return docRef.id;
}

export async function assignDriverToPool(poolId, driver) {
  if (!isFirebaseConfigured || !db) return;
  const poolRef = doc(db, 'truckPools', poolId);
  await updateDoc(poolRef, {
    driverId: driver.id,
    driverName: driver.fullName,
    driverPhone: driver.phone,
    vehiclePlate: driver.vehiclePlate,
    vehicleType: driver.vehicleType,
  });
}

// Atomic transaction prevents concurrent overbooking when two farmers pay simultaneously
export async function joinTruckPool(poolId, booking) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase Firestore is not configured.');
  }

  const poolRef = doc(db, 'truckPools', poolId);

  return runTransaction(db, async (transaction) => {
    const poolSnap = await transaction.get(poolRef);
    if (!poolSnap.exists()) {
      throw new Error('Selected truck pool no longer exists.');
    }

    const poolData = poolSnap.data();
    const currentWeight = Number(poolData.currentWeightKg) || 0;
    const maxCapacity = Number(poolData.maxCapacityKg) || 0;
    const remainingKg = Math.max(maxCapacity - currentWeight, 0);
    const requestedWeight = Number(booking.weightKg) || 0;

    if (remainingKg <= 0 || requestedWeight <= 0) {
      throw new Error('This truck pool is already at 100% capacity.');
    }

    const acceptedWeight = Math.min(requestedWeight, remainingKg);
    const randomTagNum = Math.floor(1000 + Math.random() * 9000);

    const newBooking = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      goodsTag: `MZG-${randomTagNum}`,
      uid: booking.uid || null,
      farmerName: booking.farmerName.trim(),
      productName: booking.productName?.trim() || poolData.produceType,
      village: booking.village.trim(),
      phone: booking.phone ? booking.phone.trim() : '',
      weightKg: acceptedWeight,
      channel: booking.channel,
      paid: true,
      mpesaReceipt: booking.mpesaReceipt || `USSD-${Date.now().toString().slice(-6)}`,
      amountPaid: Number(booking.amountPaid) || 0,
      escrowStatus: booking.escrowStatus || 'Held in Escrow',
      deliveryStatus: 'Listed & Paid',
      dropoffPhotoUrl: '',
      dropoffNotes: '',
      deliveredAt: null,
      timestamp: new Date().toISOString(),
    };

    const nextWeight = currentWeight + acceptedWeight;
    const nextTripStatus =
      poolData.tripStatus === 'Awaiting Cargo' ? 'Filling Pool' : poolData.tripStatus;

    transaction.update(poolRef, {
      currentWeightKg: nextWeight,
      tripStatus: nextTripStatus,
      bookings: [...(poolData.bookings || []), newBooking],
    });

    return newBooking;
  });
}

export async function updateBookingDelivery(poolId, bookingId, updates) {
  if (!isFirebaseConfigured || !db) return;
  const poolRef = doc(db, 'truckPools', poolId);
  const poolSnap = await getDoc(poolRef);
  if (!poolSnap.exists()) return;

  const poolData = poolSnap.data();
  const updatedBookings = (poolData.bookings || []).map((b) =>
    b.id === bookingId ? { ...b, ...updates } : b
  );

  const allDelivered =
    updatedBookings.length > 0 && updatedBookings.every((b) => b.deliveryStatus === 'Delivered');
  const anyInTransit = updatedBookings.some((b) => b.deliveryStatus === 'In Transit');
  const anyPickedUp = updatedBookings.some((b) => b.deliveryStatus === 'Tagged & Picked Up');

  let tripStatus = poolData.tripStatus || 'Awaiting Cargo';
  if (allDelivered) tripStatus = 'Delivered';
  else if (anyInTransit) tripStatus = 'In Transit';
  else if (anyPickedUp) tripStatus = 'Loading Pickups';

  await updateDoc(poolRef, {
    bookings: updatedBookings,
    tripStatus,
  });
}

// Broadcast real-time driver GPS coordinates to Firestore
export async function updatePoolLiveLocation(poolId, coords) {
  if (!isFirebaseConfigured || !db || !poolId) return;
  const poolRef = doc(db, 'truckPools', poolId);
  await updateDoc(poolRef, {
    liveLocation: {
      lat: Number(coords.lat),
      lng: Number(coords.lng),
      speedKmh: coords.speedKmh ? Math.round(coords.speedKmh * 3.6) : 0,
      updatedAt: new Date().toISOString(),
    },
  });
}