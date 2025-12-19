
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { EventTheme } from '../types';
import { Snowflake, Flame, Leaf, Globe, CheckCircle2, AlertCircle, Power } from 'lucide-react';
import { settingEventService } from '../services/settingEventService';

const AdminThemeSettings: React.FC = () => {
    const { eventTheme, setEventTheme, addNotification } = useApp();
    const [isGlobalEnabled, setIsGlobalEnabled] = useState(eventTheme !== 'DEFAULT');

    // Sync local toggle state when eventTheme changes from elsewhere
    useEffect(() => {
        setIsGlobalEnabled(eventTheme !== 'DEFAULT');
    }, [eventTheme]);

    const themes: { id: EventTheme; label: string; icon: React.ElementType; color: string; desc: string }[] = [
        { 
            id: 'DEFAULT', 
            label: 'Mặc định', 
            icon: Globe, 
            color: 'bg-blue-500',
            desc: 'Giao diện tiêu chuẩn của BrainQnA.'
        },
        { 
            id: 'CHRISTMAS', 
            label: 'Giáng sinh', 
            icon: Snowflake, 
            color: 'bg-red-600',
            desc: 'Không khí tuyết rơi, rực rỡ sắc đỏ và xanh thông.'
        },
        { 
            id: 'TET', 
            label: 'Tết Nguyên Đán', 
            icon: Flame, 
            color: 'bg-orange-500',
            desc: 'Pháo hoa rộn ràng, sắc vàng và cam may mắn.'
        },
        { 
            id: 'AUTUMN', 
            label: 'Mùa thu', 
            icon: Leaf, 
            color: 'bg-amber-600',
            desc: 'Lá vàng rơi nhẹ nhàng, sắc màu trầm ấm, dịu mắt.'
        }
    ];

    const handleThemeSelect = async (id: EventTheme) => {
        setEventTheme(id);
        const shouldEnable = id !== 'DEFAULT';
        
        try {
            await settingEventService.updateGlobalEventStatus(shouldEnable);
            setIsGlobalEnabled(shouldEnable);
            addNotification(`Đã cập nhật chủ đề: ${id}`, 'success');
        } catch (error) {
            addNotification('Lỗi khi cập nhật trạng thái sự kiện lên máy chủ', 'error');
        }
    };

    const toggleGlobalStatus = async () => {
        const nextState = !isGlobalEnabled;
        try {
            await settingEventService.updateGlobalEventStatus(nextState);
            setIsGlobalEnabled(nextState);
            
            // If turning off, reset to DEFAULT theme locally
            if (!nextState) {
                setEventTheme('DEFAULT');
            }
            
            addNotification(`Đã ${nextState ? 'bật' : 'tắt'} sự kiện toàn hệ thống`, nextState ? 'success' : 'info');
        } catch (error) {
            addNotification('Không thể cập nhật trạng thái sự kiện', 'error');
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in pb-32">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <Flame size={28} />
                        </div>
                        Quản lý Sự kiện & Giao diện
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Thay đổi phong cách toàn website để chào đón các dịp đặc biệt.
                    </p>
                </div>

                {/* Master Toggle */}
                <button 
                    onClick={toggleGlobalStatus}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all shadow-lg ${
                        isGlobalEnabled 
                        ? 'bg-green-600 text-white shadow-green-200 dark:shadow-none' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                >
                    <Power size={20} />
                    {isGlobalEnabled ? 'SỰ KIỆN: ON' : 'SỰ KIỆN: OFF'}
                </button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-2xl flex items-start gap-4 mb-10 transition-colors">
                <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed font-medium">
                    <strong>Lưu ý:</strong> Việc thay đổi chủ đề tại đây sẽ có hiệu lực ngay lập tức cho tất cả các trang. Khi tắt sự kiện, hệ thống sẽ tự động quay về giao diện mặc định.
                </p>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 transition-opacity duration-300 ${!isGlobalEnabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {themes.map((t) => (
                    <div 
                        key={t.id}
                        onClick={() => handleThemeSelect(t.id)}
                        className={`group relative p-6 rounded-[32px] border-2 transition-all cursor-pointer overflow-hidden ${
                            eventTheme === t.id 
                            ? 'border-indigo-600 bg-white dark:bg-gray-800 shadow-xl shadow-indigo-100 dark:shadow-none' 
                            : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-855 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                    >
                        {eventTheme === t.id && (
                            <div className="absolute top-4 right-4 text-indigo-600">
                                <CheckCircle2 size={24} fill="currentColor" className="text-white fill-indigo-600" />
                            </div>
                        )}

                        <div className={`w-14 h-14 rounded-2xl ${t.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                            <t.icon size={28} />
                        </div>

                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t.label}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-4">
                            {t.desc}
                        </p>

                        <div className={`w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden`}>
                             <div className={`h-full ${t.color} transition-all duration-500 ${eventTheme === t.id ? 'w-full' : 'w-0'}`}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black mb-4">Preview Hiệu ứng</h3>
                    <p className="text-indigo-100 font-medium mb-6 max-w-lg">
                        Khi bật sự kiện, hệ thống sẽ tự động thêm các layer trang trí tinh tế ở các góc màn hình để không làm ảnh hưởng đến trải nghiệm học tập của người dùng.
                    </p>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-xs font-bold uppercase tracking-widest italic">#AskingSmart</div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-xs font-bold uppercase tracking-widest italic">#LearningDeep</div>
                    </div>
                </div>
                
                {/* Decorative blobs */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default AdminThemeSettings;
