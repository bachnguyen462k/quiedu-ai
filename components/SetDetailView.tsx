import React, { useState } from 'react';
import { StudySet } from '../types';
import { ArrowLeft, Clock, User, Play, BookOpen, BarChart3, Star, Calendar, Lock, Info, ShieldCheck, Share2, Link, QrCode, Copy, Check, MessageSquare } from 'lucide-react';

interface SetDetailViewProps {
  set: StudySet;
  onBack: () => void;
  onStartFlashcard: () => void;
  onStartQuiz: () => void;
}

const SetDetailView: React.FC<SetDetailViewProps> = ({ set, onBack, onStartFlashcard, onStartQuiz }) => {
  const [copiedType, setCopiedType] = useState<'LINK' | 'CODE' | null>(null);

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

  const handleCopy = (text: string, type: 'LINK' | 'CODE') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Quay lại thư viện
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
               <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {set.cards.length} Câu hỏi
               </span>
               <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm font-bold">{averageRating}</span>
                  <span className="text-gray-400 text-xs font-normal">({reviews.length} đánh giá)</span>
               </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{set.title}</h1>
            
            {/* Description is now the main preview content */}
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">{set.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{set.author}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Play size={18} className="text-gray-400" />
                    <span>{set.plays || 0} lượt thi</span>
                </div>
            </div>
          </div>

          {/* New Preview Section: Hides specific questions */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-600" />
                Thông tin bài kiểm tra
            </h3>
            
            {/* Knowledge Summary */}
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 mb-6">
                <h4 className="text-sm font-bold text-indigo-900 uppercase mb-2 flex items-center gap-2">
                    <Info size={16} /> Phạm vi kiến thức
                </h4>
                <p className="text-indigo-800 leading-relaxed text-sm text-justify">
                    {set.description ? set.description : "Học phần này bao gồm các kiến thức quan trọng đã được tổng hợp. Nội dung câu hỏi xoay quanh các chủ đề đã học."}
                </p>
            </div>

            {/* Hidden Questions Notice */}
            <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center">
                <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mb-4 shadow-inner">
                    <Lock size={28} />
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">Danh sách câu hỏi được bảo mật</h4>
                <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                    Để đảm bảo tính khách quan và đánh giá chính xác năng lực, chi tiết {set.cards.length} câu hỏi và đáp án sẽ không được hiển thị trước.
                </p>
                <div className="mt-4 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                    Chỉ hiển thị khi làm bài
                </div>
            </div>
          </div>

          {/* REVIEWS SECTION */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200" id="reviews-section">
             <div className="flex items-center gap-2 mb-6">
                 <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <MessageSquare size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">Đánh giá & Bình luận ({reviews.length})</h3>
             </div>

             {reviews.length === 0 ? (
                 <div className="text-center py-8 text-gray-500 italic">
                     Chưa có đánh giá nào. Hãy là người đầu tiên!
                 </div>
             ) : (
                 <div className="space-y-4">
                     {reviews.map(review => (
                         <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                         <img src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} alt="User" />
                                     </div>
                                     <div>
                                         <p className="font-bold text-sm text-gray-900">{review.userName}</p>
                                         <div className="flex text-yellow-400 text-xs">
                                             {[...Array(5)].map((_, i) => (
                                                 <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                                 <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                             </div>
                             <p className="text-gray-600 text-sm pl-13 ml-13">{review.comment}</p>
                         </div>
                     ))}
                 </div>
             )}
          </div>
        </div>

        {/* Right Column: Study Modes */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 sticky top-24">
                
                <h3 className="text-lg font-bold text-gray-900 mb-6">Bắt đầu làm bài</h3>
                
                <div className="space-y-4">
                    <button 
                        onClick={onStartFlashcard}
                        className="w-full group p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-4 text-left opacity-75 hover:opacity-100"
                    >
                        <div className="w-12 h-12 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <span className="block font-bold text-gray-900 group-hover:text-indigo-700">Ôn tập thẻ</span>
                            <span className="text-sm text-gray-500">Xem lướt các khái niệm</span>
                        </div>
                    </button>

                    <button 
                        onClick={onStartQuiz}
                        className="w-full group p-4 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-4 text-left transform hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <span className="block font-bold text-lg">Vào thi ngay</span>
                            <span className="text-indigo-100 text-sm">Chế độ kiểm tra tính điểm</span>
                        </div>
                    </button>
                </div>

                {/* --- STATS SECTION --- */}
                {set.averageScore !== undefined && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Thống kê lớp học</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">{set.averageScore}%</span>
                            <span className="text-sm text-gray-500 mb-1">Điểm trung bình</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${set.averageScore}%` }}></div>
                        </div>
                    </div>
                )}

                {/* --- EMBEDDED SHARE SECTION --- */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                        <Share2 size={16} className="text-indigo-600" /> Chia sẻ học phần
                    </h4>

                    {/* Copy Code */}
                    <div className="mb-4">
                        <div 
                            onClick={() => handleCopy(shareCode, 'CODE')}
                            className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-3 text-center cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 transition-all group relative"
                            title="Nhấn để sao chép mã"
                        >
                            <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1">Mã tham gia</span>
                            <span className="font-mono text-xl font-bold text-indigo-700 tracking-wider">
                                {shareCode}
                            </span>
                            
                            {/* Copy Feedback Overlay */}
                            <div className={`absolute inset-0 flex items-center justify-center bg-indigo-600/90 rounded-lg transition-opacity duration-200 ${copiedType === 'CODE' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <span className="text-white font-bold text-sm flex items-center gap-1"><Check size={16}/> Đã chép!</span>
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
                                     className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 break-all resize-none focus:outline-none"
                                 />
                                 <button 
                                     onClick={() => handleCopy(shareUrl, 'LINK')}
                                     className="absolute bottom-2 right-2 bg-white shadow-sm border border-gray-200 p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-500 transition-colors"
                                     title="Sao chép liên kết"
                                 >
                                     {copiedType === 'LINK' ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
                                 </button>
                             </div>
                             <p className="text-[10px] text-center text-gray-400 mt-1 font-medium">Link bài học</p>
                         </div>

                         {/* QR Code Box */}
                         <div className="col-span-1 flex flex-col items-center">
                             <div className="w-24 h-24 bg-white p-2 border border-gray-200 rounded-xl flex items-center justify-center shadow-sm">
                                 <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                                 <QrCode size={10} /> Quét mã
                             </p>
                         </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default SetDetailView;