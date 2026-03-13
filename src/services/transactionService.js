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
        const q = query(collection(db, COLLECTION_NAME));
        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(doc => doc.data());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTx = transactions.filter(tx => new Date(tx.createdAt) >= today);
        const todaySales = todayTx.reduce((sum, tx) => sum + tx.totalAmount, 0);

        return {
            todaySales,
            todayCount: todayTx.length,
            totalCount: transactions.length
        };
    } catch (error) {
        console.error("Error fetching dashboard stats: ", error);
        throw error;
    }
};

export const getTransactions = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
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
