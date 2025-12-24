
import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, Review, User, QuizAttempt, ServerQuestion } from '../types';
import { ArrowLeft, CheckCircle, XCircle, LayoutGrid, Clock, Check, X, Send, HelpCircle, Loader2, Award, List, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { quizService, AnswerResponse } from '../services/quizService';
import { useApp } from '../contexts/AppContext';
import ThemeLoader from './ThemeLoader';

interface QuizViewProps {
  set: StudySet;
  allSets?: StudySet[];
  currentUser: User;
  onBack: () => void;
  onAddReview: (setId: string, review: Review) => void;
  serverAttempt?: QuizAttempt; 
  reviewAttemptId?: string; 
}

const COLORS = ['#10B981', '#EF4444'];

const QuizView: React.FC<QuizViewProps> = ({ set, allSets = [], currentUser, onBack, onAddReview, serverAttempt, reviewAttemptId }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); 
  const [loadedQuestions, setLoadedQuestions] = useState<ServerQuestion[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [resultsMap, setResultsMap] = useState<Record<number, { correct: boolean; correctAnswer: string; explanation?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(!!reviewAttemptId);
  const [showGridMobile, setShowGridMobile] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  const totalQuestionCount = serverAttempt?.studySet?.totalQuestions || serverAttempt?.totalQuestions || set.cards.length;

  useEffect(() => {
    if (serverAttempt) {
      const questionsFromServer = serverAttempt.questions || [];
      setLoadedQuestions(questionsFromServer);
      const initialSelections = new Array(totalQuestionCount).fill(null);
      questionsFromServer.forEach(q => {
          if (q.selectedAnswer) initialSelections[q.questionNo - 1] = q.selectedAnswer;
      });
      setUserSelections(initialSelections);
    } else {
      setUserSelections(new Array(totalQuestionCount).fill(null));
    }
  }, [serverAttempt, totalQuestionCount]);

  useEffect(() => {
    const checkAndLoadMore = async () => {
      if (!serverAttempt) return;
      const questionNo = currentQuestionIndex + 1;
      const alreadyLoaded = loadedQuestions.some(q => q.questionNo === questionNo);
      if (!alreadyLoaded && !isLoadingBatch) {
        setIsLoadingBatch(true);
        try {
          const offset = currentQuestionIndex;
          const newQuestions = await quizService.getQuestionsBatch(serverAttempt.attemptId, offset, 10);
          if (newQuestions && newQuestions.length > 0) {
            setLoadedQuestions(prev => {
                const combined = [...prev, ...newQuestions];
                const unique = Array.from(new Map(combined.map(q => [q.questionNo, q])).values());
                return unique.sort((a, b) => a.questionNo - b.questionNo);
            });
          }
        } catch (error) {
          console.error("Load more questions failed", error);
        } finally {
          setIsLoadingBatch(false);
        }
      }
    };
    checkAndLoadMore();
  }, [currentQuestionIndex, loadedQuestions, serverAttempt, isLoadingBatch]);

  useEffect(() => {
    if (reviewAttemptId) {
        const fetchReview = async () => {
            setIsSubmitting(true);
            try {
                const response = await quizService.getQuizReview(reviewAttemptId);
                if (response.code === 1000) {
                    const items = response.result;
                    const correctCount = items.filter((i: any) => i.correct).length;
                    setScore(Math.round((correctCount / items.length) * 100));
                    setReviewItems(items);
                }
            } catch (error) {
                addNotification("Lỗi tải kết quả thi.", "error");
            } finally {
                setIsSubmitting(false);
            }
        };
        fetchReview();
    }
  }, [reviewAttemptId, addNotification]);

  useEffect(() => {
    if (isCompleted || isSubmitting) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, isSubmitting]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = loadedQuestions.find(q => q.questionNo === currentQuestionIndex + 1);

  const handleOptionSelect = async (option: string) => {
    if (isCompleted || isSubmitting || !currentQuestion || resultsMap[currentQuestionIndex]) return;
    
    setSelectedOption(option);
    const newUserSelections = [...userSelections];
    newUserSelections[currentQuestionIndex] = option;
    setUserSelections(newUserSelections);

    if (serverAttempt) {
        try {
            const result: AnswerResponse = await quizService.saveAnswer(
                serverAttempt.attemptId,
                currentQuestion.cardId,
                option
            );
            
            setResultsMap(prev => ({
                ...prev,
                [currentQuestionIndex]: {
                    correct: result.correct,
                    correctAnswer: result.correctAnswer,
                    explanation: result.explanation
                }
            }));

            setTimeout(() => {
                setSelectedOption(null);
                if (currentQuestionIndex < totalQuestionCount - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                }
            }, 800);
        } catch (err) {
            console.error("Auto-save answer failed", err);
            addNotification("Không thể lưu đáp án.", "error");
        }
    }
  };

  const handleRedoIncorrect = () => {
    const incorrectIndices = Object.keys(resultsMap)
        .map(Number)
        .filter(idx => !resultsMap[idx].correct);

    if (incorrectIndices.length === 0) {
        addNotification("Bạn không có câu trả lời sai!", "info");
        return;
    }

    setResultsMap(prev => {
        const next = { ...prev };
        incorrectIndices.forEach(idx => delete next[idx]);
        return next;
    });

    setUserSelections(prev => {
        const next = [...prev];
        incorrectIndices.forEach(idx => next[idx] = null);
        return next;
    });

    setCurrentQuestionIndex(incorrectIndices[0]);
    setShowGridMobile(false);
    addNotification(`Đã sẵn sàng làm lại ${incorrectIndices.length} câu sai.`, "success");
  };

  const handleFinishQuiz = async () => {
      if (!serverAttempt) return;
      setIsSubmitting(true);
      try {
          const finalAnswers = loadedQuestions.map(q => ({
              attemptQuestionId: q.attemptQuestionId,
              answer: userSelections[q.questionNo - 1] || ""
          }));

          const submitResponse = await quizService.submitQuiz(serverAttempt.attemptId, finalAnswers);
          if (submitResponse.code === 1000) {
              const reviewResponse = await quizService.getQuizReview(serverAttempt.attemptId);
              if (reviewResponse.code === 1000) {
                  setScore(Math.round((reviewResponse.result.filter((i:any)=>i.correct).length / reviewResponse.result.length) * 100));
                  setReviewItems(reviewResponse.result);
                  setIsCompleted(true);
                  addNotification("Hoàn thành bài luyện tập!", "success");
              }
          }
      } catch (error) {
          addNotification("Lỗi khi kết thúc bài thi.", "error");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedOption(null);
    setShowGridMobile(false);
  };

  if (isSubmitting && !isCompleted) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> Đang tổng kết...</div>;

  // --- RESULTS VIEW ---
  if (isCompleted) {
    const data = [{ name: 'Đúng', value: score }, { name: 'Sai', value: 100 - score }];
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in pb-32 transition-colors">
         <div className="flex justify-between items-end mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Award className="text-yellow-500 shrink-0" size={28} /> Kết quả luyện tập
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{set.title}</p>
            </div>
            <button onClick={onBack} className="text-gray-400 hover:text-brand-blue font-black uppercase text-[10px] flex items-center gap-2 transition-colors"><ArrowLeft size={16} /> Quay về</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-855 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 text-center shadow-xl sticky top-24">
                    <div className="h-48 w-full relative flex justify-center items-center mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart><Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">{data.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie></PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black text-gray-900 dark:text-white">{score}%</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-50 dark:border-gray-800 pt-6 mb-8">
                        <div className="text-center"><span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</span><span className="font-black text-lg text-gray-800 dark:text-gray-100">{formatTime(seconds)}</span></div>
                        <div className="text-center"><span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Số câu đúng</span><span className="font-black text-lg text-green-600">{reviewItems.filter((i:any)=>i.correct).length}/{reviewItems.length}</span></div>
                    </div>
                    <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl bg-brand-blue text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-blue/20 active:scale-95">Làm lại từ đầu</button>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2"><List size={16} /> Chi tiết câu hỏi</h3>
                {reviewItems.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-[28px] border-2 transition-all ${item.correct ? 'bg-green-50/20 border-green-100 dark:bg-green-900/5' : 'bg-red-50/20 border-red-100 dark:bg-red-900/5'}`}>
                        <div className="flex gap-5">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm ${item.correct ? 'bg-green-500' : 'bg-red-500'}`}>{item.correct ? <Check size={20} strokeWidth={4} /> : <X size={20} strokeWidth={4} />}</div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-gray-900 dark:text-white text-base mb-3 leading-snug">{item.questionNo}. {item.term}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div className={`p-3 rounded-xl border ${item.correct ? 'bg-green-50/50 border-green-200 text-green-800' : 'bg-red-50/50 border-red-200 text-red-800'}`}>
                                        <span className="block text-[8px] font-black uppercase opacity-60 mb-1">Lựa chọn của bạn</span>
                                        <span className="font-bold text-sm">{item.selectedAnswer || 'Bỏ trống'}</span>
                                    </div>
                                    {!item.correct && (
                                        <div className="p-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 text-green-600">
                                            <span className="block text-[8px] font-black uppercase text-gray-400 mb-1">Đáp án đúng</span>
                                            <span className="font-bold text-sm">{item.correctAnswer}</span>
                                        </div>
                                    )}
                                </div>
                                {item.explanation && <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 italic text-xs text-gray-500 dark:text-gray-400">{item.explanation}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    );
  }

  // --- ACTIVE QUIZ VIEW ---
  const progress = (userSelections.filter(a => a !== null).length / totalQuestionCount) * 100;
  const isLoaded = !!currentQuestion && !isLoadingBatch;
  const currentResult = resultsMap[currentQuestionIndex];
  const incorrectCount = Object.values(resultsMap).filter((r: any) => !r.correct).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in transition-colors pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Main Question Content */}
        <div className="lg:col-span-3 space-y-6">
            <div className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900 pb-4 transition-colors">
                <div className="flex justify-between items-center mb-3 gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-gray-900 font-black uppercase text-[10px] flex items-center gap-2 shrink-0"><ArrowLeft size={16} /> Thoát</button>
                    <div className="flex-1 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-brand-blue" /><span className="text-sm font-black text-gray-900 dark:text-white font-mono">{formatTime(seconds)}</span></div>
                        <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden"><div className="bg-brand-blue h-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase">{userSelections.filter(a => a !== null).length}/{totalQuestionCount}</span>
                        <button onClick={() => setShowGridMobile(!showGridMobile)} className="lg:hidden p-2 text-brand-blue bg-blue-50 dark:bg-blue-900/30 rounded-xl"><LayoutGrid size={20} /></button>
                    </div>
                </div>
            </div>

            {!isLoaded ? (
                <div className="bg-white dark:bg-gray-855 rounded-3xl border border-gray-100 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center">
                    <ThemeLoader size={40} className="mb-4" />
                    <p className="text-gray-400 font-black uppercase text-xs tracking-[0.2em]">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="animate-fade-in">
                    {/* Question Card */}
                    <div className="bg-white dark:bg-gray-855 rounded-[32px] shadow-sm border-2 border-gray-50 dark:border-gray-800 p-8 md:p-12 mb-6 min-h-[160px] flex flex-col justify-center relative overflow-hidden transition-colors">
                        <div className="absolute top-6 left-8">
                             <span className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg uppercase tracking-widest">Câu hỏi {currentQuestionIndex + 1}</span>
                        </div>
                        <p className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-snug text-center pt-4">{currentQuestion.term}</p>
                    </div>

                    {/* Options Stack */}
                    <div className="flex flex-col gap-3 mb-8">
                        {currentQuestion.options.map((option, idx) => {
                            const userSelection = userSelections[currentQuestionIndex];
                            const isSelected = (selectedOption === option) || (userSelection === option);
                            
                            let styleClass = "bg-white dark:bg-gray-855 border-gray-100 dark:border-gray-800 hover:border-brand-blue";
                            let iconClass = "bg-gray-50 dark:bg-gray-800 text-gray-400";
                            let iconContent: React.ReactNode = String.fromCharCode(65 + idx);

                            if (currentResult) {
                                const isCorrectOption = option === currentResult.correctAnswer;
                                const isWrongSelection = isSelected && !currentResult.correct;

                                if (isCorrectOption) {
                                    styleClass = "border-green-500 bg-green-50/50 text-green-700 dark:text-green-400 ring-4 ring-green-100 dark:ring-green-900/10 shadow-lg shadow-green-100 dark:shadow-none";
                                    iconClass = "bg-green-500 text-white";
                                    iconContent = <Check size={18} strokeWidth={4} />;
                                } else if (isWrongSelection) {
                                    styleClass = "border-red-500 bg-red-50/50 text-red-700 dark:text-red-400 ring-4 ring-red-100 dark:ring-red-900/10 shadow-lg shadow-red-100 dark:shadow-none";
                                    iconClass = "bg-red-500 text-white";
                                    iconContent = <X size={18} strokeWidth={4} />;
                                }
                            } else if (isSelected) {
                                styleClass = "border-brand-blue bg-blue-50/50 text-brand-blue shadow-md scale-[1.01]";
                                iconClass = "bg-brand-blue text-white";
                            }

                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => handleOptionSelect(option)} 
                                    disabled={!!currentResult}
                                    className={`group p-4 md:p-5 text-left rounded-[24px] transition-all duration-300 flex items-center gap-4 active:scale-[0.99] border-2 ${styleClass} ${currentResult ? 'cursor-default' : 'hover:shadow-md'}`}
                                >
                                    <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-base transition-colors ${iconClass}`}>
                                        {iconContent}
                                    </div>
                                    <span className="font-bold text-base md:text-lg leading-tight flex-1">{option}</span>
                                </button>
                            );
                        })}
                    </div>

                    {currentResult && currentResult.explanation && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-brand-blue p-6 rounded-2xl mb-8 animate-fade-in transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle size={16} className="text-brand-blue" />
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Giải thích chi tiết</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed italic font-medium">{currentResult.explanation}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between gap-4 mt-6 bg-white dark:bg-gray-855 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
                <div className="flex gap-2">
                    <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-20 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"><ChevronLeft size={18}/> Câu trước</button>
                    <button onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestionCount - 1, prev + 1))} disabled={currentQuestionIndex === totalQuestionCount - 1} className="px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-20 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">Câu tiếp <ChevronRight size={18}/></button>
                </div>
                <div className="flex gap-3">
                    {incorrectCount > 0 && (
                        <button onClick={handleRedoIncorrect} className="px-6 py-3 bg-brand-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-orange/20 active:scale-95 transition-all flex items-center gap-2">
                            <RotateCcw size={16} /> Làm lại {incorrectCount} câu sai
                        </button>
                    )}
                    <button onClick={handleFinishQuiz} className="px-8 py-3 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-blue/20 active:scale-95 transition-all flex items-center gap-2">
                        <CheckCircle size={16} /> Xem kết quả
                    </button>
                </div>
            </div>
        </div>

        {/* Right Side: Desktop Navigation Grid Sidebar */}
        <div className="hidden lg:block lg:sticky lg:top-24 space-y-6">
            <div className="bg-white dark:bg-gray-855 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-widest flex items-center gap-2"><LayoutGrid size={16} className="text-brand-blue" /> Bản đồ câu hỏi</h3>
                    <div className="text-[10px] font-black text-gray-400 uppercase">{userSelections.filter(a => a !== null).length}/{totalQuestionCount}</div>
                </div>

                <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                    {Array.from({ length: totalQuestionCount }).map((_, index) => {
                        const result = resultsMap[index];
                        const isCurrent = index === currentQuestionIndex;
                        const isAnswered = !!userSelections[index];
                        
                        let statusClass = "bg-gray-50 dark:bg-gray-800 text-gray-400 border-transparent hover:bg-gray-100";
                        if (result) {
                            statusClass = result.correct 
                                ? "bg-green-500 text-white shadow-md shadow-green-200 dark:shadow-none" 
                                : "bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-none";
                        } else if (isCurrent) {
                            statusClass = "bg-brand-blue text-white ring-4 ring-brand-blue/20";
                        } else if (isAnswered) {
                            statusClass = "bg-blue-50 text-brand-blue border-brand-blue/20";
                        }

                        return (
                            <button 
                                key={index} 
                                onClick={() => handleJumpToQuestion(index)} 
                                className={`aspect-square rounded-xl flex items-center justify-center font-black text-xs border transition-all active:scale-90 ${statusClass}`}
                            >
                                {index + 1}
                            </button>
                        )
                    })}
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-gray-800 space-y-3">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span className="text-[9px] font-bold text-gray-400 uppercase">Đúng</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-[9px] font-bold text-gray-400 uppercase">Sai</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-brand-blue"></div><span className="text-[9px] font-bold text-gray-400 uppercase">Hiện tại</span></div>
                    </div>
                    {incorrectCount > 0 && (
                        <button onClick={handleRedoIncorrect} className="w-full bg-brand-orange text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-orange/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"><RotateCcw size={16}/> Làm lại câu sai</button>
                    )}
                    <button onClick={handleFinishQuiz} className="w-full bg-brand-blue text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-blue/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><CheckCircle size={16}/> Kết thúc luyện tập</button>
                </div>
            </div>
        </div>
      </div>

      {/* Grid Overlay for Mobile */}
      {showGridMobile && (
         <div className="fixed inset-0 bg-black/60 z-[160] flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowGridMobile(false)}>
            <div className="bg-white dark:bg-gray-800 max-w-sm w-full rounded-[40px] p-8 shadow-2xl transition-colors relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowGridMobile(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><XCircle size={24} /></button>
                
                <div className="mb-6">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2"><LayoutGrid size={20} className="text-brand-blue" /> Lưới câu hỏi</h3>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Nhấn để chuyển câu nhanh</p>
                </div>

                <div className="grid grid-cols-5 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1 mb-8">
                    {Array.from({ length: totalQuestionCount }).map((_, index) => {
                        const result = resultsMap[index];
                        const isCurrent = index === currentQuestionIndex;
                        const isAnswered = !!userSelections[index];
                        let statusClass = "bg-gray-50 dark:bg-gray-855 text-gray-400 border-transparent";
                        if (result) statusClass = result.correct ? "bg-green-500 text-white" : "bg-red-500 text-white";
                        else if (isCurrent) statusClass = "bg-brand-blue text-white ring-4 ring-brand-blue/20";
                        else if (isAnswered) statusClass = "bg-blue-50 text-brand-blue border-brand-blue/20";
                        
                        return (
                            <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-xl flex items-center justify-center font-black text-xs border transition-all ${statusClass}`}>{index + 1}</button>
                        )
                    })}
                </div>
                <div className="space-y-3">
                    {incorrectCount > 0 && (
                        <button onClick={handleRedoIncorrect} className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"><RotateCcw size={18} /> Làm lại {incorrectCount} câu sai</button>
                    )}
                    <button onClick={handleFinishQuiz} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"><CheckCircle size={18} /> Kết thúc luyện tập</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default QuizView;
