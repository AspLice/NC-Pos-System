import { db, storage } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';

const COLLECTION_NAME = 'products';

// Upload image to Firebase Storage
export const uploadProductImage = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// Add new product
export const addProduct = async (productData, imageFile) => {
    try {
        let imageUrl = null;
        if (imageFile) {
            imageUrl = await uploadProductImage(imageFile);
        }

        const newProduct = {
            ...productData,
            imageUrl,
            createdAt: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newProduct);
        return { id: docRef.id, ...newProduct };
    } catch (error) {
        console.error("Error adding product: ", error);
        throw error;
    }
};

// Get all products
export const getProducts = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching products: ", error);
        throw error;
    }
};

// Update product
export const updateProduct = async (id, productData, newImageFile, oldImageUrl) => {
    try {
        let imageUrl = productData.imageUrl || oldImageUrl;

        if (newImageFile) {
            imageUrl = await uploadProductImage(newImageFile);
            // Optional: Delete old image from storage if needed
        }

        const productRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(productRef, {
            ...productData,
            imageUrl,
            updatedAt: new Date().toISOString()
        });

        return { id, ...productData, imageUrl };
    } catch (error) {
        console.error("Error updating product: ", error);
        throw error;
    }
};

// Delete product
export const deleteProduct = async (id, imageUrl) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));

        // Attempt to delete the image from storage if it exists
        if (imageUrl) {
            try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
            } catch (imgError) {
                console.warn("Could not delete image from storage: ", imgError);
            }
        }
        return id;
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw error;
    }
};
