
import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, Review, User, QuizAttempt, ServerQuestion } from '../types';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, LayoutGrid, Clock, Check, X, Send, ArrowRight, HelpCircle, Star, MessageSquare, Loader2, Timer, Award, BarChart3, List, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { quizService } from '../services/quizService';
import { useApp } from '../contexts/AppContext';
import ThemeLoader from './ThemeLoader';

interface QuizViewProps {
  set: StudySet;
  currentUser: User;
  onBack: () => void;
  onAddReview: (setId: string, review: Review) => void;
  serverAttempt?: QuizAttempt; 
  reviewAttemptId?: string; 
}

const COLORS = ['#10B981', '#EF4444'];

const QuizView: React.FC<QuizViewProps> = ({ set, currentUser, onBack, onAddReview, serverAttempt, reviewAttemptId }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); 
  const [loadedQuestions, setLoadedQuestions] = useState<ServerQuestion[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(!!reviewAttemptId);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [score, setScore] = useState(0);
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  const totalQuestionCount = serverAttempt?.totalQuestions || set.cards.length;

  // Initialize questions and sync initial answers from server
  useEffect(() => {
    if (serverAttempt) {
      setLoadedQuestions(serverAttempt.questions);
      
      const initialSelections = new Array(serverAttempt.totalQuestions).fill(null);
      serverAttempt.questions.forEach(q => {
          if (q.selectedAnswer) {
              initialSelections[q.questionNo - 1] = q.selectedAnswer;
          }
      });
      setUserSelections(initialSelections);
    } else {
      setUserSelections(new Array(totalQuestionCount).fill(null));
    }
  }, [serverAttempt]);

  // Sync userSelections when a new batch of questions is loaded
  useEffect(() => {
    if (loadedQuestions.length > 0) {
        setUserSelections(prev => {
            const next = [...prev];
            loadedQuestions.forEach(q => {
                if (q.selectedAnswer && next[q.questionNo - 1] === null) {
                    next[q.questionNo - 1] = q.selectedAnswer;
                }
            });
            return next;
        });
    }
  }, [loadedQuestions]);

  // Lazy load questions when index changes
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
          
          if (newQuestions.length > 0) {
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

  // Handle attempt review fetch
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

  // Timer
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
    if (isCompleted || isSubmitting || !currentQuestion) return;
    
    // 1. Cập nhật UI ngay lập tức
    setSelectedOption(option);
    const newUserSelections = [...userSelections];
    newUserSelections[currentQuestionIndex] = option;
    setUserSelections(newUserSelections);

    // 2. Gọi API /quiz/answer để lưu đáp án (Request: attemptId, studyCardId, selectedAnswer)
    if (serverAttempt) {
        quizService.saveAnswer(
            serverAttempt.attemptId,
            currentQuestion.cardId,
            option
        ).catch(err => {
            console.error("Auto-save answer failed", err);
        });
    }

    // 3. Tự động chuyển câu sau 300ms
    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestionIndex < totalQuestionCount - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleSubmitQuiz = async () => {
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
                  addNotification("Nộp bài thành công!", "success");
              }
          }
      } catch (error) {
          addNotification("Lỗi nộp bài.", "error");
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

  if (isSubmitting && !isCompleted) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> Đang xử lý...</div>;

  // --- RESULTS VIEW ---
  if (isCompleted) {
    const data = [{ name: t('quiz.correct'), value: score }, { name: t('quiz.incorrect'), value: 100 - score }];
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-32">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Award className="text-yellow-500 shrink-0" size={32} /> 
                    {reviewAttemptId ? "Lịch sử" : t('quiz.result_title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Học phần: <span className="text-brand-blue font-bold">{set.title}</span></p>
            </div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors"><ArrowLeft size={16} /> {t('quiz.back_detail')}</button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3"><List className="text-brand-blue" size={24} /> {t('quiz.detail_title')}</h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">Tổng {reviewItems.length} câu</span>
                </div>

                {reviewItems.map((item, idx) => (
                    <div key={idx} className={`p-5 md:p-8 rounded-[32px] border-2 transition-all group ${item.correct ? 'bg-green-50/30 border-green-100' : 'bg-red-50/30 border-red-100'}`}>
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-lg ${item.correct ? 'bg-green-500 shadow-green-100' : 'bg-red-500 shadow-red-100'}`}>{item.correct ? <Check size={24} strokeWidth={4} /> : <X size={24} strokeWidth={4} />}</div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-gray-900 dark:text-white text-lg leading-snug mb-4"><span className="text-gray-400 font-bold mr-2 text-sm uppercase">Câu {item.questionNo}:</span>{item.term}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className={`p-4 rounded-2xl border ${item.correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                        <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">{t('quiz.your_choice')}</span>
                                        <span className={`font-bold text-sm ${item.correct ? 'text-green-700' : 'text-red-700'}`}>{item.selectedAnswer || t('quiz.not_answered')}</span>
                                    </div>
                                    {!item.correct && (
                                        <div className="p-4 rounded-2xl border bg-white border-gray-200">
                                            <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">{t('quiz.correct_answer')}</span>
                                            <span className="font-bold text-sm text-green-600">{item.correctAnswer}</span>
                                        </div>
                                    )}
                                </div>
                                {item.explanation && <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 border-l-4 border-l-brand-blue"><p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">{item.explanation}</p></div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="lg:sticky lg:top-24 space-y-6">
                    <div className="bg-white dark:bg-gray-855 p-8 rounded-[40px] shadow-xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
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
                            <div className="text-center"><span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Kết quả</span><span className="font-black text-green-600">{reviewItems.filter(i=>i.correct).length}/{reviewItems.length}</span></div>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl bg-brand-blue text-white font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-brand-blue/20">Làm lại</button>
                            <button onClick={onBack} className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black uppercase text-xs tracking-widest transition-all">Quay về</button>
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    );
  }

  // --- QUIZ REVIEW (BEFORE SUBMIT) ---
  if (isReviewing) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
             <div className="mb-6"><button onClick={() => setIsReviewing(false)} className="text-gray-400 hover:text-gray-900 font-black uppercase text-[10px] flex items-center gap-2"><ArrowLeft size={16} /> Quay lại làm bài</button></div>
             <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10 text-center mb-10 transition-colors relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-600"></div>
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 text-indigo-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-xl"><HelpCircle size={40} /></div>
                 <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">{t('quiz.ready_submit')}</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-8 md:mb-10 font-medium max-w-md mx-auto text-sm md:text-base">{t('quiz.ready_desc')}</p>
                 <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={handleSubmitQuiz} className="bg-brand-blue text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-brand-blue/30 active:scale-95 transition-all flex items-center justify-center gap-3"><Send size={24} /> {t('quiz.confirm_submit')}</button>
                    <button onClick={() => setIsReviewing(false)} className="px-8 py-4 md:py-5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black uppercase text-xs tracking-widest transition-all">Kiểm tra lại</button>
                 </div>
             </div>
             <h3 className="text-[10px] font-black text-gray-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]"><LayoutGrid size={16} /> {t('quiz.overview')}</h3>
             <div className={`grid gap-3 ${totalQuestionCount > 40 ? 'grid-cols-5 sm:grid-cols-8 md:grid-cols-12' : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-10'}`}>
                {Array.from({ length: totalQuestionCount }).map((_, index) => {
                    const isAnswered = !!userSelections[index];
                    return (
                        <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-2xl flex items-center justify-center font-black text-sm border transition-all hover:scale-105 active:scale-95 ${isAnswered ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-100 text-gray-300 border-transparent'}`}>{index + 1}</button>
                    )
                })}
             </div>
        </div>
      );
  }

  // --- ACTIVE QUIZ VIEW ---
  const progress = (userSelections.filter(a => a !== null).length / totalQuestionCount) * 100;
  const isLoaded = !!currentQuestion && !isLoadingBatch;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10 animate-fade-in transition-colors pb-24">
      <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-50 bg-gray-50 dark:bg-gray-900 pb-6 pt-2 transition-colors">
              <div className="flex justify-between items-center mb-6 gap-4">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-900 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-colors shrink-0"><ArrowLeft size={18} /> <span className="hidden sm:inline">{t('quiz.exit')}</span></button>
                <div className="flex-1 flex flex-col items-center min-w-0">
                    <div className="flex items-center gap-2 mb-2"><Clock size={18} className="text-brand-blue" /><span className="text-lg md:text-xl font-black text-gray-900 dark:text-white font-mono">{formatTime(seconds)}</span></div>
                    <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-2 md:h-2.5 overflow-hidden"><div className="bg-brand-blue h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{userSelections.filter(a => a !== null).length}/{totalQuestionCount}</span>
                    <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden p-2 text-brand-blue bg-blue-50 dark:bg-blue-900/30 rounded-xl active:scale-90 transition-all"><LayoutGrid size={22} /></button>
                </div>
              </div>
          </div>

          {!isLoaded ? (
              <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] border-2 border-gray-50 dark:border-gray-800 p-20 flex flex-col items-center justify-center text-center">
                  <ThemeLoader size={48} className="mb-4" />
                  <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">{isLoadingBatch ? "Đang tải thêm câu hỏi..." : "Đang tải dữ liệu câu hỏi..."}</p>
              </div>
          ) : (
              <>
                  <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] shadow-sm border-2 border-gray-50 dark:border-gray-800 p-6 md:p-12 mb-8 min-h-[220px] md:min-h-[280px] flex flex-col justify-center relative overflow-hidden transition-colors">
                    <div className="absolute top-6 left-6 md:top-8 md:left-8">
                         <h3 className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">{t('quiz.question_prefix')} {currentQuestionIndex + 1}</h3>
                    </div>
                    <p className="text-xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-[1.3] text-center pt-8">{currentQuestion.term}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = (selectedOption === option) || (userSelections[currentQuestionIndex] === option);
                      return (
                        <button key={idx} onClick={() => handleOptionSelect(option)} className={`group p-4 md:p-6 text-left rounded-[28px] md:rounded-[32px] transition-all duration-300 flex items-center gap-4 md:gap-5 active:scale-[0.98] border-2 ${isSelected ? 'border-brand-blue bg-blue-50/50 ring-8 ring-brand-blue/5 text-brand-blue' : 'bg-white dark:bg-gray-855 border-gray-100 dark:border-gray-800 hover:border-brand-blue'}`}>
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 font-black text-base md:text-lg transition-colors ${isSelected ? 'bg-brand-blue text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>{isSelected ? <Check size={20} strokeWidth={4} /> : String.fromCharCode(65 + idx)}</div>
                          <span className="font-bold text-base md:text-lg leading-tight">{option}</span>
                        </button>
                      );
                    })}
                  </div>
              </>
          )}

          <div className="flex items-center justify-between gap-4 mt-8 bg-white dark:bg-gray-855 p-4 rounded-[32px] border-2 border-gray-50 dark:border-gray-800 transition-colors">
              <div className="flex gap-2">
                  <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="p-3 md:px-5 md:py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={24} className="md:hidden" /><span className="hidden md:flex items-center gap-2 font-black uppercase text-xs tracking-widest"><ChevronLeft size={16}/> Câu trước</span></button>
                  <button onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestionCount - 1, prev + 1))} disabled={currentQuestionIndex === totalQuestionCount - 1} className="p-3 md:px-5 md:py-3 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={24} className="md:hidden" /><span className="hidden md:flex items-center gap-2 font-black uppercase text-xs tracking-widest">Câu tiếp <ChevronRight size={16}/></span></button>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setIsReviewing(true)} className="px-5 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-black uppercase text-xs tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"><Eye size={18} /> <span className="hidden sm:inline">Tiến độ</span></button>
                  <button onClick={() => setIsReviewing(true)} className={`px-6 md:px-10 py-3 md:py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${userSelections.filter(a=>a!==null).length === totalQuestionCount ? 'bg-brand-blue text-white shadow-brand-blue/30 hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}><Send size={18} /> {t('quiz.submit_btn')}</button>
              </div>
          </div>
      </div>

      {/* Sidebar question grid - Optimized for many items */}
      <div className={`fixed inset-0 bg-black/50 z-[160] lg:static lg:bg-transparent lg:z-auto lg:w-80 flex-shrink-0 ${showGrid ? 'flex justify-end' : 'hidden lg:block'}`} onClick={() => setShowGrid(false)}>
         <div className="bg-white dark:bg-gray-800 h-full w-72 md:w-80 lg:w-full lg:h-auto lg:rounded-[40px] lg:shadow-xl lg:border lg:border-gray-100 dark:lg:border-gray-800 p-6 md:p-8 overflow-y-auto transition-colors" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]"><LayoutGrid size={18} className="text-brand-blue" /> {t('quiz.list_questions')}</h3>
                <button onClick={() => setShowGrid(false)} className="lg:hidden text-gray-400 hover:text-gray-900"><XCircle size={24} /></button>
            </div>

            <div className={`grid gap-2 ${totalQuestionCount > 100 ? 'grid-cols-6' : totalQuestionCount > 40 ? 'grid-cols-5' : 'grid-cols-4 md:gap-3'}`}>
                {Array.from({ length: totalQuestionCount }).map((_, index) => {
                    const isAnswered = !!userSelections[index];
                    const isLoadedItem = loadedQuestions.some(q => q.questionNo === index + 1);
                    const isCurrent = index === currentQuestionIndex;
                    
                    let statusClass = "bg-gray-50 dark:bg-gray-855 text-gray-400 border-transparent hover:border-gray-200 dark:hover:border-gray-700";
                    if (isCurrent) statusClass = "bg-brand-blue text-white shadow-lg ring-4 ring-brand-blue/20 z-10 border-transparent scale-110";
                    else if (isAnswered) statusClass = "bg-green-50 text-green-600 font-black border-green-100";
                    else if (!isLoadedItem) statusClass = "bg-gray-100 dark:bg-gray-900 text-gray-300 opacity-50";

                    return (
                        <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-xl md:rounded-2xl flex items-center justify-center font-black border transition-all ${totalQuestionCount > 100 ? 'text-[9px]' : totalQuestionCount > 50 ? 'text-[10px]' : 'text-xs md:text-sm'} ${statusClass}`}>
                            {index + 1}
                        </button>
                    )
                })}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-500"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>{t('quiz.status_answered')}</span></div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-400"><div className="w-3 h-3 rounded-full bg-gray-100"></div><span>{t('quiz.status_unanswered')}</span></div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-brand-blue"><div className="w-3 h-3 rounded-full bg-brand-blue animate-pulse"></div><span>Đang làm</span></div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                <button onClick={() => setIsReviewing(true)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"><CheckCircle size={18} /> {t('quiz.submit_btn')}</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default QuizView;
