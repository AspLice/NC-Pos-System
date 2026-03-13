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
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const monthStartISO = monthStart.toISOString();
        const nextMonthStartISO = nextMonthStart.toISOString();

        const todayQuery = query(
            collection(db, COLLECTION_NAME),
            where('createdAt', '>=', todayISO)
        );
        const monthQuery = query(
            collection(db, COLLECTION_NAME),
            where('createdAt', '>=', monthStartISO),
            where('createdAt', '<', nextMonthStartISO)
        );
        const [todaySnapshot, monthSnapshot, totalCountSnapshot] = await Promise.all([
            getDocs(todayQuery),
            getDocs(monthQuery),
            getCountFromServer(collection(db, COLLECTION_NAME))
        ]);

        const todaySales = todaySnapshot.docs.reduce(
            (sum, txDoc) => sum + (txDoc.data().totalAmount || 0),
            0
        );
        const daysInMonth = today.getDate();
        const monthDailySales = Array.from({ length: daysInMonth }, (_, index) => ({
            day: index + 1,
            amount: 0
        }));

        let monthSales = 0;
        monthSnapshot.docs.forEach((txDoc) => {
            const tx = txDoc.data();
            const amount = tx.totalAmount || 0;
            monthSales += amount;
            if (!tx.createdAt) return;
            const txDate = new Date(tx.createdAt);
            const dayIndex = txDate.getDate() - 1;
            if (dayIndex >= 0 && dayIndex < monthDailySales.length) {
                monthDailySales[dayIndex].amount += amount;
            }
        });

        return {
            todaySales,
            monthSales,
            todayCount: todaySnapshot.size,
            totalCount: totalCountSnapshot.data().count,
            monthDailySales
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
