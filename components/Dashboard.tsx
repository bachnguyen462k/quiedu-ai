import React, { useState, useMemo } from 'react';
import { StudySet } from '../types';
import { Plus, Search, Layers, Flame, Calendar, Filter, ArrowUpRight, Book, GraduationCap, Clock, TrendingUp, SlidersHorizontal, User } from 'lucide-react';

interface DashboardProps {
  sets: StudySet[];
  onCreateNew: () => void;
  onSelectSet: (set: StudySet) => void;
}

const SUBJECTS = ['Tất cả', 'Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Tiếng Anh', 'Lịch Sử', 'Địa Lý', 'GDCD'];
const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];

const Dashboard: React.FC<DashboardProps> = ({ sets, onCreateNew, onSelectSet }) => {
  const [filterSubject, setFilterSubject] = useState('Tất cả');
  const [filterGrade, setFilterGrade] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'NEWEST'>('POPULAR');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Logic: Get Trending Sets (Top 3 by plays)
  const trendingSets = useMemo(() => {
    return [...sets]
        .sort((a, b) => (b.plays || 0) - (a.plays || 0))
        .slice(0, 3);
  }, [sets]);

  // 2. Logic: Filter & Sort Main List
  const filteredSets = useMemo(() => {
    let result = sets.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Simple text matching for Subject/Grade since they aren't explicit fields in StudySet yet
        // In a real app, these would be IDs or Enum fields
        const matchesSubject = filterSubject === 'Tất cả' || s.title.toLowerCase().includes(filterSubject.toLowerCase().replace('học', '').trim());
        const matchesGrade = filterGrade === 'Tất cả' || s.title.includes(filterGrade.replace('Lớp ', ''));

        return matchesSearch && matchesSubject && matchesGrade;
    });

    if (sortBy === 'POPULAR') {
        result.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    } else {
        result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [sets, searchQuery, filterSubject, filterGrade, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      
      {/* --- TRENDING SECTION (Replaces Leaderboard) --- */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <TrendingUp size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Đang xu hướng</h2>
                <p className="text-gray-500 text-sm">Các học phần được thi nhiều nhất tuần qua</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingSets.map((set, idx) => (
                <div 
                    key={set.id}
                    onClick={() => onSelectSet(set)}
                    className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer overflow-hidden"
                >
                    {/* Decor number */}
                    <div className="absolute -right-4 -bottom-4 text-9xl font-black text-gray-50 opacity-10 group-hover:text-orange-50 transition-colors pointer-events-none select-none">
                        {idx + 1}
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <Flame size={12} fill="currentColor" /> Xu hướng
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User size={12} /> {set.author}
                            </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                            {set.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{set.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                            <div className="flex items-center gap-1">
                                <Layers size={16} className="text-indigo-500" />
                                {set.cards.length} câu
                            </div>
                            <div className="flex items-center gap-1">
                                <Flame size={16} className="text-orange-500" />
                                {set.plays?.toLocaleString()} lượt thi
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* --- MAIN LIBRARY SECTION --- */}
      <section>
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                   <h1 className="text-2xl font-bold text-gray-900">Thư viện học liệu</h1>
                   <p className="text-gray-500 text-sm mt-1">Khám phá {filteredSets.length} bài học phù hợp với bạn</p>
               </div>
               <button 
                onClick={onCreateNew}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
               >
                <Plus size={18} /> Soạn bài mới
               </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo tên bài, tác giả..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-w-fit">
                        <Book size={16} className="text-gray-500" />
                        <select 
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                        >
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 min-w-fit">
                        <GraduationCap size={16} className="text-gray-500" />
                        <select 
                            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                        >
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

                    <div className="flex items-center gap-2 min-w-fit">
                        <button 
                            onClick={() => setSortBy('POPULAR')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'POPULAR' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Phổ biến
                        </button>
                        <button 
                            onClick={() => setSortBy('NEWEST')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'NEWEST' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Mới nhất
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Results Grid */}
        {filteredSets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 border-dashed">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy kết quả</h3>
                <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                <button 
                    onClick={() => {setFilterSubject('Tất cả'); setFilterGrade('Tất cả'); setSearchQuery('');}}
                    className="text-indigo-600 font-bold hover:underline"
                >
                    Xóa bộ lọc
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSets.map(set => (
                <div 
                key={set.id}
                onClick={() => onSelectSet(set)}
                className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-indigo-300 cursor-pointer transition-all duration-300 flex flex-col h-full"
                >
                <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">
                            {set.cards.length} thuật ngữ
                        </div>
                        {/* Auto-detect subject badge based on title (Mock logic) */}
                        {set.title.includes('Anh') && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md">Tiếng Anh</span>}
                        {set.title.includes('Sử') && <span className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-md">Lịch Sử</span>}
                        {set.title.includes('Hóa') && <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-md">Hóa Học</span>}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-tight">
                        {set.title}
                    </h3>
                    <p className="text-gray-500 text-xs mb-4 line-clamp-2">{set.description}</p>
                </div>
                
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl flex items-center justify-between text-gray-500">
                    <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        {set.author.charAt(0)}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[80px]" title={set.author}>{set.author}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                        {set.createdAt > Date.now() - 86400000 * 3 && (
                            <span className="flex items-center gap-1 text-green-600 font-bold">
                                <Clock size={12} /> Mới
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <ArrowUpRight size={12} /> {set.plays}
                        </span>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;