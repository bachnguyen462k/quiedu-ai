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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 py-4 z-10 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Tạo học phần mới</h2>
        <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
                Hủy
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 text-sm"
            >
                <Save size={18} /> Lưu học phần
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid gap-4 mb-4">
          <input
            type="text"
            placeholder='Nhập tiêu đề, ví dụ: "Sinh học 12 - Chương 1"'
            className="w-full p-3 border-b-2 border-gray-200 focus:border-indigo-500 outline-none text-xl font-medium transition-colors"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div className="flex gap-4 items-start">
             <input
                type="text"
                placeholder="Thêm mô tả..."
                className="flex-1 p-3 border-b-2 border-gray-200 focus:border-indigo-500 outline-none text-gray-600 transition-colors"
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
            <button
                onClick={() => setShowAiModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap text-sm"
            >
                <Sparkles size={16} /> Tạo bằng AI
            </button>
          </div>
        </div>
      </div>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" /> 
                    Tạo nhanh với Gemini AI
                </h3>
                <p className="text-gray-600 mb-4 text-sm">Nhập chủ đề bạn muốn học, AI sẽ tự động tạo danh sách thuật ngữ và định nghĩa cho bạn.</p>
                <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm"
                    placeholder="Ví dụ: 50 từ vựng tiếng Anh chủ đề Du lịch, hoặc Các nguyên tố hóa học nhóm 1A..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                ></textarea>
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm"
                    >
                        Đóng
                    </button>
                    <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {isGenerating ? 'Đang tạo...' : 'Tạo ngay'}
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="space-y-4">
        {cards.map((card, index) => (
          <div key={card.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 group relative">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-400">{index + 1}</span>
                <button onClick={() => handleRemoveCard(card.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thuật ngữ</label>
                <input
                  type="text"
                  className="w-full p-2 border-b-2 border-gray-200 focus:border-indigo-500 outline-none transition-colors bg-transparent"
                  placeholder="Nhập thuật ngữ"
                  value={card.term}
                  onChange={e => handleCardChange(card.id, 'term', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Định nghĩa</label>
                <input
                  type="text"
                  className="w-full p-2 border-b-2 border-gray-200 focus:border-indigo-500 outline-none transition-colors bg-transparent"
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
        className="w-full py-6 mt-8 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
      >
        <Plus size={24} /> Thêm thẻ
      </button>
    </div>
  );
};

export default CreateSet;