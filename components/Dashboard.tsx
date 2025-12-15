import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySet, AiGenerationRecord, User, Review } from '../types';
import { Plus, Search, ArrowUpRight, Book, GraduationCap, Clock, Flame, Play, Loader2, FileText, Layers, ChevronRight, Heart, MessageSquare, Star, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  sets: StudySet[];
  uploads?: AiGenerationRecord[]; // Passed only in Library view
  currentUser?: User | null; // Needed to filter "My Sets" in Library
  onCreateNew: () => void;
  onSelectSet: (set: StudySet) => void;
  onSelectUpload?: (record: AiGenerationRecord) => void;
  onToggleFavorite: (setId: string) => void;
  isLibrary: boolean;
}

const SUBJECTS = ['Tất cả', 'Toán', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Tiếng Anh', 'Lịch Sử', 'Địa Lý', 'GDCD'];
const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12', 'Đại học'];
const ITEMS_PER_PAGE = 10;

const Dashboard: React.FC<DashboardProps> = ({ sets, uploads, currentUser, onCreateNew, onSelectSet, onSelectUpload, onToggleFavorite, isLibrary }) => {
  const { t } = useTranslation();
  const [filterSubject, setFilterSubject] = useState('Tất cả');
  const [filterGrade, setFilterGrade] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'NEWEST'>('POPULAR');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Library Tabs State
  const [libraryTab, setLibraryTab] = useState<'SETS' | 'FAVORITES' | 'FILES'>('SETS');

  // Infinity Scroll State
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Logic: Trending List (Top 3 by plays) - Always taken from the full list
  const trendingSets = useMemo(() => {
      // In dashboard view, we usually show trending from ALL sets.
      return [...sets].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 3);
  }, [sets]);

  // Logic: Recent Reviews (Across all sets)
  const recentReviews = useMemo(() => {
      if (isLibrary) return []; // Don't compute for library view
      
      const allReviews: (Review & { setTitle: string, setId: string })[] = [];
      sets.forEach(set => {
          if (set.reviews && set.reviews.length > 0) {
              set.reviews.forEach(review => {
                  allReviews.push({
                      ...review,
                      setTitle: set.title,
                      setId: set.id
                  });
              });
          }
      });
      // Sort by newest
      return allReviews.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  }, [sets, isLibrary]);

  // Logic: Filter & Sort Main List (SETS)
  const filteredSets = useMemo(() => {
    let result = sets;

    // 1. Library View specific filtering
    if (isLibrary && currentUser) {
        if (libraryTab === 'SETS') {
            // Show only my sets
            result = result.filter(s => s.author === currentUser.name);
        } else if (libraryTab === 'FAVORITES') {
            // Show only favorite sets (mine or others)
            result = result.filter(s => s.isFavorite);
        }
    }

    // 2. Apply Search & Filters
    result = result.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Simple text matching for Subject/Grade
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
  }, [sets, searchQuery, filterSubject, filterGrade, sortBy, isLibrary, libraryTab, currentUser]);

  // Logic: Filter Uploads (FILES)
  const filteredUploads = useMemo(() => {
      if (!uploads) return [];
      return uploads.filter(u => 
          u.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.result.subject.toLowerCase().includes(searchQuery.toLowerCase())
      ).sort((a, b) => b.createdAt - a.createdAt);
  }, [uploads, searchQuery]);

  // Determine what to show based on Tab
  const isShowingFiles = isLibrary && libraryTab === 'FILES';
  const totalItems = isShowingFiles ? filteredUploads.length : filteredSets.length;

  // Reset visible count when filters or tabs change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filteredSets, filteredUploads, libraryTab]);

  // Get current chunk of data
  const displayedSets = useMemo(() => {
      return filteredSets.slice(0, visibleCount);
  }, [filteredSets, visibleCount]);

  const displayedUploads = useMemo(() => {
      return filteredUploads.slice(0, visibleCount);
  }, [filteredUploads, visibleCount]);

  const hasMore = visibleCount < totalItems;

  // Infinite Scroll Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
            setTimeout(() => {
                setVisibleCount(prev => prev + ITEMS_PER_PAGE);
            }, 500);
        }
    });

    if (loadMoreRef.current) {
        observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
        if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, totalItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 animate-fade-in">
      
      {/* --- TRENDING SECTION (Only on Dashboard - Full Width Top) --- */}
      {!isLibrary && (
        <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Flame className="text-orange-500" fill="currentColor" /> {t('dashboard.trending')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingSets.map((set, idx) => (
                    <div 
                        key={set.id}
                        onClick={() => onSelectSet(set)}
                        className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all group ${
                            idx === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 
                            'bg-white dark:bg-gray-800'
                        }`}
                    >
                        {idx === 0 && (
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Flame size={100} />
                            </div>
                        )}
                        
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                                            idx === 0 ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            HOT
                                        </span>
                                        <span className={`text-xs font-medium flex items-center gap-1 ${idx === 0 ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            <Play size={10} /> {set.plays}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }}
                                        className={`p-1.5 rounded-full transition-all hover:bg-white/20 ${
                                            set.isFavorite 
                                            ? (idx === 0 ? 'text-white fill-white' : 'text-red-500 fill-red-500') 
                                            : (idx === 0 ? 'text-indigo-200' : 'text-gray-400')
                                        }`}
                                    >
                                        <Heart size={18} fill={set.isFavorite ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${idx === 0 ? 'text-white' : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                                    {set.title}
                                </h3>
                                <p className={`text-sm line-clamp-2 ${idx === 0 ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {set.description}
                                </p>
                            </div>
                            
                            <div className="mt-4 flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    idx === 0 ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                    {set.author.charAt(0)}
                                </div>
                                <span className={`text-xs font-medium ${idx === 0 ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {set.author}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* --- GRID LAYOUT: MAIN CONTENT + SIDEBAR (REVIEWS) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* LEFT: MAIN EXPLORE/LIBRARY SECTION */}
        <div className={!isLibrary ? "xl:col-span-3" : "xl:col-span-4"}>
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isLibrary ? t('dashboard.library') : t('dashboard.explore')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {isLibrary 
                                ? (libraryTab === 'FILES' 
                                    ? `${filteredUploads.length} ${t('dashboard.tab_files').toLowerCase()}`
                                    : `${filteredSets.length} ${t('common.search').replace('...', '').toLowerCase()}`
                                )
                                : t('landing.hero_desc')
                            }
                    </p>
                </div>
                <button 
                    onClick={onCreateNew}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
                >
                    <Plus size={18} /> {t('dashboard.create_btn')}
                </button>
                </div>

                {/* LIBRARY TABS (Only Visible in Library Mode) */}
                {isLibrary && (
                    <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6 overflow-x-auto">
                        <button 
                            onClick={() => setLibraryTab('SETS')}
                            className={`py-3 px-2 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                                libraryTab === 'SETS' 
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Book size={18} /> {t('dashboard.tab_sets')}
                        </button>
                        <button 
                            onClick={() => setLibraryTab('FAVORITES')}
                            className={`py-3 px-2 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                                libraryTab === 'FAVORITES' 
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Heart size={18} /> {t('dashboard.tab_favorites')}
                        </button>
                        <button 
                            onClick={() => setLibraryTab('FILES')}
                            className={`py-3 px-2 border-b-2 font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${
                                libraryTab === 'FILES' 
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <FileText size={18} /> {t('dashboard.tab_files')}
                        </button>
                    </div>
                )}

                {/* Filter Bar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row gap-4 items-center transition-colors">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={libraryTab === 'FILES' ? t('dashboard.search_lib') : t('dashboard.search_comm')}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 dark:text-white transition-all text-sm placeholder-gray-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filters (Hidden for FILES tab to simplify) */}
                    {!isShowingFiles && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 min-w-fit flex-1 sm:flex-none">
                                    <Book size={16} className="text-gray-500 dark:text-gray-400" />
                                    <select 
                                        className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none w-full"
                                        value={filterSubject}
                                        onChange={(e) => setFilterSubject(e.target.value)}
                                    >
                                        {SUBJECTS.map(s => <option key={s} value={s} className="bg-white dark:bg-gray-800">{s === 'Tất cả' ? t('dashboard.filter_all') : s}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 min-w-fit flex-1 sm:flex-none">
                                    <GraduationCap size={16} className="text-gray-500 dark:text-gray-400" />
                                    <select 
                                        className="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none w-full"
                                        value={filterGrade}
                                        onChange={(e) => setFilterGrade(e.target.value)}
                                    >
                                        {GRADES.map(g => <option key={g} value={g} className="bg-white dark:bg-gray-800">{g === 'Tất cả' ? t('dashboard.filter_all') : g}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 hidden xl:block"></div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                                <button 
                                    onClick={() => setSortBy('POPULAR')}
                                    className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'POPULAR' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {t('dashboard.sort_popular')}
                                </button>
                                <button 
                                    onClick={() => setSortBy('NEWEST')}
                                    className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'NEWEST' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {t('dashboard.sort_newest')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CONTENT AREA: FILES TAB */}
            {isShowingFiles ? (
                displayedUploads.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 border-dashed transition-colors">
                        <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.empty_library')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('dashboard.empty_library_desc')}</p>
                        <button 
                            onClick={onCreateNew}
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            {t('dashboard.upload_now')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedUploads.map(file => (
                            <div 
                                key={file.id}
                                onClick={() => onSelectUpload && onSelectUpload(file)}
                                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-all duration-300 p-5 flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} /> {new Date(file.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 break-all">
                                    {file.fileName}
                                </h3>
                                
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{file.result.subject} - {file.result.grade}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                        <Layers size={14} />
                                        <span>{file.result.topics.length} topics</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline items-center gap-1">
                                    {t('common.start')} <ChevronRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* CONTENT AREA: SETS TAB */
                <>
                    {filteredSets.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 border-dashed transition-colors">
                            <Search size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.no_results')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {libraryTab === 'FAVORITES' ? 'Bạn chưa thêm học phần nào vào danh sách yêu thích.' : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.'}
                            </p>
                            <button 
                                onClick={() => {setFilterSubject('Tất cả'); setFilterGrade('Tất cả'); setSearchQuery('');}}
                                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                            >
                                {t('dashboard.clear_filter')}
                            </button>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 ${!isLibrary ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
                        {displayedSets.map(set => (
                            <div 
                            key={set.id}
                            onClick={() => onSelectSet(set)}
                            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-all duration-300 flex flex-col h-full relative"
                            >
                            {/* Favorite Button on Card */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }}
                                className={`absolute top-4 right-4 p-2 rounded-full z-10 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${set.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                                title={set.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                            >
                                <Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} />
                            </button>

                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wide">
                                        {set.cards.length} cards
                                    </div>
                                    {/* Auto-detect subject badge based on title (Mock logic) */}
                                    {set.title.includes('Anh') && <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-md mr-8">English</span>}
                                    {set.title.includes('Sử') && <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] font-bold px-2 py-1 rounded-md mr-8">History</span>}
                                    {set.title.includes('Hóa') && <span className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-1 rounded-md mr-8">Chemistry</span>}
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 leading-tight pr-6">
                                    {set.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 line-clamp-2">{set.description}</p>
                            </div>
                            
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-xl flex items-center justify-between text-gray-500 dark:text-gray-400 transition-colors">
                                <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                    {set.author.charAt(0)}
                                </div>
                                <span className="text-xs font-medium truncate max-w-[80px]" title={set.author}>{set.author}</span>
                                </div>
                                
                                <div className="flex items-center gap-3 text-xs">
                                    {set.createdAt > Date.now() - 86400000 * 3 && (
                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                                            <Clock size={12} /> New
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
                </>
            )}

            {/* Loading Indicator for Infinite Scroll */}
            {hasMore && (
                <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm">
                        <Loader2 className="animate-spin" size={18} /> {t('dashboard.loading')}
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT: RECENT REVIEWS SIDEBAR (Only on Dashboard) */}
        {!isLibrary && (
            <div className="xl:col-span-1 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="text-indigo-500" fill="currentColor" size={20} /> {t('dashboard.recent_reviews')}
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    {recentReviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                            <MessageSquare size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">{t('set_detail.no_comments')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4 overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
                            {recentReviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-50 dark:border-gray-700/50 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <img 
                                                src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} 
                                                alt="User" 
                                                className="w-6 h-6 rounded-full bg-gray-200"
                                            />
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{review.userName}</span>
                                        </div>
                                        <div className="flex text-yellow-400 text-[10px]">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300 dark:text-gray-600"} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1.5 line-clamp-2 italic">"{review.comment}"</p>
                                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                                        <div className="flex items-center gap-1 overflow-hidden">
                                            <span>{t('dashboard.commented_on')}</span>
                                            <span 
                                                onClick={() => {
                                                    const targetSet = sets.find(s => s.id === review.setId);
                                                    if (targetSet) onSelectSet(targetSet);
                                                }}
                                                className="font-bold text-indigo-500 hover:underline cursor-pointer truncate max-w-[80px]"
                                                title={review.setTitle}
                                            >
                                                {review.setTitle}
                                            </span>
                                        </div>
                                        <span className="shrink-0">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;