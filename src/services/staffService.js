import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'staff';
const STAFF_CACHE_TTL_MS = 30 * 1000;
let staffCache = {
    data: null,
    timestamp: 0
};

const isStaffCacheValid = () =>
    Array.isArray(staffCache.data) &&
    (Date.now() - staffCache.timestamp) < STAFF_CACHE_TTL_MS;

const setStaffCache = (data) => {
    staffCache = {
        data,
        timestamp: Date.now()
    };
};

const clearStaffCache = () => {
    staffCache = {
        data: null,
        timestamp: 0
    };
};

export const addStaff = async (staffName, role = 'スタッフ', pin = '0000') => {
    try {
        const newStaff = {
            name: staffName,
            role: role,
            pin: pin,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newStaff);
        clearStaffCache();
        return { id: docRef.id, ...newStaff };
    } catch (error) {
        console.error("Error adding staff: ", error);
        throw error;
    }
};

export const getStaffList = async (options = {}) => {
    try {
        const forceRefresh = options.forceRefresh === true;
        if (!forceRefresh && isStaffCacheValid()) {
            return staffCache.data;
        }

        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const staff = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setStaffCache(staff);
        return staff;
    } catch (error) {
        console.error("Error fetching staff: ", error);
        throw error;
    }
};

export const deleteStaff = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        clearStaffCache();
        return id;
    } catch (error) {
        console.error("Error deleting staff: ", error);
        throw error;
    }
};
