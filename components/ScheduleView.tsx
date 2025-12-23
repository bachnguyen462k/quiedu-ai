
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, Plus, Trash2, MoreHorizontal, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
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
];

const ScheduleView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>(INITIAL_SCHEDULE);
    const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());

    // Calendar logic
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        // Adjust for Monday start (JS getDay() returns 0 for Sunday)
        const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < emptyDays; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [viewDate]);

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };

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
        if (confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const monthName = viewDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-32">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors"
                >
                    <ArrowLeft size={18} /> Quay lại
                </button>
                <div className="flex items-center gap-2 text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest">
                    <CalendarIcon size={16} /> {selectedDate.toLocaleDateString('vi-VN')}
                </div>
            </div>

            {/* Calendar Grid Card */}
            <div className="bg-white dark:bg-gray-855 rounded-[40px] p-6 md:p-10 shadow-xl border border-gray-100 dark:border-gray-800 mb-8 transition-colors">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{monthName}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-400"><ChevronLeft size={20}/></button>
                        <button onClick={() => setViewDate(new Date())} className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-[10px] font-black uppercase text-gray-500 tracking-widest">Hôm nay</button>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-400"><ChevronRight size={20}/></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                        <div key={day} className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="aspect-square"></div>;
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());
                        const hasTasks = tasks.some(t => isSameDay(t.date, date));

                        return (
                            <button 
                                key={idx} 
                                onClick={() => setSelectedDate(date)}
                                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 group ${
                                    isSelected 
                                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20 z-10' 
                                    : 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md'
                                }`}
                            >
                                <span className={`text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-brand-blue' : ''}`}>
                                    {date.getDate()}
                                </span>
                                {hasTasks && !isSelected && (
                                    <div className="absolute bottom-2 w-1 h-1 rounded-full bg-brand-orange"></div>
                                )}
                                {isToday && !isSelected && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white dark:bg-gray-855 rounded-[40px] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">
                            Nhiệm vụ {isSameDay(selectedDate, new Date()) ? 'hôm nay' : selectedDate.toLocaleDateString('vi-VN')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Theo dõi tiến độ học tập chi tiết.</p>
                    </div>
                    <button className="bg-brand-blue text-white px-6 py-3.5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all text-sm">
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
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${item.done ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-300 group-hover:text-brand-blue'}`}
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
                            <p className="text-gray-400 text-sm font-medium">Bạn không có nhiệm vụ nào cần thực hiện.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;
