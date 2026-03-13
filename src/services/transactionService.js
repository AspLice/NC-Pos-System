import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    getCountFromServer,
    deleteDoc,
    doc,
    query,
    orderBy,
    where,
    limit
} from 'firebase/firestore';

const COLLECTION_NAME = 'transactions';

export const saveTransaction = async (transactionData) => {
    try {
        const newTx = {
            ...transactionData,
            createdAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, COLLECTION_NAME), newTx);
        return { id: docRef.id, ...newTx };
    } catch (error) {
        console.error("Error saving transaction: ", error);
        throw error;
    }
};

export const getDashboardStats = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const todayQuery = query(
            collection(db, COLLECTION_NAME),
            where('createdAt', '>=', todayISO)
        );
        const [todaySnapshot, totalCountSnapshot] = await Promise.all([
            getDocs(todayQuery),
            getCountFromServer(collection(db, COLLECTION_NAME))
        ]);

        const todaySales = todaySnapshot.docs.reduce(
            (sum, txDoc) => sum + (txDoc.data().totalAmount || 0),
            0
        );

        return {
            todaySales,
            todayCount: todaySnapshot.size,
            totalCount: totalCountSnapshot.data().count
        };
    } catch (error) {
        console.error("Error fetching dashboard stats: ", error);
        throw error;
    }
};

export const getTransactions = async (pageLimit = 200) => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc'),
            limit(pageLimit)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching transactions: ", error);
        throw error;
    }
};

export const deleteTransaction = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return id;
    } catch (error) {
        console.error("Error deleting transaction: ", error);
        throw error;
    }
};
