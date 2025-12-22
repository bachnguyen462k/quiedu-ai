
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySet, AiGenerationRecord, User, Review } from '../types';
/* Added BookOpen to the lucide-react imports to fix 1-based line error at 163 */
import { Plus, Search, ArrowUpRight, Book, Clock, Flame, Play, Loader2, FileText, Layers, ChevronRight, Heart, MessageSquare, Star, AlertCircle, Sparkles, Keyboard, ScanLine, BookOpen } from 'lucide-react';
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

  /* Defined trendingSets to fix 1-based line error at 186 */
  const trendingSets = useMemo(() => {
    return [...localSets].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 3);
  }, [localSets]);

  /* Defined recentReviews to fix 1-based line errors at 344, 348 */
  const recentReviews = useMemo(() => {
    const allReviews: (Review & { setId: string; setTitle: string })[] = [];
    localSets.forEach(set => {
      if (set.reviews) {
        set.reviews.forEach(review => {
          allReviews.push({ ...review, setId: set.id, setTitle: set.title });
        });
      }
    });
    return allReviews.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  }, [localSets]);

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
                  type: item.type, // Map trường type từ server
                  status: item.status, // Map trường status từ server
                  plays: 0,
                  cards: []
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

  useEffect(() => {
    if (isLibrary && libraryTab === 'SETS') {
        setCurrentPage(0);
        fetchMySets(0, true);
    } else {
        setIsInitialLoading(false);
    }
  }, [isLibrary, libraryTab]);

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

  const filteredSets = useMemo(() => {
    let base = isLibrary && libraryTab === 'SETS' ? serverSets : localSets;
    if (isLibrary && currentUser) {
        if (libraryTab === 'FAVORITES') base = localSets.filter(s => s.isFavorite);
    }
    let result = [...base].filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = filterSubject === 'all' || s.subject?.toLowerCase().includes(filterSubject.toLowerCase());
        return matchesSearch && matchesSubject;
    });
    if (sortBy === 'POPULAR') result.sort((a, b) => (b.plays || 0) - (a.plays || 0));
    else result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  }, [serverSets, localSets, searchQuery, filterSubject, sortBy, isLibrary, libraryTab, currentUser]);

  const filteredUploads = useMemo(() => {
      if (!uploads) return [];
      return uploads.filter(u => u.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || u.result.subject.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => b.createdAt - a.createdAt);
  }, [uploads, searchQuery]);

  const isShowingFiles = isLibrary && libraryTab === 'FILES';

  const renderSetTypeBadge = (type?: string) => {
      switch (type) {
          case 'MANUAL': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md"><Keyboard size={10}/> Thủ công</span>;
          case 'AI_TOPIC': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-md"><Sparkles size={10}/> AI Chủ đề</span>;
          case 'AI_FILE': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md"><ScanLine size={10}/> AI Quét file</span>;
          case 'AI_TEXTBOOK': return <span className="flex items-center gap-1 text-[9px] font-black uppercase text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded-md"><BookOpen size={10}/> AI Giáo án</span>;
          default: return null;
      }
  };

  const renderStatusBadge = (status?: string) => {
      if (!status) return null;
      const isDraft = status === 'DRAFT';
      return (
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
              isDraft 
              ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border dark:border-gray-600' 
              : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 border dark:border-green-800/30'
          }`}>
              {isDraft ? 'Bản nháp' : 'Hoạt động'}
          </span>
      );
  };

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
                    <div key={set.id} onClick={() => onSelectSet(set)} className={`relative overflow-hidden rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-800 cursor-pointer hover:shadow-xl transition-all group ${idx === 0 ? 'bg-gradient-to-br from-brand-blue to-blue-800 text-white border-transparent' : 'bg-white dark:bg-gray-855'}`}>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${idx === 0 ? 'bg-white/20 text-white' : 'bg-brand-orange/10 text-brand-orange'}`}>HOT</span>
                                        {renderStatusBadge(set.status)}
                                    </div>
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

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10 items-start">
        <div className={!isLibrary ? "xl:col-span-3" : "xl:col-span-4"}>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${!isLibrary ? 'lg:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'} gap-8 mt-8`}>
                {filteredSets.map(set => (
                    <div key={set.id} onClick={() => onSelectSet(set)} className="group bg-white dark:bg-gray-855 rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all duration-300 flex flex-col h-full relative overflow-hidden transition-colors">
                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }} className={`absolute top-4 right-4 p-2.5 rounded-full z-10 transition-all ${set.isFavorite ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'}`}><Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} /></button>
                        <div className="p-6 flex-1">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2 py-1 rounded-lg bg-brand-blue/5 dark:bg-blue-400/10 text-brand-blue dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-transparent dark:border-blue-800/30">FLASHCARD</span>
                                <span className="px-2 py-1 rounded-lg bg-brand-orange/5 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-transparent dark:border-orange-800/30">{set.subject}</span>
                                {renderSetTypeBadge(set.type)}
                                {renderStatusBadge(set.status)}
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
