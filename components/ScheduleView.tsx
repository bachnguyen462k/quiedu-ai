
import React, { useState } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Clock, CheckCircle, Plus, Trash2, Filter, MoreHorizontal, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Task {
    id: number;
    time: string;
    date: string;
    task: string;
    category: string;
    done: boolean;
}

const INITIAL_SCHEDULE: Task[] = [
    { id: 1, time: '08:00', date: 'Hôm nay', task: 'Ôn tập Từ vựng Tiếng Anh - Unit 5', category: 'Ngoại ngữ', done: true },
    { id: 2, time: '14:30', date: 'Hôm nay', task: 'Làm Quiz Toán Giải Tích 12', category: 'Toán học', done: false },
    { id: 3, time: '19:00', date: 'Hôm nay', task: 'Học nhóm Lịch Sử VN (Online)', category: 'Lịch sử', done: false },
    { id: 4, time: '21:00', date: 'Hôm nay', task: 'Làm bài tập Hóa học hữu cơ', category: 'Hóa học', done: false },
    { id: 5, time: '09:00', date: 'Ngày mai', task: 'Đọc trước chương 3 Vật Lý', category: 'Vật lý', done: false },
    { id: 6, time: '15:00', date: 'Ngày mai', task: 'Luyện đề Ngữ Văn (90 phút)', category: 'Ngữ văn', done: false },
    { id: 7, time: '20:00', date: '15/10/2025', task: 'Nộp bài tập GDCD lớp 12A1', category: 'Khác', done: false },
];

const ScheduleView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>(INITIAL_SCHEDULE);
    const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');

    const filteredTasks = tasks.filter(t => {
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

    const stats = {
        total: tasks.length,
        done: tasks.filter(t => t.done).length,
        todo: tasks.filter(t => !t.done).length,
    };

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
                    <CalendarIcon size={16} /> 12 Tháng 10, 2025
                </div>
            </div>

            <div className="bg-white dark:bg-gray-855 rounded-[40px] p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800 mb-10 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Lịch học tập</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Lập kế hoạch và theo dõi tiến độ mỗi ngày.</p>
                    </div>
                    <button className="bg-brand-blue text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={24} /> Thêm nhiệm vụ
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center">
                        <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tổng cộng</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white">{stats.total}</span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl text-center">
                        <span className="block text-[10px] font-black text-green-600/50 uppercase mb-1">Đã xong</span>
                        <span className="text-xl font-black text-green-600">{stats.done}</span>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl text-center">
                        <span className="block text-[10px] font-black text-brand-orange/50 uppercase mb-1">Chờ làm</span>
                        <span className="text-xl font-black text-brand-orange">{stats.todo}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit mb-8 transition-colors">
                    <button onClick={() => setFilter('ALL')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filter === 'ALL' ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-md' : 'text-gray-500'}`}>Tất cả</button>
                    <button onClick={() => setFilter('TODO')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filter === 'TODO' ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-md' : 'text-gray-500'}`}>Chưa làm</button>
                    <button onClick={() => setFilter('DONE')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filter === 'DONE' ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-md' : 'text-gray-500'}`}>Đã xong</button>
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
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${item.done ? 'text-gray-400' : 'text-brand-blue'}`}>{item.time} • {item.date}</span>
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
                        <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/20 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                            <CheckSquare className="mx-auto text-gray-200 dark:text-gray-800 mb-4" size={48} />
                            <p className="text-gray-500 font-black text-lg">Không có nhiệm vụ nào!</p>
                            <p className="text-gray-400 text-sm font-medium">Hãy tận hưởng thời gian rảnh rỗi của bạn.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;
