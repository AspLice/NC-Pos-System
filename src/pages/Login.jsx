import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { getStaffList } from '../services/staffService';

export default function Login() {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const data = await getStaffList();
            setStaffList(data);
        } catch (error) {
            console.warn("Using mock staff data");
            setStaffList([
                { id: '1', name: '管理者 (Admin)', role: '管理者' },
                { id: '2', name: 'テストスタッフA', role: 'スタッフ' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStaff = (staff) => {
        // Show PIN input modal for the selected staff
        setSelectedStaff(staff);
        setPinInput('');
        setPinError('');
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();
        // Fallback for mock data without a PIN or guest
        const expectedPin = selectedStaff.pin || '0000';

        if (selectedStaff.id === 'guest' || pinInput === expectedPin) {
            login(selectedStaff);
            navigate('/');
        } else {
            setPinError('PINが正しくありません');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img src="/logo.png" alt="Natural Coffe Logo" className="w-24 h-24 object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold font-brand tracking-normal text-gray-800">Natural Coffe</h1>
                    <p className="text-gray-500 mt-2">担当者を選択してレジを開始してください</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-8 text-gray-400">
                        <Loader2 className="animate-spin mr-2" /> スタッフ一覧を読み込み中...
                    </div>
                ) : selectedStaff ? (
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 mb-6">
                            <p className="text-sm text-blue-600 font-medium">選択中のスタッフ</p>
                            <p className="font-bold text-gray-800 text-lg">{selectedStaff.name}</p>
                        </div>

                        <form onSubmit={handlePinSubmit}>
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                暗証番号 (PIN) を入力してください
                            </label>
                            <input
                                type="password"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                autoFocus
                                required
                                className="w-full text-center text-2xl tracking-widest p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                value={pinInput}
                                onChange={e => {
                                    setPinInput(e.target.value);
                                    setPinError('');
                                }}
                            />
                            {pinError && <p className="text-red-500 text-sm text-center mb-4">{pinError}</p>}

                            <div className="flex gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSelectedStaff(null)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
                                >
                                    戻る
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition"
                                >
                                    ログイン
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {staffList.length > 0 ? (
                            staffList.map((staff) => (
                                <button
                                    key={staff.id}
                                    onClick={() => handleSelectStaff(staff)}
                                    className="w-full text-left bg-gray-50 hover:bg-blue-50 border hover:border-blue-300 p-4 rounded-xl transition flex items-center justify-between group"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800 group-hover:text-blue-700">{staff.name}</p>
                                        <p className="text-sm text-gray-500">{staff.role}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                                        →
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-500 border border-dashed rounded-xl">
                                スタッフが未登録です。<br />一時的にゲストとして開始できます。
                                <button
                                    onClick={() => handleSelectStaff({ id: 'guest', name: 'ゲスト', role: '管理者' })}
                                    className="mt-4 text-blue-600 font-medium underline block w-full text-center"
                                >
                                    ゲストとして開始
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
