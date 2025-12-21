
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySet, AiGenerationRecord, User, Review } from '../types';
import { Plus, Search, ArrowUpRight, Book, Clock, Flame, Play, Loader2, FileText, Layers, ChevronRight, Heart, MessageSquare, Star, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { studySetService } from '../services/studySetService';
import { useApp } from '../contexts/AppContext';

interface DashboardProps {
  sets: StudySet[];
  uploads?: AiGenerationRecord[]; 
  currentUser?: User | null; 
  onCreateNew: () => void;
  onSelectSet: (set: StudySet) => void;
  onSelectUpload?: (record: AiGenerationRecord) => void;
  onToggleFavorite: (setId: string) => void;
  isLibrary: boolean;
}

const ITEMS_PER_PAGE = 20;

const Dashboard: React.FC<DashboardProps> = ({ sets: localSets, uploads, currentUser, onCreateNew, onSelectSet, onSelectUpload, onToggleFavorite, isLibrary }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  
  const subjectsList = [
    { key: 'all', label: t('dashboard.subjects.all') },
    { key: 'math', label: t('dashboard.subjects.math') },
    { key: 'physics', label: t('dashboard.subjects.physics') },
    { key: 'chemistry', label: t('dashboard.subjects.chemistry') },
    { key: 'biology', label: t('dashboard.subjects.biology') },
    { key: 'english', label: t('dashboard.subjects.english') },
    { key: 'history', label: t('dashboard.subjects.history') },
    { key: 'geography', label: t('dashboard.subjects.geography') },
    { key: 'civics', label: t('dashboard.subjects.civics') }
  ];

  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'NEWEST'>('POPULAR');
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryTab, setLibraryTab] = useState<'SETS' | 'FAVORITES' | 'FILES'>('SETS');
  
  // Server Pagination State
  const [serverSets, setServerSets] = useState<StudySet[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // --- FETCH DATA FROM SERVER ---
  const fetchMySets = async (page: number, refresh: boolean = false) => {
      if (!isLibrary || libraryTab !== 'SETS' || isLoading) return;

      setIsLoading(true);
      try {
          const response = await studySetService.getMyStudySets(page, ITEMS_PER_PAGE);
          if (response.code === 1000) {
              const { content, totalPages: total } = response.result;
              
              // Map API format to Frontend type
              const mappedSets: StudySet[] = content.map((item: any) => ({
                  id: item.id.toString(),
                  title: item.title,
                  description: item.description,
                  author: currentUser?.name || 'Bạn',
                  createdAt: new Date(item.createdAt).getTime(),
                  privacy: 'PUBLIC',
                  subject: item.topic || 'Khác',
                  plays: 0,
                  cards: [] // Sẽ được fetch chi tiết khi nhấn vào
              }));

              if (refresh) {
                  setServerSets(mappedSets);
              } else {
                  setServerSets(prev => [...prev, ...mappedSets]);
              }
              setTotalPages(total);
          }
      } catch (error) {
          console.error("Failed to load my sets", error);
          addNotification("Không thể tải danh sách học phần từ máy chủ", "error");
      } finally {
          setIsLoading(false);
          setIsInitialLoading(false);
      }
  };

  // Reset and load when entering Library/Tab Sets
  useEffect(() => {
    if (isLibrary && libraryTab === 'SETS') {
        setCurrentPage(0);
        fetchMySets(0, true);
    } else {
        setIsInitialLoading(false);
    }
  }, [isLibrary, libraryTab]);

  // Infinite Scroll Logic
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    const hasMore = currentPage < totalPages - 1;
    
    observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchMySets(nextPage);
        }
    });

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [currentPage, totalPages, isLoading, isLibrary, libraryTab]);

  // --- LOCAL DATA LOGIC (Explore / Favorites) ---
  const trendingSets = useMemo(() => {
      return [...localSets].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 3);
  }, [localSets]);

  const recentReviews = useMemo(() => {
      if (isLibrary) return []; 
      const allReviews: (Review & { setTitle: string, setId: string })[] = [];
      localSets.forEach(set => {
          if (set.reviews) {
              set.reviews.forEach(review => {
                  allReviews.push({ ...review, setTitle: set.title, setId: set.id });
              });
          }
      });
      return allReviews.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  }, [localSets, isLibrary]);

  // Merge server and local sets depending on context
  const filteredSets = useMemo(() => {
    let base = isLibrary && libraryTab === 'SETS' ? serverSets : localSets;
    
    if (isLibrary && currentUser) {
        if (libraryTab === 'FAVORITES') base = localSets.filter(s => s.isFavorite);
    }

    let result = [...base].filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = filterSubject === 'all' || s.subject?.toLowerCase().includes(filterSubject.toLowerCase());
        return matchesSearch && matchesSubject;
    });

    if (sortBy === 'POPULAR') result.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    else result.sort((a, b) => b.createdAt - a.createdAt);
    
    return result;
  }, [serverSets, localSets, searchQuery, filterSubject, sortBy, isLibrary, libraryTab, currentUser]);

  const filteredUploads = useMemo(() => {
      if (!uploads) return [];
      return uploads.filter(u => 
          u.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
          u.result.subject.toLowerCase().includes(searchQuery.toLowerCase())
      ).sort((a, b) => b.createdAt - a.createdAt);
  }, [uploads, searchQuery]);

  const isShowingFiles = isLibrary && libraryTab === 'FILES';

  if (isInitialLoading && isLibrary && libraryTab === 'SETS') {
      return (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
              <Loader2 className="animate-spin text-brand-blue mb-4" size={48} />
              <p className="text-gray-500 font-bold">{t('dashboard.loading')}</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 animate-fade-in">
      {!isLibrary && (
        <section className="mb-12">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Flame className="text-brand-orange" fill="currentColor" /> {t('dashboard.trending')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingSets.map((set, idx) => (
                    <div 
                        key={set.id}
                        onClick={() => onSelectSet(set)}
                        className={`relative overflow-hidden rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all group ${
                            idx === 0 ? 'bg-gradient-to-br from-brand-blue to-blue-800 text-white border-transparent' : 
                            'bg-white dark:bg-gray-855'
                        }`}
                    >
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                                        idx === 0 ? 'bg-white/20 text-white' : 'bg-brand-orange/10 text-brand-orange'
                                    }`}>HOT</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }}
                                        className={`p-2 rounded-full transition-all hover:bg-white/10 ${set.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-gray-500'}`}
                                    >
                                        <Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} />
                                    </button>
                                </div>
                                <h3 className={`text-xl font-bold mb-3 line-clamp-2 leading-snug ${idx === 0 ? 'text-white' : 'text-gray-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-blue-400'}`}>
                                    {set.title}
                                </h3>
                                <p className={`text-sm line-clamp-2 opacity-80 ${idx === 0 ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {set.description}
                                </p>
                            </div>
                            <div className="mt-6 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-white text-brand-blue' : 'bg-brand-blue text-white'}`}>
                                    {set.author.charAt(0)}
                                </div>
                                <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-gray-800 dark:text-gray-300'}`}>{set.author}</span>
                                <div className={`ml-auto flex items-center gap-1 text-xs ${idx === 0 ? 'text-blue-200' : 'text-gray-500'}`}>
                                    <Play size={12} /> {set.plays}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
        <div className={!isLibrary ? "xl:col-span-3" : "xl:col-span-4"}>
            <div className="flex flex-col gap-8 mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {isLibrary ? t('dashboard.library') : t('dashboard.explore')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
                                {isShowingFiles ? `${filteredUploads.length} tài liệu` : `${filteredSets.length} học phần`}
                        </p>
                    </div>
                    <button 
                        onClick={onCreateNew}
                        className="bg-brand-orange text-white px-6 py-3 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-brand-orange/20 flex items-center gap-2 whitespace-nowrap justify-center transform hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus size={20} /> {t('dashboard.create_btn')}
                    </button>
                </div>

                {isLibrary && (
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit overflow-x-auto">
                        <button onClick={() => setLibraryTab('SETS')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${libraryTab === 'SETS' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}><Book size={18} /> {t('dashboard.tab_sets')}</button>
                        <button onClick={() => setLibraryTab('FAVORITES')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${libraryTab === 'FAVORITES' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}><Heart size={18} /> {t('dashboard.tab_favorites')}</button>
                        <button onClick={() => setLibraryTab('FILES')} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${libraryTab === 'FILES' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'}`}><FileText size={18} /> {t('dashboard.tab_files')}</button>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-855 p-5 rounded-3xl shadow-md border border-gray-100 dark:border-gray-800 flex flex-col xl:flex-row gap-5 items-center">
                    <div className="relative flex-1 w-full text-gray-900">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" placeholder={libraryTab === 'FILES' ? t('dashboard.search_lib') : t('dashboard.search_comm')} className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all text-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    {!isShowingFiles && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-2xl border border-transparent dark:border-gray-700">
                                <Book size={18} className="text-brand-blue dark:text-blue-400" />
                                <select className="bg-transparent border-none text-sm font-bold text-gray-800 dark:text-gray-200 focus:ring-0 cursor-pointer outline-none" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                                    {subjectsList.map(s => <option key={s.key} value={s.key} className="bg-white dark:bg-gray-800 font-bold">{s.label}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setSortBy('POPULAR')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${sortBy === 'POPULAR' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{t('dashboard.sort_popular')}</button>
                                <button onClick={() => setSortBy('NEWEST')} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${sortBy === 'NEWEST' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{t('dashboard.sort_newest')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isShowingFiles ? (
                /* Fix: Renamed displayedUploads to filteredUploads to fix reference error */
                filteredUploads.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-gray-855 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800"><FileText size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-6" /><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.empty_library')}</h3><p className="text-gray-600 dark:text-gray-400 mb-8">{t('dashboard.empty_library_desc')}</p><button onClick={onCreateNew} className="text-brand-blue dark:text-blue-400 font-black hover:underline">{t('dashboard.upload_now')}</button></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredUploads.map(file => (
                            <div key={file.id} onClick={() => onSelectUpload && onSelectUpload(file)} className="group bg-white dark:bg-gray-855 rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all duration-300 p-6 flex flex-col h-full"><div className="flex justify-between items-start mb-6"><div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-brand-blue dark:text-blue-400 group-hover:bg-brand-blue group-hover:text-white transition-colors"><FileText size={24} /></div><span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-wider"><Clock size={12} /> {new Date(file.createdAt).toLocaleDateString('vi-VN')}</span></div><h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-blue transition-colors line-clamp-2 mb-3 leading-tight">{file.fileName}</h3><p className="text-sm text-gray-600 mb-6">{file.result.subject} - {file.result.grade}</p><div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-xs font-black text-brand-blue"><span className="flex items-center gap-1.5"><Layers size={14} /> {file.result.topics.length} CHỦ ĐỀ</span><span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-widest">{t('common.start')} <ChevronRight size={14} /></span></div></div>
                        ))}
                    </div>
                )
            ) : (
                <>
                    {filteredSets.length === 0 ? (
                        <div className="text-center py-24 bg-white dark:bg-gray-855 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800">
                             <AlertCircle size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-6" />
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.no_results')}</h3>
                             <p className="text-gray-500 dark:text-gray-400">{t('dashboard.clear_filter')}</p>
                        </div>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 ${!isLibrary ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-8`}>
                            {filteredSets.map(set => (
                                <div key={set.id} onClick={() => onSelectSet(set)} className="group bg-white dark:bg-gray-855 rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all duration-300 flex flex-col h-full relative">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }} className={`absolute top-4 right-4 p-2.5 rounded-full z-10 transition-all ${set.isFavorite ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}><Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} /></button>
                                    <div className="p-6 flex-1">
                                        <div className="flex gap-2 mb-4">
                                            <span className="px-2 py-1 rounded-lg bg-brand-blue/5 dark:bg-blue-400/10 text-brand-blue dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">FLASHCARD</span>
                                            <span className="px-2 py-1 rounded-lg bg-brand-orange/5 text-brand-orange text-[10px] font-black uppercase tracking-widest">{set.subject}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-blue transition-colors line-clamp-2 mb-3 leading-tight pr-6">{set.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 opacity-80 font-medium">{set.description}</p>
                                    </div>
                                    <div className="px-6 py-5 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 rounded-b-3xl flex items-center justify-between text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-black shadow-sm">{set.author.charAt(0)}</div>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{set.author}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                            <span className="flex items-center gap-1"><Clock size={14} className="text-brand-blue" /> {new Date(set.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Infinite Scroll Loader */}
                    {(isLoading || (currentPage < totalPages - 1)) && (
                        <div ref={loadMoreRef} className="py-12 flex justify-center w-full">
                            <div className="flex items-center gap-3 text-gray-600 font-bold bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 transition-colors">
                                <Loader2 className="animate-spin text-brand-blue" size={20} /> 
                                {isLoading ? t('dashboard.loading') : "Cuộn để xem thêm"}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>

        {!isLibrary && (
            <div className="xl:col-span-1 sticky top-24">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight"><MessageSquare className="text-brand-blue dark:text-blue-400" fill="currentColor" size={20} /> {t('dashboard.recent_reviews')}</h2>
                <div className="bg-white dark:bg-gray-855 rounded-3xl p-5 shadow-md border border-gray-100 dark:border-gray-800 flex flex-col">
                    {recentReviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400"><MessageSquare size={40} className="mb-3 opacity-20" /><p className="text-sm font-bold">{t('set_detail.no_comments')}</p></div>
                    ) : (
                        <div className="space-y-6 overflow-y-auto custom-scrollbar max-h-[calc(100vh-250px)] pr-1">
                            {recentReviews.map((review) => (
                                <div key={review.id} className="group cursor-pointer">
                                    <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><img src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} alt="User" className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700" /><span className="text-xs font-black text-gray-900 dark:text-white">{review.userName}</span></div><div className="flex text-brand-orange"><Star size={10} fill="currentColor" /></div></div>
                                    <p className="text-xs text-gray-700 dark:text-gray-400 mb-3 italic line-clamp-3 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl group-hover:text-brand-blue transition-colors">"{review.comment}"</p>
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-gray-500">
                                        <span onClick={() => { const targetSet = localSets.find(s => s.id === review.setId); if (targetSet) onSelectSet(targetSet); }} className="text-brand-blue hover:underline truncate max-w-[120px]">{review.setTitle}</span>
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
