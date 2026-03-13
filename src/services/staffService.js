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

export const addStaff = async (staffName, role = 'スタッフ', pin = '0000') => {
    try {
        const newStaff = {
            name: staffName,
            role: role,
            pin: pin,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newStaff);
        return { id: docRef.id, ...newStaff };
    } catch (error) {
        console.error("Error adding staff: ", error);
        throw error;
    }
};

export const getStaffList = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching staff: ", error);
        throw error;
    }
};

export const deleteStaff = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return id;
    } catch (error) {
        console.error("Error deleting staff: ", error);
        throw error;
    }
};
