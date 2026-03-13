import React, { useState, useEffect } from 'react';
import { getTransactions, deleteTransaction } from '../services/transactionService';
import { Loader2, Trash2 } from 'lucide-react';

export default function HistoryManager() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getTransactions();
            setHistory(data);
        } catch (error) {
            console.warn("Using mock history. Firebase not configured.");
            setHistory([
                {
                    id: 'mock1',
                    createdAt: new Date().toISOString(),
                    totalAmount: 1130,
                    items: [
                        { id: '1', name: 'サンプルコーヒー', quantity: 1, price: 450 },
                        { id: '2', name: 'サンドイッチ', quantity: 1, price: 680 }
                    ],
                    cashierName: '管理者 (Admin)'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('この取引履歴を削除してもよろしいですか？')) return;
        try {
            await deleteTransaction(id);
            setHistory(history.filter(h => h.id !== id));
        } catch (error) {
            alert('Mock mode: Removed from local state.');
            setHistory(history.filter(h => h.id !== id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> 読み込み中...</div>;

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">販売履歴</h2>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">担当</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(tx.createdAt).toLocaleString('ja-JP')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {tx.cashierName || '不明'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <ul className="list-disc list-inside">
                                        {tx.items?.map((item, idx) => (
                                            <li key={idx} className="truncate max-w-[200px]" title={item.name}>
                                                {item.name} × {item.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                    ¥{tx.totalAmount?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition hover:bg-red-100">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">履歴がありません</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
