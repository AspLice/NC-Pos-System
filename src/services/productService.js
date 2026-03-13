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
    deleteObject,
    getBlob
} from 'firebase/storage';

const COLLECTION_NAME = 'products';
const IMAGE_MAIN_MAX_WIDTH = 1280;
const IMAGE_THUMB_MAX_WIDTH = 480;
const IMAGE_MAIN_QUALITY = 0.82;
const IMAGE_THUMB_QUALITY = 0.72;
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

const createImageElement = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const extractStoragePathFromUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const marker = '/o/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) return null;
    const pathWithParams = url.slice(markerIndex + marker.length);
    const encodedPath = pathWithParams.split('?')[0];
    if (!encodedPath) return null;
    try {
        return decodeURIComponent(encodedPath);
    } catch {
        return null;
    }
};

const resizeToBlob = async (file, maxWidth, quality) => {
    const objectUrl = URL.createObjectURL(file);
    try {
        const image = await createImageElement(objectUrl);
        const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
        const targetWidth = Math.max(1, Math.round(image.width * ratio));
        const targetHeight = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context unavailable');
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (result) => result ? resolve(result) : reject(new Error('Failed to encode image')),
                'image/webp',
                quality
            );
        });
        return blob;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

// Upload optimized main image + thumbnail to Firebase Storage
export const uploadProductImage = async (file) => {
    if (!file) return {
        imageUrl: null,
        thumbnailUrl: null,
        imagePath: null,
        thumbnailPath: null
    };

    const [mainBlob, thumbBlob] = await Promise.all([
        resizeToBlob(file, IMAGE_MAIN_MAX_WIDTH, IMAGE_MAIN_QUALITY),
        resizeToBlob(file, IMAGE_THUMB_MAX_WIDTH, IMAGE_THUMB_QUALITY)
    ]);

    const safeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const baseName = `${Date.now()}_${safeName}`;
    const imagePath = `products/${baseName}.webp`;
    const thumbnailPath = `products/thumbnails/${baseName}_thumb.webp`;

    const imageRef = ref(storage, imagePath);
    const thumbRef = ref(storage, thumbnailPath);
    await Promise.all([
        uploadBytes(imageRef, mainBlob, { contentType: 'image/webp' }),
        uploadBytes(thumbRef, thumbBlob, { contentType: 'image/webp' })
    ]);
    const [imageUrl, thumbnailUrl] = await Promise.all([
        getDownloadURL(imageRef),
        getDownloadURL(thumbRef)
    ]);
    return { imageUrl, thumbnailUrl, imagePath, thumbnailPath };
};

// Add new product
export const addProduct = async (productData, imageFile) => {
    try {
        let imageAsset = {
            imageUrl: null,
            thumbnailUrl: null,
            imagePath: null,
            thumbnailPath: null
        };
        if (imageFile) {
            imageAsset = await uploadProductImage(imageFile);
        }

        const newProduct = {
            ...productData,
            ...imageAsset,
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
        let imageAsset = null;
        if (newImageFile) imageAsset = await uploadProductImage(newImageFile);

        const productRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(productRef, {
            ...productData,
            ...(imageAsset || {}),
            updatedAt: new Date().toISOString()
        });
        clearProductsCache();

        return { id, ...productData, ...(imageAsset || {}) };
    } catch (error) {
        console.error("Error updating product: ", error);
        throw error;
    }
};

// Delete product
export const deleteProduct = async (idOrProduct, imageUrl) => {
    try {
        const id = typeof idOrProduct === 'object' ? idOrProduct.id : idOrProduct;
        const imagePath = typeof idOrProduct === 'object' ? idOrProduct.imagePath : null;
        const thumbnailPath = typeof idOrProduct === 'object' ? idOrProduct.thumbnailPath : null;
        const imageUrlToDelete = typeof idOrProduct === 'object' ? idOrProduct.imageUrl : imageUrl;
        const thumbnailUrlToDelete = typeof idOrProduct === 'object' ? idOrProduct.thumbnailUrl : null;

        await deleteDoc(doc(db, COLLECTION_NAME, id));
        clearProductsCache();

        const deleteTargets = [];
        if (imagePath) deleteTargets.push(ref(storage, imagePath));
        if (thumbnailPath) deleteTargets.push(ref(storage, thumbnailPath));
        if (!imagePath && imageUrlToDelete) deleteTargets.push(ref(storage, imageUrlToDelete));
        if (!thumbnailPath && thumbnailUrlToDelete) deleteTargets.push(ref(storage, thumbnailUrlToDelete));

        if (deleteTargets.length > 0) {
            await Promise.all(deleteTargets.map(async (targetRef) => {
                try {
                    await deleteObject(targetRef);
                } catch (imgError) {
                    console.warn("Could not delete image from storage: ", imgError);
                }
            }));
        }
        return id;
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw error;
    }
};

export const migrateProductImage = async (product) => {
    if (!product?.id || !product?.imageUrl) {
        throw new Error('Invalid product for migration');
    }

    const inferredPath = product.imagePath || extractStoragePathFromUrl(product.imageUrl);
    let sourceBlob = null;
    let lastError = null;

    if (inferredPath) {
        try {
            sourceBlob = await getBlob(ref(storage, inferredPath));
        } catch (error) {
            lastError = error;
        }
    }

    if (!sourceBlob) {
        try {
            const response = await fetch(product.imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch original image: ${response.status}`);
            }
            sourceBlob = await response.blob();
        } catch (error) {
            lastError = error;
        }
    }

    if (!sourceBlob) {
        const baseMessage = lastError instanceof Error ? lastError.message : String(lastError || '');
        throw new Error(
            `画像取得に失敗しました。Storage CORS 設定が必要です。` +
            ` gsutil cors set cors.json gs://krr-pos-system.firebasestorage.app (${baseMessage})`
        );
    }

    const sourceType = sourceBlob.type || 'image/jpeg';
    const extension = sourceType.includes('png') ? 'png' : 'jpg';
    const sourceFile = new File([sourceBlob], `product_${product.id}.${extension}`, { type: sourceType });

    const baseProductData = {
        name: product.name,
        price: Number(product.price || 0),
        category: product.category || ''
    };

    return updateProduct(product.id, baseProductData, sourceFile, product.imageUrl);
};
