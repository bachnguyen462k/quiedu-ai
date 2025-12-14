import React from 'react';
import { StudySet } from '../types';
import { ArrowLeft, Clock, User, Play, BookOpen, BarChart3, Star, Calendar } from 'lucide-react';

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
                  {set.cards.length} Thuật ngữ
               </span>
               <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="text-sm font-bold">4.8</span>
                  <span className="text-gray-400 text-xs font-normal">(12 đánh giá)</span>
               </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{set.title}</h1>
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
                    <span>{set.plays || 0} lượt học</span>
                </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                Xem trước nội dung
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {set.cards.map((card, idx) => (
                    <div key={card.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                            {idx + 1}
                        </div>
                        <div className="flex-1 grid md:grid-cols-3 gap-2">
                            <div className="font-medium text-gray-900 md:col-span-1">{card.term}</div>
                            <div className="text-gray-600 md:col-span-2">{card.definition}</div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Study Modes */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Chọn chế độ học</h3>
                
                <div className="space-y-4">
                    <button 
                        onClick={onStartFlashcard}
                        className="w-full group p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-4 text-left"
                    >
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <span className="block font-bold text-gray-900 group-hover:text-indigo-700">Thẻ ghi nhớ</span>
                            <span className="text-sm text-gray-500">Ôn tập với lật thẻ</span>
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
                            <span className="block font-bold text-lg">Làm bài kiểm tra</span>
                            <span className="text-indigo-100 text-sm">Trắc nghiệm tính điểm</span>
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