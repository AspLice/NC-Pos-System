import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { getSettings, saveSettings } from '../services/settingsService';

export default function SettingsManager() {
    const [beginnerDiscountRate, setBeginnerDiscountRate] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await getSettings();
            setBeginnerDiscountRate(data.beginnerDiscountRate || 0);
            setDeliveryFee(data.deliveryFee || 0);
        } catch (error) {
            setMessage({ text: '設定の読み込みに失敗しました', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        // 簡単なバリデーション
        if (beginnerDiscountRate < 0 || beginnerDiscountRate > 100) {
            setMessage({ text: '初心者割引率は0から100の間で設定してください', type: 'error' });
            return;
        }
        if (deliveryFee < 0) {
            setMessage({ text: 'デリバリー料金は0以上にしてください', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            await saveSettings({
                beginnerDiscountRate: Number(beginnerDiscountRate),
                deliveryFee: Number(deliveryFee)
            });
            setMessage({ text: '設定を保存しました', type: 'success' });

            // 3秒後にメッセージを消す
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 3000);
        } catch (error) {
            setMessage({ text: '保存に失敗しました。モックモードで保存した扱いにします', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-400">
                <Loader2 className="animate-spin mr-2" /> 設定を読み込み中...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">店舗設定</h2>
                <p className="text-sm text-gray-500 mt-1">割引率や各種料金の設定を行います。</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'error' && <AlertCircle size={20} />}
                    <p className="font-medium text-sm">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        初心者割引率 (%)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={beginnerDiscountRate}
                            onChange={(e) => setBeginnerDiscountRate(e.target.value)}
                            className="block w-full px-4 py-3 rounded-xl border-gray-300 border focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            placeholder="例: 10"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-gray-500">%</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        ※小計に対して指定されたパーセンテージ分の割引が適用されます。
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        デリバリー料金 (円)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            className="block w-full px-4 py-3 rounded-xl border-gray-300 border focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            placeholder="例: 500"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-gray-500">円</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        ※デリバリーが選択された場合に加算される固定料金です。
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                保存中...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={18} />
                                設定を保存する
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
