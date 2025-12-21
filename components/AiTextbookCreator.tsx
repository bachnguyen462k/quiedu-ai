
import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, FileText, CheckCircle, BookOpen, BrainCircuit, ChevronDown, ChevronUp, Save, Book, Sigma, PenTool, Lightbulb, Layers, GraduationCap, FileType, Image as ImageIcon, History, Clock, ArrowRight, X, Trash2, Edit3, Plus, Check, List, Link, ArrowLeft, Globe, Lock, Building, Hash, Bookmark } from 'lucide-react';
import { analyzeTextbookWithAI } from '../services/geminiService';
import { TextbookAnalysisResult, StudySet, AiGenerationRecord, Flashcard, PrivacyStatus } from '../types';
import ThemeLoader from './ThemeLoader';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'CREATE' | 'HISTORY'>('CREATE');
    const [file, setFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<TextbookAnalysisResult | null>(null);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingSet, setEditingSet] = useState<{
        title: string;
        description: string;
        privacy: PrivacyStatus;
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
        level: 'Trung học phổ thông',
        school: '',
        major: '',
        subject: '',
        topic: '',
        cards: [] 
    });

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isAnalyzing) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isAnalyzing]);

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
                options: cleanOptions.length > 0 ? cleanOptions : [cleanCorrect, "", "", ""],
                explanation: q.solutionGuide || "",
                relatedLink: ""
            };
        });
        setEditingSet({
            title: currentTopic.topicName,
            description: `${currentTopic.summary}. Tổng hợp câu hỏi từ ${result.grade}.`,
            privacy: 'PUBLIC',
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
                newOptions[optionIndex] = value;
                const isCurrentlyCorrect = c.definition === c.options?.[optionIndex];
                return { ...c, options: newOptions, definition: isCurrentlyCorrect ? value : c.definition };
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
                let newDef = c.definition;
                if (c.definition === removedValue) {
                    newDef = newOptions.length > 0 ? newOptions[0] : '';
                }
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

    const handleFinalSave = () => {
        if (!editingSet.title.trim()) {
            alert(t('ai_creator.error_no_title'));
            return;
        }
        const newSet: StudySet = {
            id: uuidv4(),
            title: editingSet.title,
            description: editingSet.description,
            author: 'AI Assistant',
            createdAt: Date.now(),
            cards: editingSet.cards,
            privacy: editingSet.privacy,
            level: editingSet.level,
            school: editingSet.school,
            major: editingSet.major,
            subject: editingSet.subject,
            topic: editingSet.topic
        };
        onSaveToLibrary(newSet);
        setShowSaveModal(false);
    };

    const renderDifficultyBar = (level: string) => {
        let activeSegments = 1;
        let colorClass = 'bg-green-500';
        let label = 'Nhận biết';
        switch (level) {
            case 'Nhận biết': activeSegments = 1; colorClass = 'bg-green-500'; label = 'Nhận biết'; break;
            case 'Thông hiểu': activeSegments = 2; colorClass = 'bg-blue-500'; label = 'Thông hiểu'; break;
            case 'Vận dụng': activeSegments = 3; colorClass = 'bg-orange-500'; label = 'Vận dụng'; break;
            case 'Vận dụng cao': activeSegments = 4; colorClass = 'bg-red-600'; label = 'Vận dụng cao'; break;
            default: activeSegments = 1;
        }
        return (
            <div className="flex flex-col gap-1 w-32">
                <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4].map((seg) => (
                        <div key={seg} className={`flex-1 rounded-full ${seg <= activeSegments ? colorClass : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    ))}
                </div>
                <span className={`text-[10px] font-bold uppercase text-right ${activeSegments === 1 ? 'text-green-600 dark:text-green-400' : activeSegments === 2 ? 'text-blue-600 dark:text-blue-400' : activeSegments === 3 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                    {label}
                </span>
            </div>
        );
    };

    const currentTopic = result?.topics[selectedTopicIndex];

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
            {activeTab === 'HISTORY' && (
                <div className="animate-fade-in">
                    {history.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                             <History className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('ai_creator.no_history_title')}</h3>
                             <p className="text-gray-500 dark:text-gray-400 mb-6">{t('ai_creator.no_history_desc')}</p>
                             <button onClick={() => setActiveTab('CREATE')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">{t('ai_creator.create_first')}</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map(record => (
                                <div key={record.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400"><Sparkles size={20} /></div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{new Date(record.createdAt).toLocaleDateString('vi-VN')}</div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">{record.result.topics[0]?.topicName || "Không có tên"}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{record.result.subject} - {record.result.grade}</p>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded"><FileText size={14} /><span className="truncate max-w-[200px]">{record.fileName}</span></div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded"><Layers size={14} /><span>{record.result.topics.length} chủ đề chính</span></div>
                                    </div>
                                    <button onClick={() => handleHistorySelect(record)} className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">{t('ai_creator.view_edit')} <ArrowRight size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'CREATE' && (
                <div className="animate-fade-in">
                    {!result && (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('ai_creator.upload_label')}</label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative group overflow-hidden">
                                        <input type="file" accept="application/pdf, image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"/>
                                        {file ? (
                                            <div className="flex flex-col items-center relative z-10">
                                                {file.type.startsWith('image/') ? (
                                                    <div className="w-32 h-32 mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm"><img src={file.data} alt="Preview" className="w-full h-full object-cover" /></div>
                                                ) : (
                                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-3"><FileType size={32} /></div>
                                                )}
                                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{file.name}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><CheckCircle size={12} /> {t('ai_creator.upload_success')}</p>
                                                <button className="mt-4 text-xs text-gray-500 dark:text-gray-400 underline hover:text-indigo-600 dark:hover:text-indigo-400 z-30 relative cursor-pointer pointer-events-none group-hover:pointer-events-auto">{t('ai_creator.change_file')}</button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex justify-center gap-4 mb-3"><div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors"><Upload size={24} /></div></div>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">{t('ai_creator.upload_prompt_title')}</p>
                                                <p className="text-xs text-gray-400 mt-1">{t('ai_creator.upload_prompt_desc')}</p>
                                                <div className="flex justify-center gap-2 mt-2"><span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FileType size={10} /> PDF</span><span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><ImageIcon size={10} /> ẢNH</span></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex flex-col justify-center w-full md:w-auto">
                                    <button onClick={handleAnalyze} disabled={!file || isAnalyzing} className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all w-full md:w-auto ${!file || isAnalyzing ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:-translate-y-1 hover:shadow-indigo-200'}`}>
                                        {isAnalyzing ? <ThemeLoader className="text-white" /> : <BrainCircuit />}
                                        {isAnalyzing ? t('ai_creator.analyzing') : t('ai_creator.analyze_btn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {result && currentTopic && (
                        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1 space-y-4">
                                <button onClick={() => { setResult(null); setFile(null); }} className="w-full mb-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">&larr; {t('ai_creator.back_create')}</button>
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-[400px] lg:max-h-[calc(100vh-200px)] flex flex-col transition-colors">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Layers size={18} /> {t('ai_creator.toc')} ({result.topics.length})</h3>
                                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                        {result.topics.map((topic, idx) => (
                                            <button key={idx} onClick={() => setSelectedTopicIndex(idx)} className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all border-l-4 ${selectedTopicIndex === idx ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-indigo-600 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent hover:border-l-gray-300'}`}><div className="line-clamp-2">{topic.topicName}</div><div className="text-xs text-gray-400 font-normal mt-1">{topic.questions.length} {t('create_set.question')}</div></button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 text-sm">
                                    <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">{t('ai_creator.general_info')}</div>
                                    <div className="text-indigo-700 dark:text-indigo-400 mb-2 font-medium">{result.subject} - {result.grade}</div>
                                    <p className="text-indigo-600 dark:text-indigo-300 opacity-80 text-xs leading-relaxed">{result.overallSummary}</p>
                                </div>
                            </div>
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentTopic.topicName}</h2><button onClick={handleOpenSaveModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm text-sm whitespace-nowrap transition-colors"><Save size={18} /> {t('ai_creator.save_to_lib')}</button></div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BookOpen className="text-indigo-600 dark:text-indigo-400" size={20} /> {t('ai_creator.theory_title')}</h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">{currentTopic.summary}</p>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div><h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2"><Lightbulb size={14} /> {t('ai_creator.key_points')}</h4><ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 text-sm">{currentTopic.keyPoints.map((point, idx) => (<li key={idx}>{point}</li>))}</ul></div>
                                        {currentTopic.formulas.length > 0 && (<div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600"><h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2"><Sigma size={14} /> {t('ai_creator.formulas')}</h4><ul className="space-y-2">{currentTopic.formulas.map((formula, idx) => (<li key={idx} className="bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 font-mono text-indigo-700 dark:text-indigo-300 text-sm shadow-sm">{formula}</li>))}</ul></div>)}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between"><h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><PenTool className="text-indigo-600 dark:text-indigo-400" size={20} /> {t('ai_creator.exercises')}</h3><div className="flex gap-2"><span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">{currentTopic.questions.filter(q => q.type === 'QUIZ').length} {t('ai_creator.type_quiz')}</span><span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold">{currentTopic.questions.filter(q => q.type === 'ESSAY').length} {t('ai_creator.type_essay')}</span></div></div>
                                    {currentTopic.questions.map((q, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                                            <div className="p-5 cursor-pointer" onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}>
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-4 w-full">
                                                        <div className="flex flex-col items-center gap-2 min-w-[40px]"><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200 dark:border-gray-600">{idx + 1}</span>{q.type === 'QUIZ' ? (<span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tighter">Quiz</span>) : (<span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tighter">Essay</span>)}</div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full"><h4 className="font-medium text-gray-900 dark:text-white text-lg leading-snug">{q.question}</h4><div className="flex-shrink-0 pt-1">{renderDifficultyBar(q.difficulty)}</div></div>
                                                            <div className="mt-3 flex items-center gap-2"><div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-xs font-medium"><BrainCircuit size={12} />{q.knowledgeApplied}</div></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 pt-1">{expandedQuestion === idx ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}</div>
                                                </div>
                                            </div>
                                            {expandedQuestion === idx && (
                                                <div className="px-5 pb-5 pt-0 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 animate-fade-in">
                                                    <div className="pl-14 mt-4 space-y-4">
                                                        {q.type === 'QUIZ' && q.options && (<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{q.options.map((opt, i) => (<div key={i} className={`p-3 rounded-lg border text-sm flex items-center gap-3 transition-colors ${opt === q.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300 font-medium shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${opt === q.correctAnswer ? 'border-green-300 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 'border-gray-200 dark:border-gray-500 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}>{String.fromCharCode(65+i)}</span>{opt.replace(/^[A-Z][\.\)]\s*/, '')}</div>))}</div>)}
                                                        {q.type === 'ESSAY' && (<div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg text-sm text-orange-800 dark:text-orange-300 flex items-start gap-3"><PenTool size={16} className="mt-0.5" /><div><span className="font-bold block mb-1">{t('ai_creator.essay_guide_title')}</span>{t('ai_creator.essay_guide_desc')}</div></div>)}
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 relative overflow-hidden"><div className="absolute top-0 right-0 p-2 opacity-10"><GraduationCap size={60} className="text-blue-600 dark:text-blue-400" /></div><h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2 flex items-center gap-1 relative z-10"><Book size={14} /> {t('ai_creator.solution_guide')}</h5><p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-line leading-relaxed relative z-10">{q.solutionGuide}</p></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Globe size={10} /> {t('create_set.privacy_label')}</label><select value={editingSet.privacy} onChange={(e) => setEditingSet({...editingSet, privacy: e.target.value as PrivacyStatus})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="PUBLIC">{t('create_set.public')}</option><option value="PRIVATE">{t('create_set.private')}</option></select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><GraduationCap size={10} /> {t('create_set.level_label')}</label><select value={editingSet.level} onChange={(e) => handleLevelChangeInModal(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">{EDUCATION_LEVELS.map(lvl => (<option key={lvl} value={lvl}>{lvl}</option>))}</select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><BookOpen size={10} /> {t('create_set.subject_label')}</label><input type="text" placeholder={t('create_set.subject_ph')} value={editingSet.subject} onChange={(e) => setEditingSet({...editingSet, subject: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Building size={10} /> {t('create_set.school_label')}</label><input type="text" list="ai-school-options" placeholder={t('create_set.school_ph')} value={editingSet.school} onChange={(e) => setEditingSet({...editingSet, school: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"/><datalist id="ai-school-options">{(SCHOOLS_BY_LEVEL[editingSet.level] || []).map((s, idx) => (<option key={idx} value={s} />))}</datalist></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Bookmark size={10} /> {t('create_set.major_label')}</label><input type="text" placeholder={t('create_set.major_ph')} value={editingSet.major} onChange={(e) => setEditingSet({...editingSet, major: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                                    <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> {t('create_set.topic_label')}</label><input type="text" placeholder={t('create_set.topic_ph')} value={editingSet.topic} onChange={(e) => setEditingSet({...editingSet, topic: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center"><h4 className="font-bold text-gray-800 dark:text-white">{t('ai_creator.list_questions')} ({editingSet.cards.length})</h4><button onClick={handleAddNewCard} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"><Plus size={16} /> {t('ai_creator.add_question')}</button></div>
                                {editingSet.cards.map((card, idx) => (
                                    <div key={card.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm group transition-colors relative">
                                        <div className="flex justify-between items-start mb-4"><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold uppercase">{t('create_set.quiz')} {idx + 1}</span><button onClick={() => handleRemoveCard(card.id)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" title={t('create_set.delete_card')}><Trash2 size={16} /></button></div>
                                        <div className="space-y-4">
                                            <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1"><BrainCircuit size={12} /> {t('ai_creator.question')}</label><textarea rows={2} value={card.term} onChange={(e) => handleCardTermChange(card.id, e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base font-medium text-gray-900 dark:text-white transition-colors" placeholder={t('ai_creator.question_ph')}/></div>
                                            <div><label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1"><List size={12} /> {t('ai_creator.answer_label')}</label><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{card.options?.map((option, optIdx) => { const isCorrect = card.definition === option && option !== ''; return (<div key={optIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'}`}><div onClick={() => handleSetCorrectAnswer(card.id, option)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-500 hover:border-green-400'}`}>{isCorrect && <Check size={12} strokeWidth={4} />}</div><div className="flex-1"><input type="text" value={option} onChange={(e) => handleCardOptionChange(card.id, optIdx, e.target.value)} className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400" placeholder={`Lựa chọn ${optIdx + 1}`}/></div><button onClick={() => handleRemoveOption(card.id, optIdx)} className="text-gray-300 hover:text-red-500 p-1"><X size={14} /></button></div>);})}</div><button onClick={() => handleAddOption(card.id)} className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={12} /> {t('ai_creator.add_option')}</button></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30"><label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1 flex items-center gap-1"><Lightbulb size={12} /> {t('ai_creator.explanation')}</label><textarea rows={2} value={card.explanation || ''} onChange={(e) => handleCardExplanationChange(card.id, e.target.value)} className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-blue-900 dark:text-blue-200 placeholder-blue-300 resize-none p-0" placeholder={t('ai_creator.explanation_ph')}/></div>
                                                <div className="bg-gray-100 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700"><label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase mb-1 flex items-center gap-1"><Link size={12} /> {t('ai_creator.ref_link')}</label><input type="text" value={card.relatedLink || ''} onChange={(e) => handleCardLinkChange(card.id, e.target.value)} className="w-full bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400 p-0" placeholder="https://..."/></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl flex justify-end gap-3 transition-colors"><button onClick={() => setShowSaveModal(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-bold transition-colors">{t('common.cancel')}</button><button onClick={handleFinalSave} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all hover:shadow-indigo-200 hover:-translate-y-0.5"><Save size={18} /> {t('ai_creator.confirm_save')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiTextbookCreator;
