
import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, Review, User, QuizAttempt, ServerQuestion } from '../types';
// Added List to the imports from lucide-react to fix "Cannot find name 'List'" error on line 206.
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, LayoutGrid, Clock, Check, X, Send, ArrowRight, HelpCircle, Star, MessageSquare, Loader2, Timer, Award, BarChart3, List } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { quizService } from '../services/quizService';
import { useApp } from '../contexts/AppContext';

interface QuizViewProps {
  set: StudySet;
  currentUser: User;
  onBack: () => void;
  onAddReview: (setId: string, review: Review) => void;
  serverAttempt?: QuizAttempt; 
  reviewAttemptId?: string; // Nếu có ID này, nhảy thẳng vào màn hình kết quả
}

const COLORS = ['#10B981', '#EF4444'];

const QuizView: React.FC<QuizViewProps> = ({ set, currentUser, onBack, onAddReview, serverAttempt, reviewAttemptId }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  
  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(!!reviewAttemptId);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Timer State
  const [seconds, setSeconds] = useState(0);

  // Result state (filled after submission and review fetch)
  const [score, setScore] = useState(0);
  const [reviewItems, setReviewItems] = useState<any[]>([]);

  // Review state (rating for study set)
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Fetch Review Data for Old Attempt
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

  // Timer Effect
  useEffect(() => {
    if (isCompleted || isSubmitting) return;
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, isSubmitting]);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize selections based on question count
  useEffect(() => {
    const questionCount = serverAttempt ? serverAttempt.questions.length : set.cards.length;
    setUserSelections(new Array(questionCount).fill(null));
  }, [serverAttempt, set.cards.length]);

  const questions = useMemo(() => {
    if (serverAttempt) return serverAttempt.questions;
    return set.cards.map((card, idx) => ({
        attemptQuestionId: idx,
        questionNo: idx + 1,
        cardId: Number(card.id),
        term: card.term,
        options: [...(card.options || []), card.definition].sort(() => 0.5 - Math.random())
    })) as any as ServerQuestion[];
  }, [serverAttempt, set.cards]);

  const handleOptionSelect = async (option: string) => {
    if (isCompleted || isSubmitting) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedOption(option);
    
    const newUserSelections = [...userSelections];
    newUserSelections[currentQuestionIndex] = option;
    setUserSelections(newUserSelections);

    if (serverAttempt) {
        quizService.saveAnswer(
            serverAttempt.attemptId,
            currentQuestion.cardId,
            option
        ).catch(err => console.error("Auto-save answer failed", err));
    }

    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setIsReviewing(true);
      }
    }, 300);
  };

  const handleSubmitQuiz = async () => {
      if (!serverAttempt) return;

      setIsSubmitting(true);
      try {
          const finalAnswers = questions.map((q, idx) => ({
              attemptQuestionId: q.attemptQuestionId,
              answer: userSelections[idx] || ""
          }));

          const submitResponse = await quizService.submitQuiz(serverAttempt.attemptId, finalAnswers);
          
          if (submitResponse.code === 1000) {
              const reviewResponse = await quizService.getQuizReview(serverAttempt.attemptId);
              if (reviewResponse.code === 1000) {
                  const items = reviewResponse.result; 
                  const correctCount = items.filter((i: any) => i.correct).length;
                  setScore(Math.round((correctCount / items.length) * 100));
                  setReviewItems(items);
                  setIsReviewing(false);
                  setIsCompleted(true);
                  addNotification("Nộp bài thành công!", "success");
              } else {
                  addNotification("Không thể lấy kết quả chi tiết.", "warning");
                  setIsCompleted(true);
              }
          } else {
              addNotification(submitResponse.message || "Lỗi khi nộp bài", "error");
          }
      } catch (error) {
          addNotification("Lỗi hệ thống. Vui lòng thử lại.", "error");
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

  if (isSubmitting && !isCompleted) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> Đang chuẩn bị kết quả...</div>;
  if (questions.length === 0 && !isCompleted) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> {t('quiz.generating')}</div>;

  // --- VIEW: RESULTS (Restructured) ---
  if (isCompleted) {
    const data = [
      { name: t('quiz.correct'), value: score },
      { name: t('quiz.incorrect'), value: 100 - score },
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-32">
         {/* Title Section */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Award className="text-yellow-500 shrink-0" size={32} /> 
                    {reviewAttemptId ? "Lịch sử ôn tập" : t('quiz.result_title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Chúc mừng bạn đã hoàn thành học phần: <span className="text-brand-blue font-bold">{set.title}</span></p>
            </div>
            <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-brand-blue font-black uppercase text-[10px] tracking-widest transition-colors self-start md:self-auto">
                <ArrowLeft size={16} /> {t('quiz.back_detail')}
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: DETAILED RESULTS (2/3) */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                        <List className="text-brand-blue" size={24} /> {t('quiz.detail_title')}
                    </h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">Tổng {reviewItems.length} câu</span>
                </div>

                {reviewItems.length > 0 ? reviewItems.map((item, idx) => (
                    <div key={idx} className={`p-5 md:p-8 rounded-[32px] border-2 transition-all group ${item.correct ? 'bg-green-50/30 dark:bg-green-900/5 border-green-100 dark:border-green-800/30 hover:border-green-300' : 'bg-red-50/30 dark:bg-red-900/5 border-red-100 dark:border-red-800/30 hover:border-red-300'}`}>
                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-white shadow-lg transition-transform group-hover:scale-110 ${item.correct ? 'bg-green-500 shadow-green-200 dark:shadow-none' : 'bg-red-500 shadow-red-200 dark:shadow-none'}`}>
                                {item.correct ? <Check size={24} strokeWidth={4} /> : <X size={24} strokeWidth={4} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                                    <h4 className="font-black text-gray-900 dark:text-white text-lg leading-snug">
                                        <span className="text-gray-400 font-bold mr-2 text-sm uppercase">Câu {item.questionNo}:</span>
                                        {item.term}
                                    </h4>
                                    {item.timeSpentMs > 0 && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                                            <Timer size={12} /> {(item.timeSpentMs / 1000).toFixed(1)}s
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                    <div className={`p-4 rounded-2xl border ${item.correct ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30'}`}>
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('quiz.your_choice')}</span>
                                        <span className={`font-bold text-sm ${item.correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{item.selectedAnswer || t('quiz.not_answered')}</span>
                                    </div>
                                    {!item.correct && (
                                        <div className="p-4 rounded-2xl border bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 shadow-sm">
                                            <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('quiz.correct_answer')}</span>
                                            <span className="font-bold text-sm text-green-600 dark:text-green-400">{item.correctAnswer}</span>
                                        </div>
                                    )}
                                </div>

                                {item.explanation && (
                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden transition-colors">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-blue"></div>
                                        <h5 className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <MessageSquare size={12} fill="currentColor" /> Giải thích kiến thức
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium italic">{item.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-24 text-gray-400 font-medium italic bg-white dark:bg-gray-800 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-700 transition-colors">
                        <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                        Đang tải dữ liệu kết quả chi tiết...
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: SCORE & EVALUATION (1/3) */}
            <div className="lg:col-span-1 space-y-6">
                <div className="lg:sticky lg:top-24 space-y-6">
                    {/* Score Chart Card */}
                    <div className="bg-white dark:bg-gray-855 p-8 rounded-[40px] shadow-xl border border-gray-100 dark:border-gray-800 transition-colors text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-blue"></div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Thống kê điểm số</h3>
                        
                        <div className="h-40 md:h-48 w-full relative flex justify-center items-center mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-none">{score}%</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">Hoàn thành</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 dark:border-gray-800 mb-8">
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Thời gian</span>
                                <span className="font-black text-gray-800 dark:text-gray-100">{formatTime(seconds)}</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Kết quả</span>
                                <span className="font-black text-green-600">{reviewItems.filter(i=>i.correct).length}/{reviewItems.length}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {!reviewAttemptId && (
                                <button onClick={() => window.location.reload()} className="w-full py-4 rounded-2xl bg-brand-blue text-white hover:bg-blue-700 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-blue/20 active:scale-95">
                                    <RefreshCw size={18} /> {t('quiz.retry')}
                                </button>
                            )}
                            <button onClick={onBack} className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-black uppercase text-xs tracking-widest transition-all active:scale-95">
                                Quay về thư viện
                            </button>
                        </div>
                    </div>

                    {/* Evaluation/Review Card */}
                    {!reviewAttemptId && !reviewSubmitted && (
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 md:p-8 rounded-[40px] border border-orange-100 dark:border-orange-900/30 transition-colors shadow-sm">
                            <h3 className="text-center text-xs font-black text-brand-orange uppercase tracking-widest mb-6">Đánh giá học phần</h3>
                            <div className="flex justify-center gap-2 md:gap-3 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star} 
                                        onClick={() => setRating(star)} 
                                        className="transition-all hover:scale-125 active:scale-90"
                                    >
                                        <Star size={32} className={`${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-gray-200 dark:text-gray-700'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                className="w-full p-4 bg-white dark:bg-gray-900 border border-orange-100 dark:border-orange-900/30 dark:text-white rounded-2xl text-sm mb-4 focus:ring-4 focus:ring-brand-orange/10 outline-none transition-all font-medium placeholder-gray-400" 
                                placeholder={t('quiz.review_ph')} 
                                rows={3} 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)} 
                            />
                            <button 
                                onClick={() => { 
                                    if(rating === 0) { addNotification("Vui lòng chọn số sao đánh giá!", "warning"); return; }
                                    onAddReview(set.id, { id: uuidv4(), userId: currentUser.id, userName: currentUser.name, rating, comment, createdAt: Date.now() }); 
                                    setReviewSubmitted(true); 
                                    addNotification("Cảm ơn bạn đã đánh giá!", "success");
                                }} 
                                className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-orange/20 hover:bg-orange-600 transition-all active:scale-95"
                            >
                                Gửi ý kiến của bạn
                            </button>
                        </div>
                    )}
                    
                    {reviewSubmitted && (
                         <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-[40px] border border-green-100 dark:border-green-900/30 text-center animate-fade-in transition-colors">
                            <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <CheckCircle size={24} />
                            </div>
                            <h4 className="font-black text-green-700 dark:text-green-400 uppercase text-xs tracking-widest mb-2">Đã ghi nhận đánh giá</h4>
                            <p className="text-xs text-gray-500 font-medium">Ý kiến của bạn đã được gửi tới tác giả học phần.</p>
                         </div>
                    )}
                </div>
            </div>
         </div>
      </div>
    );
  }

  // --- VIEW: REVIEW BEFORE SUBMIT ---
  if (isReviewing) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
             <div className="mb-6">
                 <button onClick={() => setIsReviewing(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-colors">
                    <ArrowLeft size={16} /> {t('quiz.review_questions')}
                 </button>
             </div>

             <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10 text-center mb-10 transition-colors relative overflow-hidden">
                 <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-600"></div>
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[28px] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-xl">
                     <HelpCircle size={40} />
                 </div>
                 <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">{t('quiz.ready_submit')}</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-8 md:mb-10 font-medium max-w-md mx-auto text-sm md:text-base">{t('quiz.ready_desc')}</p>
                 
                 <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="bg-brand-blue text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl font-black text-base md:text-lg hover:bg-blue-700 shadow-2xl shadow-brand-blue/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />} 
                        {isSubmitting ? "ĐANG NỘP..." : t('quiz.confirm_submit')}
                    </button>
                    <button onClick={() => setIsReviewing(false)} className="px-8 py-4 md:py-5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">
                        Kiểm tra lại
                    </button>
                 </div>
             </div>

             <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                <LayoutGrid size={16} /> {t('quiz.overview')}
             </h3>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {questions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    let statusClass = "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-transparent";
                    if (hasAnswered) statusClass = "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 ring-4 ring-indigo-500/5"; 

                    return (
                        <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center font-black text-sm border transition-all hover:scale-105 active:scale-95 ${statusClass}`}>
                            {index + 1}
                        </button>
                    )
                })}
             </div>
        </div>
      );
  }

  // --- VIEW: ACTIVE QUIZ ---
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = userSelections.filter(a => a !== null).length;
  const progress = (answeredCount / questions.length) * 100;
  const isAllAnswered = userSelections.every(a => a !== null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10 animate-fade-in transition-colors pb-24">
      <div className="flex-1">
          <div className="flex justify-between items-center mb-8 gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-900 dark:hover:text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-colors shrink-0">
              <ArrowLeft size={18} /> <span className="hidden sm:inline">{t('quiz.exit')}</span>
            </button>
            
            <div className="flex-1 flex flex-col items-center min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-brand-blue" />
                    <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white font-mono">{formatTime(seconds)}</span>
                </div>
                <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-2 md:h-2.5 overflow-hidden">
                    <div className="bg-brand-blue h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap tracking-widest">{answeredCount}/{questions.length}</span>
                <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden p-2 text-brand-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl transition-all active:scale-90">
                    <LayoutGrid size={22} />
                </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-855 rounded-[32px] md:rounded-[40px] shadow-sm border-2 border-gray-50 dark:border-gray-800 p-6 md:p-12 mb-8 min-h-[220px] md:min-h-[280px] flex flex-col justify-center relative overflow-hidden transition-colors">
            <div className="absolute top-6 left-6 md:top-8 md:left-8">
                 <h3 className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">{t('quiz.question_prefix')} {currentQuestionIndex + 1}</h3>
            </div>
            <p className="text-xl md:text-4xl font-black text-gray-900 dark:text-white leading-[1.3] text-center pt-8">{currentQuestion.term}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = (selectedOption === option) || (userSelections[currentQuestionIndex] === option);
              
              let buttonStyle = "bg-white dark:bg-gray-855 border-2 border-gray-100 dark:border-gray-800 hover:border-brand-blue dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 text-gray-800 dark:text-gray-200";
              let badgeStyle = "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-gray-700";

              if (isSelected) {
                 buttonStyle = "border-brand-blue bg-blue-50/50 dark:bg-blue-900/30 ring-8 ring-brand-blue/5 text-brand-blue dark:text-blue-300 scale-[1.02]";
                 badgeStyle = "bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20";
              }

              return (
                <button key={idx} onClick={() => handleOptionSelect(option)} className={`group p-4 md:p-6 text-left rounded-[28px] md:rounded-[32px] transition-all duration-300 flex items-center gap-4 md:gap-5 active:scale-[0.98] ${buttonStyle}`}>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 font-black text-base md:text-lg transition-colors ${badgeStyle}`}>
                      {isSelected ? <Check size={20} md:size={24} strokeWidth={4} /> : String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-bold text-base md:text-xl leading-tight">{option}</span>
                </button>
              );
            })}
          </div>

          {isAllAnswered && (
              <div className="flex justify-end animate-fade-in">
                  <button onClick={() => setIsReviewing(true)} className="w-full sm:w-auto bg-brand-blue text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-2xl shadow-brand-blue/30 transition-all transform hover:-translate-y-1 active:scale-95">
                      {t('quiz.to_submit_page')} <ArrowRight size={18} />
                  </button>
              </div>
          )}
      </div>

      {/* Sidebar question grid */}
      <div className={`fixed inset-0 bg-black/50 z-[160] lg:static lg:bg-transparent lg:z-auto lg:w-80 flex-shrink-0 ${showGrid ? 'flex justify-end' : 'hidden lg:block'}`} onClick={() => setShowGrid(false)}>
         <div className="bg-white dark:bg-gray-800 h-full w-72 md:w-80 lg:w-full lg:h-auto lg:rounded-[40px] lg:shadow-xl lg:border lg:border-gray-100 dark:lg:border-gray-800 p-6 md:p-8 overflow-y-auto transition-colors" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]">
                    <LayoutGrid size={18} className="text-brand-blue" /> 
                    {t('quiz.list_questions')}
                </h3>
                <button onClick={() => setShowGrid(false)} className="lg:hidden text-gray-400 hover:text-gray-900 transition-colors"><XCircle size={24} /></button>
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-3">
                {questions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    let statusClass = "bg-gray-50 dark:bg-gray-855 text-gray-400 dark:text-gray-600 border-transparent hover:border-gray-200 dark:hover:border-gray-700";
                    if (index === currentQuestionIndex) {
                        statusClass = "bg-brand-blue text-white shadow-lg shadow-brand-blue/20 scale-110 z-10 border-transparent";
                    } else if (hasAnswered) {
                        statusClass = "bg-blue-50 dark:bg-blue-900/30 text-brand-blue dark:text-blue-400 font-black border-blue-100 dark:border-blue-900/50";
                    }

                    return (
                        <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-sm font-black border transition-all ${statusClass}`}>
                            {index + 1}
                        </button>
                    )
                })}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div className="w-3 h-3 rounded-full bg-brand-blue"></div>
                    <span>{t('quiz.status_answered')}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-gray-100 dark:bg-gray-800"></div>
                    <span>{t('quiz.status_unanswered')}</span>
                </div>
            </div>
            
            {isAllAnswered && (
                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                    <button onClick={() => setIsReviewing(true)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95">
                        <CheckCircle size={18} /> {t('quiz.submit_btn')}
                    </button>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default QuizView;
