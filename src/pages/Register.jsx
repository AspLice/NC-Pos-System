import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Settings, ShoppingCart, Image as ImageIcon, Trash2, Plus, Minus, Loader2, Copy, CheckCircle2, CheckCircle, X } from 'lucide-react';
import { getProducts } from '../services/productService';
import { saveTransaction } from '../services/transactionService';
import { getSettings } from '../services/settingsService';

export default function Register() {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('すべて');
    const [settings, setSettings] = useState({ beginnerDiscountRate: 0, deliveryFee: 0 });
    const [isBeginnerDiscount, setIsBeginnerDiscount] = useState(false);
    const [isDelivery, setIsDelivery] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [checkoutPopup, setCheckoutPopup] = useState({ show: false, amount: 0, isMock: false });

    useEffect(() => {
        fetchProducts();
        fetchSettingsData();
    }, []);

    const fetchSettingsData = async () => {
        try {
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.warn("Using mock products. Firebase not configured.");
            setProducts([
                { id: '1', name: 'サンプルコーヒー', price: 450, category: 'Drink' },
                { id: '2', name: 'サンドイッチ', price: 680, category: 'Food' },
                { id: '3', name: 'オレンジジュース', price: 300, category: 'Drink' },
                { id: '4', name: 'ケーキ', price: 550, category: 'Dessert' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 30 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 30 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart((prevCart) => {
            return prevCart.map(item => {
                if (item.id === id) {
                    const newQ = item.quantity + delta;
                    return { ...item, quantity: Math.max(0, newQ) };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const setExactQuantity = (id, value) => {
        const qty = parseInt(value, 10);
        if (isNaN(qty)) return;

        setCart((prevCart) => {
            return prevCart.map(item => {
                if (item.id === id) {
                    return { ...item, quantity: Math.max(0, qty) };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    const baseSubTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

    const discountAmount = isBeginnerDiscount ? Math.floor(baseSubTotal * (settings.beginnerDiscountRate / 100)) : 0;
    const deliveryFeeAmount = isDelivery ? (settings.deliveryFee * cartItemCount) : 0;
    const finalTotal = baseSubTotal - discountAmount + deliveryFeeAmount;

    const handleCopyTotal = () => {
        navigator.clipboard.writeText(finalTotal.toString())
            .then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            })
            .catch(err => console.error("Could not copy text: ", err));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            setCheckoutLoading(true);
            const txData = {
                items: cart,
                subTotal: baseSubTotal,
                discountAmount: discountAmount,
                deliveryFeeAmount: deliveryFeeAmount,
                totalAmount: finalTotal,
                cashierName: currentUser?.name || 'Guest Staff',
            };
            await saveTransaction(txData);

            setCheckoutPopup({ show: true, amount: finalTotal, isMock: false });
            setCart([]);
            setIsBeginnerDiscount(false);
            setIsDelivery(false);

            // 5秒後に自動で閉じる
            setTimeout(() => {
                setCheckoutPopup(prev => ({ ...prev, show: false }));
            }, 5000);

        } catch (error) {
            console.error("Checkout failed:", error);
            setCheckoutPopup({ show: true, amount: finalTotal, isMock: true });
            setCart([]);
            setIsBeginnerDiscount(false);
            setIsDelivery(false);

            // 5秒後に自動で閉じる
            setTimeout(() => {
                setCheckoutPopup(prev => ({ ...prev, show: false }));
            }, 5000);

        } finally {
            setCheckoutLoading(false);
        }
    };

    const FIXED_CATEGORIES = ['ドリンク', 'フード', 'スーパーフード', 'ジョイント'];
    const displayCategories = ['すべて', ...FIXED_CATEGORIES];

    const filteredProducts = activeCategory === 'すべて'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="flex h-screen bg-gray-50 flex-col relative">
            {/* Checkout Notification Popup */}
            {checkoutPopup.show && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick={() => setCheckoutPopup(prev => ({ ...prev, show: false }))}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X size={24} />
                        </button>
                        <div className="bg-[#4a3b32] p-8 text-center">
                            <CheckCircle size={64} className="mx-auto text-[#e6d5c3] mb-4" />
                            <h2 className="text-3xl font-bold text-white font-brand mb-1">Thank You!</h2>
                            <p className="text-[#d8c8b8] text-sm">={checkoutPopup.isMock ? "Mock Transaction Successful" : "Transaction Successful"}=</p>
                        </div>
                        <div className="p-8 text-center bg-[#faf9f6]">
                            <p className="text-gray-500 mb-2 font-medium">お支払金額</p>
                            <p className="text-5xl font-black text-[#4a3b32] tracking-tighter">
                                <span className="text-3xl mr-1 font-bold">¥</span>
                                {checkoutPopup.amount.toLocaleString()}
                            </p>
                            <div className="mt-8">
                                <button
                                    onClick={() => setCheckoutPopup(prev => ({ ...prev, show: false }))}
                                    className="w-full bg-[#4a3b32] hover:bg-[#382b23] text-white font-bold py-3 rounded-xl transition"
                                >
                                    次へ (Close)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Natural Coffe Logo" className="w-10 h-10 object-contain" />
                    <h1 className="text-2xl font-bold font-brand tracking-normal">Natural Coffe</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full border border-blue-100">
                        {currentUser?.name || 'Guest Staff'}
                    </span>
                    {currentUser?.role === '管理者' && (
                        <Link to="/admin" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="管理画面">
                            <Settings size={22} />
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm border hover:border-red-200 border-transparent"
                    >
                        <LogOut size={16} /> 退勤
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Product Grid Area */}
                <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">商品 (Products)</h2>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {displayCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === category
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-gray-400">
                            <Loader2 className="animate-spin mr-2" /> 読み込み中...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-300 transition cursor-pointer active:scale-95 group flex flex-col"
                                >
                                    <div className="h-32 bg-gray-50 flex items-center justify-center text-gray-400 border-b">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:opacity-90 transition" />
                                        ) : (
                                            <ImageIcon size={32} className="opacity-30 group-hover:scale-110 transition" />
                                        )}
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug">{product.name}</p>
                                        </div>
                                        <p className="text-blue-600 font-bold mt-2 text-lg">¥{product.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="col-span-full py-20 text-center text-gray-500 bg-white border-2 border-dashed rounded-xl border-gray-200">
                                    表示できる商品がありません。管理画面から商品を追加してください。
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cart Area */}
                <div className="w-80 lg:w-96 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] flex flex-col z-10">
                    <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-blue-600" />
                            カート
                        </h2>
                        <div className="flex items-center gap-2">
                            {cart.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('カートをすべて空にしますか？')) setCart([]);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition"
                                >
                                    空にする
                                </button>
                            )}
                            {cartItemCount > 0 && (
                                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {cartItemCount} 点
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-70">
                                <ShoppingCart size={48} className="mb-4" />
                                <p className="text-center">左の商品をクリックして<br />カートに追加してください</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="bg-white border rounded-lg p-3 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 flex-1 pr-2">{item.name}</h3>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-blue-600 font-bold">
                                            ¥{((item.price + (isDelivery ? settings.deliveryFee : 0)) * item.quantity).toLocaleString()}
                                        </span>

                                        <div className="flex flex-col gap-2 w-full mt-2">
                                            {/* Top row: Minus controls */}
                                            <div className="flex items-center justify-between gap-1 w-full bg-red-50/50 p-1 rounded-lg border border-red-100">
                                                <button onClick={() => updateQuantity(item.id, -100)} className="flex-1 bg-white text-red-600 hover:bg-red-50 text-xs py-1.5 rounded shadow-sm border border-red-100 transition active:scale-95">-100</button>
                                                <button onClick={() => updateQuantity(item.id, -10)} className="flex-1 bg-white text-red-600 hover:bg-red-50 text-xs py-1.5 rounded shadow-sm border border-red-100 transition active:scale-95">-10</button>
                                                <button onClick={() => updateQuantity(item.id, -1)} className="flex-1 bg-white text-red-600 hover:bg-red-50 text-xs py-1.5 rounded shadow-sm border border-red-100 transition active:scale-95">-1</button>
                                            </div>

                                            {/* Middle row: Manual Input */}
                                            <div className="flex items-center justify-center w-full px-2">
                                                <span className="text-xs text-gray-500 mr-2">数量:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.quantity === 0 ? '' : item.quantity}
                                                    onChange={(e) => setExactQuantity(item.id, e.target.value)}
                                                    className="w-20 text-center font-bold text-gray-800 border-b-2 border-blue-500 bg-gray-50 focus:bg-blue-50 focus:outline-none py-1"
                                                />
                                            </div>

                                            {/* Bottom row: Plus controls */}
                                            <div className="flex items-center justify-between gap-1 w-full bg-blue-50/50 p-1 rounded-lg border border-blue-100">
                                                <button onClick={() => updateQuantity(item.id, 1)} className="flex-1 bg-white text-blue-600 hover:bg-blue-50 text-xs py-1.5 rounded shadow-sm border border-blue-100 transition active:scale-95">+1</button>
                                                <button onClick={() => updateQuantity(item.id, 10)} className="flex-1 bg-white text-blue-600 hover:bg-blue-50 text-xs py-1.5 rounded shadow-sm border border-blue-100 transition active:scale-95">+10</button>
                                                <button onClick={() => updateQuantity(item.id, 100)} className="flex-1 bg-white text-blue-600 hover:bg-blue-50 text-xs py-1.5 rounded shadow-sm border border-blue-100 transition active:scale-95">+100</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-5 border-t bg-gray-50">
                        <div className="flex flex-col gap-2 mb-4 bg-white p-3 rounded-lg border border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={isBeginnerDiscount} onChange={(e) => setIsBeginnerDiscount(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm text-gray-700 font-medium">初心者割引 ({settings.beginnerDiscountRate}%)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                <input type="checkbox" checked={isDelivery} onChange={(e) => setIsDelivery(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <span className="text-sm text-gray-700 font-medium">デリバリー料金 (+¥{settings.deliveryFee.toLocaleString()} / 1点)</span>
                            </label>
                        </div>

                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                                <span>商品計 (小計)</span>
                                <span>¥{baseSubTotal.toLocaleString()}</span>
                            </div>
                            {isBeginnerDiscount && (
                                <div className="flex justify-between items-center text-sm text-red-500">
                                    <span>初心者割引</span>
                                    <span>-¥{discountAmount.toLocaleString()}</span>
                                </div>
                            )}
                            {isDelivery && (
                                <div className="flex justify-between items-center text-sm text-blue-500">
                                    <span>デリバリー料金 ({cartItemCount}点)</span>
                                    <span>+¥{deliveryFeeAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                                <span className="text-gray-700 font-bold text-lg">合計</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCopyTotal}
                                        title="金額をコピー (数字のみ)"
                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition relative group"
                                    >
                                        {isCopied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                            {isCopied ? "コピー済" : "金額コピー"}
                                        </span>
                                    </button>
                                    <span className="text-3xl font-black text-blue-700 tracking-tight">
                                        <span className="text-lg mr-1 tracking-normal font-bold">¥</span>
                                        {finalTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || checkoutLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 transition active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                        >
                            {checkoutLoading ? <><Loader2 className="animate-spin" size={20} /> 処理中...</> : 'お会計に進む'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
