
import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, Review, User, QuizAttempt, ServerQuestion } from '../types';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, LayoutGrid, Clock, Check, X, Send, ArrowRight, HelpCircle, Star, MessageSquare, Loader2, Timer, Award, BarChart3, List, ChevronLeft, ChevronRight, Eye, Play, Layers, User as UserIcon, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { quizService, AnswerResponse } from '../services/quizService';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); 
  const [loadedQuestions, setLoadedQuestions] = useState<ServerQuestion[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  
  // Map lưu kết quả đúng/sai từ API cho mỗi câu
  const [resultsMap, setResultsMap] = useState<Record<number, { correct: boolean; correctAnswer: string; explanation?: string }>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(!!reviewAttemptId);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [score, setScore] = useState(0);
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  const totalQuestionCount = serverAttempt?.studySet?.totalQuestions || serverAttempt?.totalQuestions || set.cards.length;

  const recommendations = useMemo(() => {
      return allSets
          .filter(s => s.id !== set.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
  }, [allSets, set.id]);

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

  // Logic: Làm lại các câu sai
  const handleRedoIncorrect = () => {
    const incorrectIndices = Object.keys(resultsMap)
        .map(Number)
        .filter(idx => !resultsMap[idx].correct);

    if (incorrectIndices.length === 0) {
        addNotification("Bạn không có câu trả lời sai nào!", "info");
        return;
    }

    // Xóa trạng thái của các câu sai để người dùng chọn lại
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
    setIsReviewing(false);
    setShowGrid(false);
    addNotification(`Đã sẵn sàng để bạn làm lại ${incorrectIndices.length} câu chưa đúng.`, "info");
  };

  const handleFinishPractice = async () => {
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
                  setIsReviewing(false);
                  setIsCompleted(true);
                  addNotification("Hoàn thành luyện tập!", "success");
              }
          }
      } catch (error) {
          addNotification("Lỗi khi kết thúc luyện tập.", "error");
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedOption(null);
    setShowGrid(false);
    setIsReviewing(false); 
  };

  if (isSubmitting && !isCompleted) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> Đang tổng kết...</div>;

  // --- RESULTS VIEW ---
  if (isCompleted) {
    const data = [{ name: t('quiz.correct'), value: score }, { name: t('quiz.incorrect'), value: 100 - score }];
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-32 transition-colors">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Award className="text-yellow-500 shrink-0" size={32} /> 
                    Kết quả luyện tập
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Học phần: <span className="text-brand-blue font-bold">{set.title}</span></p>
            </div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors"><ArrowLeft size={16} /> {t('quiz.back_detail')}</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3"><List className="text-brand-blue" size={24} /> {t('quiz.detail_title')}</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">Tổng {reviewItems.length} câu</span>
                </div>

                {reviewItems.map((item, idx) => (
                    <div key={idx} className={`p-5 md:p-8 rounded-[32px] border-2 transition-all group ${item.correct ? 'bg-green-50/30 border-green-100 dark:bg-green-900/10 dark:border-green-800/30' : 'bg-red-50/30 border-red-100 dark:bg-red-900/10 dark:border-red-800/30'}`}>
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg ${item.correct ? 'bg-green-500 shadow-green-100 dark:shadow-none' : 'bg-red-500 shadow-red-100 dark:shadow-none'}`}>{item.correct ? <Check size={24} strokeWidth={4} /> : <X size={24} strokeWidth={4} />}</div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-gray-900 dark:text-white text-lg leading-snug mb-4"><span className="text-gray-400 font-bold mr-2 text-sm uppercase">Câu {item.questionNo}:</span>{item.term}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className={`p-4 rounded-2xl border ${item.correct ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800'}`}>
                                        <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">{t('quiz.your_choice')}</span>
                                        <span className={`font-bold text-sm ${item.correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{item.selectedAnswer || t('quiz.not_answered')}</span>
                                    </div>
                                    {!item.correct && (
                                        <div className="p-4 rounded-2xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                            <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">{t('quiz.correct_answer')}</span>
                                            <span className="font-bold text-sm text-green-600 dark:text-green-400">{item.correctAnswer}</span>
                                        </div>
                                    )}
                                </div>
                                {item.explanation && <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 border-l-4 border-l-brand-blue transition-colors"><p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">{item.explanation}</p></div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="lg:sticky lg:top-24 space-y-6">
                    <div className="bg-white dark:bg-gray-855 p-8 rounded-[40px] shadow-xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden transition-colors">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-blue"></div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Thống kê điểm số</h3>
                        <div className="h-40 md:h-48 w-full relative flex justify-center items-center mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart><Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">{data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie></PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-none">{score}%</span><span className="text-[10px] font-black text-gray-400 uppercase mt-1">Hoàn thành</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 dark:border-gray-800 mb-8">
                            <div className="text-center"><span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Thời gian</span><span className="font-black text-gray-800 dark:text-gray-100">{formatTime(seconds)}</span></div>
                            {/* Added explicit any type to filter parameter to avoid Property 'correct' does not exist on type 'unknown' error */}
                            <div className="text-center"><span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Kết quả</span><span className="font-black text-green-600">{reviewItems.filter((i: any) => i.correct).length}/{reviewItems.length}</span></div>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl bg-brand-blue text-white font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-brand-blue/20">Làm lại từ đầu</button>
                            <button onClick={onBack} className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black uppercase text-xs tracking-widest transition-all">Quay về</button>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    );
  }

  // --- QUIZ REVIEW (BEFORE FINISH) ---
  if (isReviewing) {
      {/* Added explicit any type to filter parameter to avoid Property 'correct' does not exist on type 'unknown' error */}
      const incorrectCount = Object.values(resultsMap).filter((r: any) => !r.correct).length;
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
             <div className="mb-6"><button onClick={() => setIsReviewing(false)} className="text-gray-400 hover:text-gray-900 font-black uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Quay lại làm bài</button></div>
             <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10 text-center mb-10 transition-colors relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-brand-blue"></div>
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-brand-blue rounded-[28px] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-xl"><LayoutGrid size={40} /></div>
                 <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Tiến độ thực hiện</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-8 md:mb-10 font-medium max-w-md mx-auto text-sm md:text-base">Bạn đã hoàn thành phần lớn các câu hỏi. Bạn muốn làm gì tiếp theo?</p>
                 <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {incorrectCount > 0 && (
                        <button onClick={handleRedoIncorrect} className="bg-brand-orange text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-xl shadow-brand-orange/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <RotateCcw size={24} /> Làm lại {incorrectCount} câu sai
                        </button>
                    )}
                    <button onClick={handleFinishPractice} className="bg-brand-blue text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-xl shadow-brand-blue/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                        <CheckCircle size={24} /> Kết thúc & xem kết quả
                    </button>
                 </div>
             </div>
             <h3 className="text-[10px] font-black text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]"><LayoutGrid size={16} /> Tổng quan lưới câu hỏi</h3>
             <div className={`grid gap-3 ${totalQuestionCount > 40 ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-12' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-10'}`}>
                {Array.from({ length: totalQuestionCount }).map((_, index) => {
                    const isAnswered = !!userSelections[index];
                    const result = resultsMap[index];
                    
                    let bgClass = "bg-gray-100 text-gray-300 border-transparent";
                    if (result) {
                        bgClass = result.correct 
                            ? "bg-green-500 text-white border-green-600 shadow-md shadow-green-200" 
                            : "bg-red-500 text-white border-red-600 shadow-md shadow-red-200";
                    } else if (isAnswered) {
                        bgClass = "bg-indigo-50 text-indigo-600 border-indigo-200";
                    }

                    return (
                        <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-sm border transition-all hover:scale-105 active:scale-95 ${bgClass}`}>{index + 1}</button>
                    )
                })}
             </div>
        </div>
      );
  }

  // --- ACTIVE QUIZ VIEW ---
  const progress = (userSelections.filter(a => a !== null).length / totalQuestionCount) * 100;
  const isLoaded = !!currentQuestion && !isLoadingBatch;
  const currentResult = resultsMap[currentQuestionIndex];
  {/* Added explicit any type to some parameter to avoid Property 'correct' does not exist on type 'unknown' error */}
  const hasIncorrect = Object.values(resultsMap).some((r: any) => !r.correct);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 animate-fade-in transition-colors pb-24">
      <div className="w-full">
          <div className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900 pb-4 pt-2 transition-colors">
              <div className="flex justify-between items-center mb-4 gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-900 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-colors shrink-0"><ArrowLeft size={18} /> <span className="hidden sm:inline">{t('quiz.exit')}</span></button>
                <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-2 mb-1.5"><Clock size={16} className="text-brand-blue" /><span className="text-base md:text-lg font-black text-gray-900 dark:text-white font-mono">{formatTime(seconds)}</span></div>
                    <div className="w-full max-w-sm bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 md:h-2 overflow-hidden"><div className="bg-brand-blue h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{userSelections.filter(a => a !== null).length}/{totalQuestionCount}</span>
                    <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden p-1.5 text-brand-blue bg-blue-50 dark:bg-blue-900/30 rounded-lg active:scale-90 transition-all"><LayoutGrid size={20} /></button>
                </div>
              </div>
          </div>

          {!isLoaded ? (
              <div className="bg-white dark:bg-gray-855 rounded-[24px] md:rounded-[32px] border-2 border-gray-50 dark:border-gray-800 p-16 flex flex-col items-center justify-center text-center">
                  <ThemeLoader size={40} className="mb-3" />
                  <p className="text-gray-500 font-black uppercase tracking-widest text-[9px]">{isLoadingBatch ? "Đang tải thêm câu hỏi..." : "Đang tải dữ liệu câu hỏi..."}</p>
              </div>
          ) : (
              <>
                  <div className="bg-white dark:bg-gray-855 rounded-[24px] md:rounded-[32px] shadow-sm border-2 border-gray-50 dark:border-gray-800 p-6 md:p-10 mb-6 min-h-[160px] md:min-h-[200px] flex flex-col justify-center relative overflow-hidden transition-colors">
                    <div className="absolute top-4 left-6">
                         <h3 className="text-[9px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full uppercase tracking-widest">{t('quiz.question_prefix')} {currentQuestionIndex + 1}</h3>
                    </div>
                    <p className="text-lg md:text-2xl font-black text-gray-900 dark:text-white leading-[1.4] text-center pt-4">{currentQuestion.term}</p>
                  </div>

                  <div className="flex flex-col gap-3 mb-6">
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
                              styleClass = "border-green-500 bg-green-50/50 text-green-700 dark:text-green-400 ring-4 ring-green-100 dark:ring-green-900/20";
                              iconClass = "bg-green-500 text-white";
                              iconContent = <Check size={16} strokeWidth={4} />;
                          } else if (isWrongSelection) {
                              styleClass = "border-red-500 bg-red-50/50 text-red-700 dark:text-red-400 ring-4 ring-red-100 dark:ring-red-900/20";
                              iconClass = "bg-red-500 text-white";
                              iconContent = <X size={16} strokeWidth={4} />;
                          } else if (isSelected) {
                             styleClass = "border-brand-blue bg-blue-50/50 text-brand-blue";
                          }
                      } else if (isSelected) {
                          styleClass = "border-brand-blue bg-blue-50/50 ring-4 ring-brand-blue/5 text-brand-blue";
                          iconClass = "bg-brand-blue text-white";
                      }

                      return (
                        <button 
                            key={idx} 
                            onClick={() => handleOptionSelect(option)} 
                            disabled={!!currentResult}
                            className={`group p-3 md:p-4 text-left rounded-2xl md:rounded-[24px] transition-all duration-300 flex items-center gap-3 md:gap-4 active:scale-[0.99] border-2 ${styleClass} ${currentResult ? 'cursor-default' : ''}`}
                        >
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 font-black text-sm md:text-base transition-colors ${iconClass}`}>
                              {iconContent}
                          </div>
                          <span className="font-bold text-sm md:text-base leading-tight">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {currentResult && currentResult.explanation && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-brand-blue p-5 rounded-2xl mb-6 animate-fade-in transition-colors">
                          <div className="flex items-center gap-2 mb-1.5">
                              <HelpCircle size={14} className="text-brand-blue" />
                              <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Giải thích</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-200 text-xs md:text-sm font-medium leading-relaxed italic">{currentResult.explanation}</p>
                      </div>
                  )}
              </>
          )}

          <div className="flex items-center justify-between gap-4 mt-4 bg-white dark:bg-gray-855 p-3 rounded-2xl md:rounded-[24px] border-2 border-gray-50 dark:border-gray-800 transition-colors">
              <div className="flex gap-2">
                  <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="p-2.5 md:px-4 md:py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={20} className="md:hidden" /><span className="hidden md:flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><ChevronLeft size={14}/> Câu trước</span></button>
                  <button onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestionCount - 1, prev + 1))} disabled={currentQuestionIndex === totalQuestionCount - 1} className="p-2.5 md:px-4 md:py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={20} className="md:hidden" /><span className="hidden md:flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">Câu tiếp <ChevronRight size={14}/></span></button>
              </div>
              <div className="flex gap-2">
                  {hasIncorrect && (
                      <button onClick={handleRedoIncorrect} className="px-4 py-2.5 rounded-xl bg-brand-orange text-white font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95 transition-all flex items-center gap-2">
                          <RotateCcw size={16} /> <span className="hidden sm:inline">Làm lại câu sai</span>
                      </button>
                  )}
                  <button onClick={() => setIsReviewing(true)} className="px-5 md:px-8 py-2.5 md:py-3 rounded-xl bg-brand-blue text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md"><Eye size={16} /> <span className="hidden sm:inline">Tiến độ & Kết thúc</span></button>
              </div>
          </div>
      </div>

      {/* Grid Overlay for Tablet/Desktop results overview */}
      {showGrid && (
         <div className="fixed inset-0 bg-black/50 z-[160] flex justify-center items-center p-4" onClick={() => setShowGrid(false)}>
            <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-[32px] p-8 overflow-y-auto max-h-[80vh] transition-colors" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]"><LayoutGrid size={18} className="text-brand-blue" /> {t('quiz.list_questions')}</h3>
                    <button onClick={() => setShowGrid(false)} className="text-gray-400 hover:text-gray-900"><XCircle size={24} /></button>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-8">
                    {Array.from({ length: totalQuestionCount }).map((_, index) => {
                        const result = resultsMap[index];
                        const isCurrent = index === currentQuestionIndex;
                        let statusClass = "bg-gray-50 dark:bg-gray-855 text-gray-400 border-transparent";
                        if (result) statusClass = result.correct ? "bg-green-500 text-white" : "bg-red-500 text-white";
                        else if (isCurrent) statusClass = "bg-brand-blue text-white ring-4 ring-brand-blue/20";
                        return (
                            <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-xl flex items-center justify-center font-black text-xs border transition-all ${statusClass}`}>{index + 1}</button>
                        )
                    })}
                </div>
                <div className="space-y-3">
                    {hasIncorrect && (
                        <button onClick={handleRedoIncorrect} className="w-full bg-brand-orange text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-orange/20"><RotateCcw size={18} /> Làm lại câu sai</button>
                    )}
                    <button onClick={handleFinishPractice} className="w-full bg-brand-blue text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"><CheckCircle size={18} /> Kết thúc luyện tập</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default QuizView;
