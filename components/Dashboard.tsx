
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySet, AiGenerationRecord, User, Review } from '../types';
import { Plus, Search, ArrowUpRight, Book, Clock, Flame, Play, Loader2, FileText, Layers, ChevronRight, Heart, MessageSquare, Star, AlertCircle, Sparkles, Keyboard, ScanLine, BookOpen, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { studySetService } from '../services/studySetService';
import { useApp } from '../contexts/AppContext';
import ThemeLoader from './ThemeLoader';

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
  
  const [sortBy, setSortBy] = useState<'POPULAR' | 'NEWEST'>('NEWEST');
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

  const trendingSets = useMemo(() => {
    return [...localSets].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 3);
  }, [localSets]);

  // --- FETCH DATA FROM SERVER ---
  const fetchMySets = async (page: number, refresh: boolean = false) => {
      if (!isLibrary || libraryTab !== 'SETS' || isLoading) return;

      setIsLoading(true);
      try {
          const response = await studySetService.getMyStudySets(page, ITEMS_PER_PAGE);
          if (response.code === 1000) {
              const { content, totalPages: total } = response.result;
              
              const mappedSets: StudySet[] = content.map((item: any) => ({
                  id: item.id.toString(),
                  title: item.title,
                  description: item.description,
                  author: currentUser?.name || 'Bạn',
                  createdAt: new Date(item.createdAt).getTime(),
                  privacy: 'PUBLIC',
                  subject: item.topic || 'Khác',
                  type: item.type,
                  status: item.status,
                  plays: item.plays || 0,
                  cards: [],
                  isFavorite: localSets.find(ls => ls.id === item.id.toString())?.isFavorite || false
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
      } finally {
          setIsLoading(false);
          setIsInitialLoading(false);
      }
  };

  useEffect(() => {
    if (isLibrary && libraryTab === 'SETS') {
        setCurrentPage(0);
        fetchMySets(0, true);
    } else {
        setIsInitialLoading(true);
        const timer = setTimeout(() => setIsInitialLoading(false), 400);
        return () => clearTimeout(timer);
    }
  }, [isLibrary, libraryTab]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const hasMore = currentPage < totalPages - 1;
    observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && libraryTab === 'SETS') {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchMySets(nextPage);
        }
    });
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [currentPage, totalPages, isLoading, isLibrary, libraryTab]);

  const filteredSets = useMemo(() => {
    let base = (isLibrary && libraryTab === 'SETS') ? serverSets : localSets;
    
    if (isLibrary) {
        if (libraryTab === 'FAVORITES') base = localSets.filter(s => s.isFavorite);
        // AI Files are handled separately in the UI render below
    }

    let result = [...base].filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    if (sortBy === 'POPULAR') result.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    else result.sort((a, b) => b.createdAt - a.createdAt);
    
    return result;
  }, [serverSets, localSets, searchQuery, sortBy, isLibrary, libraryTab]);

  const renderSetTypeBadge = (type?: string) => {
      switch (type) {
          case 'MANUAL': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md"><Keyboard size={10}/> {t('create_set.manual_title')}</span>;
          case 'AI_TOPIC': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-md"><Sparkles size={10}/> AI Chủ đề</span>;
          case 'AI_FILE': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md"><ScanLine size={10}/> AI Quét file</span>;
          case 'AI_TEXTBOOK': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded-md"><BookOpen size={10}/> AI Giáo án</span>;
          default: return null;
      }
  };

  if (isInitialLoading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
              <ThemeLoader size={64} />
              <p className="mt-6 text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">
                  {t('dashboard.loading')}
              </p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 animate-fade-in">
      
      {/* LIBRARY HEADER & TABS */}
      {isLibrary ? (
        <div className="mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('sidebar.library')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Quản lý các tài liệu học tập của riêng bạn</p>
                </div>
                <button 
                    onClick={onCreateNew}
                    className="bg-brand-blue text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-brand-blue/20 hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Plus size={20} /> {t('dashboard.create_btn')}
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 gap-4">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-px">
                    <button 
                        onClick={() => setLibraryTab('SETS')}
                        className={`px-4 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${libraryTab === 'SETS' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        {t('dashboard.tab_sets')}
                    </button>
                    <button 
                        onClick={() => setLibraryTab('FAVORITES')}
                        className={`px-4 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${libraryTab === 'FAVORITES' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        {t('dashboard.tab_favorites')}
                    </button>
                    <button 
                        onClick={() => setLibraryTab('FILES')}
                        className={`px-4 py-3 font-black text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${libraryTab === 'FILES' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        {t('dashboard.tab_files')}
                    </button>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto pb-3 sm:pb-0">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            placeholder={t('dashboard.search_lib')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-blue/50"
                        />
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <section className="mb-12">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Flame className="text-brand-orange" fill="currentColor" /> {t('dashboard.trending')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingSets.map((set, idx) => (
                    <div key={set.id} onClick={() => onSelectSet(set)} className={`relative overflow-hidden rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all group ${idx === 0 ? 'bg-gradient-to-br from-brand-blue to-blue-800 text-white border-transparent' : 'bg-white dark:bg-gray-855'}`}>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${idx === 0 ? 'bg-white/20 text-white' : 'bg-brand-orange/10 text-brand-orange'}`}>HOT</span>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }} className={`p-2 rounded-full transition-all hover:bg-white/10 ${set.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-gray-500'}`}><Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} /></button>
                                </div>
                                <h3 className={`text-xl font-bold mb-3 line-clamp-2 leading-snug ${idx === 0 ? 'text-white' : 'text-gray-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-blue-400'}`}>{set.title}</h3>
                                <p className={`text-sm line-clamp-2 opacity-80 ${idx === 0 ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'}`}>{set.description}</p>
                            </div>
                            <div className="mt-6 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-white text-brand-blue' : 'bg-brand-blue text-white'}`}>{set.author.charAt(0)}</div>
                                <span className={`text-sm font-bold ${idx === 0 ? 'text-white' : 'text-gray-800 dark:text-gray-300'}`}>{set.author}</span>
                                <div className={`ml-auto flex items-center gap-1 text-xs ${idx === 0 ? 'text-blue-200' : 'text-gray-500'}`}><Play size={12} /> {set.plays}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      )}

      {/* CONTENT AREA */}
      <div>
        {/* Tab Files View */}
        {isLibrary && libraryTab === 'FILES' ? (
            <div className="space-y-4">
                {uploads && uploads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {uploads.map(file => (
                            <div key={file.id} onClick={() => onSelectUpload?.(file)} className="bg-white dark:bg-gray-855 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText size={24} />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white truncate mb-1">{file.fileName}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(file.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-800/30 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 mb-4"><ScanLine size={32} /></div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('dashboard.empty_library')}</h3>
                        <p className="text-sm text-gray-500 mb-6">{t('dashboard.empty_library_desc')}</p>
                        <button onClick={onCreateNew} className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm">{t('dashboard.upload_now')}</button>
                    </div>
                )}
            </div>
        ) : (
            <>
                {filteredSets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredSets.map(set => (
                            <div key={set.id} onClick={() => onSelectSet(set)} className="group bg-white dark:bg-gray-855 rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all duration-300 flex flex-col h-full relative overflow-hidden transition-colors">
                                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }} className={`absolute top-4 right-4 p-2.5 rounded-full z-10 transition-all ${set.isFavorite ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}><Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} /></button>
                                <div className="p-6 flex-1">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-1 rounded-lg bg-brand-blue/5 dark:bg-blue-400/10 text-brand-blue dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-transparent dark:border-blue-800/30">FLASHCARD</span>
                                        {renderSetTypeBadge(set.type)}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-blue transition-colors line-clamp-2 mb-3 leading-tight pr-6">{set.title}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 opacity-80 font-medium leading-relaxed">{set.description}</p>
                                </div>
                                <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/20 rounded-b-3xl flex items-center justify-between text-gray-500 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px] font-black shadow-sm">{set.author.charAt(0)}</div>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{set.author}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1"><Clock size={14} className="text-brand-blue dark:text-blue-400" /> {new Date(set.createdAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 dark:bg-gray-800/30 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 mb-6 transition-colors">
                            {libraryTab === 'FAVORITES' ? <Heart size={40} /> : <Layers size={40} />}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                            {libraryTab === 'FAVORITES' ? "Chưa có mục yêu thích" : t('dashboard.empty_library')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs text-center font-medium">
                            {libraryTab === 'FAVORITES' ? "Hãy nhấn trái tim ở các học phần bạn thích để xem lại nhanh tại đây." : t('dashboard.empty_library_desc')}
                        </p>
                        {libraryTab !== 'FAVORITES' && (
                            <button 
                                onClick={onCreateNew}
                                className="bg-brand-blue text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/20"
                            >
                                {t('dashboard.upload_now')}
                            </button>
                        )}
                    </div>
                )}
            </>
        )}
        
        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
            {isLoading && libraryTab === 'SETS' && <ThemeLoader size={32} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
