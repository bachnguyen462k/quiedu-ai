import React, { useState } from 'react';
import { Upload, Sparkles, FileText, CheckCircle, BarChart, BookOpen, BrainCircuit, ChevronDown, ChevronUp, Save, Loader2, Book, Sigma, PenTool, Lightbulb, Layers, HelpCircle, GraduationCap, FileType } from 'lucide-react';
import { analyzeTextbookWithAI } from '../services/geminiService';
import { TextbookAnalysisResult, StudySet, QuestionDifficulty } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AiTextbookCreatorProps {
    onSaveToLibrary: (set: StudySet) => void;
}

const AiTextbookCreator: React.FC<AiTextbookCreatorProps> = ({ onSaveToLibrary }) => {
    const [file, setFile] = useState<{name: string, data: string, type: string} | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<TextbookAnalysisResult | null>(null);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            
            // Check file size (limit to ~10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                alert("Vui lòng tải lên file nhỏ hơn 10MB");
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
        } catch (error) {
            alert("Có lỗi xảy ra khi phân tích tài liệu. Vui lòng đảm bảo file PDF không bị hỏng hoặc thử lại.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveSet = () => {
        if (!result) return;
        
        const currentTopic = result.topics[selectedTopicIndex];
        
        // Convert analysis result to StudySet format
        const quizQuestions = currentTopic.questions.filter(q => q.type === 'QUIZ');
        
        const newSet: StudySet = {
            id: uuidv4(),
            title: `${currentTopic.topicName} (${result.subject})`,
            description: `${currentTopic.summary}. Tổng hợp ${currentTopic.questions.length} câu hỏi từ ${result.grade}.`,
            author: 'Giáo viên (AI Assistant)',
            createdAt: Date.now(),
            cards: quizQuestions.map(q => ({
                id: uuidv4(),
                term: q.question,
                definition: q.correctAnswer || "Xem đáp án chi tiết"
            }))
        };
        
        onSaveToLibrary(newSet);
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
                            className={`flex-1 rounded-full ${seg <= activeSegments ? colorClass : 'bg-gray-200'}`}
                        ></div>
                    ))}
                </div>
                <span className={`text-[10px] font-bold uppercase text-right ${
                    activeSegments === 1 ? 'text-green-600' : 
                    activeSegments === 2 ? 'text-blue-600' : 
                    activeSegments === 3 ? 'text-orange-600' : 'text-red-600'
                }`}>
                    {label}
                </span>
            </div>
        );
    };

    const currentTopic = result?.topics[selectedTopicIndex];

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" /> Soạn bài từ Tài liệu
                </h1>
                <p className="text-gray-500 mt-2">
                    Hỗ trợ phân tích tài liệu PDF, Sách giáo khoa điện tử. Trích xuất kiến thức và tạo câu hỏi tự động.
                </p>
            </div>

            {/* Step 1: Upload */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tải lên tài liệu (PDF)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative group">
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
                                        <FileType size={24} />
                                    </div>
                                    <p className="font-bold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                        <CheckCircle size={12} /> Đã tải lên thành công
                                    </p>
                                    <button className="mt-4 text-xs text-gray-500 underline hover:text-indigo-600 z-10 relative">
                                        Chọn file khác
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                        <Upload size={24} />
                                    </div>
                                    <p className="font-medium text-gray-700">Nhấn để tải lên file PDF</p>
                                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ PDF, Tối đa 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex flex-col justify-center">
                        <button 
                            onClick={handleAnalyze}
                            disabled={!file || isAnalyzing}
                            className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg transition-all ${
                                !file || isAnalyzing
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:-translate-y-1 hover:shadow-indigo-200'
                            }`}
                        >
                            {isAnalyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                            {isAnalyzing ? 'Đang phân tích...' : 'Phân tích & Soạn bài'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 2: Results */}
            {result && currentTopic && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar: Topics List */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 max-h-[calc(100vh-200px)] flex flex-col">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Layers size={18} /> Mục lục ({result.topics.length})
                            </h3>
                            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {result.topics.map((topic, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedTopicIndex(idx)}
                                        className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-all border-l-4 ${
                                            selectedTopicIndex === idx 
                                            ? 'bg-indigo-50 text-indigo-700 border-l-indigo-600 shadow-sm' 
                                            : 'text-gray-600 hover:bg-gray-50 border-l-transparent hover:border-l-gray-300'
                                        }`}
                                    >
                                        <div className="line-clamp-2">{topic.topicName}</div>
                                        <div className="text-xs text-gray-400 font-normal mt-1">{topic.questions.length} câu hỏi</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-sm">
                            <div className="font-bold text-indigo-900 mb-1">Thông tin chung</div>
                            <div className="text-indigo-700 mb-2 font-medium">{result.subject} - {result.grade}</div>
                            <p className="text-indigo-600 opacity-80 text-xs leading-relaxed">{result.overallSummary}</p>
                        </div>
                    </div>

                    {/* Main Content: Selected Topic */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <h2 className="text-2xl font-bold text-gray-900">{currentTopic.topicName}</h2>
                             <button 
                                onClick={handleSaveSet}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm text-sm whitespace-nowrap"
                             >
                                <Save size={18} /> Lưu bài này vào thư viện
                             </button>
                        </div>

                        {/* Theory Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <BookOpen className="text-indigo-600" size={20} /> Lý thuyết trọng tâm
                            </h3>
                            <p className="text-gray-700 mb-4 italic">{currentTopic.summary}</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        <Lightbulb size={14} /> Các ý chính
                                    </h4>
                                    <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                                        {currentTopic.keyPoints.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                                {currentTopic.formulas.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                                            <Sigma size={14} /> Công thức / Định lý
                                        </h4>
                                        <ul className="space-y-2">
                                            {currentTopic.formulas.map((formula, idx) => (
                                                <li key={idx} className="bg-white px-3 py-2 rounded border border-gray-200 font-mono text-indigo-700 text-sm shadow-sm">
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
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <PenTool className="text-indigo-600" size={20} /> 
                                    Bài tập vận dụng
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                        {currentTopic.questions.filter(q => q.type === 'QUIZ').length} Trắc nghiệm
                                    </span>
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                        {currentTopic.questions.filter(q => q.type === 'ESSAY').length} Tự luận
                                    </span>
                                </div>
                            </div>
                            
                            {currentTopic.questions.map((q, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-indigo-300 transition-all">
                                    <div 
                                        className="p-5 cursor-pointer"
                                        onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex gap-4 w-full">
                                                <div className="flex flex-col items-center gap-2 min-w-[40px]">
                                                    <span className="bg-gray-100 text-gray-600 font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">
                                                        {idx + 1}
                                                    </span>
                                                    {q.type === 'QUIZ' ? (
                                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter">Quiz</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Essay</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                                                        <h4 className="font-medium text-gray-900 text-lg leading-snug">{q.question}</h4>
                                                        
                                                        {/* Difficulty Bar UI */}
                                                        <div className="flex-shrink-0 pt-1">
                                                            {renderDifficultyBar(q.difficulty)}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium">
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
                                        <div className="px-5 pb-5 pt-0 bg-white border-t border-gray-50 animate-fade-in">
                                            <div className="pl-14 mt-4 space-y-4">
                                                {/* Options if Quiz */}
                                                {q.type === 'QUIZ' && q.options && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {q.options.map((opt, i) => (
                                                            <div key={i} className={`p-3 rounded-lg border text-sm flex items-center gap-3 transition-colors ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-900 font-medium shadow-sm' : 'bg-white border-gray-100 text-gray-600'}`}>
                                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${opt === q.correctAnswer ? 'border-green-300 bg-green-100 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                                                    {String.fromCharCode(65+i)}
                                                                </span>
                                                                {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Essay Placeholder */}
                                                {q.type === 'ESSAY' && (
                                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800 flex items-start gap-3">
                                                        <PenTool size={16} className="mt-0.5" />
                                                        <div>
                                                            <span className="font-bold block mb-1">Dạng bài tự luận:</span>
                                                            Học sinh sẽ trình bày lời giải ra giấy và chụp ảnh nộp lại.
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Teacher Guide */}
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                        <GraduationCap size={60} className="text-blue-600" />
                                                    </div>
                                                    <h5 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1 relative z-10">
                                                        <Book size={14} /> Hướng dẫn giải (Giáo viên)
                                                    </h5>
                                                    <p className="text-sm text-blue-900 whitespace-pre-line leading-relaxed relative z-10">{q.solutionGuide}</p>
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
    );
};

export default AiTextbookCreator;