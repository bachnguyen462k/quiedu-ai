import React from 'react';
import { StudySet } from '../types';
import { ArrowLeft, Clock, User, Play, BookOpen, BarChart3, Star, Calendar, Lock, Info, ShieldCheck } from 'lucide-react';

interface SetDetailViewProps {
  set: StudySet;
  onBack: () => void;
  onStartFlashcard: () => void;
  onStartQuiz: () => void;
}

const SetDetailView: React.FC<SetDetailViewProps> = ({ set, onBack, onStartFlashcard, onStartQuiz }) => {
  const formattedDate = new Date(set.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
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
                  <span className="text-sm font-bold">4.8</span>
                  <span className="text-gray-400 text-xs font-normal">(12 đánh giá)</span>
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

                {set.averageScore !== undefined && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-2">Thống kê lớp học</p>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900">{set.averageScore}%</span>
                            <span className="text-sm text-gray-500 mb-1">Điểm trung bình</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${set.averageScore}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SetDetailView;