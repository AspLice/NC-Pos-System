import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'settings';
const SETTINGS_DOC_ID = 'general';
const SETTINGS_CACHE_TTL_MS = 30 * 1000;
let settingsCache = {
    data: null,
    timestamp: 0
};

const isSettingsCacheValid = () =>
    settingsCache.data !== null &&
    (Date.now() - settingsCache.timestamp) < SETTINGS_CACHE_TTL_MS;

const setSettingsCache = (data) => {
    settingsCache = {
        data,
        timestamp: Date.now()
    };
};

const clearSettingsCache = () => {
    settingsCache = {
        data: null,
        timestamp: 0
    };
};

const defaultSettings = {
    beginnerDiscountRate: 0,
    deliveryFee: 0
};

export const getSettings = async (options = {}) => {
    try {
        const forceRefresh = options.forceRefresh === true;
        if (!forceRefresh && isSettingsCacheValid()) {
            return settingsCache.data;
        }

        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setSettingsCache(data);
            return data;
        }
        setSettingsCache(defaultSettings);
        return defaultSettings;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return defaultSettings;
    }
};

export const saveSettings = async (settingsData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
        await setDoc(docRef, {
            ...settingsData,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        clearSettingsCache();
        return true;
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};
