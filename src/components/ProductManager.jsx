import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getProducts, addProduct, deleteProduct, updateProduct, migrateProductImage } from '../services/productService';
import { Trash2, Edit, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';

const CATEGORIES = ['ドリンク', 'フード', 'スーパーフード', 'ジョイント'];

export default function ProductManager() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', category: CATEGORIES[0] });
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [migratingExisting, setMigratingExisting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async (options = {}) => {
        try {
            setLoading(true);
            const data = await getProducts(300, options);
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products", error);
            setProducts([
                { id: '1', name: 'サンプルコーヒー', price: 450, category: 'Drink' },
                { id: '2', name: 'サンドイッチ', price: 680, category: 'Food' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        try {
            setSubmitting(true);
            const productData = {
                ...formData,
                price: Number(formData.price)
            };

            if (editingId) {
                const existing = products.find(p => p.id === editingId);
                const updated = await updateProduct(editingId, productData, imageFile, existing?.imageUrl);
                setProducts(products.map(p => p.id === editingId ? { ...existing, ...updated } : p));
            } else {
                const added = await addProduct(productData, imageFile);
                setProducts([added, ...products]);
            }

            resetForm();
        } catch (error) {
            console.error("Failed to save product", error);
            alert('Firebaseが未設定のため、実際の保存処理はスキップされました。');

            if (editingId) {
                const existing = products.find(p => p.id === editingId);
                const mockUpdated = {
                    ...existing,
                    ...productData,
                    imageUrl: imageFile ? URL.createObjectURL(imageFile) : existing?.imageUrl
                };
                setProducts(products.map(p => p.id === editingId ? mockUpdated : p));
            } else {
                const mockAdded = {
                    id: Date.now().toString(),
                    ...productData,
                    imageUrl: imageFile ? URL.createObjectURL(imageFile) : null
                };
                setProducts([mockAdded, ...products]);
            }
            resetForm();
        } finally {
            setSubmitting(false);
        }
    }, [editingId, formData, imageFile, products]);

    const handleEditClick = useCallback((product) => {
        setEditingId(product.id);
        const validCategory = CATEGORIES.includes(product.category) ? product.category : CATEGORIES[0];
        setFormData({ name: product.name, price: product.price, category: validCategory });
        setImageFile(null);
        setIsFormOpen(true);
    }, []);

    const resetForm = useCallback(() => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({ name: '', price: '', category: CATEGORIES[0] });
        setImageFile(null);
    }, []);

    const handleDelete = useCallback(async (product) => {
        if (!window.confirm('この商品を削除してもよろしいですか？')) return;

        try {
            await deleteProduct(product);
            setProducts(products.filter(p => p.id !== product.id));
        } catch (error) {
            console.error("Failed to delete product", error);
            alert('Firebaseが未設定のため、実際の削除処理はスキップされました。');
            setProducts(products.filter(p => p.id !== product.id));
        }
    }, [products]);

    const handleMigrateExistingImages = useCallback(async () => {
        const targets = products.filter((product) =>
            product.imageUrl && (!product.thumbnailUrl || !product.imagePath || !product.thumbnailPath)
        );

        if (targets.length === 0) {
            alert('最適化が必要な既存画像はありません。');
            return;
        }

        if (!window.confirm(`既存商品の画像を最適化します（${targets.length}件）。実行しますか？`)) return;

        setMigratingExisting(true);
        try {
            for (const product of targets) {
                await migrateProductImage(product);
            }
            await fetchProducts({ forceRefresh: true });
            alert(`既存画像の最適化が完了しました（${targets.length}件）。`);
        } catch (error) {
            console.error("Failed to migrate existing images", error);
            alert(`既存画像の最適化中にエラーが発生しました。\n${error?.message || ''}`);
        } finally {
            setMigratingExisting(false);
        }
    }, [products]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-400">
                <Loader2 className="animate-spin mr-2" /> 読み込み中...
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">商品リスト</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleMigrateExistingImages}
                        disabled={migratingExisting}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                    >
                        {migratingExisting ? <><Loader2 size={16} className="animate-spin" /> 変換中...</> : '既存画像を最適化'}
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsFormOpen(!isFormOpen);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                    >
                        {isFormOpen && !editingId ? 'キャンセル' : <><Plus size={18} /> 新規商品追加</>}
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 p-6 rounded-xl mb-6">
                    <h3 className="font-bold text-gray-800 mb-4">{editingId ? '商品編集' : '新規商品'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">商品名 <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">価格 (¥) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                            <select
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">商品画像</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="w-full p-1.5 border rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={e => setImageFile(e.target.files[0])}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium shadow-sm transition"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                        >
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> 保存中...</> : '保存'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white border rounded-xl shadow-sm hover:shadow relative overflow-hidden group transition">
                        <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400 border-b relative">
                            {(product.thumbnailUrl || product.imageUrl) ? (
                                <img
                                    src={product.thumbnailUrl || product.imageUrl}
                                    alt={product.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <ImageIcon size={32} className="mb-2 opacity-50" />
                                    <span className="text-xs">No Image</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                                    className="bg-white/90 p-2 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm transition"
                                    title="編集"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                                    className="bg-white/90 p-2 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm transition"
                                    title="削除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-gray-800 line-clamp-1 flex-1 pr-2">{product.name}</h4>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{product.category || 'なし'}</span>
                            </div>
                            <p className="text-blue-700 font-bold text-lg mt-2">¥{product.price.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {products.length === 0 && !loading && (
                    <div className="col-span-full py-10 text-center text-gray-500 border-2 border-dashed rounded-xl border-gray-200">
                        商品が登録されていません
                    </div>
                )}
            </div>
        </div>
    );
}
