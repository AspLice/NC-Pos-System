import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Package, Clock, LayoutDashboard, LogOut, Loader2, Settings } from 'lucide-react';
import ProductManager from '../components/ProductManager';
import StaffManager from '../components/StaffManager';
import HistoryManager from '../components/HistoryManager';
import SettingsManager from '../components/SettingsManager';
import { getDashboardStats } from '../services/transactionService';
import { getProducts } from '../services/productService';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ todaySales: 0, todayCount: 0, productCount: 0 });
    const [loadingStats, setLoadingStats] = useState(false);

    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser && currentUser.role !== '管理者') {
            alert('管理画面へのアクセスには管理者権限が必要です。');
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchStats();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const dashboardStats = await getDashboardStats();
            const products = await getProducts();
            setStats({
                ...dashboardStats,
                productCount: products.length
            });
        } catch (error) {
            console.error("Failed to load stats", error);
        } finally {
            setLoadingStats(false);
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

    const tabs = [
        { id: 'dashboard', name: 'ダッシュボード', icon: LayoutDashboard },
        { id: 'products', name: '商品管理', icon: Package },
        { id: 'staff', name: 'スタッフ管理', icon: Users },
        { id: 'history', name: '販売履歴', icon: Clock },
        { id: 'settings', name: '設定', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r shadow-sm flex flex-col">
                <div className="p-6 border-b">
                    <Link to="/" className="flex items-center gap-3 mb-1">
                        <img src="/logo.png" alt="Natural Coffe Logo" className="w-8 h-8 object-contain" />
                        <span className="text-xl font-bold font-brand tracking-normal text-gray-800 hover:text-gray-600 transition">
                            Natural Coffe Admin
                        </span>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">管理画面</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 text-sm font-medium ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                                {tab.name}
                            </button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 font-medium">現在担当スタッフ</p>
                        <p className="text-sm text-gray-800 font-semibold truncate">{currentUser?.name}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg transition text-sm font-medium shadow-sm"
                    >
                        <LogOut size={16} /> 退勤
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">
                    {tabs.find(t => t.id === activeTab)?.name}
                </h1>

                <div className="bg-white rounded-2xl shadow-sm border p-6 min-h-[500px]">
                    {activeTab === 'dashboard' && (
                        <div className="text-gray-500">
                            <p>ダッシュボードへようこそ。</p>
                            {loadingStats ? (
                                <div className="flex justify-center items-center h-40 text-gray-400">
                                    <Loader2 className="animate-spin mr-2" /> データ読み込み中...
                                </div>
                            ) : (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                        <h3 className="text-blue-800 font-medium">今日の売上</h3>
                                        <p className="text-3xl font-bold text-blue-900 mt-2">¥{stats.todaySales.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                        <h3 className="text-green-800 font-medium">今日の販売件数</h3>
                                        <p className="text-3xl font-bold text-green-900 mt-2">{stats.todayCount} 件</p>
                                    </div>
                                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                                        <h3 className="text-purple-800 font-medium">登録商品数</h3>
                                        <p className="text-3xl font-bold text-purple-900 mt-2">{stats.productCount}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <ProductManager />
                    )}

                    {activeTab === 'staff' && (
                        <StaffManager />
                    )}

                    {activeTab === 'history' && (
                        <HistoryManager />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsManager />
                    )}
                </div>
            </main>
        </div>
    );
}
