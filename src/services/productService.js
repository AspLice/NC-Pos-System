import { db, storage } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getCountFromServer,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';

const COLLECTION_NAME = 'products';
const PRODUCTS_CACHE_TTL_MS = 30 * 1000;
let productsCache = {
    data: null,
    timestamp: 0
};

const isProductsCacheValid = () =>
    Array.isArray(productsCache.data) &&
    (Date.now() - productsCache.timestamp) < PRODUCTS_CACHE_TTL_MS;

const setProductsCache = (data) => {
    productsCache = {
        data,
        timestamp: Date.now()
    };
};

const clearProductsCache = () => {
    productsCache = {
        data: null,
        timestamp: 0
    };
};

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
        clearProductsCache();
        return { id: docRef.id, ...newProduct };
    } catch (error) {
        console.error("Error adding product: ", error);
        throw error;
    }
};

// Get all products with pagination
export const getProducts = async (pageLimit = 100, options = {}) => {
    try {
        const forceRefresh = options.forceRefresh === true;
        if (!forceRefresh && isProductsCacheValid()) {
            return productsCache.data.slice(0, pageLimit);
        }

        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc'),
            limit(pageLimit)
        );
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setProductsCache(products);
        return products;
    } catch (error) {
        console.error("Error fetching products: ", error);
        throw error;
    }
};

export const getProductsCount = async () => {
    try {
        const countSnapshot = await getCountFromServer(collection(db, COLLECTION_NAME));
        return countSnapshot.data().count;
    } catch (error) {
        console.error("Error counting products: ", error);
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
        clearProductsCache();

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
        clearProductsCache();

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
