
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySet, AiGenerationRecord, User, QuizHistoryItem } from '../types';
import { Plus, Search, Book, Clock, Flame, Play, Loader2, Heart, AlertCircle, Sparkles, Keyboard, ScanLine, BookOpen, Trophy, Medal, Crown, History, ChevronRight, CheckCircle2, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { studySetService } from '../services/studySetService';
import { quizService } from '../services/quizService';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryTab, setLibraryTab] = useState<'SETS' | 'FAVORITES' | 'HISTORY'>('SETS');
  
  const [displaySets, setDisplaySets] = useState<StudySet[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchingTaskRef = useRef<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const trendingSets = useMemo(() => {
    return [...displaySets].slice(0, 3);
  }, [displaySets]);

  const fetchData = async (page: number, refresh: boolean = false) => {
      const taskKey = `${isLibrary ? 'LIB' : 'HOME'}-${libraryTab}-${page}`;
      if (fetchingTaskRef.current === taskKey) return;
      
      fetchingTaskRef.current = taskKey;
      if (page === 0) setIsInitialLoading(true);
      setIsLoading(true);
      
      try {
          if (libraryTab === 'HISTORY') {
              const response = await quizService.getMyQuizHistory(page, ITEMS_PER_PAGE);
              if (response.code === 1000) {
                  const { content, totalPages: total } = response.result;
                  if (refresh) setQuizHistory(content);
                  else setQuizHistory(prev => [...prev, ...content]);
                  setTotalPages(total);
              }
          } else {
              const response = isLibrary && libraryTab === 'SETS' 
                ? await studySetService.getMyStudySets(page, ITEMS_PER_PAGE)
                : await studySetService.getPublicStudySets(page, ITEMS_PER_PAGE);

              if (response.code === 1000) {
                  const { content, totalPages: total } = response.result;
                  const mappedSets: StudySet[] = content.map((item: any) => ({
                      id: item.id.toString(),
                      title: item.title,
                      description: item.description,
                      author: item.author || 'Thành viên',
                      createdAt: new Date(item.createdAt).getTime(),
                      privacy: item.privacy || 'PUBLIC',
                      subject: item.topic || 'Khác',
                      type: item.type,
                      status: item.status,
                      plays: item.plays || 0,
                      cards: []
                  }));

                  if (refresh) setDisplaySets(mappedSets);
                  else setDisplaySets(prev => [...prev, ...mappedSets]);
                  setTotalPages(total);
              }
          }
      } catch (error) {
          console.error("Failed to load data", error);
          addNotification("Không thể kết nối máy chủ", "error");
      } finally {
          setIsLoading(false);
          setIsInitialLoading(false);
      }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchData(0, true);
  }, [isLibrary, libraryTab]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    const hasMore = currentPage < totalPages - 1;
    
    observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isInitialLoading) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchData(nextPage);
        }
    });

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [currentPage, totalPages, isLoading, isInitialLoading, libraryTab]);

  const filteredSets = useMemo(() => {
    let base = displaySets;
    if (isLibrary && libraryTab === 'FAVORITES') {
        base = localSets.filter(s => s.isFavorite);
    }
    return base.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });
  }, [displaySets, localSets, searchQuery, isLibrary, libraryTab]);

  const formatTime = (totalSeconds: number) => {
      const safeSecs = totalSeconds || 0;
      const mins = Math.floor(safeSecs / 60);
      const secs = safeSecs % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  if (isInitialLoading) {
      return (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
              <ThemeLoader size={48} className="mb-4" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Đang kết nối thư viện...</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 animate-fade-in transition-colors">
      {!isLibrary && (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                            <Flame className="text-brand-orange animate-pulse" fill="currentColor" size={24} />
                        </div>
                        {t('dashboard.trending')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Top 3 học phần bùng nổ nhất tuần qua.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingSets.length > 0 ? trendingSets.map((set, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;
                    
                    const cardTheme = isTop1 
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 ring-4 ring-amber-100 dark:ring-amber-900/20'
                        : isTop2
                        ? 'bg-gradient-to-br from-slate-400 via-slate-500 to-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-900/10'
                        : 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 ring-4 ring-orange-50 dark:ring-orange-900/10';

                    return (
                        <div 
                            key={set.id} 
                            onClick={() => onSelectSet(set)} 
                            className={`group relative overflow-hidden rounded-[36px] p-7 cursor-pointer transition-all duration-500 shadow-xl hover:shadow-2xl border-transparent transform hover:-translate-y-2 flex flex-col justify-between min-h-[300px] text-white ${cardTheme}`}
                        >
                            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                {isTop1 ? <Crown size={220} /> : isTop2 ? <Trophy size={200} /> : <Medal size={180} />}
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            {isTop1 ? <Crown size={12} className="text-yellow-200" /> : isTop2 ? <Trophy size={12} /> : <Medal size={12} />}
                                            RANK {idx + 1}
                                        </div>
                                        {isTop1 && (
                                            <span className="bg-red-500 text-[9px] font-black px-2 py-0.5 rounded-lg animate-pulse tracking-widest">HOT</span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }} 
                                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all hover:scale-110 active:scale-90"
                                    >
                                        <Heart size={20} fill={set.isFavorite ? "white" : "none"} className={set.isFavorite ? 'text-white' : 'text-white/70'} />
                                    </button>
                                </div>

                                <h3 className="text-xl md:text-2xl font-black mb-3 line-clamp-2 leading-tight drop-shadow-sm">
                                    {set.title}
                                </h3>
                                
                                <p className="text-xs line-clamp-2 font-medium text-white/80 mb-6 leading-relaxed">
                                    {set.description}
                                </p>
                            </div>

                            <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-2xl bg-white text-brand-blue flex items-center justify-center text-xs font-black shadow-lg">
                                        {set.author.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="block text-xs font-bold truncate text-white">{set.author}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{set.subject}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-blue rounded-xl font-black text-[10px] shadow-lg transition-transform group-hover:scale-105">
                                    <Play size={12} fill="currentColor" /> {set.plays}
                                </div>
                            </div>
                        </div>
                    );
                }) : null}
            </div>
        </section>
      )}

      {isLibrary && (
          <div className="mb-10 flex flex-col md:flex-row gap-6 items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-8 transition-colors">
              <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-[22px] w-full md:w-auto overflow-x-auto custom-scrollbar scrollbar-hide">
                  <button onClick={() => setLibraryTab('SETS')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${libraryTab === 'SETS' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('dashboard.tab_sets')}</button>
                  <button onClick={() => setLibraryTab('FAVORITES')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${libraryTab === 'FAVORITES' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('dashboard.tab_favorites')}</button>
                  <button onClick={() => setLibraryTab('HISTORY')} className={`flex-1 md:flex-none px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap flex items-center gap-2 ${libraryTab === 'HISTORY' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}><History size={16}/> Lịch sử Quiz</button>
              </div>
              <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('dashboard.search_lib')} className="w-full pl-14 pr-5 py-4 rounded-[24px] bg-white dark:bg-gray-855 border-2 border-gray-100 dark:border-gray-800 focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/5 outline-none font-bold transition-all text-gray-900 dark:text-white" />
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 gap-10">
        {libraryTab === 'HISTORY' ? (
            <div className="animate-fade-in">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                    <History className="text-brand-blue" size={24} /> Lịch sử ôn luyện của bạn
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizHistory.map((item) => {
                        const scoreValue = item.totalScore ?? 0;
                        const scoreColor = scoreValue >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : scoreValue >= 50 ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20';
                        const displayDate = item.submittedAt ? new Date(item.submittedAt) : new Date();
                        
                        return (
                            <div key={item.attemptId} className="bg-white dark:bg-gray-855 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group flex flex-col justify-between min-h-[220px]">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-4 py-1 rounded-full text-lg font-black ${scoreColor}`}>
                                            {scoreValue.toFixed(0)}%
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{displayDate.toLocaleDateString()}</span>
                                            <span className="block text-[10px] font-bold text-gray-400">{displayDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-brand-blue transition-colors">{item.studySetTitle}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-500"/> {(item.correctCount ?? 0)}/{(item.totalQuestions ?? 0)} câu đúng</p>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Timer size={12} className="text-brand-blue"/> {formatTime(item.totalTimeSec)}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/quiz/review/${item.attemptId}/${item.studySetId}`)}
                                    className="mt-6 w-full py-3 bg-gray-50 dark:bg-gray-800 text-brand-blue dark:text-blue-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-brand-blue hover:text-white transition-all active:scale-95"
                                >
                                    Xem chi tiết bài làm <ChevronRight size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
                
                {quizHistory.length === 0 && !isLoading && (
                    <div className="text-center py-24 bg-white dark:bg-gray-855 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                        <History size={64} className="mx-auto text-gray-100 dark:text-gray-800 mb-6" />
                        <p className="text-gray-500 font-black text-lg">Bạn chưa tham gia Quiz nào.</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-6 bg-brand-blue text-white px-8 py-4 rounded-[20px] font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-blue/20">Luyện tập ngay</button>
                    </div>
                )}
            </div>
        ) : (
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                    <Book className="text-brand-blue" size={24} /> {isLibrary ? t('dashboard.library') : 'Khám phá học phần mới'}
                </h2>
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8`}>
                    {filteredSets.map(set => (
                        <div key={set.id} onClick={() => onSelectSet(set)} className="group bg-white dark:bg-gray-855 rounded-[32px] shadow-sm hover:shadow-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all duration-300 flex flex-col h-full relative overflow-hidden transition-colors">
                            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(set.id); }} className={`absolute top-4 right-4 p-3 rounded-2xl z-10 transition-all ${set.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20 scale-110 shadow-lg' : 'text-gray-300 dark:text-gray-600 hover:text-red-400 bg-gray-50 dark:bg-gray-800'}`}><Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} /></button>
                            <div className="p-7 flex-1">
                                <div className="flex flex-wrap gap-2 mb-5">
                                    <span className="px-3 py-1 rounded-xl bg-brand-blue/5 dark:bg-blue-400/10 text-brand-blue dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-brand-blue/10">QUIZ</span>
                                    <span className="px-3 py-1 rounded-xl bg-brand-orange/5 text-brand-orange text-[10px] font-black uppercase tracking-widest border border-brand-orange/10">{set.subject}</span>
                                    {isLibrary && (
                                        <>
                                            {renderSetTypeBadge(set.type)}
                                            {renderStatusBadge(set.status)}
                                        </>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-brand-blue transition-colors line-clamp-2 mb-4 leading-[1.3] pr-6">{set.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 font-medium leading-relaxed mb-6">{set.description}</p>
                            </div>
                            <div className="px-7 py-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between text-gray-500 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-2xl bg-brand-blue text-white flex items-center justify-center text-[10px] font-black shadow-md">{set.author.charAt(0)}</div>
                                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{set.author}</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-blue dark:text-blue-400" /> {new Date(set.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={loadMoreRef} className="h-32 flex items-center justify-center mt-12">
                    {isLoading && filteredSets.length > 0 && (
                        <div className="flex flex-col items-center gap-4 text-gray-400 font-black uppercase tracking-widest text-[10px]">
                            <ThemeLoader size={32} />
                            <span>Đang tải thêm...</span>
                        </div>
                    )}
                    {!isLoading && currentPage >= totalPages - 1 && filteredSets.length > 0 && (
                        <div className="w-full flex items-center justify-center gap-4">
                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Bạn đã xem hết thư viện</p>
                            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                        </div>
                    )}
                    {filteredSets.length === 0 && !isLoading && (
                        <div className="text-center py-24 w-full bg-white dark:bg-gray-855 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                            <AlertCircle size={64} className="mx-auto text-gray-100 dark:text-gray-800 mb-6" />
                            <p className="text-gray-500 font-black text-lg">{t('dashboard.no_results')}</p>
                            <button onClick={onCreateNew} className="mt-6 bg-brand-blue text-white px-8 py-4 rounded-[20px] font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-blue/20">{t('dashboard.upload_now')}</button>
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
