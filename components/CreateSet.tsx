import React, { useState, useRef, useEffect } from 'react';
import { Flashcard, StudySet, PrivacyStatus } from '../types';
import { generateStudySetWithAI, generateStudySetFromFile } from '../services/geminiService';
import { Plus, Trash2, Sparkles, Save, Loader2, FileText, Upload, CheckCircle, PenTool, Keyboard, FileUp, ArrowLeft, BrainCircuit, Check, X, Menu, AlertCircle, Lightbulb, ChevronRight, Layers, LayoutGrid, List, BookOpen, ScanLine, Link, Globe, Lock, Building, GraduationCap, Hash, Bookmark, Eye, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CreateSetProps {
  onSave: (set: StudySet) => void;
  onCancel: () => void;
  onGoToAiTextbook: () => void;
}

type CreationMode = 'MENU' | 'EDITOR';
type AiGenerationMode = 'TEXT_TOPIC' | 'FILE_SCAN_QUIZ';
type EditorMode = 'VISUAL' | 'TEXT';

const EDUCATION_LEVELS = [
  'Trung học phổ thông',
  'Đại học',
  'Cao đẳng',
  'Cao học',
  'Trung cấp',
  'Khác'
];

const SCHOOLS_BY_LEVEL: Record<string, string[]> = {
  'Trung học phổ thông': [
    'THPT Chuyên Hà Nội - Amsterdam',
    'THPT Chu Văn An',
    'THPT Lương Thế Vinh',
    'THPT Nguyễn Huệ',
    'THPT Lê Hồng Phong',
    'THPT Chuyên Ngoại Ngữ',
    'THPT Marie Curie'
  ],
  'Đại học': [
    'Đại học Bách Khoa Hà Nội',
    'Đại học Quốc Gia Hà Nội',
    'Đại học Kinh Tế Quốc Dân',
    'Đại học FPT',
    'Đại học RMIT',
    'Đại học Ngoại Thương',
    'Học viện Công nghệ Bưu chính Viễn thông'
  ],
  'Cao đẳng': [
    'Cao đẳng FPT Polytechnic',
    'Cao đẳng Công nghệ cao Hà Nội',
    'Cao đẳng Du lịch',
    'Cao đẳng Y tế',
    'Cao đẳng Kinh tế Kỹ thuật'
  ],
  'Cao học': [
    'Học viện Khoa học xã hội',
    'Viện Hàn lâm Khoa học xã hội Việt Nam',
    'Đại học Quốc Gia - Khoa Sau Đại học'
  ],
  'Trung cấp': [
    'Trung cấp Nghề',
    'Trung cấp Y dược',
    'Trung cấp Kinh tế'
  ]
};

const CreateSet: React.FC<CreateSetProps> = ({ onSave, onCancel, onGoToAiTextbook }) => {
  // Navigation State
  const [creationStep, setCreationStep] = useState<CreationMode>('MENU');

  // Editor State
  const [editorMode, setEditorMode] = useState<EditorMode>('VISUAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Metadata State
  const [privacy, setPrivacy] = useState<PrivacyStatus>('PUBLIC');
  const [level, setLevel] = useState('Trung học phổ thông');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  const [cards, setCards] = useState<Flashcard[]>([
    { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' },
    { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' },
  ]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  // Text Editor State
  const [textEditorContent, setTextEditorContent] = useState('');
  const [parsedPreviewCards, setParsedPreviewCards] = useState<Flashcard[]>([]);

  // Refs for scrolling
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<AiGenerationMode>('TEXT_TOPIC');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFile, setAiFile] = useState<{name: string, data: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Helpers for Text Mode ---
  const stringifyCardsToText = (currentCards: Flashcard[]) => {
      return currentCards.map(c => {
          let text = `${c.term.replace(/\n/g, '<br />')}\n`;
          c.options?.forEach(opt => {
              const isCorrect = opt === c.definition;
              text += `${isCorrect ? '*' : ''}${opt.replace(/\n/g, '<br />')}\n`;
          });
          return text;
      }).join('\n\n');
  };

  const parseTextToCards = (text: string): Flashcard[] => {
      const blocks = text.split(/\n\s*\n/);
      
      const parsed: Flashcard[] = [];
      blocks.forEach(block => {
          const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length === 0) return;

          const term = lines[0].replace(/<br\s*\/?>/gi, '\n');
          
          let definition = '';
          const options: string[] = [];

          if (lines.length > 1) {
              for (let i = 1; i < lines.length; i++) {
                  let optLine = lines[i];
                  const isCorrect = optLine.startsWith('*');
                  
                  if (isCorrect) {
                      optLine = optLine.substring(1).trim();
                  }
                  
                  const cleanOpt = optLine.replace(/<br\s*\/?>/gi, '\n');
                  options.push(cleanOpt);
                  
                  if (isCorrect) {
                      definition = cleanOpt;
                  }
              }
          }

          parsed.push({
              id: uuidv4(),
              term,
              definition,
              options: options.length > 0 ? options : ['', '', '', ''],
              explanation: '',
              relatedLink: ''
          });
      });
      return parsed;
  };

  // Watch for text content changes to update preview
  useEffect(() => {
      if (editorMode === 'TEXT') {
          setParsedPreviewCards(parseTextToCards(textEditorContent));
      }
  }, [textEditorContent, editorMode]);

  const handleSwitchMode = (newMode: EditorMode) => {
      if (newMode === 'TEXT') {
          // Convert current cards to text
          setTextEditorContent(stringifyCardsToText(cards));
      } else {
          // Convert text back to cards
          const parsed = parseTextToCards(textEditorContent);
          if (parsed.length > 0) {
              setCards(parsed);
          }
      }
      setEditorMode(newMode);
  };

  const handleAddCard = () => {
    const newId = uuidv4();
    const newCard = { id: newId, term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' };
    setCards([...cards, newCard]);
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

  const handleLinkChange = (id: string, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, relatedLink: value } : c));
  };

  const handleOptionChange = (cardId: string, optionIndex: number, value: string) => {
    setCards(cards.map(c => {
        if (c.id !== cardId) return c;
        const newOptions = [...(c.options || [])];
        newOptions[optionIndex] = value;
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
          newOptions.splice(optionIndex, 1);
          let newDef = c.definition;
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

  const handleLevelChange = (newLevel: string) => {
      setLevel(newLevel);
      setSchool('');
  };

  const handleSave = () => {
    let finalCards = cards;
    if (editorMode === 'TEXT') {
        finalCards = parseTextToCards(textEditorContent);
    }

    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề học phần");
      return;
    }
    const validCards = finalCards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 2) {
      alert("Cần ít nhất 2 câu hỏi hợp lệ (có nội dung và đáp án đúng) để tạo học phần");
      return;
    }

    const newSet: StudySet = {
      id: uuidv4(),
      title,
      description,
      author: 'Bạn',
      createdAt: Date.now(),
      cards: validCards,
      privacy,
      level,
      school,
      major,
      subject,
      topic
    };

    onSave(newSet);
  };

  const handleAiGenerate = async () => {
    if (aiMode === 'TEXT_TOPIC' && !aiPrompt.trim()) return;
    if (aiMode === 'FILE_SCAN_QUIZ' && !aiFile) return;
    
    setIsGenerating(true);
    try {
      let generatedCards: Omit<Flashcard, 'id'>[] = [];
      let generatedTitle = '';
      let generatedDescription = '';

      if (aiMode === 'TEXT_TOPIC') {
          const result = await generateStudySetWithAI(aiPrompt);
          generatedTitle = result.title;
          generatedDescription = result.description;
          generatedCards = result.cards;

      } else if (aiMode === 'FILE_SCAN_QUIZ') {
          const result = await generateStudySetFromFile(aiFile!.data, aiFile!.name);
          generatedTitle = result.title;
          generatedDescription = result.description;
          generatedCards = result.cards;
      }
      
      setTitle(generatedTitle);
      setDescription(generatedDescription);
      
      const newCardsWithIds = generatedCards.map(c => ({ 
          ...c, 
          id: uuidv4(),
          options: c.options && c.options.length > 0 ? c.options : [c.definition],
          explanation: c.explanation || '',
          relatedLink: ''
      }));

      setCards(newCardsWithIds);
      if (editorMode === 'TEXT') {
          setTextEditorContent(stringifyCardsToText(newCardsWithIds));
      }
      
      setShowAiModal(false);
      setAiPrompt('');
      setAiFile(null);
      setCreationStep('EDITOR');

    } catch (error) {
      alert("Có lỗi xảy ra khi xử lý với AI. Vui lòng thử lại hoặc kiểm tra file.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startManual = () => {
      setCreationStep('EDITOR');
      setTitle('');
      setDescription('');
      setCards([
        { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' },
        { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' },
      ]);
      setEditorMode('VISUAL');
  };

  const openAiModal = (mode: AiGenerationMode) => {
      setAiMode(mode);
      setShowAiModal(true);
      setAiFile(null);
      setAiPrompt('');
  };

  // --- RENDER: SELECTION MENU ---
  if (creationStep === 'MENU') {
      return (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in relative">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Bạn muốn tạo học phần bằng cách nào?</h2>
                  <p className="text-gray-500 dark:text-gray-400">Chọn phương thức phù hợp nhất để bắt đầu xây dựng bài học của bạn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <button 
                    onClick={startManual}
                    className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all text-left flex flex-col h-full"
                  >
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Keyboard size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nhập liệu thủ công</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          Tự nhập từng câu hỏi và đáp án. Phù hợp khi bạn đã có sẵn nội dung chi tiết.
                      </p>
                  </button>

                  <button 
                    onClick={() => openAiModal('TEXT_TOPIC')}
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

                  <button 
                    onClick={() => openAiModal('FILE_SCAN_QUIZ')}
                    className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl transition-all text-left flex flex-col h-full"
                  >
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <ScanLine size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Quét Đề thi / Tài liệu</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          Tải lên file PDF, Word hoặc Ảnh chụp đề thi. AI sẽ trích xuất câu hỏi trắc nghiệm có sẵn.
                      </p>
                  </button>

                  <button 
                    onClick={onGoToAiTextbook}
                    className="group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-xl transition-all text-left flex flex-col h-full relative overflow-hidden"
                  >
                      <div className="absolute top-0 right-0 p-2">
                          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1">
                             <Sparkles size={10} /> Pro
                          </span>
                      </div>
                      <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <BookOpen size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Soạn bài chi tiết (AI)</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          Phân tích sâu Sách giáo khoa hoặc Tài liệu dài. Tự động tóm tắt lý thuyết và tạo câu hỏi vận dụng.
                      </p>
                  </button>
              </div>

              <div className="mt-12 text-center">
                  <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium">
                      Hủy bỏ
                  </button>
              </div>

              {/* SHARED AI MODAL */}
              {showAiModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                {aiMode === 'TEXT_TOPIC' && <><BrainCircuit className="text-purple-600" /> AI Tạo từ Chủ đề</>}
                                {aiMode === 'FILE_SCAN_QUIZ' && <><ScanLine className="text-indigo-600" /> Quét Đề thi / Tài liệu</>}
                            </h3>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {aiMode === 'TEXT_TOPIC' ? (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Nhập chủ đề bạn muốn học, AI sẽ tự động tạo danh sách câu hỏi trắc nghiệm.</p>
                                <textarea
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-4 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm transition-colors"
                                    placeholder="Ví dụ: 50 từ vựng tiếng Anh chủ đề Du lịch..."
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    autoFocus
                                ></textarea>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                                    Tải lên file đề thi (PDF, DOCX, Ảnh). AI sẽ trích xuất câu hỏi và đáp án.
                                </p>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative mb-6 group">
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.txt,image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {aiFile ? (
                                        <div className="flex flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400">
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                                <CheckCircle size={24} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm truncate max-w-[200px] block">{aiFile.name}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Nhấn để thay đổi file</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400 flex flex-col items-center group-hover:scale-105 transition-transform">
                                            <Upload size={32} className="mb-3 text-gray-400" />
                                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Nhấn để tải lên file</span>
                                            <span className="text-xs mt-1">Hỗ trợ PDF, Ảnh, Word</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleAiGenerate}
                                disabled={isGenerating || (aiMode === 'TEXT_TOPIC' ? !aiPrompt.trim() : !aiFile)}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all shadow-md hover:shadow-indigo-200"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                {isGenerating ? 'Đang xử lý...' : 'Bắt đầu tạo'}
                            </button>
                        </div>
                    </div>
                </div>
              )}
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="mx-auto w-full max-w-[1920px] grid grid-cols-1 lg:grid-cols-4 gap-8 relative h-full">
              
              {/* LEFT SIDEBAR: INFO & TOC (ALWAYS VISIBLE) */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-0 self-start">
                  {/* General Info Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 transition-colors">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-indigo-600 dark:text-indigo-400" /> Thông tin chung
                      </h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tiêu đề</label>
                              <input
                                  type="text"
                                  placeholder="Ví dụ: Lịch sử 12 - Bài 1"
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white transition-colors placeholder-gray-400"
                                  value={title}
                                  onChange={e => setTitle(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Mô tả</label>
                              <textarea
                                  placeholder="Mô tả ngắn gọn..."
                                  rows={2}
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-gray-200 transition-colors placeholder-gray-400 resize-none"
                                  value={description}
                                  onChange={e => setDescription(e.target.value)}
                              />
                          </div>

                          {/* Metadata Fields */}
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Globe size={10} /> Quyền riêng tư</label>
                                  <select 
                                    value={privacy}
                                    onChange={(e) => setPrivacy(e.target.value as PrivacyStatus)}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                      <option value="PUBLIC">Công khai</option>
                                      <option value="PRIVATE">Riêng tư</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><GraduationCap size={10} /> Trình độ</label>
                                  <select 
                                    value={level}
                                    onChange={(e) => handleLevelChange(e.target.value)}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                      {EDUCATION_LEVELS.map(lvl => (
                                          <option key={lvl} value={lvl}>{lvl}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><BookOpen size={10} /> Môn học</label>
                              <input 
                                type="text"
                                placeholder="VD: Toán, Lý, Tiếng Anh..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Building size={10} /> Trường học</label>
                              <input 
                                type="text"
                                list="school-options"
                                placeholder="Chọn hoặc nhập tên trường..."
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <datalist id="school-options">
                                  {(SCHOOLS_BY_LEVEL[level] || []).map((s, idx) => (
                                      <option key={idx} value={s} />
                                  ))}
                              </datalist>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Bookmark size={10} /> Chuyên ngành</label>
                              <input 
                                type="text"
                                placeholder="VD: CNTT, Kinh tế..."
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> Chủ đề</label>
                              <input 
                                type="text"
                                placeholder="VD: Hàm số, Thì quá khứ..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>
                      </div>
                  </div>

                  {/* TOC Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col transition-colors max-h-[calc(100vh-350px)]">
                      <div className="flex justify-between items-center mb-3 flex-shrink-0">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                              <List size={18} className="text-indigo-600 dark:text-indigo-400" /> Mục lục câu hỏi
                          </h3>
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                              {editorMode === 'VISUAL' ? cards.length : parsedPreviewCards.length}
                          </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                          {(editorMode === 'VISUAL' ? cards : parsedPreviewCards).map((card, idx) => {
                              const isValid = card.term.trim() && card.definition.trim();
                              const isActive = activeCardId === card.id;
                              return (
                                <button
                                    key={card.id}
                                    onClick={() => editorMode === 'VISUAL' && scrollToCard(card.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-all border-l-2 ${
                                        isActive 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-indigo-600 font-medium' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent hover:border-l-gray-300'
                                    } ${editorMode === 'TEXT' ? 'cursor-default' : ''}`}
                                >
                                    <span className={`text-xs font-bold min-w-[1.5rem] ${isActive ? 'opacity-100' : 'opacity-60'}`}>{idx + 1}.</span>
                                    <span className="truncate flex-1">{card.term.replace(/\n/g, ' ') || "Câu hỏi mới..."}</span>
                                    {!isValid && <AlertCircle size={12} className="text-orange-500 shrink-0" />}
                                </button>
                              );
                          })}
                      </div>
                      
                      {editorMode === 'VISUAL' && (
                        <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <button 
                                onClick={handleAddCard}
                                className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Thêm nhanh
                            </button>
                        </div>
                      )}
                  </div>
              </div>

              {/* RIGHT MAIN: QUESTIONS EDITOR */}
              <div className="lg:col-span-3 space-y-6 h-full flex flex-col">
                  {/* Toolbar & Tabs */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto">
                          <button
                            onClick={() => handleSwitchMode('VISUAL')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
                                editorMode === 'VISUAL' 
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                              <Layers size={16} /> Trực quan
                          </button>
                          <button
                            onClick={() => handleSwitchMode('TEXT')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
                                editorMode === 'TEXT' 
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                              <FileText size={16} /> Nhập văn bản
                          </button>
                      </div>
                      
                      <div className="flex gap-2">
                          <button
                              onClick={() => openAiModal('TEXT_TOPIC')}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
                          >
                              <Sparkles size={16} /> Dùng AI tạo thêm
                          </button>
                      </div>
                  </div>

                  {/* EDITOR CONTENT AREA */}
                  {editorMode === 'VISUAL' ? (
                      /* --- VISUAL MODE --- */
                      <div className="space-y-6 flex-1">
                        {cards.map((card, index) => (
                        <div 
                            key={card.id} 
                            ref={(el) => { cardRefs.current[card.id] = el; }}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-300 overflow-hidden relative group scroll-mt-24 ${
                                activeCardId === card.id 
                                ? 'border-indigo-500 ring-1 ring-indigo-200 dark:ring-indigo-900 shadow-md' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                            }`}
                            onClick={() => setActiveCardId(card.id)}
                        >
                            {/* Card Header */}
                            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                                        {index + 1}
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">Quiz</span>
                                    {(!card.definition || !card.options?.includes(card.definition)) && (
                                        <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
                                            <AlertCircle size={14} /> Chọn đáp án đúng
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.id); }}
                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" 
                                    title="Xóa câu hỏi"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Question Input */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                                        <BrainCircuit size={14} /> Câu hỏi
                                    </label>
                                    <textarea
                                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 font-medium text-lg leading-relaxed resize-none"
                                        placeholder="Nhập nội dung câu hỏi..."
                                        rows={2}
                                        value={card.term}
                                        onChange={e => handleTermChange(card.id, e.target.value)}
                                    />
                                </div>

                                {/* Options Grid */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
                                        <List size={14} /> Các lựa chọn đáp án
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {card.options?.map((option, optIdx) => {
                                            const isCorrect = card.definition === option && option !== '';
                                            return (
                                                <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-gray-400 dark:focus-within:border-gray-500'}`}>
                                                    <div 
                                                        onClick={() => handleSetCorrectAnswer(card.id, option)}
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${isCorrect ? 'border-green-500 bg-green-500 text-white scale-110' : 'border-gray-300 dark:border-gray-500 text-transparent hover:border-green-400'}`}
                                                        title="Đánh dấu là đáp án đúng"
                                                    >
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                    <div className="flex-1">
                                                         <input 
                                                            type="text"
                                                            className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 font-medium text-sm"
                                                            placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}...`}
                                                            value={option}
                                                            onChange={(e) => handleOptionChange(card.id, optIdx, e.target.value)}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveOption(card.id, optIdx)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {(card.options?.length || 0) < 6 && (
                                        <button 
                                            onClick={() => handleAddOption(card.id)}
                                            className="mt-3 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1 px-1"
                                        >
                                            <Plus size={14} /> Thêm lựa chọn khác
                                        </button>
                                    )}
                                </div>

                                {/* Explanation & Link Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                        <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">
                                            <Lightbulb size={14} /> Giải thích / Hướng dẫn
                                        </label>
                                        <textarea
                                            className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-blue-900 dark:text-blue-200 placeholder-blue-300 resize-none text-sm leading-relaxed"
                                            placeholder="Nhập lời giải thích cho đáp án đúng..."
                                            rows={2}
                                            value={card.explanation || ''}
                                            onChange={e => handleExplanationChange(card.id, e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <Link size={14} /> Link bài viết tham khảo
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
                                            placeholder="https://vidu.com/bai-viet..."
                                            value={card.relatedLink || ''}
                                            onChange={e => handleLinkChange(card.id, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}

                        <button
                            onClick={handleAddCard}
                            className="w-full py-4 mt-4 bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-bold hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Plus size={20} /> Thêm câu hỏi mới
                        </button>
                      </div>
                  ) : (
                      /* --- TEXT MODE (Split View Full Height) --- */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
                          {/* Input Column */}
                          <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Nhập liệu</span>
                                  <div className="text-[10px] text-gray-400 flex gap-2">
                                      <span>* = Đáp án đúng</span>
                                      <span>&lt;br /&gt; = Xuống dòng</span>
                                  </div>
                              </div>
                              <textarea
                                  className="flex-1 w-full p-4 bg-transparent outline-none font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 h-full resize-none"
                                  placeholder={`Nhập câu hỏi tại đây...

Câu hỏi 1
A. Lựa chọn 1
*B. Lựa chọn 2 (Đáp án đúng)
C. Lựa chọn 3

Câu hỏi 2 (cách 1 dòng)
*A. Đúng
B. Sai`}
                                  value={textEditorContent}
                                  onChange={(e) => setTextEditorContent(e.target.value)}
                              />
                          </div>

                          {/* Preview Column */}
                          <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center shrink-0">
                                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-300 flex items-center gap-2">
                                      <Eye size={12} /> Xem trước ({parsedPreviewCards.length})
                                  </span>
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                  {parsedPreviewCards.length === 0 ? (
                                      <div className="text-center text-gray-400 text-sm mt-10">
                                          Nội dung xem trước sẽ hiển thị tại đây...
                                      </div>
                                  ) : (
                                      parsedPreviewCards.map((card, idx) => {
                                          const isValid = card.term && card.definition && card.options?.length && card.options.length >= 2;
                                          return (
                                              <div key={idx} className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${isValid ? 'border-gray-200 dark:border-gray-700' : 'border-orange-300 dark:border-orange-500'}`}>
                                                  <div className="flex gap-2 items-start mb-2">
                                                      <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{idx + 1}</span>
                                                      <p className="text-sm font-bold text-gray-900 dark:text-white flex-1 whitespace-pre-line">{card.term}</p>
                                                      {!isValid && <AlertTriangle size={14} className="text-orange-500" />}
                                                  </div>
                                                  <div className="space-y-1 ml-6">
                                                      {card.options?.map((opt, i) => (
                                                          <div key={i} className={`text-xs flex items-center gap-2 ${opt === card.definition ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                              {opt === card.definition && <Check size={12} />}
                                                              <span className="whitespace-pre-line">{opt}</span>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          );
                                      })
                                  )}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* SHARED AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        {aiMode === 'TEXT_TOPIC' && <><BrainCircuit className="text-purple-600" /> AI Tạo từ Chủ đề</>}
                        {aiMode === 'FILE_SCAN_QUIZ' && <><ScanLine className="text-indigo-600" /> Quét Đề thi / Tài liệu</>}
                    </h3>
                    <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                {aiMode === 'TEXT_TOPIC' ? (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Nhập chủ đề bạn muốn học, AI sẽ tự động tạo danh sách câu hỏi trắc nghiệm.</p>
                        <textarea
                            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-4 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm transition-colors"
                            placeholder="Ví dụ: 50 từ vựng tiếng Anh chủ đề Du lịch..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            autoFocus
                        ></textarea>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                            Tải lên file đề thi (PDF, DOCX, Ảnh). AI sẽ trích xuất câu hỏi và đáp án.
                        </p>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative mb-6 group">
                            <input 
                                type="file" 
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {aiFile ? (
                                <div className="flex flex-col items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-sm truncate max-w-[200px] block">{aiFile.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Nhấn để thay đổi file</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400 flex flex-col items-center group-hover:scale-105 transition-transform">
                                    <Upload size={32} className="mb-3 text-gray-400" />
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Nhấn để tải lên file</span>
                                    <span className="text-xs mt-1">Hỗ trợ PDF, Ảnh, Word</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating || (aiMode === 'TEXT_TOPIC' ? !aiPrompt.trim() : !aiFile)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all shadow-md hover:shadow-indigo-200"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        {isGenerating ? 'Đang xử lý...' : 'Bắt đầu tạo'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateSet;