
import React, { useState, useEffect } from 'react';
import { StudySet, Flashcard } from '../types';
import { ArrowLeft, Clock, User, Play, BookOpen, BarChart3, Star, Calendar, Lock, Info, ShieldCheck, Share2, Link, QrCode, Copy, Check, MessageSquare, X, Download, Heart, Flag, Send, Book, Zap, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';
import { studySetService } from '../services/studySetService';
import ThemeLoader from './ThemeLoader';

interface SetDetailViewProps {
  set: StudySet; // Initial metadata from dashboard or placeholder from router
  onBack: () => void;
  onStartFlashcard: () => void;
  onStartQuiz: () => void;
  onToggleFavorite?: (setId: string) => void;
}

const SetDetailView: React.FC<SetDetailViewProps> = ({ set: metadata, onBack, onStartFlashcard, onStartQuiz, onToggleFavorite }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  
  const [fullSet, setFullSet] = useState<StudySet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedType, setCopiedType] = useState<'LINK' | 'CODE' | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fetch full study set details when component mounts
  useEffect(() => {
    const fetchFullDetails = async () => {
        if (!metadata.id) return;
        
        setIsLoading(true);
        try {
            // Gọi API để lấy thông tin chung và danh sách câu hỏi trước khi bắt đầu
            const response = await studySetService.getStudySetById(metadata.id);
            if (response.code === 1000) {
                const data = response.result;
                const mapped: StudySet = {
                    ...metadata,
                    id: data.id.toString(),
                    title: data.title,
                    cards: (data.cards || []).map((c: any) => ({
                        id: c.id.toString(),
                        term: c.term,
                        definition: c.definition,
                        options: c.options || [],
                        explanation: c.explanation || ''
                    })),
                    description: data.description || metadata.description,
                    subject: data.topic || metadata.subject,
                    author: data.author || metadata.author,
                    plays: data.plays || 0
                };
                setFullSet(mapped);
            } else {
                addNotification("Học phần không tồn tại hoặc đã bị xóa", "error");
                onBack();
            }
        } catch (error) {
            console.error("Failed to fetch full study set details", error);
            addNotification("Không thể tải thông tin chi tiết học phần từ máy chủ", "error");
            // Vẫn cho phép hiển thị metadata nếu có (fallback)
            if (!metadata.title || metadata.title === 'Đang tải...') {
                onBack();
            }
        } finally {
            setIsLoading(false);
        }
    };

    fetchFullDetails();
  }, [metadata.id, addNotification]);

  const activeSet = fullSet || metadata;

  // Xử lý ngày tháng an toàn
  const formattedDate = activeSet.createdAt 
    ? new Date(activeSet.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '...';

  const averageRating = activeSet.reviews && activeSet.reviews.length > 0 
      ? (activeSet.reviews.reduce((acc, r) => acc + r.rating, 0) / activeSet.reviews.length).toFixed(1)
      : "5.0";
  
  const shareUrl = `${window.location.origin}/#/set/${activeSet.id}`;
  const shareCode = `QZ-${activeSet.id.toUpperCase()}`;

  const handleCopy = (text: string, type: 'LINK' | 'CODE') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  if (isLoading && (!fullSet)) {
      return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
              <ThemeLoader size={48} className="mb-4" />
              <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu học phần...</p>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative animate-fade-in">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-blue dark:text-gray-400 dark:hover:text-blue-400 transition-colors font-black uppercase text-xs tracking-widest"
        >
            <ArrowLeft size={18} /> {t('set_detail.back_library')}
        </button>

        <div className="flex gap-3">
            <button
                onClick={() => setShowReportModal(true)}
                className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-red-600 dark:bg-gray-800 dark:border-gray-700 transition-colors"
                title={t('set_detail.report_btn')}
            >
                <Flag size={20} />
            </button>

            {onToggleFavorite && (
                <button
                    onClick={() => onToggleFavorite(activeSet.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-black text-sm transition-all ${
                        activeSet.isFavorite 
                        ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-900/30' 
                        : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                >
                    <Heart size={18} fill={activeSet.isFavorite ? "currentColor" : "none"} />
                    {activeSet.isFavorite ? t('set_detail.liked') : t('set_detail.like')}
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-855 p-10 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <BookOpen size={180} className="text-brand-blue" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-brand-blue/10 text-brand-blue px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {activeSet.subject || 'Tổng hợp'}
                    </span>
                    <span className="bg-orange-100 text-brand-orange px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Zap size={10} fill="currentColor" /> {activeSet.cards.length} Câu hỏi
                    </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight">{activeSet.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 text-xl mb-10 leading-relaxed font-medium">{activeSet.description || 'Không có mô tả cho học phần này.'}</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Người tạo</span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center text-[8px] font-black uppercase">{activeSet.author.charAt(0)}</div>
                            <span className="font-bold text-gray-900 dark:text-white truncate">{activeSet.author}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ngày tạo</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{formattedDate}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lượt học</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{activeSet.plays || 0} lần</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Guidelines Section */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 transition-colors">
            <h3 className="font-black text-indigo-900 dark:text-indigo-300 mb-6 flex items-center gap-3 uppercase tracking-tighter text-lg">
                <Info size={24} /> {t('set_detail.info_title')}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-white dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <Timer className="text-brand-blue" size={20} />
                        <span className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Thời gian dự kiến</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Khoảng <span className="text-brand-blue font-black">{Math.ceil((activeSet.cards.length || 10) * 1.5)} phút</span> để hoàn thành bài tập này.</p>
                </div>

                <div className="bg-white/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-white dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="text-brand-orange" size={20} />
                        <span className="font-black text-sm text-gray-800 dark:text-white uppercase tracking-tight">Độ tin cậy</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Nội dung đã được kiểm duyệt bởi hệ thống <span className="text-brand-orange font-black">BrainQnA</span>.</p>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-3xl bg-white/30 dark:bg-gray-900/20 text-center">
                <Lock size={32} className="text-indigo-400 mb-4" />
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg mb-2">Xem trước giới hạn</h4>
                <p className="text-sm text-indigo-700/60 dark:text-indigo-400/60 max-w-sm font-medium">
                    Hãy bắt đầu học để xem toàn bộ {activeSet.cards.length} câu hỏi và ghi lại kết quả học tập của bạn.
                </p>
            </div>
          </div>
        </div>

        {/* Start Mode Selection Column */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-855 p-8 rounded-[40px] shadow-2xl border border-brand-blue/10 dark:border-gray-800 sticky top-24 transition-colors">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                    <Play className="text-brand-blue fill-brand-blue" size={20} /> Sẵn sàng chưa?
                </h3>
                
                <div className="space-y-5">
                    <button 
                        onClick={onStartFlashcard}
                        disabled={isLoading}
                        className="w-full group p-5 rounded-3xl border-2 border-gray-100 dark:border-gray-800 hover:border-brand-blue dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-5 text-left active:scale-95 disabled:opacity-50"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-brand-blue group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <span className="block font-black text-gray-900 dark:text-white text-lg group-hover:text-brand-blue dark:group-hover:text-blue-400">{t('set_detail.mode_flashcard')}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">{t('set_detail.mode_flashcard_desc')}</span>
                        </div>
                    </button>

                    <button 
                        onClick={onStartQuiz}
                        disabled={isLoading}
                        className="w-full group p-5 rounded-3xl bg-brand-blue text-white shadow-xl shadow-brand-blue/25 hover:bg-blue-700 transition-all flex items-center gap-5 text-left transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                            <BarChart3 size={28} />
                        </div>
                        <div>
                            <span className="block font-black text-xl">{t('set_detail.mode_quiz')}</span>
                            <span className="text-blue-100 text-xs font-bold uppercase tracking-tighter">{t('set_detail.mode_quiz_desc')}</span>
                        </div>
                    </button>
                </div>

                {/* Stats & Share Card */}
                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-end mb-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('set_detail.stats_title')}</p>
                        <div className="flex items-center gap-1 text-yellow-400">
                             <Star size={14} fill="currentColor" />
                             <span className="text-sm font-black text-gray-900 dark:text-white">{averageRating}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="flex-1">
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: `${activeSet.averageScore || 100}%` }}></div>
                            </div>
                         </div>
                         <span className="text-xs font-black text-gray-500 dark:text-gray-400 whitespace-nowrap">{activeSet.averageScore || 100}% thành công</span>
                    </div>

                    <div className="mt-8">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Share2 size={12} /> Chia sẻ học phần
                        </p>
                        <div className="flex gap-2">
                            <div 
                                onClick={() => handleCopy(shareCode, 'CODE')}
                                className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-center cursor-pointer border border-transparent hover:border-brand-blue transition-all group relative"
                            >
                                <span className="text-[9px] text-gray-400 font-black block mb-0.5 tracking-tighter">MÃ MỜI</span>
                                <span className="font-black text-sm text-brand-blue tracking-widest uppercase">{shareCode}</span>
                                {copiedType === 'CODE' && <div className="absolute inset-0 bg-brand-blue rounded-2xl flex items-center justify-center text-[10px] text-white font-black animate-fade-in">ĐÃ COPY!</div>}
                            </div>
                            <button 
                                onClick={() => setShowQrModal(true)}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-brand-blue text-gray-400 hover:text-brand-blue transition-all"
                            >
                                <QrCode size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowQrModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-2xl max-w-sm w-full flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Quét mã QR</h3>
                <div className="bg-white p-4 rounded-3xl border-4 border-brand-blue/5 my-6">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`} alt="QR" className="w-56 h-56" />
                </div>
                <div className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-black mb-1">MÃ THAM GIA</p>
                    <p className="text-2xl font-black text-brand-blue tracking-widest uppercase">{shareCode}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetDetailView;
