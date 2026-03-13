import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Loader2 } from 'lucide-react';
import { getStaffList, addStaff, deleteStaff } from '../services/staffService';

export default function StaffManager() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('スタッフ');
    const [newPin, setNewPin] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const data = await getStaffList();
            setStaffList(data);
        } catch (error) {
            console.warn("Using mock staff data");
            setStaffList([
                { id: '1', name: '管理者 (Admin)', role: '管理者', createdAt: new Date().toISOString() },
                { id: '2', name: 'テストスタッフA', role: 'スタッフ', createdAt: new Date().toISOString() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        if (!newName) return;

        try {
            setSubmitting(true);
            const added = await addStaff(newName, newRole, newPin);
            setStaffList([added, ...staffList]);
            setIsAdding(false);
            setNewName('');
            setNewRole('スタッフ');
            setNewPin('');
        } catch (error) {
            alert('Mock mode: 追加しました (Firebase未設定)');
            const mockAdded = {
                id: Date.now().toString(),
                name: newName,
                role: newRole,
                pin: newPin,
                createdAt: new Date().toISOString()
            };
            setStaffList([mockAdded, ...staffList]);
            setIsAdding(false);
            setNewName('');
            setNewRole('スタッフ');
            setNewPin('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('このスタッフを削除しますか？')) return;
        try {
            await deleteStaff(id);
            setStaffList(staffList.filter(s => s.id !== id));
        } catch (error) {
            alert('Mock mode: 削除しました (Firebase未設定)');
            setStaffList(staffList.filter(s => s.id !== id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" /> 読み込み中...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">スタッフ一覧</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                >
                    {isAdding ? 'キャンセル' : <><UserPlus size={18} /> スタッフ追加</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleAddStaff} className="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-6">
                    <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                        新規スタッフ登録
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">スタッフ名 <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                                <input
                                    type="text"
                                    required
                                    className="pl-9 w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="例: 佐藤 太郎"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">暗証番号 (PIN) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="password"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    required
                                    className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value)}
                                    placeholder="例: 1234"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">権限</label>
                            <select
                                className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                            >
                                <option value="スタッフ">スタッフ</option>
                                <option value="管理者">管理者</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                        >
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> 登録中...</> : '登録する'}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">スタッフ名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">権限</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staffList.map((staff) => (
                            <tr key={staff.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {staff.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${staff.role === '管理者' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {staff.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('ja-JP') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {staff.role !== '管理者' && (
                                        <button onClick={() => handleDelete(staff.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition hover:bg-red-100" title="削除">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {staffList.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">スタッフが登録されていません</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
