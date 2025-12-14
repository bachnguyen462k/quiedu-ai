import React, { useState } from 'react';
import { Upload, Sparkles, FileText, CheckCircle, BookOpen, BrainCircuit, ChevronDown, ChevronUp, Save, Loader2, Book, Sigma, PenTool, Lightbulb, Layers, GraduationCap, FileType, Image as ImageIcon, History, Clock, ArrowRight, X, Trash2, Edit3, Plus } from 'lucide-react';
import { analyzeTextbookWithAI } from '../services/geminiService';
import { TextbookAnalysisResult, StudySet, AiGenerationRecord, Flashcard } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AiTextbookCreatorProps {
    onSaveToLibrary: (set: StudySet) => void;
    history: AiGenerationRecord[];
    onAddToHistory: (record: AiGenerationRecord) => void;
}

const AiTextbookCreator: React.FC<AiTextbookCreatorProps> = ({ onSaveToLibrary, history, onAddToHistory }) => {
    const [activeTab, setActiveTab] = useState<'CREATE' | 'HISTORY'>('CREATE');
    const [file, setFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<TextbookAnalysisResult | null>(null);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    // Editing State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [editingSet, setEditingSet] = useState<{
        title: string;
        description: string;
        cards: Flashcard[];
    }>({ title: '', description: '', cards: [] });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Check file size (limit to ~100MB)
            if (selectedFile.size > 100 * 1024 * 1024) {
                alert("Vui lòng tải lên file nhỏ hơn 100MB");
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
                setResult(null); // Reset previous result
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
            
            // Auto save to history
            const newRecord: AiGenerationRecord = {
                id: uuidv4(),
                createdAt: Date.now(),
                fileName: file.name,
                result: data
            };
            onAddToHistory(newRecord);

        } catch (error) {
            alert("Có lỗi xảy ra khi phân tích tài liệu. Vui lòng đảm bảo file không bị hỏng hoặc thử lại.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleHistorySelect = (record: AiGenerationRecord) => {
        setResult(record.result);
        setFile({ name: record.fileName, data: '', type: 'unknown' }); // Mock file presence for UI
        setActiveTab('CREATE');
        setSelectedTopicIndex(0);
    };

    const handleOpenSaveModal = () => {
        if (!result) return;
        const currentTopic = result.topics[selectedTopicIndex];
        
        // Prepare initial data for editing
        const quizQuestions = currentTopic.questions.filter(q => q.type === 'QUIZ');
        const initialCards = quizQuestions.map(q => ({
            id: uuidv4(),
            term: q.question,
            // Clean up the answer: remove "A.", "B.", etc. prefix if present for cleaner Flashcards
            definition: q.correctAnswer ? q.correctAnswer.replace(/^[A-Z][\.\)]\s*/, '') : "Xem đáp án chi tiết"
        }));

        setEditingSet({
            title: currentTopic.topicName,
            description: `${currentTopic.summary}. Tổng hợp câu hỏi từ ${result.grade}.`,
            cards: initialCards
        });

        setShowSaveModal(true);
    };

    const handleFinalSave = () => {
        if (!editingSet.title.trim()) {
            alert("Vui lòng nhập tên học phần");
            return;
        }

        const newSet: StudySet = {
            id: uuidv4(),
            title: editingSet.title,
            description: editingSet.description,
            author: 'AI Assistant', // Use generic author name
            createdAt: Date.now(),
            cards: editingSet.cards
        };
        
        onSaveToLibrary(newSet);
        setShowSaveModal(false);
    };

    // Helper to render the Difficulty Bar
    const renderDifficultyBar = (level: string) => {
        let activeSegments = 1;
        let colorClass = 'bg-green-500';
        let label = 'Nhận biết';

        switch (level) {
            case 'Nhận biết':
                activeSegments = 1;
                colorClass = 'bg-green-500';
                label = 'Nhận biết';
                break;
            case 'Thông hiểu':
                activeSegments = 2;
                colorClass = 'bg-blue-500';
                label = 'Thông hiểu';
                break;
            case 'Vận dụng':
                activeSegments = 3;
                colorClass = 'bg-orange-500';
                label = 'Vận dụng';
                break;
            case 'Vận dụng cao':
                activeSegments = 4;
                colorClass = 'bg-red-600';
                label = 'Vận dụng cao';
                break;
            default:
                activeSegments = 1;
        }

        return (
            <div className="flex flex-col gap-1 w-32">
                <div className="flex gap-1 h-2">
                    {[1, 2, 3, 4].map((seg) => (
                        <div 
                            key={seg} 
                            className={`flex-1 rounded-full ${seg <= activeSegments ? colorClass : 'bg-gray-200 dark:bg-gray-700'}`}
                        ></div>
                    ))}
                </div>
                <span className={`text-[10px] font-bold uppercase text-right ${
                    activeSegments === 1 ? 'text-green-600 dark:text-green-400' : 
                    activeSegments === 2 ? 'text-blue-600 dark:text-blue-400' : 
                    activeSegments === 3 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                }`}>
                    {label}
                </span>
            </div>
        );
    };

    const currentTopic = result?.topics[selectedTopicIndex];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="text-indigo-600 dark:text-indigo-400" /> Soạn bài từ Tài liệu
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Hỗ trợ phân tích tài liệu PDF, Sách giáo khoa điện tử hoặc Ảnh chụp bài học.
                    </p>
                </div>
                
                {/* Mode Tabs */}
                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex font-medium text-sm self-stretch md:self-auto">
                    <button 
                        onClick={() => setActiveTab('CREATE')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'CREATE' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Upload size={16} /> Tạo mới
                    </button>
                    <button 
                         onClick={() => setActiveTab('HISTORY')}
                         className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <History size={16} /> Lịch sử ({history.length})
                    </button>
                </div>
            </div>

            {/* TAB: HISTORY */}
            {activeTab === 'HISTORY' && (
                <div className="animate-fade-in">
                    {history.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                             <History className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa có bài soạn nào</h3>
                             <p className="text-gray-500 dark:text-gray-400 mb-6">Các bài học do AI tạo ra sẽ được lưu tự động tại đây.</p>
                             <button 
                                onClick={() => setActiveTab('CREATE')}
                                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                             >
                                Tạo bài học đầu tiên
                             </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map(record => (
                                <div key={record.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <Sparkles size={20} />
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 line-clamp-1">{record.result.topics[0]?.topicName || "Không có tên"}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{record.result.subject} - {record.result.grade}</p>
                                    
                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                            <FileText size={14} />
                                            <span className="truncate max-w-[200px]">{record.fileName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                            <Layers size={14} />
                                            <span>{record.result.topics.length} chủ đề chính</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleHistorySelect(record)}
                                        className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        Xem & Chỉnh sửa <ArrowRight size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: CREATE (Existing Interface) */}
            {activeTab === 'CREATE' && (
                <div className="animate-fade-in">
                    {/* Step 1: Upload (Hidden if result exists) */}
                    {!result && (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 transition-colors">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1 w-full">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tải lên tài liệu (PDF hoặc Ảnh)</label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative group overflow-hidden">
                                        <input 
                                            type="file" 
                                            accept="application/pdf, image/png, image/jpeg, image/jpg"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />
                                        {file ? (
                                            <div className="flex flex-col items-center relative z-10">
                                                {file.type.startsWith('image/') ? (
                                                    <div className="w-32 h-32 mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                                        <img src={file.data} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-3">
                                                        <FileType size={32} />
                                                    </div>
                                                )}
                                                
                                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{file.name}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                                    <CheckCircle size={12} /> Đã tải lên thành công
                                                </p>
                                                <button className="mt-4 text-xs text-gray-500 dark:text-gray-400 underline hover:text-indigo-600 dark:hover:text-indigo-400 z-30 relative cursor-pointer pointer-events-none group-hover:pointer-events-auto">
                                                    (Nhấn để chọn file khác)
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex justify-center gap-4 mb-3">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500 transition-colors">
                                                        <Upload size={24} />
                                                    </div>
                                                </div>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">Nhấn để tải lên file</p>
                                                <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, JPG, PNG (Tối đa 10MB)</p>
                                                <div className="flex justify-center gap-2 mt-2">
                                                    <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FileType size={10} /> PDF</span>
                                                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><ImageIcon size={10} /> ẢNH</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex-shrink-0 flex flex-col justify-center w-full md:w-auto">
                                    <button 
                                        onClick={handleAnalyze}
                                        disabled={!file || isAnalyzing}
                                        className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all w-full md:w-auto ${
                                            !file || isAnalyzing
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:-translate-y-1 hover:shadow-indigo-200'
                                        }`}
                                    >
                                        {isAnalyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                                        {isAnalyzing ? 'Đang phân tích...' : 'Phân tích & Soạn bài'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Results */}
                    {result && currentTopic && (
                        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Left Sidebar: Topics List */}
                            <div className="lg:col-span-1 space-y-4">
                                <button 
                                    onClick={() => { setResult(null); setFile(null); }}
                                    className="w-full mb-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    &larr; Tạo bài mới
                                </button>

                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-[400px] lg:max-h-[calc(100vh-200px)] flex flex-col transition-colors">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Layers size={18} /> Mục lục ({result.topics.length})
                                    </h3>
                                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                        {result.topics.map((topic, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedTopicIndex(idx)}
                                                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all border-l-4 ${
                                                    selectedTopicIndex === idx 
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-l-indigo-600 shadow-sm' 
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-transparent hover:border-l-gray-300'
                                                }`}
                                            >
                                                <div className="line-clamp-2">{topic.topicName}</div>
                                                <div className="text-xs text-gray-400 font-normal mt-1">{topic.questions.length} câu hỏi</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 text-sm">
                                    <div className="font-bold text-indigo-900 dark:text-indigo-300 mb-1">Thông tin chung</div>
                                    <div className="text-indigo-700 dark:text-indigo-400 mb-2 font-medium">{result.subject} - {result.grade}</div>
                                    <p className="text-indigo-600 dark:text-indigo-300 opacity-80 text-xs leading-relaxed">{result.overallSummary}</p>
                                </div>
                            </div>

                            {/* Main Content: Selected Topic */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentTopic.topicName}</h2>
                                    <button 
                                        onClick={handleOpenSaveModal}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm text-sm whitespace-nowrap transition-colors"
                                    >
                                        <Save size={18} /> Lưu bài này vào thư viện
                                    </button>
                                </div>

                                {/* Theory Section */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <BookOpen className="text-indigo-600 dark:text-indigo-400" size={20} /> Lý thuyết trọng tâm
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">{currentTopic.summary}</p>
                                    
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                <Lightbulb size={14} /> Các ý chính
                                            </h4>
                                            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                                                {currentTopic.keyPoints.map((point, idx) => (
                                                    <li key={idx}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        {currentTopic.formulas.length > 0 && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
                                                <h4 className="font-bold text-xs text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                                                    <Sigma size={14} /> Công thức / Định lý
                                                </h4>
                                                <ul className="space-y-2">
                                                    {currentTopic.formulas.map((formula, idx) => (
                                                        <li key={idx} className="bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-600 font-mono text-indigo-700 dark:text-indigo-300 text-sm shadow-sm">
                                                            {formula}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Questions Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <PenTool className="text-indigo-600 dark:text-indigo-400" size={20} /> 
                                            Bài tập vận dụng
                                        </h3>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold">
                                                {currentTopic.questions.filter(q => q.type === 'QUIZ').length} Trắc nghiệm
                                            </span>
                                            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold">
                                                {currentTopic.questions.filter(q => q.type === 'ESSAY').length} Tự luận
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {currentTopic.questions.map((q, idx) => (
                                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                                            <div 
                                                className="p-5 cursor-pointer"
                                                onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-4 w-full">
                                                        <div className="flex flex-col items-center gap-2 min-w-[40px]">
                                                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200 dark:border-gray-600">
                                                                {idx + 1}
                                                            </span>
                                                            {q.type === 'QUIZ' ? (
                                                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tighter">Quiz</span>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tighter">Essay</span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex-1">
                                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                                                                <h4 className="font-medium text-gray-900 dark:text-white text-lg leading-snug">{q.question}</h4>
                                                                
                                                                {/* Difficulty Bar UI */}
                                                                <div className="flex-shrink-0 pt-1">
                                                                    {renderDifficultyBar(q.difficulty)}
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 flex items-center gap-2">
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-xs font-medium">
                                                                    <BrainCircuit size={12} />
                                                                    {q.knowledgeApplied}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 pt-1">
                                                        {expandedQuestion === idx ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedQuestion === idx && (
                                                <div className="px-5 pb-5 pt-0 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 animate-fade-in">
                                                    <div className="pl-14 mt-4 space-y-4">
                                                        {/* Options if Quiz */}
                                                        {q.type === 'QUIZ' && q.options && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {q.options.map((opt, i) => (
                                                                    <div key={i} className={`p-3 rounded-lg border text-sm flex items-center gap-3 transition-colors ${opt === q.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300 font-medium shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${opt === q.correctAnswer ? 'border-green-300 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 'border-gray-200 dark:border-gray-500 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}>
                                                                            {String.fromCharCode(65+i)}
                                                                        </span>
                                                                        {/* Remove prefix A. B. C. from content if present to avoid duplication with badge */}
                                                                        {opt.replace(/^[A-Z][\.\)]\s*/, '')}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Essay Placeholder */}
                                                        {q.type === 'ESSAY' && (
                                                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-lg text-sm text-orange-800 dark:text-orange-300 flex items-start gap-3">
                                                                <PenTool size={16} className="mt-0.5" />
                                                                <div>
                                                                    <span className="font-bold block mb-1">Dạng bài tự luận:</span>
                                                                    Học sinh sẽ trình bày lời giải ra giấy và chụp ảnh nộp lại.
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Teacher Guide */}
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                                                <GraduationCap size={60} className="text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2 flex items-center gap-1 relative z-10">
                                                                <Book size={14} /> Hướng dẫn giải chi tiết
                                                            </h5>
                                                            <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-line leading-relaxed relative z-10">{q.solutionGuide}</p>
                                                        </div>
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

            {/* SAVE & EDIT MODAL */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl transition-colors animate-fade-in">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750 rounded-t-2xl">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Edit3 size={20} className="text-indigo-600 dark:text-indigo-400" /> Xem lại & Chỉnh sửa
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Điều chỉnh nội dung trước khi lưu vào thư viện.</p>
                            </div>
                            <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
                            {/* Set Info */}
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên học phần</label>
                                    <input 
                                        type="text" 
                                        value={editingSet.title}
                                        onChange={(e) => setEditingSet({...editingSet, title: e.target.value})}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả ngắn</label>
                                    <input 
                                        type="text" 
                                        value={editingSet.description}
                                        onChange={(e) => setEditingSet({...editingSet, description: e.target.value})}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Cards List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 dark:text-white">Danh sách câu hỏi ({editingSet.cards.length})</h4>
                                    <button 
                                        onClick={() => setEditingSet({
                                            ...editingSet,
                                            cards: [...editingSet.cards, { id: uuidv4(), term: '', definition: '' }]
                                        })}
                                        className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus size={16} /> Thêm thẻ
                                    </button>
                                </div>

                                {editingSet.cards.map((card, idx) => (
                                    <div key={card.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm group transition-colors">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-gray-400 text-sm">Câu {idx + 1}</span>
                                            <button 
                                                onClick={() => setEditingSet({
                                                    ...editingSet,
                                                    cards: editingSet.cards.filter(c => c.id !== card.id)
                                                })}
                                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Câu hỏi / Thuật ngữ</label>
                                                <textarea
                                                    rows={2}
                                                    value={card.term}
                                                    onChange={(e) => {
                                                        const newCards = [...editingSet.cards];
                                                        newCards[idx].term = e.target.value;
                                                        setEditingSet({...editingSet, cards: newCards});
                                                    }}
                                                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm font-medium text-gray-900 dark:text-white transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Đáp án / Định nghĩa</label>
                                                <textarea
                                                    rows={2}
                                                    value={card.definition}
                                                    onChange={(e) => {
                                                        const newCards = [...editingSet.cards];
                                                        newCards[idx].definition = e.target.value;
                                                        setEditingSet({...editingSet, cards: newCards});
                                                    }}
                                                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-green-500 outline-none resize-none text-sm text-gray-700 dark:text-gray-200 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl flex justify-end gap-3 transition-colors">
                            <button 
                                onClick={() => setShowSaveModal(false)}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-bold transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleFinalSave}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-all hover:shadow-indigo-200 hover:-translate-y-0.5"
                            >
                                <Save size={18} /> Xác nhận Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiTextbookCreator;