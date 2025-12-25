
import React, { useState, useEffect, useRef } from 'react';
import { StudySet } from '../types';
import { ArrowLeft, Play, BookOpen, BarChart3, Star, Info, ShieldCheck, Share2, QrCode, X, Heart, Flag, Zap, Timer, Users, Layers, Loader2, MessageSquare, MessageCircle, ChevronDown, Send, Smile } from 'lucide-react';
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
    if (!metadata.id) return;
    let ignore = false;
    
    const fetchPreviewData = async () => {
        setIsLoading(true);
        try {
            const response = await studySetService.getStudySetPreviewById(metadata.id);
            if (!ignore && response.code === 1000) {
                setPreview(response.result);
                setIsFavorited(response.result.favorited || false);
            }
        } catch (error) {
            console.error("Fetch preview error", error);
        } finally {
            if (!ignore) setIsLoading(false);
        }
    };

    fetchPreviewData();
    fetchComments(0, true);

    return () => { ignore = true; };
  }, [metadata.id]); 

  const fetchComments = async (page: number, refresh: boolean = false) => {
    if (!metadata.id || (commentsLoading && !refresh)) return;
    setCommentsLoading(true);
    try {
        const response = await quizService.getComments(metadata.id, page, 5);
        if (response.result) {
            const { content, last, totalElements } = response.result;
            if (refresh) {
                setComments(content);
            } else {
                setComments(prev => [...prev, ...content]);
            }
            setIsLastCommentsPage(last);
            setTotalComments(totalElements);
            setCommentsPage(page);
        }
    } catch (err) {
        console.error("Failed to load comments", err);
    } finally {
        setCommentsLoading(false);
    }
  };

  const handleLoadMoreComments = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (commentsLoading) return;
      fetchComments(commentsPage + 1);
  };

  const handlePostComment = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    // Ngăn chặn triệt để hành vi mặc định (load trang)
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
        const response = await quizService.addComment(metadata.id, newComment);
        if (response.code === 1000) {
            const postedComment = response.result;
            setNewComment('');
            
            // Cập nhật danh sách local để hiển thị ngay mà không load lại trang
            setComments(prev => [...prev, postedComment]);
            setTotalComments(prev => prev + 1);
            
            // Cuộn mượt xuống cuối danh sách (trong ô cuộn)
            setTimeout(() => {
                if (commentListRef.current) {
                    commentListRef.current.scrollTo({
                        top: commentListRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
            
            addNotification("Đã đăng bình luận!", "success");
        }
    } catch (error) {
        addNotification("Không thể gửi bình luận", "error");
    } finally {
        setIsSubmittingComment(false);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isTogglingFavorite) return;
      setIsTogglingFavorite(true);
      try {
          const response = await favoriteService.toggleFavorite(metadata.id);
          if (response.code === 1000) {
              setIsFavorited(response.result);
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
          <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
              <ThemeLoader size={48} className="mb-4" />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Đang tải học phần...</p>
          </div>
      );
  }

  const formattedDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
  const shareUrl = `${window.location.origin}/#/set/${preview.id}`;
  const shareCode = `QZ-${preview.id.toString().toUpperCase()}`;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in transition-colors">
      <div className="flex justify-between items-center gap-4 mb-8">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-brand-blue font-black uppercase text-[10px] md:text-xs tracking-widest transition-colors">
            <ArrowLeft size={18} /> {t('set_detail.back_library')}
        </button>
        <div className="flex gap-2">
            <button
                type="button"
                onClick={handleFavoriteClick}
                disabled={isTogglingFavorite}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-black text-sm transition-all ${
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card */}
          <div className="bg-white dark:bg-gray-855 p-6 md:p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{preview.topic || 'Tổng hợp'}</span>
                    <span className="bg-orange-100 text-brand-orange px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor" /> {preview.totalQuestions} Câu hỏi</span>
                </div>
                <h1 className="text-2xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight">{preview.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base md:text-xl font-medium leading-relaxed">{preview.description || 'Học phần này hiện chưa có mô tả chi tiết.'}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 mt-10 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Người tạo</span><span className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{preview.createdBy}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Ngày tạo</span><span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{formattedDate(preview.createdAt)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Số lượt thi</span><span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{preview.totalAttempts}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase mb-1">Đánh giá</span><div className="flex items-center gap-1 text-brand-orange font-bold text-sm"><Star size={14} fill="currentColor" /> {preview.rating || 5.0}</div></div>
                </div>
          </div>

          {/* Comment Box with independent scroll */}
          <div className="bg-white dark:bg-gray-855 rounded-[40px] border border-gray-100 dark:border-gray-800 transition-colors shadow-sm overflow-hidden flex flex-col h-[650px]">
              {/* Header - Fixed */}
              <div className="p-6 md:p-10 pb-5 border-b border-gray-50 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-855 z-20">
                    <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter text-lg">
                        <MessageSquare size={24} className="text-brand-blue" /> {t('set_detail.comments_title')} 
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-0.5 rounded-lg text-xs">{totalComments}</span>
                    </h3>
              </div>

              {/* Scrollable Content */}
              <div 
                ref={commentListRef}
                className="flex-1 overflow-y-auto p-6 md:px-10 space-y-8 custom-scrollbar bg-white dark:bg-gray-855"
              >
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 transition-colors mb-4">
                        <h4 className="font-black text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2 uppercase text-xs tracking-widest"><Info size={16} /> Ghi chú học tập</h4>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"><Timer size={18} className="text-brand-blue"/> {preview.durationMinutes || 15} phút luyện tập</div>
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400"><ShieldCheck size={18} className="text-green-500"/> Nội dung đã kiểm duyệt</div>
                        </div>
                  </div>

                  {comments.length === 0 && !commentsLoading ? (
                      <div className="text-center py-16">
                          <MessageCircle size={48} className="mx-auto text-gray-100 dark:text-gray-800 mb-4" />
                          <p className="text-gray-400 font-medium">{t('set_detail.no_comments')}</p>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          {comments.map((comment) => (
                              <div key={comment.id} className="flex gap-4 group items-start animate-fade-in">
                                  <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0 border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden">
                                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userId)}&background=random`} alt="AV" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                      <div className="inline-block bg-gray-100 dark:bg-gray-800 px-5 py-3 rounded-[24px] max-w-full shadow-sm">
                                          <div className="font-black text-gray-900 dark:text-white text-[13px] mb-1 hover:underline cursor-pointer">{comment.userId}</div>
                                          <div className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed font-medium break-words">{comment.content}</div>
                                      </div>
                                      <div className="flex items-center gap-4 mt-1.5 ml-4">
                                          <button type="button" className="text-[10px] font-black text-gray-400 hover:text-brand-blue transition-colors uppercase">Thích</button>
                                          <button type="button" className="text-[10px] font-black text-gray-400 hover:text-brand-blue transition-colors uppercase">Phản hồi</button>
                                          <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">{formattedDate(comment.createdAt)}</span>
                                      </div>
                                  </div>
                              </div>
                          ))}

                          {!isLastCommentsPage && (
                              <button 
                                  type="button"
                                  onClick={handleLoadMoreComments}
                                  disabled={commentsLoading}
                                  className="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-brand-blue flex items-center justify-center gap-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl"
                              >
                                  {commentsLoading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                                  Xem thêm bình luận
                              </button>
                          )}
                          {commentsLoading && commentsPage > 0 && <div className="flex justify-center p-4"><ThemeLoader size={24} /></div>}
                      </div>
                  )}
              </div>

              {/* Sticky Footer Input - Internal */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-855 border-t border-gray-100 dark:border-gray-800 p-6 md:px-10 transition-all z-30 shrink-0 shadow-[0_-10px_25px_rgba(0,0,0,0.03)]">
                    <div className="flex gap-3 items-end">
                        <div className="w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md mb-1 border-2 border-white dark:border-gray-700">
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-[28px] px-5 py-2.5 flex flex-col focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:bg-white dark:focus-within:bg-gray-750 transition-all border border-transparent">
                            <textarea 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Viết bình luận của bạn..."
                                className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 resize-none min-h-[44px] py-1.5 custom-scrollbar"
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { handlePostComment(e); } }}
                            />
                            <div className="flex justify-between items-center mt-2 border-t border-gray-200/30 dark:border-gray-700/30 pt-2 pb-0.5">
                                <div className="flex gap-1">
                                    {/* Chỉ giữ lại nút chọn icon, bỏ nút ảnh */}
                                    <button type="button" className="p-2 text-gray-400 hover:text-brand-orange transition-colors rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><Smile size={20}/></button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handlePostComment}
                                    disabled={!newComment.trim() || isSubmittingComment}
                                    className={`p-2 rounded-full transition-all ${newComment.trim() ? 'text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-90' : 'text-gray-300 dark:text-gray-600'}`}
                                >
                                    {isSubmittingComment ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="ml-14 mt-2 text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">Nhấn Enter để gửi</p>
              </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-gray-855 p-6 md:p-8 rounded-[40px] shadow-xl border border-brand-blue/10 dark:border-gray-800 transition-colors">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><Play className="text-brand-blue fill-brand-blue" size={22} /> Sẵn sàng chưa?</h3>
                <div className="space-y-4">
                    <button type="button" onClick={onStartFlashcard} className="w-full group p-5 rounded-[28px] border-2 border-gray-50 dark:border-gray-800 hover:border-brand-blue dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-5 text-left active:scale-95">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-brand-blue group-hover:text-white transition-colors flex items-center justify-center shrink-0"><BookOpen size={28} /></div>
                        <div className="min-w-0">
                            <span className="block font-black text-gray-900 dark:text-white text-lg group-hover:text-brand-blue truncate">{t('set_detail.mode_flashcard')}</span>
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter line-clamp-1">{t('set_detail.mode_flashcard_desc')}</span>
                        </div>
                    </button>
                    <button type="button" onClick={onStartQuiz} className="w-full group p-5 rounded-[28px] bg-brand-blue text-white shadow-xl shadow-brand-blue/20 hover:bg-blue-700 transition-all flex items-center gap-5 text-left transform hover:-translate-y-1 active:scale-95">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><BarChart3 size={28} /></div>
                        <div className="min-w-0">
                            <span className="block font-black text-xl truncate">{t('set_detail.mode_quiz')}</span>
                            <span className="text-blue-100 text-[10px] font-black uppercase tracking-tighter line-clamp-1">{t('set_detail.mode_quiz_desc')}</span>
                        </div>
                    </button>
                </div>
                
                <div className="mt-10 pt-8 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Share2 size={14} /> Chia sẻ liên kết</p>
                    <div className="flex gap-2">
                        {/* Fix: Changed div with type="button" to a button element to fix TypeScript error and improve accessibility. */}
                        <button type="button" onClick={() => { navigator.clipboard.writeText(shareCode); addNotification("Đã copy mã!", "success"); }} className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-center cursor-pointer border border-transparent hover:border-brand-blue transition-all group active:scale-95">
                            <span className="text-[8px] text-gray-400 font-black block mb-0.5 tracking-tighter uppercase">MÃ THAM GIA</span>
                            <span className="font-black text-xs text-brand-blue tracking-[0.2em] uppercase">{shareCode}</span>
                        </button>
                        <button type="button" onClick={() => setShowQrModal(true)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-brand-blue text-gray-400 hover:text-brand-blue transition-all active:scale-95"><QrCode size={24} /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowQrModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[40px] shadow-2xl max-w-sm w-full flex flex-col items-center relative" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                <button type="button" onClick={() => setShowQrModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors"><X size={28} /></button>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Mã QR Học phần</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8 text-center">Quét để truy cập nhanh trên thiết bị di động</p>
                <div className="bg-white p-5 rounded-[40px] border-8 border-brand-blue/5 mb-8 overflow-hidden shadow-inner">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`} alt="QR" className="w-48 h-48" />
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-3xl p-5 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-black mb-1 tracking-widest">MÃ MỜI</p>
                    <p className="text-2xl font-black text-brand-blue tracking-[0.3em] uppercase">{shareCode}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetDetailView;
