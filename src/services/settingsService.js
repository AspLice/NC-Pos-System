import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'settings';
const SETTINGS_DOC_ID = 'general';

export const getSettings = async () => {
    try {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        // デフォルト値
        return {
            beginnerDiscountRate: 0,
            deliveryFee: 0
        };
    } catch (error) {
        console.error("Error fetching settings:", error);
        // エラー時のデフォルト
        return {
            beginnerDiscountRate: 0,
            deliveryFee: 0
        };
    }
};

export const saveSettings = async (settingsData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        await setDoc(docRef, {
            ...settingsData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};
