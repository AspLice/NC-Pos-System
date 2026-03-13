import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// NOTE: Make sure to replace these with actual values from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCJheKSA5UdIkGQQ4nbg89YILjC9majiPc",
    authDomain: "krr-pos-system.firebaseapp.com",
    projectId: "krr-pos-system",
    storageBucket: "krr-pos-system.firebasestorage.app",
    messagingSenderId: "582408755983",
    appId: "1:582408755983:web:323c06674db8035ca3bc7a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
