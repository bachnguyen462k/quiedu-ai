
import React, { useState, useEffect } from 'react';
// Added Loader2 to the list of icons imported from lucide-react to fix a reference error
import { Upload, Sparkles, FileText, CheckCircle, BookOpen, BrainCircuit, ChevronDown, ChevronUp, Save, Book, Sigma, PenTool, Lightbulb, Layers, GraduationCap, FileType, Image as ImageIcon, History, Clock, ArrowRight, X, Trash2, Edit3, Plus, Check, List, Link, ArrowLeft, Globe, Lock, Building, Hash, Bookmark, FileEdit, Loader2 } from 'lucide-react';
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
  'Trung học phổ thông', 'Đại học', 'Cao đẳng', 'Cao học', 'Trung cấp', 'Khác'
];

const SCHOOLS_BY_LEVEL: Record<string, string[]> = {
  'Trung học phổ thông': ['THPT Chuyên Hà Nội - Amsterdam', 'THPT Chu Văn An', 'THPT Lương Thế Vinh', 'THPT Nguyễn Huệ', 'THPT Lê Hồng Phong', 'THPT Chuyên Ngoại Ngữ', 'THPT Marie Curie'],
  'Đại học': ['Đại học Bách Khoa Hà Nội', 'Đại học Quốc Gia Hà Nội', 'Đại học Kinh Tế Quốc Dân', 'Đại học FPT', 'Đại học RMIT', 'Đại học Ngoại Thương', 'Học viện Công nghệ Bưu chính Viễn thông']
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
        title: string; description: string; privacy: PrivacyStatus; status: string;
        level: string; school: string; major: string; subject: string; topic: string;
        cards: Flashcard[];
    }>({ 
        title: '', description: '', privacy: 'PUBLIC', status: 'ACTIVE',
        level: 'Trung học phổ thông', school: '', major: '', subject: '', topic: '', cards: [] 
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = () => setFile({ name: selectedFile.name, data: reader.result as string, type: selectedFile.type });
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const data = await analyzeTextbookWithAI(file.data);
            setResult(data);
            onAddToHistory({ id: uuidv4(), createdAt: Date.now(), fileName: file.name, result: data });
        } catch (error) { alert(t('ai_creator.error_analyze')); }
        finally { setIsAnalyzing(false); }
    };

    const handleOpenSaveModal = () => {
        if (!result) return;
        const currentTopic = result.topics[selectedTopicIndex];
        const initialCards: Flashcard[] = currentTopic.questions.filter(q => q.type === 'QUIZ').map(q => ({
            id: uuidv4(), term: q.question, definition: q.correctAnswer?.replace(/^[A-Z][\.\)]\s*/, '') || "",
            options: q.options ? q.options.map(o => o.replace(/^[A-Z][\.\)]\s*/, '')) : ["", "", "", ""],
            explanation: q.solutionGuide || "", relatedLink: ""
        }));
        setEditingSet({
            title: currentTopic.topicName, description: currentTopic.summary, privacy: 'PUBLIC', status: 'ACTIVE',
            level: 'Trung học phổ thông', school: '', major: '', subject: result.subject || '', topic: currentTopic.topicName, cards: initialCards
        });
        setShowSaveModal(true);
    };

    const handleFinalSave = async () => {
        if (!editingSet.title.trim()) { alert(t('ai_creator.error_no_title')); return; }
        if (editingSet.cards.length < 2) { alert(t('notifications.min_cards')); return; }

        setIsSaving(true);
        try {
            const response = await studySetService.createStudySet({
                topic: editingSet.topic, language: i18n.language || 'vi',
                title: editingSet.title, description: editingSet.description, type: 'AI_TEXTBOOK', status: editingSet.status,
                cards: editingSet.cards.map(c => ({ term: c.term, definition: c.definition, options: c.options || [], explanation: c.explanation || '' }))
            });
            if (response.code === 1000) {
                onSaveToLibrary({ ...editingSet, id: response.result?.toString() || uuidv4(), author: 'AI Assistant', createdAt: Date.now() });
                addNotification("Đã lưu thành công!", "success");
                setShowSaveModal(false);
            }
        } catch (error) { addNotification("Lỗi khi lưu lên máy chủ.", "error"); }
        finally { setIsSaving(false); }
    };

    const currentTopic = result?.topics[selectedTopicIndex];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20 animate-fade-in">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">
                <ArrowLeft size={20} /> {t('common.back')}
            </button>
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2"><Sparkles className="text-indigo-600" /> {t('ai_creator.title')}</h1>
                    <p className="text-gray-500 mt-2">{t('ai_creator.subtitle')}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex font-medium text-sm">
                    <button onClick={() => setActiveTab('CREATE')} className={`px-4 py-2 rounded-md ${activeTab === 'CREATE' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Tạo mới</button>
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-md ${activeTab === 'HISTORY' ? 'bg-white dark:bg-gray-800 text-indigo-600 shadow-sm' : 'text-gray-500'}`}>Lịch sử</button>
                </div>
            </div>

            {activeTab === 'CREATE' && (
                <div className="animate-fade-in">
                    {!result ? (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border text-center">
                            <div className="border-2 border-dashed rounded-xl p-12 relative group">
                                <input type="file" accept=".pdf,.docx,image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {file ? <div className="text-indigo-600 font-bold">{file.name}</div> : <div className="text-gray-400"><Upload size={48} className="mx-auto mb-4" />{t('ai_creator.upload_prompt_title')}</div>}
                            </div>
                            <button onClick={handleAnalyze} disabled={!file || isAnalyzing} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto disabled:bg-gray-300">
                                {isAnalyzing ? <ThemeLoader className="text-white" /> : <BrainCircuit />} {isAnalyzing ? "Đang phân tích..." : "Phân tích tài liệu"}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-1 space-y-4">
                                <button onClick={() => setResult(null)} className="w-full text-indigo-600 font-bold py-2 border rounded-lg hover:bg-indigo-50 transition-colors">Tải tài liệu khác</button>
                                <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
                                    <h3 className="font-bold mb-4 dark:text-white">Mục lục chủ đề</h3>
                                    <div className="space-y-2">
                                        {result.topics.map((t, idx) => (
                                            <button key={idx} onClick={() => setSelectedTopicIndex(idx)} className={`w-full text-left p-3 rounded-lg text-sm border-l-4 ${selectedTopicIndex === idx ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>{t.topicName}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border">
                                    <h2 className="text-xl font-bold dark:text-white">{currentTopic?.topicName}</h2>
                                    <button onClick={handleOpenSaveModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Save size={18} /> Lưu vào thư viện</button>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border">
                                    <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2"><BookOpen size={20} className="text-indigo-600" /> Tóm tắt lý thuyết</h3>
                                    <p className="text-gray-600 dark:text-gray-300 italic mb-4">{currentTopic?.summary}</p>
                                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-200">{currentTopic?.keyPoints.map((p,i)=><li key={i}>{p}</li>)}</ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center dark:bg-gray-750">
                            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><Edit3 size={20} className="text-indigo-600" /> Lưu & Chỉnh sửa</h3>
                            <button onClick={() => setShowSaveModal(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border space-y-4">
                                <div><label className="text-sm font-medium dark:text-white">Tên học phần</label><input type="text" value={editingSet.title} onChange={e=>setEditingSet({...editingSet,title:e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white font-bold" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm font-medium dark:text-white">Quyền riêng tư</label><select value={editingSet.privacy} onChange={e=>setEditingSet({...editingSet,privacy:e.target.value as any})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"><option value="PUBLIC">Công khai</option><option value="PRIVATE">Riêng tư</option></select></div>
                                    <div><label className="text-sm font-medium dark:text-white">Trạng thái</label><select value={editingSet.status} onChange={e=>setEditingSet({...editingSet,status:e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"><option value="ACTIVE">Hoạt động</option><option value="DRAFT">Bản nháp</option></select></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {editingSet.cards.map((card, idx) => (
                                    <div key={card.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border">
                                        <div className="flex justify-between mb-4"><span className="text-xs font-bold text-gray-500 uppercase">QUIZ {idx+1}</span><button onClick={()=>setEditingSet({...editingSet,cards:editingSet.cards.filter(c=>c.id!==card.id)})} className="text-red-400"><Trash2 size={16} /></button></div>
                                        <textarea rows={2} value={card.term} onChange={e=>setEditingSet({...editingSet,cards:editingSet.cards.map(c=>c.id===card.id?{...c,term:e.target.value}:c)})} className="w-full p-3 border rounded-lg mb-4 outline-none font-medium dark:bg-gray-700 dark:text-white" />
                                        <div className="grid grid-cols-2 gap-3">
                                            {card.options?.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                                    <div onClick={()=>setEditingSet({...editingSet,cards:editingSet.cards.map(c=>c.id===card.id?{...c,definition:opt}:c)})} className={`w-5 h-5 rounded-full border-2 cursor-pointer ${card.definition===opt?'bg-green-500 border-green-500':'border-gray-300'}`} />
                                                    <input type="text" value={opt} onChange={e=>{const next=[...(card.options||[])]; next[oi]=e.target.value; setEditingSet({...editingSet,cards:editingSet.cards.map(c=>c.id===card.id?{...c,options:next,definition:card.definition===opt?e.target.value:c.definition}:c)})}} className="flex-1 bg-transparent text-sm dark:text-white outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3 dark:bg-gray-800">
                            <button onClick={()=>setShowSaveModal(false)} className="px-5 py-2.5 text-gray-500 font-bold">Hủy</button>
                            <button onClick={handleFinalSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Xác nhận lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiTextbookCreator;
