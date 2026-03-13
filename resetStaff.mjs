import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCJheKSA5UdIkGQQ4nbg89YILjC9majiPc",
    authDomain: "krr-pos-system.firebaseapp.com",
    projectId: "krr-pos-system",
    storageBucket: "krr-pos-system.firebasestorage.app",
    messagingSenderId: "582408755983",
    appId: "1:582408755983:web:323c06674db8035ca3bc7a"
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
