
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StudySet, AiGenerationRecord, User, QuizHistoryItem } from '../types';
import { Search, Book, Clock, Flame, Play, Heart, AlertCircle, Sparkles, Keyboard, ScanLine, BookOpen, Trophy, Medal, Crown, History, ChevronRight, Timer, Calendar as CalendarIcon, Megaphone, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { studySetService } from '../services/studySetService';
import { quizService } from '../services/quizService';
import { favoriteService } from '../services/favoriteService';
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

const FAKE_NOTIFICATIONS = [
  "🎉 Chúc mừng bạn Minh Anh vừa đạt 100/100 điểm Quiz Sinh học 12!",
  "🚀 Hệ thống vừa cập nhật thêm 500 câu hỏi ôn thi THPT Quốc gia mới.",
  "✨ Tính năng 'AI Soạn Giáo Án' đã hỗ trợ tệp Word (.docx) mượt mà hơn."
];

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

  // Ref để khóa việc gọi API trùng lặp và ghi nhớ tham số cuối
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef("");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const trendingSets = useMemo(() => {
    return [...displaySets].slice(0, 3);
  }, [displaySets]);

  const fetchData = async (page: number, refresh: boolean = false, abortSignal?: { ignored: boolean }) => {
      const fetchKey = `${isLibrary}-${libraryTab}-${page}-${refresh}`;
      
      // Chống gọi trùng lặp cùng một tham số trong thời gian ngắn (đặc biệt cho StrictMode)
      if (isFetchingRef.current && !refresh) return;
      if (lastFetchKeyRef.current === fetchKey && !refresh) return;

      isFetchingRef.current = true;
      lastFetchKeyRef.current = fetchKey;

      if (page === 0) {
          setIsInitialLoading(true);
          if (refresh) {
              setDisplaySets([]);
              setQuizHistory([]);
          }
      }
      setIsLoading(true);
      
      try {
          let response: any;
          if (libraryTab === 'HISTORY') {
              response = await quizService.getMyQuizHistory(page, ITEMS_PER_PAGE);
              if (response.code === 1000 && !abortSignal?.ignored) {
                  const { content, totalPages: total } = response.result;
                  if (refresh) setQuizHistory(content);
                  else setQuizHistory(prev => [...prev, ...content]);
                  setTotalPages(total);
              }
          } else if (libraryTab === 'FAVORITES') {
              response = await favoriteService.getFavorites(page, ITEMS_PER_PAGE);
              if (response.code === 1000 && !abortSignal?.ignored) {
                  const { content, totalPages: total } = response.result;
                  const mappedSets = content.map((item: any) => ({
                      id: item.studySet.id.toString(),
                      title: item.studySet.title,
                      description: item.studySet.description || "",
                      author: item.studySet.author || 'Thành viên',
                      createdAt: new Date(item.studySet.createdAt).getTime(),
                      privacy: item.studySet.privacy || 'PUBLIC',
                      subject: item.studySet.topic || 'Khác',
                      isFavorite: true,
                      type: item.studySet.type,
                      status: item.studySet.status,
                      totalAttempts: item.studySet.totalAttempts ?? 0,
                      totalComments: item.studySet.totalComments ?? 0,
                      cards: []
                  }));
                  if (refresh) setDisplaySets(mappedSets);
                  else setDisplaySets(prev => [...prev, ...mappedSets]);
                  setTotalPages(total);
              }
          } else {
              response = isLibrary && libraryTab === 'SETS' 
                ? await studySetService.getMyStudySets(page, ITEMS_PER_PAGE)
                : await studySetService.getPublicStudySets(page, ITEMS_PER_PAGE);

              if (response.code === 1000 && !abortSignal?.ignored) {
                  const { content, totalPages: total } = response.result;
                  const mappedSets = content.map((item: any) => ({
                      id: item.id.toString(),
                      title: item.title,
                      description: item.description || "",
                      author: item.author || 'Thành viên',
                      createdAt: new Date(item.createdAt).getTime(),
                      privacy: item.privacy || 'PUBLIC',
                      subject: item.topic || 'Khác',
                      isFavorite: item.favorited || false,
                      type: item.type,
                      status: item.status,
                      totalAttempts: item.totalAttempts ?? 0,
                      totalComments: item.totalComments ?? 0,
                      cards: []
                  }));
                  if (refresh) setDisplaySets(mappedSets);
                  else setDisplaySets(prev => [...prev, ...mappedSets]);
                  setTotalPages(total);
              }
          }
      } catch (error) {
          console.error("Dashboard fetch error:", error);
      } finally {
          if (!abortSignal?.ignored) {
              setIsLoading(false);
              setIsInitialLoading(false);
          }
          isFetchingRef.current = false;
      }
  };

  useEffect(() => {
    const signal = { ignored: false };
    setCurrentPage(0);
    fetchData(0, true, signal);
    return () => { signal.ignored = true; };
  }, [isLibrary, libraryTab]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && currentPage < totalPages - 1 && !isLoading && !isInitialLoading) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchData(nextPage);
        }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [currentPage, totalPages, isLoading, isInitialLoading]);

  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return displaySets;
    return displaySets.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [displaySets, searchQuery]);

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
          <div className="flex flex-col items-center justify-center py-32">
              <ThemeLoader size={48} className="mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Đang kết nối thư viện...</p>
          </div>
      );
  }

  const handleDashboardToggleFavorite = async (setId: string) => {
    await onToggleFavorite(setId);
    if (libraryTab === 'FAVORITES') {
        setDisplaySets(prev => prev.filter(s => s.id !== setId));
    } else {
        setDisplaySets(prev => prev.map(s => s.id === setId ? { ...s, isFavorite: !s.isFavorite } : s));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 animate-fade-in transition-colors">
      {!isLibrary && (
        <section className="mb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="shrink-0">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
                            <Flame className="text-brand-orange animate-pulse" fill="currentColor" size={24} />
                        </div>
                        {t('dashboard.trending')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Top 3 học phần bùng nổ nhất tuần qua.</p>
                </div>

                <div className="flex-1 min-w-0 max-w-2xl bg-gray-100 dark:bg-gray-800/50 rounded-2xl h-12 flex items-center px-4 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-100 dark:from-gray-800 to-transparent z-10"></div>
                    <div className="shrink-0 mr-3 text-brand-blue flex items-center gap-2 z-20">
                        <Megaphone size={18} className="animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Tin mới:</span>
                    </div>
                    <div className="overflow-hidden flex-1 relative h-full flex items-center">
                        <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
                            {FAKE_NOTIFICATIONS.map((note, i) => (
                                <span key={i} className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-tight flex items-center gap-3">
                                    {note}
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-orange"></div>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {trendingSets.length > 0 && trendingSets.map((set, idx) => {
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const cardTheme = isTop1 
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 ring-4 ring-amber-100 dark:ring-amber-900/20'
                        : isTop2
                        ? 'bg-gradient-to-br from-slate-400 via-slate-500 to-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-900/10'
                        : 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 ring-4 ring-orange-50 dark:ring-orange-900/10';

                    return (
                        <div 
                            key={set.id} 
                            onClick={() => onSelectSet(set)} 
                            className={`group relative overflow-hidden rounded-[32px] md:rounded-[36px] p-6 md:p-7 cursor-pointer transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 flex flex-col justify-between min-h-[280px] md:min-h-[300px] text-white ${cardTheme}`}
                        >
                            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                {isTop1 ? <Crown size={220} /> : isTop2 ? <Trophy size={200} /> : <Medal size={180} />}
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        {isTop1 ? <Crown size={12} className="text-yellow-200" /> : isTop2 ? <Trophy size={12} /> : <Medal size={12} />}
                                        RANK {idx + 1}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDashboardToggleFavorite(set.id); }} 
                                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all hover:scale-110 active:scale-90"
                                    >
                                        <Heart size={20} fill={set.isFavorite ? "white" : "none"} className={set.isFavorite ? 'text-white' : 'text-white/70'} />
                                    </button>
                                </div>
                                <h3 className="text-xl md:text-2xl font-black mb-3 line-clamp-2 leading-tight drop-shadow-sm">{set.title}</h3>
                                <p className="text-xs line-clamp-2 font-medium text-white/80 mb-6 leading-relaxed">{set.description}</p>
                            </div>
                            <div className="relative z-10 pt-5 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-9 h-9 rounded-2xl bg-white text-brand-blue flex items-center justify-center text-xs font-black shadow-lg shrink-0">{set.author.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <span className="block text-xs font-bold truncate text-white">{set.author}</span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60 truncate block">{set.subject}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-blue rounded-xl font-black text-[10px] shadow-lg shrink-0">
                                    <Play size={12} fill="currentColor" /> {set.totalAttempts || 0}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
      )}

      {isLibrary && (
          <div className="mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-8 transition-colors">
              <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800 rounded-[22px] w-full lg:w-auto overflow-x-auto scrollbar-hide">
                  <button onClick={() => setLibraryTab('SETS')} className={`flex-1 lg:flex-none px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${libraryTab === 'SETS' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('dashboard.tab_sets')}</button>
                  <button onClick={() => setLibraryTab('FAVORITES')} className={`flex-1 lg:flex-none px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${libraryTab === 'FAVORITES' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('dashboard.tab_favorites')}</button>
                  <button onClick={() => setLibraryTab('HISTORY')} className={`flex-1 lg:flex-none px-6 py-3 rounded-2xl text-sm font-black transition-all whitespace-nowrap flex items-center gap-2 ${libraryTab === 'HISTORY' ? 'bg-white dark:bg-gray-700 text-brand-blue dark:text-blue-400 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}><History size={16}/> Lịch sử Quiz</button>
              </div>
              <div className="relative w-full lg:w-96 group">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizHistory.map((item) => (
                        <div key={item.attemptId} className="bg-white dark:bg-gray-855 p-5 md:p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all group flex flex-col justify-between min-h-[220px]">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-4 py-1 rounded-full text-lg font-black ${item.totalScore >= 80 ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                                        {item.totalScore?.toFixed(0)}%
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(item.submittedAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-brand-blue transition-colors">{item.studySetTitle}</h3>
                                <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5"><Timer size={12} className="text-brand-blue"/> {formatTime(item.totalTimeSec)}</p>
                            </div>
                            <button onClick={() => navigate(`/quiz/review/${item.attemptId}/${item.studySetId}`)} className="mt-6 w-full py-3 bg-gray-50 dark:bg-gray-800 text-brand-blue dark:text-blue-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-brand-blue hover:text-white transition-all active:scale-95">Xem chi tiết bài làm <ChevronRight size={14} /></button>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                        <Book className="text-brand-blue" size={24} /> {isLibrary ? t('dashboard.library') : 'Khám phá học phần mới'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {filteredSets.map(set => (
                            <div key={set.id} onClick={() => onSelectSet(set)} className="group bg-white dark:bg-gray-855 rounded-[32px] shadow-sm hover:shadow-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-brand-blue transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                                <button onClick={(e) => { e.stopPropagation(); handleDashboardToggleFavorite(set.id); }} className={`absolute top-4 right-4 p-3 rounded-2xl z-10 transition-all ${set.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-900/20 scale-110 shadow-lg' : 'text-gray-300 dark:text-gray-600 hover:text-red-400 bg-gray-50 dark:bg-gray-800'}`}><Heart size={20} fill={set.isFavorite ? "currentColor" : "none"} /></button>
                                <div className="p-6 md:p-7 flex-1">
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="px-3 py-1 rounded-xl bg-brand-blue/5 text-brand-blue text-[10px] font-black uppercase tracking-widest border border-brand-blue/10">QUIZ</span>
                                        {isLibrary && (
                                            <>
                                                {renderSetTypeBadge(set.type)}
                                                {renderStatusBadge(set.status)}
                                            </>
                                        )}
                                    </div>
                                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white group-hover:text-brand-blue transition-colors line-clamp-2 mb-4 leading-[1.3] pr-6">{set.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 font-medium leading-relaxed mb-6">{set.description}</p>
                                </div>
                                <div className="px-6 md:px-7 py-5 md:py-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between text-gray-500 mt-auto">
                                    <div className="flex flex-col gap-2 min-w-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-2xl bg-brand-blue text-white flex items-center justify-center text-[10px] font-black shadow-md shrink-0">{set.author.charAt(0)}</div>
                                            <span className="text-xs font-black text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{set.author}</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"><Clock size={14} className="text-brand-blue" /> {new Date(set.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <div className="flex gap-4">
                                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-blue"><Play size={14} fill="currentColor" /> {set.totalAttempts || 0} lượt làm</span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-500"><MessageSquare size={14} fill="currentColor" className="opacity-20" /> {set.totalComments || 0} bình luận</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div ref={loadMoreRef} className="h-32 flex items-center justify-center mt-12">
                        {isLoading && <ThemeLoader size={32} />}
                        {!isLoading && currentPage >= totalPages - 1 && filteredSets.length > 0 && (
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Bạn đã xem hết thư viện</p>
                        )}
                    </div>
                </div>

                {!isLibrary && (
                    <div className="lg:w-80 shrink-0">
                        <div className="bg-white dark:bg-gray-855 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl p-6 md:p-8 sticky top-24 transition-colors">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase text-[10px] tracking-widest"><CalendarIcon size={18} className="text-brand-blue" /> Lịch nhắc hôm nay</h3>
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            </div>
                            <button onClick={() => navigate('/schedule')} className="w-full mt-8 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-brand-blue rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 shadow-sm">Xem toàn bộ lịch <ChevronRight size={12} /></button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
