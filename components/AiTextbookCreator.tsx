
import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, FileText, CheckCircle, BookOpen, BrainCircuit, ChevronDown, ChevronUp, Save, Book, Sigma, PenTool, Lightbulb, Layers, GraduationCap, FileType, Image as ImageIcon, History, Clock, ArrowRight, X, Trash2, Edit3, Plus, Check, List, Link, ArrowLeft, Globe, Lock, Building, Hash, Bookmark, FileEdit } from 'lucide-react';
import { analyzeTextbookWithAI } from '../services/geminiService';
import { studySetService, CreateStudySetRequest } from '../services/studySetService';
import { TextbookAnalysisResult, StudySet, AiGenerationRecord, Flashcard, PrivacyStatus, StudySetType } from '../types';
import ThemeLoader from './ThemeLoader';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';

interface AiTextbookCreatorProps {
    onSaveToLibrary: (set: StudySet) => void;
    history: AiGenerationRecord[];
    onAddToHistory: (record: AiGenerationRecord) => void;
    onBack: () => void;
}

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

const AiTextbookCreator: React.FC<AiTextbookCreatorProps> = ({ onSaveToLibrary, history, onAddToHistory, onBack }) => {
    const { t, i18n } = useTranslation();
    const { addNotification } = useApp();
    const [activeTab, setActiveTab] = useState<'CREATE' | 'HISTORY'>('CREATE');
    const [file, setFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [result, setResult] = useState<TextbookAnalysisResult | null>(null);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingSet, setEditingSet] = useState<{
        title: string;
        description: string;
        privacy: PrivacyStatus;
        status: string;
        level: string;
        school: string;
        major: string;
        subject: string;
        topic: string;
        cards: Flashcard[];
    }>({ 
        title: '', 
        description: '', 
        privacy: 'PUBLIC',
        status: 'ACTIVE',
        level: 'Trung học phổ thông',
        school: '',
        major: '',
        subject: '',
        topic: '',
        cards: [] 
    });

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isAnalyzing || isSaving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isAnalyzing, isSaving]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 100 * 1024 * 1024) {
                alert(t('ai_creator.error_file_size'));
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = () => {
                setFile({ 
                    name: selectedFile.name, 
                    data: reader.result as string,
                    type: selectedFile.type
                });
                setResult(null);
                setSelectedTopicIndex(0);
            };
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const data = await analyzeTextbookWithAI(file.data);
            setResult(data);
            const newRecord: AiGenerationRecord = {
                id: uuidv4(),
                createdAt: Date.now(),
                fileName: file.name,
                result: data
            };
            onAddToHistory(newRecord);
        } catch (error) {
            alert(t('ai_creator.error_analyze'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleHistorySelect = (record: AiGenerationRecord) => {
        setResult(record.result);
        setFile({ name: record.fileName, data: '', type: 'unknown' });
        setActiveTab('CREATE');
        setSelectedTopicIndex(0);
    };

    const handleOpenSaveModal = () => {
        if (!result) return;
        const currentTopic = result.topics[selectedTopicIndex];
        const quizQuestions = currentTopic.questions.filter(q => q.type === 'QUIZ');
        const initialCards: Flashcard[] = quizQuestions.map(q => {
            const cleanOptions = q.options ? q.options.map(o => o.replace(/^[A-Z][\.\)]\s*/, '')) : [];
            const rawCorrect = q.correctAnswer || "";
            const cleanCorrect = rawCorrect.replace(/^[A-Z][\.\)]\s*/, '');
            
            return {
                id: uuidv4(),
                term: q.question,
                definition: cleanCorrect,
                options: cleanOptions.length > 0 ? cleanOptions : [cleanCorrect, "Đáp án B", "Đáp án C", "Đáp án D"],
                explanation: q.solutionGuide || "",
                relatedLink: ""
            };
        });
        setEditingSet({
            title: currentTopic.topicName,
            description: `${currentTopic.summary}. Tổng hợp kiến thức: ${result.grade}.`,
            privacy: 'PUBLIC',
            status: 'ACTIVE',
            level: 'Trung học phổ thông',
            school: '',
            major: '',
            subject: result.subject || '',
            topic: currentTopic.topicName,
            cards: initialCards
        });
        setShowSaveModal(true);
    };

    const handleLevelChangeInModal = (newLevel: string) => {
        setEditingSet(prev => ({ ...prev, level: newLevel, school: '' }));
    };

    const handleCardTermChange = (id: string, value: string) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => c.id === id ? { ...c, term: value } : c)
        }));
    };

    const handleCardExplanationChange = (id: string, value: string) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => c.id === id ? { ...c, explanation: value } : c)
        }));
    };

    const handleCardLinkChange = (id: string, value: string) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => c.id === id ? { ...c, relatedLink: value } : c)
        }));
    };

    const handleCardOptionChange = (cardId: string, optionIndex: number, value: string) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => {
                if (c.id !== cardId) return c;
                const newOptions = [...(c.options || [])];
                const oldValue = newOptions[optionIndex];
                newOptions[optionIndex] = value;
                
                const wasSelectedAsCorrect = c.definition !== '' && c.definition === oldValue;
                
                return { 
                    ...c, 
                    options: newOptions, 
                    definition: wasSelectedAsCorrect ? value : c.definition 
                };
            })
        }));
    };

    const handleSetCorrectAnswer = (cardId: string, optionValue: string) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => c.id === cardId ? { ...c, definition: optionValue } : c)
        }));
    };

    const handleAddOption = (cardId: string) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => {
                if (c.id !== cardId) return c;
                return { ...c, options: [...(c.options || []), ''] };
            })
        }));
    };

    const handleRemoveOption = (cardId: string, optionIndex: number) => {
        setEditingSet(prev => ({
            ...prev,
            cards: prev.cards.map(c => {
                if (c.id !== cardId) return c;
                const newOptions = [...(c.options || [])];
                const removedValue = newOptions[optionIndex];
                newOptions.splice(optionIndex, 1);
                
                let newDef = c.definition === removedValue ? '' : c.definition;
                
                return { ...c, options: newOptions, definition: newDef };
            })
        }));
    };

    const handleRemoveCard = (cardId: string) => {
        setEditingSet(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== cardId) }));
    };

    const handleAddNewCard = () => {
        setEditingSet(prev => ({
            ...prev,
            cards: [...prev.cards, { id: uuidv4(), term: '', definition: '', options: ['', '', '', ''], explanation: '', relatedLink: '' }]
        }));
    };

    const handleFinalSave = async () => {
        if (!editingSet.title.trim()) {
            alert(t('ai_creator.error_no_title'));
            return;
        }

        if (editingSet.cards.length < 2) {
            alert(t('notifications.min_cards'));
            return;
        }

        setIsSaving(true);
        try {
            const saveRequest: CreateStudySetRequest = {
                topic: editingSet.topic || editingSet.title,
                language: i18n.language || 'vi',
                title: editingSet.title,
                description: editingSet.description,
                type: 'AI_TEXTBOOK',
                status: editingSet.status, // ACTIVE, DRAFT
                cards: editingSet.cards.map(c => ({
                    term: c.term,
                    definition: c.definition,
                    options: c.options || [],
                    explanation: c.explanation || ''
                }))
            };

            const response = await studySetService.createStudySet(saveRequest);

            if (response.code === 1000) {
                const newSet: StudySet = {
                    id: response.result?.toString() || uuidv4(),
                    title: editingSet.title,
                    description: editingSet.description,
                    author: 'AI Assistant',
                    createdAt: Date.now(),
                    cards: editingSet.cards,
                    privacy: editingSet.privacy,
                    status: editingSet.status,
                    level: editingSet.level,
                    school: editingSet.school,
                    major: editingSet.major,
                    subject: editingSet.subject,
                    topic: editingSet.topic,
                    type: 'AI_TEXTBOOK'
                };
                
                setShowSaveModal(false);
                onSaveToLibrary(newSet);
                addNotification("Đã lưu học phần từ giáo án thành công!", "success");
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error("Save failed:", error);
            addNotification("Lỗi khi lưu lên máy chủ. Vui lòng kiểm tra lại kết nối.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 font-medium transition-colors">
                <ArrowLeft size={20} /> {t('common.back')}
            </button>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="text-indigo-600 dark:text-indigo-400" /> {t('ai_creator.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{t('ai_creator.subtitle')}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex font-medium text-sm self-stretch md:self-auto">
                    <button onClick={() => setActiveTab('CREATE')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'CREATE' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        <Upload size={16} /> {t('ai_creator.tab_create')}
                    </button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                        <History size={16} /> {t('ai_creator.tab_history')} ({history.length})
                    </button>
                </div>
            </div>
            {/* History and Create Tabs UI ... */}
            {activeTab === 'CREATE' && (
                <div className="animate-fade-in">
                    {!result && (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
                            {/* Upload UI ... */}
                        </div>
                    )}
                    {result && (
                        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Analysis Result UI ... */}
                        </div>
                    )}
                </div>
            )}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl transition-colors animate-fade-in">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750 rounded-t-2xl"><div><h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Edit3 size={20} className="text-indigo-600 dark:text-indigo-400" /> {t('ai_creator.modal_title')}</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('ai_creator.modal_desc')}</p></div><button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={24} /></button></div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('ai_creator.input_name')}</label><input type="text" value={editingSet.title} onChange={(e) => setEditingSet({...editingSet, title: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg transition-colors"/></div>
                                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('ai_creator.input_desc')}</label><input type="text" value={editingSet.description} onChange={(e) => setEditingSet({...editingSet, description: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"/></div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Globe size={10} /> {t('create_set.privacy_label')}</label><select value={editingSet.privacy} onChange={(e) => setEditingSet({...editingSet, privacy: e.target.value as PrivacyStatus})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="PUBLIC">{t('create_set.public')}</option><option value="PRIVATE">{t('create_set.private')}</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><FileEdit size={10} /> Trạng thái</label><select value={editingSet.status} onChange={(e) => setEditingSet({...editingSet, status: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="ACTIVE">Hoạt động</option><option value="DRAFT">Bản nháp</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><GraduationCap size={10} /> {t('create_set.level_label')}</label><select value={editingSet.level} onChange={(e) => handleLevelChangeInModal(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">{EDUCATION_LEVELS.map(lvl => (<option key={lvl} value={lvl}>{lvl}</option>))}</select></div>
                                </div>
                                {/* Major, School, Topic inputs ... */}
                            </div>
                            {/* Questions list UI ... */}
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl flex justify-end gap-3 transition-colors"><button onClick={() => setShowSaveModal(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-bold transition-colors">{t('common.cancel')}</button><button onClick={handleFinalSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all hover:shadow-indigo-200 hover:-translate-y-0.5 disabled:opacity-50">{isSaving ? <ThemeLoader className="text-white" size={18} /> : <Save size={18} />} {t('ai_creator.confirm_save')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiTextbookCreator;
