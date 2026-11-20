import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const INITIAL_POOLS = [
  {
    id: 'pool-machakos-nairobi',
    origin: 'Machakos Hub',
    destination: 'Nairobi (Processor Gate)',
    corridor: 'Machakos ➔ Nairobi',
    produceType: 'Tomatoes (Grade A)',
    vehicleType: '1-Ton Pickup (Canter Mini)',
    maxCapacityKg: 1000,
    currentWeightKg: 600,
    baseTruckCost: 3000,
    middlemanPricePerKg: 20,
    processorPricePerKg: 45,
    departureWindow: 'Today, 4:00 PM',
    hubRoute: ['Kalama', 'Machakos Hub', 'Mlolongo', 'Nairobi Factory'],
    bookings: [
      { id: 'b1', farmerName: 'Kamau Mwangi', village: 'Kalama', weightKg: 200, channel: 'App', paid: true },
      { id: 'b2', farmerName: 'Faith Ndinda', village: 'Mwala', weightKg: 200, channel: 'USSD', paid: true },
      { id: 'b3', farmerName: 'Peter Mutua', village: 'Kathiani', weightKg: 200, channel: 'App', paid: true },
    ],
  },
  {
    id: 'pool-machakos-kisii',
    origin: 'Machakos Hub',
    destination: 'Kisii Agro-Processing Park',
    corridor: 'Machakos ➔ Nairobi Hub ➔ Kisii',
    produceType: 'French Beans & Avocados',
    vehicleType: '3-Ton Refrigerated Lorry',
    maxCapacityKg: 3000,
    currentWeightKg: 2100,
    baseTruckCost: 12000,
    middlemanPricePerKg: 35,
    processorPricePerKg: 75,
    departureWindow: 'Tomorrow, 5:30 AM',
    hubRoute: ['Machakos Hub', 'Nairobi Consolidation Hub', 'Narok', 'Kisii Plant'],
    bookings: [
      { id: 'b4', farmerName: 'Grace Wanjiku', village: 'Kangundo', weightKg: 900, channel: 'App', paid: true },
      { id: 'b5', farmerName: 'David Njoroge', village: 'Matungulu', weightKg: 1200, channel: 'USSD', paid: true },
    ],
  },
];

let localPools = JSON.parse(JSON.stringify(INITIAL_POOLS));
const localListeners = new Set();

function notifyLocalListeners() {
  localListeners.forEach((cb) => cb(JSON.parse(JSON.stringify(localPools))));
}

export async function seedInitialPoolsIfNeeded() {
  if (!isFirebaseConfigured || !db) return;
  const colRef = collection(db, 'truckPools');
  const snap = await getDocs(colRef);
  if (snap.empty) {
    for (const pool of INITIAL_POOLS) {
      await setDoc(doc(db, 'truckPools', pool.id), pool);
    }
  }
}

export function subscribeToPools(callback) {
  if (isFirebaseConfigured && db) {
    const colRef = collection(db, 'truckPools');
    return onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(data.length ? data : INITIAL_POOLS);
    });
  }

  localListeners.add(callback);
  callback(JSON.parse(JSON.stringify(localPools)));
  return () => localListeners.delete(callback);
}

export async function joinTruckPool(poolId, booking) {
  const newBooking = {
    id: `bk-${Date.now()}`,
    ...booking,
    paid: true,
    timestamp: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    const poolRef = doc(db, 'truckPools', poolId);
    const target = localPools.find((p) => p.id === poolId);
    const currentKg = target ? target.currentWeightKg : 0;
    await updateDoc(poolRef, {
      currentWeightKg: currentKg + Number(booking.weightKg),
      bookings: arrayUnion(newBooking),
    });
    return;
  }

  localPools = localPools.map((pool) => {
    if (pool.id !== poolId) return pool;
    const updatedWeight = Math.min(pool.currentWeightKg + Number(booking.weightKg), pool.maxCapacityKg);
    return {
      ...pool,
      currentWeightKg: updatedWeight,
      bookings: [...pool.bookings, newBooking],
    };
  });
  notifyLocalListeners();
}
