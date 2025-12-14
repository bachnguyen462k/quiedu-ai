import React, { useState } from 'react';
import { Flashcard, StudySet } from '../types';
import { generateStudySetWithAI } from '../services/geminiService';
import { Plus, Trash2, Sparkles, Save, Loader2, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CreateSetProps {
  onSave: (set: StudySet) => void;
  onCancel: () => void;
}

const CreateSet: React.FC<CreateSetProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([
    { id: uuidv4(), term: '', definition: '' },
    { id: uuidv4(), term: '', definition: '' },
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleAddCard = () => {
    setCards([...cards, { id: uuidv4(), term: '', definition: '' }]);
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  const handleCardChange = (id: string, field: 'term' | 'definition', value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề học phần");
      return;
    }
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 2) {
      alert("Cần ít nhất 2 thẻ hợp lệ để tạo học phần");
      return;
    }

    const newSet: StudySet = {
      id: uuidv4(),
      title,
      description,
      author: 'Bạn', // Default author for created sets
      createdAt: Date.now(),
      cards: validCards
    };

    onSave(newSet);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await generateStudySetWithAI(aiPrompt);
      setTitle(result.title);
      setDescription(result.description);
      const newCards = result.cards.map(c => ({ ...c, id: uuidv4() }));
      setCards(newCards);
      setShowAiModal(false);
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo học phần bằng AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
      {/* Sticky Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-30 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Tạo học phần mới</h2>
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={onCancel} 
                className="flex-1 sm:flex-none px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
            >
                Hủy
            </button>
            <button 
                onClick={handleSave}
                className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
            >
                <Save size={18} /> <span className="hidden sm:inline">Lưu học phần</span><span className="sm:hidden">Lưu</span>
            </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
        <div className="grid gap-6 mb-4">
          <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tiêu đề</label>
              <input
                type="text"
                placeholder='Ví dụ: "Sinh học 12 - Chương 1"'
                className="w-full p-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-xl font-medium text-gray-900 dark:text-white transition-colors placeholder-gray-400"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-start">
             <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Mô tả</label>
                <input
                    type="text"
                    placeholder="Thêm mô tả chi tiết về học phần..."
                    className="w-full p-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-gray-600 dark:text-gray-300 transition-colors placeholder-gray-400"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
             </div>
            <button
                onClick={() => setShowAiModal(true)}
                className="w-full md:w-auto px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap text-sm"
            >
                <Sparkles size={16} /> Tạo bằng AI
            </button>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors animate-fade-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400" /> 
                    Tạo nhanh với Gemini AI
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Nhập chủ đề bạn muốn học, AI sẽ tự động tạo danh sách thuật ngữ và định nghĩa cho bạn.</p>
                <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm transition-colors"
                    placeholder="Ví dụ: 50 từ vựng tiếng Anh chủ đề Du lịch, hoặc Các nguyên tố hóa học nhóm 1A..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                ></textarea>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors"
                    >
                        Đóng
                    </button>
                    <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50 text-sm transition-colors"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {isGenerating ? 'Đang tạo...' : 'Tạo ngay'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={card.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 group relative transition-colors">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="font-bold text-gray-400 dark:text-gray-500">{index + 1}</span>
                <button onClick={() => handleRemoveCard(card.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Thuật ngữ</label>
                <input
                  type="text"
                  className="w-full p-2 border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-colors bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Nhập thuật ngữ"
                  value={card.term}
                  onChange={e => handleCardChange(card.id, 'term', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Định nghĩa</label>
                <input
                  type="text"
                  className="w-full p-2 border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-colors bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Nhập định nghĩa"
                  value={card.definition}
                  onChange={e => handleCardChange(card.id, 'definition', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddCard}
        className="w-full py-6 mt-8 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 font-bold hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm"
      >
        <Plus size={24} /> Thêm thẻ
      </button>
    </div>
  );
};

export default CreateSet;