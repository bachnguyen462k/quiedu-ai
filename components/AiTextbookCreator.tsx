import React, { useState } from 'react';
import { Upload, Sparkles, FileText, CheckCircle, BarChart, BookOpen, BrainCircuit, ChevronDown, ChevronUp, Save, Loader2, RefreshCw } from 'lucide-react';
import { analyzeTextbookWithAI } from '../services/geminiService';
import { TextbookAnalysisResult, StudySet } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AiTextbookCreatorProps {
    onSaveToLibrary: (set: StudySet) => void;
}

const AiTextbookCreator: React.FC<AiTextbookCreatorProps> = ({ onSaveToLibrary }) => {
    const [file, setFile] = useState<{name: string, data: string} | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<TextbookAnalysisResult | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('summary');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = () => {
                setFile({ name: selectedFile.name, data: reader.result as string });
                setResult(null); // Reset previous result
            };
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const data = await analyzeTextbookWithAI(file.data);
            setResult(data);
            setExpandedSection('summary');
        } catch (error) {
            alert("Có lỗi xảy ra khi phân tích tài liệu. Vui lòng thử lại.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveSet = () => {
        if (!result) return;
        
        // Convert analysis result to StudySet format
        const newSet: StudySet = {
            id: uuidv4(),
            title: result.lessonTitle,
            description: result.summary,
            author: 'Giáo viên (AI Assistant)',
            createdAt: Date.now(),
            cards: result.generatedQuestions.map(q => ({
                id: uuidv4(),
                term: q.question,
                definition: q.correctAnswer // In flashcard mode, question is term, answer is definition
            }))
        };
        
        onSaveToLibrary(newSet);
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'Dễ': return 'bg-green-100 text-green-800 border-green-200';
            case 'Trung bình': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Khó': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Rất khó': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" /> Soạn bài từ Sách giáo khoa
                </h1>
                <p className="text-gray-500 mt-2">
                    Tải lên ảnh chụp trang sách hoặc tài liệu, AI sẽ tự động phân tích nội dung, 
                    đánh giá độ khó và tạo bộ câu hỏi kiểm tra cho học sinh.
                </p>
            </div>

            {/* Step 1: Upload */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tải lên tài liệu (Ảnh/PDF)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative group">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                                        <FileText size={24} />
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
                                    <p className="font-medium text-gray-700">Nhấn để tải lên hoặc kéo thả vào đây</p>
                                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG</p>
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
                            {isAnalyzing ? 'Đang phân tích...' : 'Phân tích ngay'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Step 2: Results */}
            {result && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold text-gray-900">Kết quả phân tích</h2>
                         <button 
                            onClick={handleSaveSet}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                         >
                            <Save size={18} /> Lưu vào thư viện
                         </button>
                    </div>

                    {/* Difficulty Badge */}
                    <div className={`p-4 rounded-xl border flex items-start gap-4 ${getDifficultyColor(result.difficultyLevel)}`}>
                        <div className="p-2 bg-white/50 rounded-lg">
                             <BarChart size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold uppercase opacity-70 mb-1">Đánh giá độ khó</div>
                            <div className="text-2xl font-bold mb-1">{result.difficultyLevel}</div>
                            <p className="text-sm opacity-90">{result.difficultyReasoning}</p>
                        </div>
                    </div>

                    {/* Lesson Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Summary Section */}
                        <div className="border-b border-gray-100">
                            <button 
                                onClick={() => toggleSection('summary')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <BookOpen className="text-indigo-600" size={20} />
                                    <span className="font-bold text-gray-900 text-lg">{result.lessonTitle}</span>
                                </div>
                                {expandedSection === 'summary' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </button>
                            {expandedSection === 'summary' && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                    <p className="text-gray-700 mb-4">{result.summary}</p>
                                    
                                    <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase text-indigo-600">Kiến thức trọng tâm:</h4>
                                    <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-4">
                                        {result.keyPoints.map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>

                                    <h4 className="font-bold text-gray-900 mb-2 text-sm uppercase text-indigo-600">Ví dụ minh họa:</h4>
                                    <ul className="space-y-2">
                                        {result.examples.map((ex, idx) => (
                                            <li key={idx} className="bg-white p-3 rounded border border-gray-200 text-gray-600 text-sm italic">
                                                "{ex}"
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        {/* Generated Questions Section */}
                        <div>
                            <button 
                                onClick={() => toggleSection('quiz')}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-green-600" size={20} />
                                    <span className="font-bold text-gray-900 text-lg">Đề xuất câu hỏi trắc nghiệm ({result.generatedQuestions.length} câu)</span>
                                </div>
                                {expandedSection === 'quiz' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </button>
                            {expandedSection === 'quiz' && (
                                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-6">
                                    {result.generatedQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200">
                                            <div className="flex gap-3 mb-3">
                                                <span className="bg-indigo-100 text-indigo-700 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                                                    {idx + 1}
                                                </span>
                                                <h4 className="font-bold text-gray-900 pt-1">{q.question}</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-11 mb-4">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className={`p-2 rounded border text-sm ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 text-green-800 font-medium' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                                        {String.fromCharCode(65+i)}. {opt}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ml-11 text-sm bg-blue-50 text-blue-800 p-3 rounded-lg">
                                                <span className="font-bold">Giải thích:</span> {q.explanation}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiTextbookCreator;