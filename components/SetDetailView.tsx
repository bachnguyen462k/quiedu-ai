
import React, { useState, useEffect, useRef } from 'react';
import { StudySet } from '../types';
import { ArrowLeft, Play, BookOpen, BarChart3, Star, Lock, Info, ShieldCheck, Share2, QrCode, X, Heart, Flag, Zap, Timer, Users, Languages, Layers, Loader2, MessageSquare, MessageCircle, ChevronDown, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { studySetService } from '../services/studySetService';
import { quizService } from '../services/quizService';
import { favoriteService } from '../services/favoriteService';
import ThemeLoader from './ThemeLoader';

interface SetDetailViewProps {
  set: StudySet; 
  onBack: () => void;
  onStartFlashcard: () => void;
  onStartQuiz: () => void;
  onToggleFavorite?: (setId: string) => void;
}

interface SetPreviewResponse {
  id: number;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  totalQuestions: number;
  durationMinutes: number;
  language: string;
  topic: string;
  totalAttempts: number;
  rating: number;
  successRate: number;
  hasFlashcards: boolean;
  hasQuiz: boolean;
  favorited: boolean;
}

interface Comment {
    id: number;
    studySetId: number;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string | null;
}

const SetDetailView: React.FC<SetDetailViewProps> = ({ set: metadata, onBack, onStartFlashcard, onStartQuiz, onToggleFavorite: localToggle }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  const { user } = useAuth();
  
  const [preview, setPreview] = useState<SetPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [copiedType, setCopiedType] = useState<'LINK' | 'CODE' | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(false);

  // State for Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [isLastCommentsPage, setIsLastCommentsPage] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const commentListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 350) setShowFloatingActions(true);
        else setShowFloatingActions(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!metadata.id) return;
    let ignore = false;
    const fetchPreviewData = async () => {
        setIsLoading(true);
        try {
            const response = await studySetService.getStudySetPreviewById(metadata.id);
            if (!ignore) {
                if (response.code === 1000) {
                    const data = response.result;
                    setPreview(data);
                    setIsFavorited(data.favorited || false);
                } else {
                    addNotification("Học phần không tồn tại hoặc đã bị xóa", "error");
                    onBack();
                }
            }
        } catch (error) {
            if (!ignore) {
                addNotification("Không thể kết nối đến máy chủ", "error");
                onBack();
            }
        } finally {
            if (!ignore) setIsLoading(false);
        }
    };

    fetchPreviewData();
    fetchComments(0, true);

    return () => { ignore = true; };
  }, [metadata.id, onBack, addNotification]); 

  const fetchComments = async (page: number, refresh: boolean = false) => {
    if (!metadata.id) return;
    setCommentsLoading(true);
    try {
        const response = await quizService.getComments(metadata.id, page, 5);
        if (response.result) {
            const { content, last, totalElements } = response.result;
            if (refresh) setComments(content);
            else setComments(prev => [...prev, ...content]);
            setIsLastCommentsPage(last);
            setTotalComments(totalElements);
        }
    } catch (err) {
        console.error("Failed to load comments", err);
    } finally {
        setCommentsLoading(false);
    }
  };

  const handleLoadMoreComments = () => {
      const nextPage = commentsPage + 1;
      setCommentsPage(nextPage);
      fetchComments(nextPage);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
        const response = await quizService.addComment(metadata.id, newComment);
        if (response.code === 1000) {
            addNotification("Đã gửi bình luận!", "success");
            setNewComment('');
            // Thêm bình luận mới vào danh sách và cuộn xuống cuối nếu cần
            setComments(prev => [...prev, response.result]);
            setTotalComments(prev => prev + 1);
            
            // Scroll list to bottom to see new comment
            setTimeout(() => {
                if (commentListRef.current) {
                    commentListRef.current.scrollTop = commentListRef.current.scrollHeight;
                }
            }, 100);
        }
    } catch (error) {
        addNotification("Không thể gửi bình luận", "error");
    } finally {
        setIsSubmittingComment(false);
    }
  };

  const handleFavoriteClick = async () => {
      if (isTogglingFavorite) return;
      setIsTogglingFavorite(true);
      try {
          const response = await favoriteService.toggleFavorite(metadata.id);
          if (response.code === 1000) {
              const newStatus = response.result;
              setIsFavorited(newStatus);
              addNotification(newStatus ? t('notifications.favorite_added') : t('notifications.favorite_removed'), 'success');
              if (localToggle) localToggle(metadata.id);
          }
      } catch (err) {
          addNotification("Lỗi cập nhật yêu thích", "error");
      } finally {
          setIsTogglingFavorite(false);
      }
  };

  if (isLoading || !preview) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in px-6 text-center">
              <ThemeLoader size={48} className="mb-4" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-[10px] md:text-xs">Đang chuẩn bị học phần...</p>
          </div>
      );
  }

  const formattedDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
  const shareUrl = `${window.location.origin}/#/set/${preview.id}`;
  const shareCode = `QZ-${preview.id.toString().toUpperCase()}`;

  const handleCopy = (text: string, type: 'LINK' | 'CODE') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 relative animate-fade-in pb-32 lg:pb-8 transition-colors">
      {/* Floating Bottom Bar for Mobile */}
      <div className={`fixed bottom-0 left-0 right-0 z-[110] p-4 lg:hidden transition-all duration-500 transform ${showFloatingActions ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95 pointer-events-none'}`}>
          <div className="bg-white/95 dark:bg-gray-855 border border-brand-blue/20 dark:border-gray-800 shadow-2xl rounded-[32px] p-3 flex gap-3 backdrop-blur-md">
              <button onClick={onStartFlashcard} className="flex-1 py-4 px-2 rounded-2xl font-black text-xs text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-800 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <BookOpen size={16} /> Flashcard
              </button>
              <button onClick={onStartQuiz} className="flex-[1.5] py-4 px-2 bg-brand-blue text-white rounded-2xl font-black text-xs shadow-lg shadow-brand-blue/25 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <BarChart3 size={16} /> Kiểm tra ngay
              </button>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-brand-blue dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-black uppercase text-[10px] md:text-xs tracking-widest"><ArrowLeft size={18} /> {t('set_detail.back_library')}</button>
        <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
            <button className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-red-600 dark:bg-gray-800 dark:border-gray-700 transition-colors" title={t('set_detail.report_btn')}><Flag size={20} /></button>
            <button
                onClick={handleFavoriteClick}
                disabled={isTogglingFavorite}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 font-black text-sm transition-all ${
                    isFavorited 
                    ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-900/20' 
                    : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}
            >
                {isTogglingFavorite ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={isFavorited ? "currentColor" : "none"} />}
                {isFavorited ? t('set_detail.liked') : t('set_detail.like')}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white dark:bg-gray-855 p-6 md:p-10 rounded-[32px] md:rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 transition-colors relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                    <span className="bg-brand-blue/10 text-brand-blue px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest">{preview.topic || 'Tổng hợp'}</span>
                    <span className="bg-orange-100 text-brand-orange px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor" /> {preview.totalQuestions} Câu hỏi</span>
                </div>
                <h1 className="text-2xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 md:mb-6 leading-tight">{preview.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-xl mb-8 md:mb-10 leading-relaxed font-medium">{preview.description || 'Không có mô tả cho học phần này.'}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col gap-1 min-w-0"><span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Người tạo</span><span className="font-bold text-gray-900 dark:text-white truncate text-sm">{preview.createdBy}</span></div>
                    <div className="flex flex-col gap-1"><span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Số câu hỏi</span><div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 text-sm"><Layers size={14} className="text-brand-orange" /> {preview.totalQuestions}</div></div>
                    <div className="flex flex-col gap-1"><span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày tạo</span><span className="font-bold text-gray-700 dark:text-gray-300 text-sm">{formattedDate(preview.createdAt)}</span></div>
                    <div className="flex flex-col gap-1"><span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Lượt thi</span><div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 text-sm"><Users size={14} className="text-brand-blue" /> {preview.totalAttempts || 0}</div></div>
                </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 transition-colors">
            <h3 className="font-black text-indigo-900 dark:text-indigo-300 mb-6 flex items-center gap-3 uppercase tracking-tighter text-base md:text-lg"><Info size={24} /> {t('set_detail.info_title')}</h3>
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-white dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3"><Timer className="text-brand-blue" size={20} /><span className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Thời gian</span></div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Khoảng <span className="text-brand-blue font-black">{preview.durationMinutes || 15} phút</span> để hoàn thành.</p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-white dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3"><ShieldCheck className="text-brand-orange" size={20} /><span className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Kiểm duyệt</span></div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">Nội dung đã được xác thực bởi <span className="text-brand-orange font-black">AI System</span>.</p>
                </div>
            </div>
          </div>

          {/* Comments Section with scrollable list and sticky input */}
          <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] border border-gray-100 dark:border-gray-800 transition-colors flex flex-col relative max-h-[800px] overflow-hidden">
              {/* Header */}
              <div className="p-6 md:p-10 pb-4 border-b border-gray-50 dark:border-gray-800 bg-white dark:bg-gray-855 shrink-0 z-10">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter text-base md:text-lg">
                        <MessageSquare size={24} className="text-brand-blue" /> {t('set_detail.comments_title')} 
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-0.5 rounded-lg text-xs">{totalComments}</span>
                    </h3>
                  </div>
              </div>

              {/* Scrollable Comment List */}
              <div 
                ref={commentListRef}
                className="flex-1 overflow-y-auto p-6 md:px-10 space-y-8 custom-scrollbar bg-white dark:bg-gray-855"
              >
                  {comments.length === 0 && !commentsLoading ? (
                      <div className="text-center py-20">
                          <MessageCircle size={48} className="mx-auto text-gray-100 dark:text-gray-800 mb-4" />
                          <p className="text-gray-400 font-medium">{t('set_detail.no_comments')}</p>
                      </div>
                  ) : (
                      <>
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group animate-fade-in items-start">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-black text-xs shrink-0 shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userId)}&background=random`} alt="AV" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="inline-block bg-gray-100 dark:bg-gray-800/80 px-4 py-2.5 rounded-[20px] max-w-full shadow-sm">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-black text-gray-900 dark:text-white text-[13px] hover:underline cursor-pointer">{comment.userId}</span>
                                            </div>
                                            <div className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed font-medium break-words">
                                                {comment.content}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1.5 ml-3">
                                            <button className="text-[11px] font-black text-gray-500 hover:text-brand-blue transition-colors">Thích</button>
                                            <button className="text-[11px] font-black text-gray-500 hover:text-brand-blue transition-colors">Phản hồi</button>
                                            <span className="text-[10px] font-medium text-gray-400">{formattedDate(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {!isLastCommentsPage && (
                            <button 
                                onClick={handleLoadMoreComments}
                                disabled={commentsLoading}
                                className="w-full py-4 text-gray-500 font-black text-[11px] uppercase tracking-wider hover:text-brand-blue flex items-center justify-center gap-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl"
                            >
                                {commentsLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                                Xem thêm bình luận
                            </button>
                        )}
                        {commentsLoading && commentsPage > 0 && <div className="flex justify-center p-4"><ThemeLoader size={24} /></div>}
                      </>
                  )}
              </div>

              {/* Sticky Input Footer inside the comment box */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-gray-855/95 backdrop-blur-sm border-t border-gray-50 dark:border-gray-800 p-4 md:px-10 md:py-6 shadow-[0_-10px_25px_-10px_rgba(0,0,0,0.05)] z-20 shrink-0">
                    <div className="flex gap-3 items-end">
                        <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md mb-1 border border-brand-blue/20">
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800/80 rounded-[24px] px-4 py-2 flex flex-col focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:bg-white dark:focus-within:bg-gray-750 transition-all border border-transparent focus-within:border-brand-blue/10">
                            <textarea 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận..."
                                className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-gray-900 dark:text-white placeholder-gray-500 resize-none min-h-[40px] py-1.5 custom-scrollbar"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                            />
                            <div className="flex justify-between items-center mt-1 pt-1 pb-0.5">
                                <div className="flex gap-0.5">
                                    <button className="p-1.5 text-gray-400 hover:text-brand-blue transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ImageIcon size={18}/></button>
                                    <button className="p-1.5 text-gray-400 hover:text-brand-blue transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Smile size={18}/></button>
                                </div>
                                <button 
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim() || isSubmittingComment}
                                    className={`p-1.5 rounded-full transition-all ${newComment.trim() ? 'text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-90' : 'text-gray-300 dark:text-gray-600'}`}
                                >
                                    {isSubmittingComment ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="ml-12 mt-2 text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Nhấn Enter để gửi bình luận</p>
              </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-855 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-xl md:shadow-2xl border border-brand-blue/10 dark:border-gray-800 sticky top-20 md:top-24 transition-colors">
                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-6 md:mb-8 flex items-center gap-2"><Play className="text-brand-blue fill-brand-blue" size={20} /> Sẵn sàng chưa?</h3>
                <div className="space-y-4 md:space-y-5">
                    <button onClick={onStartFlashcard} className="w-full group p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 border-gray-100 dark:border-gray-800 hover:border-brand-blue dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-4 md:gap-5 text-left active:scale-95">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-brand-blue group-hover:text-white transition-colors flex items-center justify-center shrink-0"><BookOpen size={24} /></div>
                        <div className="min-w-0">
                            <span className="block font-black text-gray-900 dark:text-white text-base md:text-lg group-hover:text-brand-blue truncate">{t('set_detail.mode_flashcard')}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter line-clamp-1">{t('set_detail.mode_flashcard_desc')}</span>
                        </div>
                    </button>
                    <button onClick={onStartQuiz} className="w-full group p-4 md:p-5 rounded-2xl md:rounded-3xl bg-brand-blue text-white shadow-xl shadow-brand-blue/25 hover:bg-blue-700 transition-all flex items-center gap-4 md:gap-5 text-left transform hover:-translate-y-1 active:scale-95">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><BarChart3 size={24} /></div>
                        <div className="min-w-0">
                            <span className="block font-black text-lg md:text-xl truncate">{t('set_detail.mode_quiz')}</span>
                            <span className="text-blue-100 text-[10px] font-bold uppercase tracking-tighter line-clamp-1">{t('set_detail.mode_quiz_desc')}</span>
                        </div>
                    </button>
                </div>
                <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Share2 size={12} /> Chia sẻ với bạn bè</p>
                    <div className="flex gap-2">
                        <div onClick={() => handleCopy(shareCode, 'CODE')} className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-center cursor-pointer border border-transparent hover:border-brand-blue transition-all group relative">
                            <span className="text-[8px] text-gray-400 font-black block mb-0.5 tracking-tighter">MÃ MỜI</span>
                            <span className="font-black text-xs text-brand-blue tracking-widest uppercase">{shareCode}</span>
                            {copiedType === 'CODE' && <div className="absolute inset-0 bg-brand-blue rounded-2xl flex items-center justify-center text-[10px] text-white font-black animate-fade-in">ĐÃ COPY!</div>}
                        </div>
                        <button onClick={() => setShowQrModal(true)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-brand-blue text-gray-400 hover:text-brand-blue transition-all"><QrCode size={24} /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowQrModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-2xl max-w-sm w-full flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={24} /></button>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Quét mã QR</h3>
                <div className="bg-white p-4 rounded-3xl border-4 border-brand-blue/5 my-6 overflow-hidden"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`} alt="QR" className="w-48 h-48" /></div>
                <div className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-black mb-1">MÃ THAM GIA</p>
                    <p className="text-xl font-black text-brand-blue tracking-widest uppercase">{shareCode}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetDetailView;
