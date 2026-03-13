import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const requiredEnvKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);
if (missingEnvKeys.length > 0) {
    throw new Error(`Missing Firebase env vars for reset script: ${missingEnvKeys.join(', ')}`);
}

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetStaff() {
    try {
        console.log("Fetching staff documents...");
        const querySnapshot = await getDocs(collection(db, 'staff'));
        let count = 0;

        // Use Promise.all for parallel deletion
        const deletePromises = [];
        for (const document of querySnapshot.docs) {
            deletePromises.push(deleteDoc(doc(db, 'staff', document.id)));
            count++;
        }

        await Promise.all(deletePromises);
        console.log(`Successfully deleted ${count} staff members.`);
    } catch (error) {
        console.error("Error resetting staff:", error);
    } finally {
        process.exit(0);
    }
}

resetStaff();
