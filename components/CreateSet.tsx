
import React, { useState, useRef, useEffect } from 'react';
import { Flashcard, StudySet, PrivacyStatus, AiGenerationRecord } from '../types';
import { generateStudySetWithAI, generateStudySetFromFile } from '../services/geminiService';
import { studySetService, CreateStudySetRequest } from '../services/studySetService';
import { Plus, Trash2, Sparkles, Save, FileText, Upload, CheckCircle, Keyboard, ScanLine, ArrowLeft, BrainCircuit, Check, X, AlertCircle, Lightbulb, Layers, List, BookOpen, Link, Globe, Lock, Building, GraduationCap, Hash, Bookmark, Eye, AlertTriangle, HelpCircle, Copy, Info, Clock, CheckSquare } from 'lucide-react';
import ThemeLoader from './ThemeLoader';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

interface CreateSetProps {
  onSave: (set: StudySet) => void;
  onCancel: () => void;
  onGoToAiTextbook: () => void;
  history?: AiGenerationRecord[];
  onSelectHistory?: (record: AiGenerationRecord) => void;
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

const SAMPLE_TEXT_FORMAT = `Thủ đô của Việt Nam là gì?
A. Thành phố Hồ Chí Minh
*B. Hà Nội
C. Đà Nẵng
D. Hải Phòng

Công thức hóa học của nước là?
A. H2O2
*B. H2O
C. HO
D. O2

Ai là người sáng lập Microsoft?
A. Steve Jobs
B. Elon Musk
*C. Bill Gates`;

const CreateSet: React.FC<CreateSetProps> = ({ onSave, onCancel, onGoToAiTextbook, history = [], onSelectHistory }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addNotification } = useApp();

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
  const [showTextGuide, setShowTextGuide] = useState(false);

  // Refs for scrolling
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<AiGenerationMode>('TEXT_TOPIC');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiFile, setAiFile] = useState<{name: string, data: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- CHECK PERMISSIONS ---
  const hasPerm = (perm: string) => user?.permissions?.includes(perm) || false;

  const canManualEntry = hasPerm('MANUAL_ENTRY_POST');
  const canScanDoc = hasPerm('SCAN_DOCUMENT_POST');
  const canAiTopic = hasPerm('AI_BY_TOPIC_POST');
  const canAiPlanner = hasPerm('AI_LESON_PLANNER_POST');

  const getPermissionTooltip = (hasPermission: boolean) => {
      return hasPermission ? "" : "Bạn không có quyền sử dụng tính năng này. Vui lòng liên hệ quản trị viên.";
  };

  // Warn user before leaving page if generating
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isGenerating]);

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
          setTextEditorContent(stringifyCardsToText(cards));
      } else {
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
      alert(t('notifications.enter_title'));
      return;
    }
    const validCards = finalCards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length < 2) {
      alert(t('notifications.min_cards'));
      return;
    }

    const newSet: StudySet = {
      id: uuidv4(),
      title,
      description,
      author: user?.name || 'Bạn',
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

      // 1. Gọi AI sinh nội dung
      if (aiMode === 'TEXT_TOPIC') {
          const result = await generateStudySetWithAI(aiPrompt, aiQuestionCount);
          generatedTitle = result.title;
          generatedDescription = result.description;
          generatedCards = result.cards;
      } else if (aiMode === 'FILE_SCAN_QUIZ') {
          const result = await generateStudySetFromFile(aiFile!.data, aiFile!.name);
          generatedTitle = result.title;
          generatedDescription = result.description;
          generatedCards = result.cards;
      }

      // 2. Chuẩn bị request lưu Backend
      const saveRequest: CreateStudySetRequest = {
          topic: aiMode === 'TEXT_TOPIC' ? aiPrompt : aiFile!.name,
          language: i18n.language || 'vi',
          title: generatedTitle,
          description: generatedDescription,
          cards: generatedCards.map(c => ({
              term: c.term,
              definition: c.definition,
              options: c.options || [],
              explanation: c.explanation || ''
          }))
      };

      try {
          // 3. Gọi API POST /study-sets
          // Theo yêu cầu: trả về { "code": 1000, "result": 52 }
          const postResponse = await studySetService.createStudySet(saveRequest);
          
          if (postResponse.code === 1000) {
              const newId = postResponse.result; // result chứa ID trực tiếp (VD: 52)
              
              // 4. Gọi API GET /study-sets/{id} để lấy dữ liệu chuẩn xác từ DB
              const detailResponse = await studySetService.getStudySetById(newId);
              
              if (detailResponse.code === 1000) {
                  const apiData = detailResponse.result;
                  
                  // 5. Cập nhật dữ liệu từ DB vào Editor
                  setTitle(apiData.title);
                  setDescription(apiData.description);
                  setTopic(apiData.topic || '');
                  
                  const dbCards: Flashcard[] = apiData.cards.map((c: any) => ({
                      id: c.id.toString(),
                      term: c.term,
                      definition: c.definition,
                      options: c.options || [],
                      explanation: c.explanation || '',
                      relatedLink: ''
                  }));
                  
                  setCards(dbCards);
                  if (editorMode === 'TEXT') {
                      setTextEditorContent(stringifyCardsToText(dbCards));
                  }
                  
                  addNotification("Đã tạo và lưu học phần thành công!", "success");
              }
          }
      } catch (apiError: any) {
          console.error("Backend Flow Error:", apiError);
          // Fallback: Nếu API lỗi, vẫn hiển thị kết quả từ AI để người dùng không mất dữ liệu
          setTitle(generatedTitle);
          setDescription(generatedDescription);
          const localCards = generatedCards.map(c => ({ 
              ...c, 
              id: uuidv4(),
              options: c.options || [],
              explanation: c.explanation || '',
              relatedLink: ''
          }));
          setCards(localCards);
          addNotification("Không thể lưu lên máy chủ, đang hiển thị bản nháp tạm thời.", "warning");
      }

      setShowAiModal(false);
      setAiPrompt('');
      setAiFile(null);
      setCreationStep('EDITOR');

    } catch (error) {
      alert(t('notifications.ai_error'));
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
      setAiQuestionCount(10);
  };

  // --- RENDER: SELECTION MENU ---
  if (creationStep === 'MENU') {
      return (
          <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in relative pb-32">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('create_set.title_method')}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{t('create_set.desc_method')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-full mx-auto mb-8">
                  {/* MANUAL ENTRY */}
                  <button 
                    onClick={startManual}
                    disabled={!canManualEntry}
                    title={getPermissionTooltip(canManualEntry)}
                    className={`group bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${
                        canManualEntry 
                        ? 'hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl' 
                        : 'opacity-50 cursor-not-allowed grayscale'
                    }`}
                  >
                      {!canManualEntry && <div className="absolute top-2 right-2"><Lock size={16} className="text-gray-400"/></div>}
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Keyboard size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('create_set.manual_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {t('create_set.manual_desc')}
                      </p>
                  </button>

                  {/* AI BY TOPIC */}
                  <button 
                    onClick={() => openAiModal('TEXT_TOPIC')}
                    disabled={!canAiTopic}
                    title={getPermissionTooltip(canAiTopic)}
                    className={`group bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative overflow-hidden ${
                        canAiTopic
                        ? 'hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-xl'
                        : 'opacity-50 cursor-not-allowed grayscale'
                    }`}
                  >
                      {!canAiTopic && <div className="absolute top-2 right-2 z-10"><Lock size={16} className="text-gray-400"/></div>}
                      <div className="absolute top-0 right-0 p-2">
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">{t('create_set.popular_badge')}</span>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <BrainCircuit size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('create_set.ai_topic_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {t('create_set.ai_topic_desc')}
                      </p>
                  </button>

                  {/* SCAN DOCUMENT */}
                  <button 
                    onClick={() => openAiModal('FILE_SCAN_QUIZ')}
                    disabled={!canScanDoc}
                    title={getPermissionTooltip(canScanDoc)}
                    className={`group bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative ${
                        canScanDoc
                        ? 'hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xl'
                        : 'opacity-50 cursor-not-allowed grayscale'
                    }`}
                  >
                      {!canScanDoc && <div className="absolute top-2 right-2"><Lock size={16} className="text-gray-400"/></div>}
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <ScanLine size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('create_set.scan_file_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {t('create_set.scan_file_desc')}
                      </p>
                  </button>

                  {/* AI LESSON PLANNER */}
                  <button 
                    onClick={onGoToAiTextbook}
                    disabled={!canAiPlanner}
                    title={getPermissionTooltip(canAiPlanner)}
                    className={`group bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all text-left flex flex-col h-full relative overflow-hidden ${
                        canAiPlanner
                        ? 'hover:border-pink-500 dark:hover:border-pink-400 hover:shadow-xl'
                        : 'opacity-50 cursor-not-allowed grayscale'
                    }`}
                  >
                      {!canAiPlanner && <div className="absolute top-2 right-2 z-10"><Lock size={16} className="text-gray-400"/></div>}
                      <div className="absolute top-0 right-0 p-2">
                          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1">
                             <Sparkles size={10} /> {t('create_set.pro_badge')}
                          </span>
                      </div>
                      <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <BookOpen size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('create_set.ai_textbook_title')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {t('create_set.ai_textbook_desc')}
                      </p>
                  </button>
              </div>

              {/* RECENT ACTIVITY TABLE */}
              {history.length > 0 && (
                  <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              <Clock size={18} className="text-gray-500" />
                              {t('create_set.recent_activity')}
                          </h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
                                  <tr>
                                      <th className="px-6 py-3">{t('create_set.col_name')}</th>
                                      <th className="px-6 py-3">{t('create_set.col_type')}</th>
                                      <th className="px-6 py-3">{t('create_set.col_date')}</th>
                                      <th className="px-6 py-3">{t('create_set.col_status')}</th>
                                      <th className="px-6 py-3 text-right">Action</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {history.map((record) => {
                                      const isTextbook = record.result?.topics?.length > 0;
                                      return (
                                          <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                                  {record.fileName || (record.result?.topics?.[0]?.topicName) || "Untitled"}
                                              </td>
                                              <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                  {isTextbook ? (
                                                      <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-pink-500" /> {t('create_set.ai_textbook_title')}</span>
                                                  ) : (
                                                      <span className="flex items-center gap-1.5"><ScanLine size={14} className="text-indigo-500" /> {t('create_set.scan_file_title')}</span>
                                                  )}
                                              </td>
                                              <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                  {new Date(record.createdAt).toLocaleDateString()}
                                              </td>
                                              <td className="px-6 py-4">
                                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                      <CheckSquare size={12} /> {t('create_set.status_completed')}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                  <button 
                                                      onClick={() => onSelectHistory && onSelectHistory(record)}
                                                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-medium text-xs border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                  >
                                                      {t('create_set.action_view')}
                                                  </button>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              <div className="mt-12 text-center">
                  <button onClick={onCancel} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium">
                      {t('create_set.cancel')}
                  </button>
              </div>

              {/* SHARED AI MODAL */}
              {showAiModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                {aiMode === 'TEXT_TOPIC' && <><BrainCircuit className="text-purple-600" /> {t('create_set.ai_modal_topic_title')}</>}
                                {aiMode === 'FILE_SCAN_QUIZ' && <><ScanLine className="text-indigo-600" /> {t('create_set.ai_modal_scan_title')}</>}
                            </h3>
                            <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {aiMode === 'TEXT_TOPIC' ? (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{t('create_set.ai_modal_topic_desc')}</p>
                                <textarea
                                    className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-4 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm transition-colors"
                                    placeholder={t('create_set.ai_modal_topic_ph')}
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    autoFocus
                                ></textarea>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                                    {t('create_set.ai_modal_scan_desc')}
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
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{t('create_set.change_file')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 dark:text-gray-400 flex flex-col items-center group-hover:scale-105 transition-transform">
                                            <Upload size={32} className="mb-3 text-gray-400" />
                                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{t('create_set.click_upload')}</span>
                                            <span className="text-xs mt-1">{t('create_set.upload_support')}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Slider for Question Count (Only for TEXT_TOPIC) */}
                        {aiMode === 'TEXT_TOPIC' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                    {t('create_set.ai_modal_count_label')}
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{aiQuestionCount}</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="30" 
                                    value={aiQuestionCount}
                                    onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>5</span>
                                    <span>30</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                onClick={() => setShowAiModal(false)}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition-colors"
                            >
                                {t('create_set.cancel')}
                            </button>
                            <button 
                                onClick={handleAiGenerate}
                                disabled={isGenerating || (aiMode === 'TEXT_TOPIC' ? !aiPrompt.trim() : !aiFile)}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all shadow-md hover:shadow-indigo-200"
                            >
                                {isGenerating ? <ThemeLoader className="text-white" size={18} /> : <Sparkles size={18} />}
                                {isGenerating ? t('create_set.processing') : t('create_set.start_create')}
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
                title={t('create_set.back_menu')}
            >
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {t('create_set.editor_title')}
                {cards.length > 0 && <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">{cards.length} {t('class_mgmt.cards_count')}</span>}
            </h2>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={onCancel} 
                className="flex-1 sm:flex-none px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-colors"
            >
                {t('create_set.cancel')}
            </button>
            <button 
                onClick={handleSave}
                className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
            >
                <Save size={18} /> <span className="hidden sm:inline">{t('create_set.save_btn')}</span><span className="sm:hidden">{t('create_set.save_short')}</span>
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
                          <FileText size={18} className="text-indigo-600 dark:text-indigo-400" /> {t('create_set.general_info')}
                      </h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('create_set.title_label')}</label>
                              <input
                                  type="text"
                                  placeholder={t('create_set.title_ph')}
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white transition-colors placeholder-gray-400"
                                  value={title}
                                  onChange={e => setTitle(e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('create_set.desc_label')}</label>
                              <textarea
                                  placeholder={t('create_set.desc_ph')}
                                  rows={2}
                                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-700 dark:text-gray-200 transition-colors placeholder-gray-400 resize-none"
                                  value={description}
                                  onChange={e => setDescription(e.target.value)}
                              />
                          </div>

                          {/* Metadata Fields */}
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Globe size={10} /> {t('create_set.privacy_label')}</label>
                                  <select 
                                    value={privacy}
                                    onChange={(e) => setPrivacy(e.target.value as PrivacyStatus)}
                                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  >
                                      <option value="PUBLIC">{t('create_set.public')}</option>
                                      <option value="PRIVATE">{t('create_set.private')}</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><GraduationCap size={10} /> {t('create_set.level_label')}</label>
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
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><BookOpen size={10} /> {t('create_set.subject_label')}</label>
                              <input 
                                type="text"
                                placeholder={t('create_set.subject_ph')}
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Building size={10} /> {t('create_set.school_label')}</label>
                              <input 
                                type="text"
                                list="school-options"
                                placeholder={t('create_set.school_ph')}
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
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Bookmark size={10} /> {t('create_set.major_label')}</label>
                              <input 
                                type="text"
                                placeholder={t('create_set.major_ph')}
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> {t('create_set.topic_label')}</label>
                              <input 
                                type="text"
                                placeholder={t('create_set.topic_ph')}
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
                              <List size={18} className="text-indigo-600 dark:text-indigo-400" /> {t('create_set.toc_title')}
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
                                <Plus size={16} /> {t('create_set.add_quick')}
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
                              <Layers size={16} /> {t('create_set.visual_mode')}
                          </button>
                          <button
                            onClick={() => handleSwitchMode('TEXT')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
                                editorMode === 'TEXT' 
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                              <FileText size={16} /> {t('create_set.text_mode')}
                          </button>
                          
                          <button 
                            onClick={() => setShowTextGuide(true)}
                            className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 text-sm font-medium transition-colors whitespace-nowrap"
                          >
                              <HelpCircle size={16} /> {t('create_set.guide')}
                          </button>
                      </div>
                      
                      <div className="flex gap-2">
                          <button
                              onClick={() => openAiModal('TEXT_TOPIC')}
                              disabled={!canAiTopic}
                              title={getPermissionTooltip(canAiTopic)}
                              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-all ${
                                  canAiTopic 
                                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90' 
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed grayscale'
                              }`}
                          >
                              {canAiTopic ? <Sparkles size={16} /> : <Lock size={14} />} 
                              {t('create_set.use_ai')}
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
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">{t('create_set.quiz')}</span>
                                    {(!card.definition || !card.options?.includes(card.definition)) && (
                                        <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
                                            <AlertCircle size={14} /> {t('create_set.choose_correct')}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.id); }}
                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" 
                                    title={t('create_set.delete_card')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Question Input */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                                        <BrainCircuit size={14} /> {t('create_set.question_label')}
                                    </label>
                                    <textarea
                                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 font-medium text-lg leading-relaxed resize-none"
                                        placeholder={t('create_set.question_ph')}
                                        rows={2}
                                        value={card.term}
                                        onChange={e => handleTermChange(card.id, e.target.value)}
                                    />
                                </div>

                                {/* Options Grid */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-1">
                                        <List size={14} /> {t('create_set.options_label')}
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {card.options?.map((option, optIdx) => {
                                            const isCorrect = card.definition === option && option !== '';
                                            return (
                                                <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:border-gray-400 dark:focus-within:border-gray-500'}`}>
                                                    <div 
                                                        onClick={() => handleSetCorrectAnswer(card.id, option)}
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${isCorrect ? 'border-green-500 bg-green-500 text-white scale-110' : 'border-gray-300 dark:border-gray-500 text-transparent hover:border-green-400'}`}
                                                        title={t('create_set.choose_correct')}
                                                    >
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                    <div className="flex-1">
                                                         <input 
                                                            type="text"
                                                            className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 font-medium text-sm"
                                                            placeholder={t('create_set.option_ph', { char: String.fromCharCode(65 + optIdx) })}
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
                                            <Plus size={14} /> {t('create_set.add_option')}
                                        </button>
                                    )}
                                </div>

                                {/* Explanation & Link Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                        <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">
                                            <Lightbulb size={14} /> {t('create_set.explanation_label')}
                                        </label>
                                        <textarea
                                            className="w-full p-2 bg-transparent border-none focus:ring-0 outline-none text-blue-900 dark:text-blue-200 placeholder-blue-300 resize-none text-sm leading-relaxed"
                                            placeholder={t('create_set.explanation_ph')}
                                            rows={2}
                                            value={card.explanation || ''}
                                            onChange={e => handleExplanationChange(card.id, e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                                            <Link size={14} /> {t('create_set.link_label')}
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
                                            placeholder="https://..."
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
                            <Plus size={20} /> {t('create_set.add_new_card')}
                        </button>
                      </div>
                  ) : (
                      /* --- TEXT MODE (Split View Full Height) --- */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
                          <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{t('create_set.input_label')}</span>
                                  <div className="text-[10px] text-gray-400 flex gap-2">
                                      <span>{t('create_set.input_hint_correct')}</span>
                                      <span>{t('create_set.input_hint_break')}</span>
                                  </div>
                              </div>
                              <textarea
                                  className="flex-1 w-full p-4 bg-transparent outline-none font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 h-full resize-none"
                                  placeholder={`Nhập câu hỏi tại đây...`}
                                  value={textEditorContent}
                                  onChange={(e) => setTextEditorContent(e.target.value)}
                              />
                          </div>

                          <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="p-3 bg-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center shrink-0">
                                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-300 flex items-center gap-2">
                                      <Eye size={12} /> {t('create_set.preview_title')} ({parsedPreviewCards.length})
                                  </span>
                              </div>

                              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-gray-800/30">
                                  {parsedPreviewCards.length === 0 ? (
                                      <div className="text-center text-gray-400 text-sm mt-10">
                                          {t('create_set.preview_empty')}
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

      {/* TEXT GUIDE MODAL */}
      {showTextGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowTextGuide(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Info size={20} className="text-indigo-600" /> {t('create_set.guide_title')}
                    </h3>
                    <button onClick={() => setShowTextGuide(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="space-y-2">
                        <p><strong className="text-indigo-600 dark:text-indigo-400">{t('create_set.guide_step_1')}</strong></p>
                        <p><strong className="text-indigo-600 dark:text-indigo-400">{t('create_set.guide_step_2')}</strong></p>
                        <p><strong className="text-indigo-600 dark:text-indigo-400">{t('create_set.guide_step_3')}</strong></p>
                        <p><strong className="text-indigo-600 dark:text-indigo-400">{t('create_set.guide_step_4')}</strong></p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 relative group">
                        <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                            {SAMPLE_TEXT_FORMAT}
                        </pre>
                        <button 
                            onClick={() => { setTextEditorContent(SAMPLE_TEXT_FORMAT); setShowTextGuide(false); }}
                            className="absolute top-2 right-2 bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 p-1.5 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100"
                        >
                            <Copy size={12} /> {t('create_set.copy_sample')}
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button 
                        onClick={() => { setTextEditorContent(SAMPLE_TEXT_FORMAT); setShowTextGuide(false); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Copy size={16} /> {t('create_set.copy_to_editor')}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* SHARED AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        {aiMode === 'TEXT_TOPIC' && <><BrainCircuit className="text-purple-600" /> {t('create_set.ai_modal_topic_title')}</>}
                        {aiMode === 'FILE_SCAN_QUIZ' && <><ScanLine className="text-indigo-600" /> {t('create_set.ai_modal_scan_title')}</>}
                    </h3>
                    <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                {aiMode === 'TEXT_TOPIC' ? (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{t('create_set.ai_modal_topic_desc')}</p>
                        <textarea
                            className="w-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl p-4 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 text-sm transition-colors"
                            placeholder={t('create_set.ai_modal_topic_ph')}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            autoFocus
                        ></textarea>
                    </>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                            {t('create_set.ai_modal_scan_desc')}
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
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('create_set.change_file')}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 dark:text-gray-400 flex flex-col items-center group-hover:scale-105 transition-transform">
                                    <Upload size={32} className="mb-3 text-gray-400" />
                                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">{t('create_set.click_upload')}</span>
                                    <span className="text-xs mt-1">{t('create_set.upload_support')}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Slider for Question Count (Only for TEXT_TOPIC) */}
                {aiMode === 'TEXT_TOPIC' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                            {t('create_set.ai_modal_count_label')}
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{aiQuestionCount}</span>
                        </label>
                        <input 
                            type="range" 
                            min="5" 
                            max="30" 
                            value={aiQuestionCount}
                            onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>5</span>
                            <span>30</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium text-sm transition-colors"
                    >
                        {t('create_set.cancel')}
                    </button>
                    <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating || (aiMode === 'TEXT_TOPIC' ? !aiPrompt.trim() : !aiFile)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all shadow-md hover:shadow-indigo-200"
                    >
                        {isGenerating ? <ThemeLoader className="text-white" size={18} /> : <Sparkles size={18} />}
                        {isGenerating ? t('create_set.processing') : t('create_set.start_create')}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateSet;
