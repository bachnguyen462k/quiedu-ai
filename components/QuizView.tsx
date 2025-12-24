
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
  
  // Lưu kết quả đúng/sai real-time
  const [resultsMap, setResultsMap] = useState<Record<number, { correct: boolean; correctAnswer: string; explanation?: string }>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(!!reviewAttemptId);
  const [showGrid, setShowGrid] = useState(false);
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
    setShowGrid(false);
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
    setShowGrid(false);
  };

  if (isSubmitting && !isCompleted) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> Đang tổng kết...</div>;

  // --- RESULTS VIEW ---
  if (isCompleted) {
    const data = [{ name: 'Đúng', value: score }, { name: 'Sai', value: 100 - score }];
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-32 transition-colors">
         <div className="flex justify-between items-end mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Award className="text-yellow-500 shrink-0" size={28} /> Kết quả
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{set.title}</p>
            </div>
            <button onClick={onBack} className="text-gray-400 hover:text-brand-blue font-black uppercase text-[10px] flex items-center gap-2 transition-colors"><ArrowLeft size={16} /> Quay về</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="md:col-span-1">
                <div className="bg-white dark:bg-gray-855 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 text-center shadow-xl">
                    <div className="h-40 w-full relative flex justify-center items-center mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart><Pie data={data} innerRadius={50} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">{data.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie></PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-2xl font-black text-gray-900 dark:text-white">{score}%</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-50 dark:border-gray-800 pt-4 mb-6">
                        <div className="text-center"><span className="block text-[8px] font-black text-gray-400 uppercase">Thời gian</span><span className="font-black text-sm text-gray-800 dark:text-gray-100">{formatTime(seconds)}</span></div>
                        <div className="text-center"><span className="block text-[8px] font-black text-gray-400 uppercase">Đúng</span><span className="font-black text-sm text-green-600">{reviewItems.filter((i:any)=>i.correct).length}/{reviewItems.length}</span></div>
                    </div>
                    <button onClick={() => window.location.reload()} className="w-full py-3 rounded-2xl bg-brand-blue text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-brand-blue/20">Làm lại từ đầu</button>
                </div>
            </div>

            <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2"><List size={16} /> Chi tiết bài làm</h3>
                {reviewItems.map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border transition-all ${item.correct ? 'bg-green-50/20 border-green-100 dark:bg-green-900/5' : 'bg-red-50/20 border-red-100 dark:bg-red-900/5'}`}>
                        <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${item.correct ? 'bg-green-500' : 'bg-red-500'}`}>{item.correct ? <Check size={16} strokeWidth={4} /> : <X size={16} strokeWidth={4} />}</div>
                            <div className="min-w-0">
                                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-2">{item.questionNo}. {item.term}</h4>
                                <div className="space-y-1 mb-2">
                                    <p className={`text-xs font-bold ${item.correct ? 'text-green-600' : 'text-red-600'}`}>Bạn chọn: {item.selectedAnswer || 'Bỏ trống'}</p>
                                    {!item.correct && <p className="text-xs font-bold text-green-600">Đáp án đúng: {item.correctAnswer}</p>}
                                </div>
                                {item.explanation && <p className="text-[10px] text-gray-500 italic leading-relaxed">{item.explanation}</p>}
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
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in transition-colors pb-24">
      <div className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900 pb-4 transition-colors">
          <div className="flex justify-between items-center mb-3 gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-900 font-black uppercase text-[10px] flex items-center gap-2 shrink-0"><ArrowLeft size={16} /> Thoát</button>
            <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-brand-blue" /><span className="text-sm font-black text-gray-900 dark:text-white font-mono">{formatTime(seconds)}</span></div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden"><div className="bg-brand-blue h-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-gray-400 uppercase">{userSelections.filter(a => a !== null).length}/{totalQuestionCount}</span>
                <button onClick={() => setShowGrid(!showGrid)} className="p-1 text-brand-blue bg-blue-50 dark:bg-blue-900/30 rounded-lg"><LayoutGrid size={18} /></button>
            </div>
          </div>
      </div>

      {!isLoaded ? (
          <div className="bg-white dark:bg-gray-855 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 flex flex-col items-center justify-center text-center">
              <ThemeLoader size={32} className="mb-3" />
              <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">Đang tải...</p>
          </div>
      ) : (
          <>
              {/* Question Card - Smaller Padding & Text */}
              <div className="bg-white dark:bg-gray-855 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-8 mb-5 min-h-[140px] flex flex-col justify-center relative overflow-hidden transition-colors">
                <div className="absolute top-4 left-5">
                     <span className="text-[8px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase">Câu {currentQuestionIndex + 1}</span>
                </div>
                <p className="text-base md:text-lg font-black text-gray-900 dark:text-white leading-snug text-center pt-2">{currentQuestion.term}</p>
              </div>

              {/* Options - Vertical Stack & Smaller */}
              <div className="flex flex-col gap-2.5 mb-6">
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
                          styleClass = "border-green-500 bg-green-50/50 text-green-700 dark:text-green-400 ring-2 ring-green-100 dark:ring-green-900/10";
                          iconClass = "bg-green-500 text-white";
                          iconContent = <Check size={14} strokeWidth={4} />;
                      } else if (isWrongSelection) {
                          styleClass = "border-red-500 bg-red-50/50 text-red-700 dark:text-red-400 ring-2 ring-red-100 dark:ring-red-900/10";
                          iconClass = "bg-red-500 text-white";
                          iconContent = <X size={14} strokeWidth={4} />;
                      }
                  } else if (isSelected) {
                      styleClass = "border-brand-blue bg-blue-50/50 text-brand-blue shadow-md";
                      iconClass = "bg-brand-blue text-white";
                  }

                  return (
                    <button 
                        key={idx} 
                        onClick={() => handleOptionSelect(option)} 
                        disabled={!!currentResult}
                        className={`group p-3 md:p-3.5 text-left rounded-xl md:rounded-2xl transition-all duration-300 flex items-center gap-3 active:scale-[0.99] border-2 ${styleClass}`}
                    >
                      <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 font-black text-xs transition-colors ${iconClass}`}>
                          {iconContent}
                      </div>
                      <span className="font-bold text-sm md:text-base leading-tight flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              {currentResult && currentResult.explanation && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-brand-blue p-4 rounded-xl mb-6 animate-fade-in transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                          <HelpCircle size={14} className="text-brand-blue" />
                          <span className="text-[9px] font-black text-brand-blue uppercase">Giải thích</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 text-xs leading-relaxed italic">{currentResult.explanation}</p>
                  </div>
              )}
          </>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-3 mt-4 bg-white dark:bg-gray-855 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
          <div className="flex gap-1.5">
              <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-20"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestionCount - 1, prev + 1))} disabled={currentQuestionIndex === totalQuestionCount - 1} className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-20"><ChevronRight size={20} /></button>
          </div>
          <div className="flex gap-2">
              {incorrectCount > 0 && (
                  <button 
                    onClick={handleRedoIncorrect}
                    className="px-4 py-2.5 bg-brand-orange text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2"
                  >
                      <RotateCcw size={14} /> Làm lại câu sai
                  </button>
              )}
              <button 
                onClick={handleFinishQuiz}
                className="px-5 py-2.5 bg-brand-blue text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                  <CheckCircle size={14} /> Xem kết quả
              </button>
          </div>
      </div>

      {/* Grid Overlay */}
      {showGrid && (
         <div className="fixed inset-0 bg-black/50 z-[160] flex justify-center items-center p-4" onClick={() => setShowGrid(false)}>
            <div className="bg-white dark:bg-gray-800 max-w-sm w-full rounded-[32px] p-6 shadow-2xl transition-colors" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase text-[10px] tracking-widest flex items-center gap-2"><LayoutGrid size={16} className="text-brand-blue" /> Danh sách câu hỏi</h3>
                    <button onClick={() => setShowGrid(false)} className="text-gray-400"><XCircle size={20} /></button>
                </div>
                <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 mb-6">
                    {Array.from({ length: totalQuestionCount }).map((_, index) => {
                        const result = resultsMap[index];
                        const isCurrent = index === currentQuestionIndex;
                        let statusClass = "bg-gray-50 dark:bg-gray-855 text-gray-400 border-transparent";
                        if (result) statusClass = result.correct ? "bg-green-500 text-white" : "bg-red-500 text-white";
                        else if (isCurrent) statusClass = "bg-brand-blue text-white ring-2 ring-brand-blue/20";
                        return (
                            <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-lg flex items-center justify-center font-black text-[10px] border transition-all ${statusClass}`}>{index + 1}</button>
                        )
                    })}
                </div>
                <div className="space-y-2.5">
                    {incorrectCount > 0 && (
                        <button onClick={handleRedoIncorrect} className="w-full bg-brand-orange text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2"><RotateCcw size={16} /> Làm lại {incorrectCount} câu sai</button>
                    )}
                    <button onClick={handleFinishQuiz} className="w-full bg-brand-blue text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2"><CheckCircle size={16} /> Kết thúc luyện tập</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default QuizView;
