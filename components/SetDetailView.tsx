
import React, { useState } from 'react';
import { StudySet } from '../types';
import { ArrowLeft, Clock, User, Play, BookOpen, BarChart3, Star, Calendar, Lock, Info, ShieldCheck, Share2, Link, QrCode, Copy, Check, MessageSquare, X, Download, Heart, Flag, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';

interface SetDetailViewProps {
  set: StudySet;
  onBack: () => void;
  onStartFlashcard: () => void;
  onStartQuiz: () => void;
  onToggleFavorite?: (setId: string) => void;
}

const SetDetailView: React.FC<SetDetailViewProps> = ({ set, onBack, onStartFlashcard, onStartQuiz, onToggleFavorite }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  const [copiedType, setCopiedType] = useState<'LINK' | 'CODE' | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('copyright');
  const [reportDescription, setReportDescription] = useState('');

  const formattedDate = new Date(set.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate Ratings
  const reviews = set.reviews || [];
  const averageRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "5.0"; // Default
  
  // Mock data for sharing
  const shareUrl = window.location.href; // In real app, this might be a specific slug
  const shareCode = `QZ-${set.id.toUpperCase()}-${new Date().getFullYear()}`; // Fake class code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`;
  const largeQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = (text: string, type: 'LINK' | 'CODE') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleReportSubmit = () => {
      // Logic to submit report to backend would go here
      addNotification(t('notifications.report_success'), 'success');
      setShowReportModal(false);
      setReportDescription('');
      setReportReason('copyright');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative animate-fade-in">
      {/* Back Button */}
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors font-medium"
        >
            <ArrowLeft size={20} /> {t('set_detail.back_library')}
        </button>

        <div className="flex gap-3">
            {/* Report Button */}
            <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-red-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
                title={t('set_detail.report_btn')}
            >
                <Flag size={18} />
            </button>

            {/* Favorite Button on Detail View */}
            {onToggleFavorite && (
                <button
                    onClick={() => onToggleFavorite(set.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                        set.isFavorite 
                        ? 'border-red-200 bg-red-50 text-red-600 dark:bg-red-900/20 dark:border-red-800' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                    }`}
                >
                    <Heart size={18} fill={set.isFavorite ? "currentColor" : "none"} />
                    <span className="font-bold text-sm hidden sm:inline">{set.isFavorite ? t('set_detail.liked') : t('set_detail.like')}</span>
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
               <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {set.cards.length} {t('set_detail.questions_count')}
               </span>
               <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm font-bold">{averageRating}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">({reviews.length} {t('set_detail.reviews_count')})</span>
               </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">{set.title}</h1>
            
            {/* Description is now the main preview content */}
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6 leading-relaxed">{set.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-400 dark:text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{set.author}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Play size={18} className="text-gray-400 dark:text-gray-500" />
                    <span>{set.plays || 0} {t('set_detail.plays_count')}</span>
                </div>
            </div>
          </div>

          {/* New Preview Section: Hides specific questions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
                {t('set_detail.info_title')}
            </h3>
            
            {/* Knowledge Summary */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 mb-6">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase mb-2 flex items-center gap-2">
                    <Info size={16} /> {t('set_detail.scope_title')}
                </h4>
                <p className="text-indigo-800 dark:text-indigo-200 leading-relaxed text-sm text-justify">
                    {set.description ? set.description : t('set_detail.scope_desc')}
                </p>
            </div>

            {/* Hidden Questions Notice */}
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-700/30 text-center transition-colors">
                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 mb-4 shadow-inner">
                    <Lock size={28} />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-2">{t('set_detail.hidden_title')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                    {t('set_detail.hidden_desc', { count: set.cards.length })}
                </p>
                <div className="mt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
                    {t('set_detail.hidden_badge')}
                </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors" id="reviews-section">
             <div className="flex items-center gap-2 mb-6">
                 <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400">
                    <MessageSquare size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('set_detail.comments_title')} ({reviews.length})</h3>
             </div>

             {reviews.length === 0 ? (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
                     {t('set_detail.no_comments')}
                 </div>
             ) : (
                 <div className="space-y-4">
                     {reviews.map(review => (
                         <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                                         <img src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} alt="User" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm text-gray-900 dark:text-white">{review.userName}</p>
                                         <div className="flex text-yellow-400 text-xs">
                                             {[...Array(5)].map((_, i) => (
                                                 <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300 dark:text-gray-600"} />
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                                 <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                             </div>
                             <p className="text-gray-600 dark:text-gray-300 text-sm pl-13 ml-13">{review.comment}</p>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        </div>

        {/* Right Column: Study Modes */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 sticky top-24 transition-colors">
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('set_detail.start_title')}</h3>
                
                {/* OPTIMIZED BUTTON GRID FOR MOBILE */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 mb-6">
                    <button 
                        onClick={onStartFlashcard}
                        className="w-full group p-3 sm:p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left opacity-90 hover:opacity-100"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                            <BookOpen size={20} className="sm:hidden" />
                            <BookOpen size={24} className="hidden sm:block" />
                        </div>
                        <div>
                            <span className="block font-black text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 text-xs sm:text-sm">Thẻ ghi nhớ</span>
                            <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{t('set_detail.mode_flashcard_desc')}</span>
                        </div>
                    </button>

                    <button 
                        onClick={onStartQuiz}
                        className="w-full group p-3 sm:p-4 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left transform hover:-translate-y-1"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <BarChart3 size={20} className="sm:hidden" />
                            <BarChart3 size={24} className="hidden sm:block" />
                        </div>
                        <div>
                            <span className="block font-black text-xs sm:text-lg">Kiểm tra</span>
                            <span className="hidden sm:block text-indigo-100 text-xs mt-0.5 line-clamp-1">{t('set_detail.mode_quiz_desc')}</span>
                        </div>
                    </button>
                </div>

                {/* --- STATS SECTION --- */}
                {set.averageScore !== undefined && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('set_detail.stats_title')}</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{set.averageScore}%</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('set_detail.avg_score')}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${set.averageScore}%` }}></div>
                        </div>
                    </div>
                )}

                {/* --- EMBEDDED SHARE SECTION --- */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                        <Share2 size={16} className="text-indigo-600 dark:text-indigo-400" /> {t('set_detail.share_title')}
                    </h4>

                    {/* Copy Code */}
                    <div className="mb-4">
                        <div 
                            onClick={() => handleCopy(shareCode, 'CODE')}
                            className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-700 rounded-xl p-3 text-center cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group relative"
                            title="Nhấn để sao chép mã"
                        >
                            <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1">{t('set_detail.join_code')}</span>
                            <span className="font-mono text-xl font-bold text-indigo-700 dark:text-indigo-300 tracking-wider">
                                {shareCode}
                            </span>
                            
                            {/* Copy Feedback Overlay */}
                            <div className={`absolute inset-0 flex items-center justify-center bg-indigo-600/90 rounded-lg transition-opacity duration-200 ${copiedType === 'CODE' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <span className="text-white font-bold text-sm flex items-center gap-1"><Check size={16}/> {t('set_detail.copied')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Copy Link & QR Preview */}
                    <div className="grid grid-cols-2 gap-3">
                         {/* Link Box */}
                         <div className="col-span-1">
                             <div className="relative">
                                 <input 
                                     type="text" 
                                     readOnly 
                                     value={shareUrl}
                                     className="w-full h-24 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-xs text-gray-500 dark:text-gray-400 break-all resize-none focus:outline-none"
                                 />
                                 <button 
                                     onClick={() => handleCopy(shareUrl, 'LINK')}
                                     className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500 transition-colors"
                                     title="Sao chép liên kết"
                                 >
                                     {copiedType === 'LINK' ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
                                 </button>
                             </div>
                             <p className="text-[10px] text-center text-gray-400 mt-1 font-medium">{t('set_detail.link_label')}</p>
                         </div>

                         {/* QR Code Box - Click to expand */}
                         <div className="col-span-1 flex flex-col items-center">
                             <div 
                                onClick={() => setShowQrModal(true)}
                                className="w-24 h-24 bg-white dark:bg-white p-2 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center shadow-sm cursor-zoom-in hover:border-indigo-400 hover:shadow-md transition-all group relative"
                             >
                                 <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                                 <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <QrCode size={20} className="text-indigo-600 drop-shadow-md" />
                                 </div>
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                                 <QrCode size={10} /> {t('set_detail.qr_label')}
                             </p>
                         </div>
                    </div>
                </div>

            </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowQrModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={() => setShowQrModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={24} />
                </button>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('set_detail.qr_modal_title')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('set_detail.qr_modal_desc')}</p>
                
                <div className="bg-white p-3 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 mb-6 shadow-inner">
                    <img src={largeQrCodeUrl} alt="Large QR Code" className="w-64 h-64 object-contain" />
                </div>
                
                <div className="w-full bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-indigo-500 dark:text-indigo-300 uppercase font-bold mb-1">{t('set_detail.join_code')}</p>
                    <p className="text-2xl font-mono font-bold text-indigo-700 dark:text-indigo-400 tracking-wider select-all">{shareCode}</p>
                </div>
            </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowReportModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-md w-full relative transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Flag size={20} className="text-red-500" /> {t('set_detail.report_modal_title')}
                    </h3>
                    <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('set_detail.report_reason_label')}</label>
                        <select 
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 dark:text-white"
                        >
                            <option value="copyright">{t('set_detail.report_reason_copyright')}</option>
                            <option value="inappropriate">{t('set_detail.report_reason_inappropriate')}</option>
                            <option value="spam">{t('set_detail.report_reason_spam')}</option>
                            <option value="other">{t('set_detail.report_reason_other')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('set_detail.report_desc_label')}</label>
                        <textarea
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            rows={4}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 dark:text-white resize-none"
                            placeholder={t('set_detail.report_desc_ph')}
                        ></textarea>
                    </div>

                    <button 
                        onClick={handleReportSubmit}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
                    >
                        <Send size={18} /> {t('set_detail.report_submit')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SetDetailView;
