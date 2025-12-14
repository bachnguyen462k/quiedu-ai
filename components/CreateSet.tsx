import React, { useState, useRef } from 'react';
import { Flashcard, StudySet } from '../types';
import { generateStudySetWithAI, generateStudySetFromFile } from '../services/geminiService';
import { Plus, Trash2, Sparkles, Save, Loader2, FileText, Upload, CheckCircle, PenTool, Keyboard, FileUp, ArrowLeft, BrainCircuit, Check, X, Menu, AlertCircle, Lightbulb, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CreateSetProps {
  onSave: (set: StudySet) => void;
  onCancel: () => void;
}

type CreationMode = 'MENU' | 'EDITOR';

const CreateSet: React.FC<CreateSetProps> = ({ onSave, onCancel }) => {
  // Navigation State
  const [creationStep, setCreationStep] = useState<CreationMode>('MENU');

  // Editor State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([
    { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '' },
    { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '' },
  ]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // Refs for scrolling
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<'TEXT' | 'FILE'>('TEXT');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFile, setAiFile] = useState<{name: string, data: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddCard = () => {
    const newId = uuidv4();
    const newCard = { id: newId, term: '', definition: '', options: ['', '', '', ''], explanation: '' };
    setCards([...cards, newCard]);
    // Optionally scroll to new card
    setTimeout(() => scrollToCard(newId), 100);
  };

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
    if (activeCardId === id) setActiveCardId(null);
  };

  const scrollToCard = (id: string) => {
      setActiveCardId(id);
      const element = cardRefs.current[id];
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  const handleTermChange = (id: string, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, term: value } : c));
  };

  const handleExplanationChange = (id: string, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, explanation: value } : c));
  };

  const handleOptionChange = (cardId: string, optionIndex: number, value: string) => {
    setCards(cards.map(c => {
        if (c.id !== cardId) return c;
        
        const newOptions = [...(c.options || [])];
        newOptions[optionIndex] = value;
        
        // If we are changing the option that is currently marked as correct (definition), update definition too
        const isCurrentlyCorrect = c.definition === c.options?.[optionIndex];
        
        return { 
            ...c, 
            options: newOptions,
            definition: isCurrentlyCorrect ? value : c.definition 
        };
    }));
  };

  const handleSetCorrectAnswer = (cardId: string, optionValue: string) => {
      setCards(cards.map(c => c.id === cardId ? { ...c, definition: optionValue } : c));
  };

  const handleAddOption = (cardId: string) => {
      setCards(cards.map(c => {
          if (c.id !== cardId) return c;
          return { ...c, options: [...(c.options || []), ''] };
      }));
  };

  const handleRemoveOption = (cardId: string, optionIndex: number) => {
      setCards(cards.map(c => {
          if (c.id !== cardId) return c;
          const newOptions = [...(c.options || [])];
          const removedValue = newOptions[optionIndex];
          newOptions.splice(optionIndex, 1);
          
          // If removed option was the correct answer, clear definition or set to first available
          let newDef = c.definition;
          if (c.definition === removedValue) {
              newDef = newOptions.length > 0 ? newOptions[0] : '';
          }

          return { ...c, options: newOptions, definition: newDef };
      }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setAiFile({
          name: file.name,
          data: reader.result as string
        });
      };
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề học phần");
      return;
    }
    // Minimal validation: must have term and definition
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 2) {
      alert("Cần ít nhất 2 câu hỏi hợp lệ (có nội dung và đáp án đúng) để tạo học phần");
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
    if (aiMode === 'TEXT' && !aiPrompt.trim()) return;
    if (aiMode === 'FILE' && !aiFile) return;
    
    setIsGenerating(true);
    try {
      let result;
      if (aiMode === 'TEXT') {
          result = await generateStudySetWithAI(aiPrompt);
      } else {
          result = await generateStudySetFromFile(aiFile!.data, aiFile!.name);
      }
      
      setTitle(result.title);
      setDescription(result.description);
      const newCards = result.cards.map(c => ({ 
          ...c, 
          id: uuidv4(),
          // Ensure options exist if AI didn't return them (fallback)
          options: c.options && c.options.length > 0 ? c.options : [c.definition],
          explanation: c.explanation || ''
      }));
      setCards(newCards);
      setShowAiModal(false);
      // Reset
      setAiPrompt('');
      setAiFile(null);
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo học phần bằng AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Functions to switch modes from Menu ---
  const startManual = () => {
      setCreationStep('EDITOR');
      setShowAiModal(false);
  };

  const startAiText = () => {
      setCreationStep('EDITOR');
      setAiMode('TEXT');
      setShowAiModal(true);
  };

  const startAiFile = () => {
      setCreationStep('EDITOR');
      setAiMode('FILE');
      setShowAiModal(true);
  };

  // --- RENDER: SELECTION MENU ---
  if (creationStep === 'MENU') {
      return (
          <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Bạn muốn tạo học phần bằng cách nào?</h2>
                  <p className="text-gray-500 dark:text-gray-400">Chọn phương thức phù hợp nhất để bắt đầu xây dựng bài học của bạn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Option 1: Manual */}
                  <button 
                    onClick={startManual}
                    className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl transition-all text-left flex flex-col h-full"
                  >
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Keyboard size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nhập liệu thủ công</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          Tự nhập từng câu hỏi và đáp án. Phù hợp khi bạn đã có sẵn nội dung chi tiết.
                      </p>
                  </button>

                  {/* Option 2: AI from Text */}
                  <button 
                    onClick={startAiText}
                    className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-xl transition-all text-left flex flex-col h-full relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-2">
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Phổ biến</span>
                      </div>
                      <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <BrainCircuit size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI tạo từ Chủ đề</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          Chỉ cần nhập chủ đề (VD: "Từ vựng IELTS"), AI sẽ tự động sinh ra danh sách từ và nghĩa.
                      </p>
                  </button>

                  {/* Option 3: AI from File */}
                  <button 
                    onClick={startAiFile}
                    className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl transition-all text-left flex flex-col h-full"
                  >
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <FileUp size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quét từ Tài liệu</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          Tải lên file PDF, Word hoặc Ảnh chụp đề thi. AI sẽ trích xuất toàn bộ câu hỏi và đáp án (A, B, C...).
                      </p>
                  </button>
              </div>

              <div className="mt-12 text-center">
                  <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium">
                      Hủy bỏ
                  </button>
              </div>
          </div>
      );
  }

  // --- RENDER: EDITOR ---
  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col animate-fade-in bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sticky Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-3 bg-white dark:bg-gray-800 z-30 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <button 
                onClick={() => setCreationStep('MENU')}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                title="Quay lại menu chọn"
            >
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Soạn thảo học phần
                {cards.length > 0 && <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">{cards.length} câu</span>}
            </h2>
        </div>
        
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

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* MAIN EDITOR AREA (Left/Center) */}
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar px-4 sm:px-8 py-6 pb-20 max-w-[1920px] mx-auto w-full">
              {/* Main Info Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors shrink-0">
                <div className="grid gap-6 mb-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tiêu đề</label>
                    <input
                        type="text"
                        placeholder='Ví dụ: "Đề thi Hóa Học 12 - Mã đề 101"'
                        className="w-full p-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-2xl font-bold text-gray-900 dark:text-white transition-colors placeholder-gray-400"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Mô tả</label>
                        <input
                            type="text"
                            placeholder="Thêm mô tả chi tiết..."
                            className="w-full p-3 bg-transparent border-b-2 border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-gray-600 dark:text-gray-300 transition-colors placeholder-gray-400"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="w-full md:w-auto px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap text-sm"
                    >
                        <Sparkles size={16} /> Sử dụng AI
                    </button>
                </div>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-8">
                {cards.map((card, index) => (
                <div 
                    key={card.id} 
                    ref={(el) => { cardRefs.current[card.id] = el; }}
                    className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border transition-all duration-300 relative group scroll-mt-24 ${
                        activeCardId === card.id 
                        ? 'border-indigo-500 ring-2 ring-indigo-50 dark:ring-indigo-900/20 shadow-lg z-10' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setActiveCardId(card.id)}
                >
                    {/* Header: Card Number & Delete */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <span className={`font-bold text-lg ${activeCardId === card.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`}>
                            Câu hỏi {index + 1}
                        </span>
                        <div className="flex items-center gap-3">
                             {(!card.definition || !card.options?.includes(card.definition)) && (
                                <span className="text-orange-500 text-xs font-bold flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                                    <AlertCircle size={12} /> Chọn đáp án đúng
                                </span>
                             )}
                             <button onClick={() => handleRemoveCard(card.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Xóa câu hỏi">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column: Question */}
                        <div>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Nội dung câu hỏi</label>
                                <textarea
                                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-gray-600 outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-400 resize-none font-medium text-lg min-h-[120px]"
                                placeholder="Nhập nội dung câu hỏi..."
                                rows={3}
                                value={card.term}
                                onChange={e => handleTermChange(card.id, e.target.value)}
                                />
                            </div>

                             {/* Explanation Field */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">
                                    <Lightbulb size={14} /> Giải thích / Gợi ý (AI Suggestion)
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 focus:border-blue-500 outline-none transition-colors text-gray-700 dark:text-gray-300 placeholder-blue-300 resize-none text-sm"
                                    placeholder="Nhập lời giải thích hoặc gợi ý cho đáp án đúng..."
                                    rows={3}
                                    value={card.explanation || ''}
                                    onChange={e => handleExplanationChange(card.id, e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Right Column: Options */}
                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Các lựa chọn đáp án</label>
                            <div className="grid grid-cols-1 gap-3">
                                {card.options?.map((option, optIdx) => {
                                    const isCorrect = card.definition === option && option !== '';
                                    return (
                                        <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-gray-400 dark:focus-within:border-gray-500'}`}>
                                            {/* Radio Button Logic to Set Correct Answer */}
                                            <div 
                                                onClick={() => handleSetCorrectAnswer(card.id, option)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${isCorrect ? 'border-green-500 bg-green-500 text-white scale-110' : 'border-gray-300 dark:border-gray-500 text-transparent hover:border-green-400'}`}
                                                title="Đánh dấu là đáp án đúng"
                                            >
                                                <Check size={14} strokeWidth={4} />
                                            </div>

                                            {/* Option Input */}
                                            <div className="flex-1">
                                                 <input 
                                                    type="text"
                                                    className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 font-medium"
                                                    placeholder={`Nhập đáp án ${String.fromCharCode(65 + optIdx)}...`}
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(card.id, optIdx, e.target.value)}
                                                />
                                            </div>

                                            {/* Delete Option */}
                                            <button 
                                                onClick={() => handleRemoveOption(card.id, optIdx)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                title="Xóa lựa chọn này"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Add Option Button */}
                                {(card.options?.length || 0) < 6 && (
                                    <button 
                                        onClick={() => handleAddOption(card.id)}
                                        className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline flex items-center gap-1 mt-2 w-fit px-2 py-1"
                                    >
                                        <Plus size={16} /> Thêm lựa chọn
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                ))}

                <button
                    onClick={handleAddCard}
                    className="w-full py-6 mt-8 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 font-bold hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm"
                >
                    <Plus size={24} /> Thêm câu hỏi mới
                </button>
              </div>
          </div>

          {/* RIGHT SIDEBAR: QUESTION NAVIGATION (Fixed width) */}
          <aside className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 hidden xl:flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm uppercase">Danh sách câu hỏi</h3>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">{cards.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {cards.map((card, idx) => {
                      const isValid = card.term.trim() && card.definition.trim();
                      const isActive = activeCardId === card.id;
                      return (
                        <button
                            key={card.id}
                            onClick={() => scrollToCard(card.id)}
                            className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center justify-between transition-all group ${
                                isActive 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${isActive ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{idx + 1}</span>
                                <span className="truncate font-medium">{card.term || "Câu hỏi mới..."}</span>
                            </div>
                            {!isValid && (
                                <AlertCircle size={14} className="text-orange-500 shrink-0" />
                            )}
                        </button>
                      );
                  })}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={handleAddCard}
                    className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                      <Plus size={16} /> Thêm nhanh
                  </button>
              </div>
          </aside>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors animate-fade-in">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400" /> 
                    Tạo nhanh với Gemini AI
                </h3>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button 
                        onClick={() => setAiMode('TEXT')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${aiMode === 'TEXT' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Nhập chủ đề
                    </button>
                    <button 
                        onClick={() => setAiMode('FILE')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${aiMode === 'FILE' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        Tải file lên
                    </button>
                </div>

                {aiMode === 'TEXT' ? (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Nhập chủ đề bạn muốn học, AI sẽ tự động tạo danh sách câu hỏi trắc nghiệm.</p>
                        <textarea
                            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm transition-colors"
                            placeholder="Ví dụ: 50 từ vựng tiếng Anh chủ đề Du lịch, hoặc Các nguyên tố hóa học nhóm 1A..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                        ></textarea>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Tải lên file câu hỏi (PDF, DOCX, Ảnh). AI sẽ quét và tự động điền câu hỏi cùng các đáp án.</p>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative mb-4">
                            <input 
                                type="file" 
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {aiFile ? (
                                <div className="flex flex-col items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
                                    <CheckCircle size={32} className="text-green-500" />
                                    <span className="font-bold text-sm truncate max-w-[200px]">{aiFile.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Nhấn để thay đổi</span>
                                </div>
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                    <Upload size={32} className="mb-2 text-gray-400" />
                                    <span className="font-medium text-sm">Nhấn để tải lên file</span>
                                    <span className="text-xs mt-1">Hỗ trợ PDF, Ảnh, Word</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors"
                    >
                        Đóng
                    </button>
                    <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating || (aiMode === 'TEXT' ? !aiPrompt.trim() : !aiFile)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50 text-sm transition-colors"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {isGenerating ? 'Đang tạo...' : 'Tạo ngay'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateSet;