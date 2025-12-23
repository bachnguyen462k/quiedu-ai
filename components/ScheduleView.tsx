
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, Plus, Trash2, MoreHorizontal, CheckSquare, Square, ChevronLeft, ChevronRight, Snowflake, Gift, Sparkles, Star, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Task {
    id: number;
    time: string;
    date: Date;
    task: string;
    category: string;
    done: boolean;
}

const INITIAL_SCHEDULE: Task[] = [
    { id: 1, time: '08:00', date: new Date(), task: 'Ôn tập Từ vựng Tiếng Anh - Unit 5', category: 'Ngoại ngữ', done: true },
    { id: 2, time: '14:30', date: new Date(), task: 'Làm Quiz Toán Giải Tích 12', category: 'Toán học', done: false },
    { id: 3, time: '19:00', date: new Date(), task: 'Học nhóm Lịch Sử VN (Online)', category: 'Lịch sử', done: false },
    { id: 4, time: '21:00', date: new Date(), task: 'Làm bài tập Hóa học hữu cơ', category: 'Hóa học', done: false },
    { id: 5, time: '20:00', date: new Date(new Date().getFullYear(), 11, 24), task: 'Tiệc Giáng sinh & Học nhóm', category: 'Sự kiện', done: false },
];

const SantaHat = () => (
    <svg 
        viewBox="0 0 100 100" 
        className="absolute -top-3 -right-2 w-8 h-8 drop-shadow-md z-20 -rotate-12 transition-transform group-hover:scale-125 group-hover:-rotate-6 duration-300"
    >
        {/* Hat body */}
        <path d="M20 70 Q50 10 80 70 Z" fill="#ef4444" />
        {/* White trim */}
        <rect x="15" y="65" width="70" height="12" rx="6" fill="white" />
        {/* Pom pom */}
        <circle cx="80" cy="70" r="8" fill="white" />
        <circle cx="20" cy="70" r="4" fill="white" opacity="0.5" />
    </svg>
);

const ScheduleView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>(INITIAL_SCHEDULE);
    const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < emptyDays; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [viewDate]);

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };

    const getSpecialDayInfo = (date: Date) => {
        const d = date.getDate();
        const m = date.getMonth() + 1;

        if (d === 24 && m === 12) return { type: 'CHRISTMAS', label: 'Đêm Noel', detail: 'Giáng Sinh an lành! ✨', color: 'from-red-600 to-red-700', icon: Snowflake, hasHat: true, textColor: 'text-red-500' };
        if (d === 25 && m === 12) return { type: 'CHRISTMAS', label: 'Giáng Sinh', detail: 'Ngày lễ Giáng Sinh 🎁', color: 'from-red-500 to-red-600', icon: Gift, hasHat: true, textColor: 'text-red-500' };
        if (d === 31 && m === 12) return { type: 'NEWYEAR', label: 'Tất Niên', detail: 'Giao thừa rộn ràng! 🎇', color: 'from-indigo-600 to-blue-700', icon: Sparkles, hasHat: false, textColor: 'text-indigo-500' };
        if (d === 1 && m === 1) return { type: 'NEWYEAR', label: 'Năm Mới', detail: 'Chúc mừng năm mới! 🎆', color: 'from-amber-500 to-orange-600', icon: Star, hasHat: false, textColor: 'text-orange-500' };
        return null;
    };

    const selectedSpecial = getSpecialDayInfo(selectedDate);

    const filteredTasks = tasks.filter(t => {
        const dateMatch = isSameDay(t.date, selectedDate);
        if (!dateMatch) return false;
        if (filter === 'TODO') return !t.done;
        if (filter === 'DONE') return t.done;
        return true;
    });

    const toggleTask = (id: number) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (id: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const monthName = viewDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 animate-fade-in pb-32 transition-colors">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors"
                >
                    <ArrowLeft size={18} /> Quay lại
                </button>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${selectedSpecial ? 'bg-red-500 text-white shadow-red-500/20' : 'text-brand-blue bg-blue-50 dark:bg-blue-900/30'}`}>
                    {selectedSpecial ? <selectedSpecial.icon size={16} className="animate-pulse" /> : <CalendarIcon size={16} />} 
                    {selectedSpecial ? selectedSpecial.label : selectedDate.toLocaleDateString('vi-VN')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                
                {/* Left Side: Tasks List */}
                <div className={`lg:col-span-2 bg-white dark:bg-gray-855 rounded-[40px] p-6 md:p-10 shadow-xl border transition-all duration-500 ${selectedSpecial?.type === 'CHRISTMAS' ? 'border-red-200 dark:border-red-900/50 ring-4 ring-red-50 dark:ring-red-950/20' : 'border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className={`text-2xl md:text-4xl font-black mb-2 uppercase tracking-tighter transition-colors ${selectedSpecial?.type === 'CHRISTMAS' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {isSameDay(selectedDate, new Date()) ? 'Hôm nay' : selectedSpecial ? selectedSpecial.label : selectedDate.toLocaleDateString('vi-VN')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                                {selectedSpecial ? `✨ Một ngày đặc biệt! Chúc bạn học tập vui vẻ.` : `Kế hoạch chi tiết cho ngày của bạn.`}
                            </p>
                        </div>
                        <button className={`px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 text-sm shrink-0 ${selectedSpecial?.type === 'CHRISTMAS' ? 'bg-red-600 text-white shadow-red-500/20' : 'bg-brand-blue text-white shadow-brand-blue/20'}`}>
                            <Plus size={20} /> Thêm mới
                        </button>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit mb-8 transition-colors">
                        <button onClick={() => setFilter('ALL')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-md' : 'text-gray-500'}`}>Tất cả</button>
                        <button onClick={() => setFilter('TODO')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'TODO' ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-md' : 'text-gray-500'}`}>Chưa làm</button>
                        <button onClick={() => setFilter('DONE')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'DONE' ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-md' : 'text-gray-500'}`}>Đã xong</button>
                    </div>

                    <div className="space-y-4">
                        {filteredTasks.map((item) => (
                            <div key={item.id} className={`group p-6 rounded-[32px] border-2 transition-all flex items-center gap-6 ${item.done ? 'bg-gray-50/50 dark:bg-gray-900/20 border-transparent opacity-60' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-brand-blue shadow-sm hover:shadow-lg'}`}>
                                <button 
                                    onClick={() => toggleTask(item.id)}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${item.done ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-300 group-hover:text-brand-blue'}`}
                                >
                                    {item.done ? <CheckCircle size={24} strokeWidth={3} /> : <Square size={24} strokeWidth={3} />}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${item.done ? 'text-gray-400' : 'text-brand-blue'}`}>{item.time}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[9px] font-black text-gray-400 rounded uppercase">{item.category}</span>
                                    </div>
                                    <h3 className={`text-lg font-black leading-tight truncate ${item.done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{item.task}</h3>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => deleteTask(item.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                    <button className="p-3 text-gray-300 hover:text-brand-blue transition-colors">
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {filteredTasks.length === 0 && (
                            <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/20 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800 transition-colors">
                                <CheckSquare className="mx-auto text-gray-200 dark:text-gray-800 mb-4" size={48} />
                                <p className="text-gray-500 font-black text-lg">Trống lịch cho ngày này!</p>
                                <p className="text-gray-400 text-sm font-medium">Tận hưởng thời gian nghỉ ngơi của bạn.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Calendar Grid */}
                <div className="bg-white dark:bg-gray-855 rounded-[40px] p-5 md:p-6 shadow-xl border border-gray-100 dark:border-gray-800 transition-colors lg:sticky lg:top-24">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{monthName}</h2>
                        <div className="flex gap-1">
                            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-400 transition-colors"><ChevronLeft size={18}/></button>
                            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-400 transition-colors"><ChevronRight size={18}/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                            <div key={day} className="text-[9px] font-black text-gray-400 uppercase tracking-widest py-2">{day}</div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                        {calendarDays.map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                            
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const hasTasks = tasks.some(t => isSameDay(t.date, date));
                            const special = getSpecialDayInfo(date);
                            
                            const dayStr = date.getDate().toString().padStart(2, '0');
                            const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');

                            let dayClasses = "bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md";
                            if (isSelected) {
                                dayClasses = "bg-brand-blue text-white shadow-lg shadow-brand-blue/20 z-10 scale-105";
                            } else if (special) {
                                dayClasses = `bg-gradient-to-br ${special.color} text-white shadow-lg z-10`;
                            }

                            return (
                                <div key={idx} className="relative group">
                                    <button 
                                        onClick={() => setSelectedDate(date)}
                                        className={`w-full aspect-square rounded-xl md:rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${dayClasses}`}
                                    >
                                        {/* Mũ Giáng Sinh */}
                                        {special?.hasHat && <SantaHat />}

                                        <div className="flex flex-col items-center leading-none">
                                            <span className={`text-[10px] md:text-[12px] font-black ${isSelected || special ? 'text-white' : isToday ? 'text-brand-blue' : ''}`}>
                                                {dayStr}
                                            </span>
                                            <span className={`text-[7px] md:text-[8px] font-black mt-0.5 opacity-50 ${isSelected || special ? 'text-white' : ''}`}>
                                                /{monthStr}
                                            </span>
                                        </div>
                                        
                                        {hasTasks && !isSelected && !special && (
                                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-orange"></div>
                                        )}
                                        {isToday && !isSelected && !special && (
                                            <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-brand-blue animate-pulse"></div>
                                        )}
                                    </button>

                                    {/* Tooltip hiển thị khi hover (đặc biệt cho ngày lễ) */}
                                    {special && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 pointer-events-none transition-all duration-300 z-[100] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 ${special.textColor}`}>
                                                    <special.icon size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 leading-tight">{special.label}</span>
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{special.detail}</span>
                                                </div>
                                            </div>
                                            {/* Triangle arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-white dark:bg-gray-800 border-b border-r border-gray-100 dark:border-gray-700 rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800">
                        <button 
                            onClick={() => { setViewDate(new Date()); setSelectedDate(new Date()); }} 
                            className="w-full py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-[10px] font-black uppercase text-gray-500 tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Clock size={12} /> Về hôm nay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;
