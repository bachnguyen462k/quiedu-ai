
import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, QuizQuestion, Review, User, QuizAttempt, ServerQuestion } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, LayoutGrid, Clock, Check, X, Send, ArrowRight, HelpCircle, Star, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
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
  serverAttempt?: QuizAttempt; // Dữ liệu từ Server API /quiz/start
}

const COLORS = ['#10B981', '#EF4444', '#E5E7EB'];

const QuizView: React.FC<QuizViewProps> = ({ set, currentUser, onBack, onAddReview, serverAttempt }) => {
  const { t } = useTranslation();
  const { addNotification } = useApp();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Track user selection: [answer_string, answer_string, ...]
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Result state (filled after submission)
  const [score, setScore] = useState(0);
  const [serverResults, setServerResults] = useState<any[]>([]);

  // Review state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Initialize selections based on question count
  useEffect(() => {
    const questionCount = serverAttempt ? serverAttempt.questions.length : set.cards.length;
    setUserSelections(new Array(questionCount).fill(null));
  }, [serverAttempt, set.cards.length]);

  const questions = useMemo(() => {
    if (serverAttempt) return serverAttempt.questions;
    // Fallback: Tự sinh câu hỏi từ cards nếu không có serverAttempt (chế độ offline/demo)
    return set.cards.map((card, idx) => ({
        attemptQuestionId: idx,
        questionNo: idx + 1,
        cardId: Number(card.id),
        term: card.term,
        options: [...(card.options || []), card.definition].sort(() => 0.5 - Math.random())
    })) as any as ServerQuestion[];
  }, [serverAttempt, set.cards]);

  const handleOptionSelect = (option: string) => {
    if (isCompleted || isSubmitting) return;
    
    setSelectedOption(option);
    const newUserSelections = [...userSelections];
    newUserSelections[currentQuestionIndex] = option;
    setUserSelections(newUserSelections);

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
      if (!serverAttempt) {
          // Logic cho Offline Quiz (Cần đáp án trong Flashcard)
          addNotification("Hệ thống Quiz Offline đang được cập nhật.", "info");
          return;
      }

      setIsSubmitting(true);
      try {
          const payload = questions.map((q, idx) => ({
              attemptQuestionId: q.attemptQuestionId,
              answer: userSelections[idx] || ""
          }));

          const response = await quizService.submitQuiz(serverAttempt.attemptId, payload);
          if (response.code === 1000) {
              setScore(response.result.score);
              setServerResults(response.result.details || []);
              setIsReviewing(false);
              setIsCompleted(true);
              addNotification("Đã nộp bài thành công!", "success");
          }
      } catch (error) {
          addNotification("Lỗi nộp bài. Vui lòng kiểm tra kết nối.", "error");
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

  if (questions.length === 0) return <div className="p-20 text-center dark:text-white flex flex-col items-center gap-4"><Loader2 className="animate-spin text-brand-blue" /> {t('quiz.generating')}</div>;

  // --- VIEW: RESULTS ---
  if (isCompleted) {
    const percentage = Math.round(score); // Giả định score trả về là 0-100
    const data = [
      { name: t('quiz.correct'), value: score },
      { name: t('quiz.incorrect'), value: 100 - score },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
         <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-8 text-gray-900 dark:text-white uppercase tracking-tight">{t('quiz.result_title')}</h2>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-700 mb-8 max-w-2xl mx-auto transition-colors">
                <div className="h-64 w-full flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="text-6xl font-black text-brand-blue dark:text-blue-400 mb-2">{percentage}%</div>
                <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold uppercase tracking-widest text-xs">
                    KẾT QUẢ ĐÃ ĐƯỢC AI XÁC THỰC
                </p>

                <div className="flex justify-center gap-4">
                    <button onClick={onBack} className="px-8 py-3.5 rounded-2xl border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-black uppercase text-xs tracking-widest transition-all">
                        {t('quiz.back_detail')}
                    </button>
                    <button onClick={() => window.location.reload()} className="px-8 py-3.5 rounded-2xl bg-brand-blue text-white hover:bg-blue-700 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-brand-blue/20">
                        <RefreshCw size={18} /> {t('quiz.retry')}
                    </button>
                </div>
            </div>
            
            {/* Review Section (Reuse old code) */}
            {!reviewSubmitted && (
                <div className="bg-orange-50 dark:bg-orange-900/10 p-8 rounded-[32px] border border-orange-100 dark:border-orange-900/20 max-w-2xl mx-auto mb-8 transition-colors">
                     <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">{t('quiz.review_title')}</h3>
                     <div className="flex justify-center gap-3 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-125">
                                <Star size={36} className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea className="w-full p-5 bg-white dark:bg-gray-900 border border-orange-100 dark:border-orange-900/30 dark:text-white rounded-2xl text-sm mb-4 focus:ring-4 focus:ring-orange-100 outline-none transition-all font-medium" placeholder={t('quiz.review_ph')} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
                    <button onClick={() => { onAddReview(set.id, { id: uuidv4(), userId: currentUser.id, userName: currentUser.name, rating, comment, createdAt: Date.now() }); setReviewSubmitted(true); }} className="w-full bg-brand-orange text-white py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-orange/20 transition-all active:scale-95">Gửi đánh giá</button>
                </div>
            )}
         </div>

         {/* Detailed Stats from Server */}
         <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 uppercase tracking-tighter">{t('quiz.detail_title')}</h3>
            
            {serverResults.length > 0 ? serverResults.map((detail, idx) => (
                <div key={idx} className={`p-6 rounded-[24px] border-2 transition-all ${detail.isCorrect ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-white ${detail.isCorrect ? 'bg-green-500 shadow-lg shadow-green-200 dark:shadow-none' : 'bg-red-500 shadow-lg shadow-red-200 dark:shadow-none'}`}>
                            {detail.isCorrect ? <Check size={20} strokeWidth={4} /> : <X size={20} strokeWidth={4} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-gray-900 dark:text-white mb-4 text-lg leading-snug">
                                <span className="text-gray-400 font-bold mr-2 text-sm uppercase">Câu {idx + 1}:</span>
                                {detail.questionTerm}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className={`p-3 rounded-xl border ${detail.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30'}`}>
                                    <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('quiz.your_choice')}</span>
                                    <span className={`font-bold text-sm ${detail.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{detail.userAnswer || t('quiz.not_answered')}</span>
                                </div>
                                {!detail.isCorrect && (
                                    <div className="p-3 rounded-xl border bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('quiz.correct_answer')}</span>
                                        <span className="font-bold text-sm text-green-600 dark:text-green-400">{detail.correctAnswer}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 text-gray-400 font-medium italic">Không có dữ liệu chi tiết cho bài làm này.</div>
            )}
         </div>
      </div>
    );
  }

  // --- VIEW: REVIEW SCREEN ---
  if (isReviewing) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
             <div className="mb-6">
                 <button onClick={() => setIsReviewing(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors">
                    <ArrowLeft size={18} /> {t('quiz.review_questions')}
                 </button>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl border border-gray-100 dark:border-gray-700 p-10 text-center mb-10 transition-colors">
                 <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[28px] flex items-center justify-center mx-auto mb-6 transform -rotate-6 shadow-xl">
                     <HelpCircle size={40} />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">{t('quiz.ready_submit')}</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">{t('quiz.ready_desc')}</p>
                 
                 <div className="flex justify-center">
                    <button 
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="bg-brand-blue text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-brand-blue/30 flex items-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />} 
                        {isSubmitting ? "ĐANG NỘP..." : t('quiz.confirm_submit')}
                    </button>
                 </div>
             </div>

             <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-2 uppercase tracking-widest">
                <LayoutGrid size={16} /> {t('quiz.overview')}
             </h3>
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-3">
                {questions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    let statusClass = "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-transparent";
                    if (hasAnswered) statusClass = "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500/20"; 

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
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10 animate-fade-in transition-colors">
      <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-900 dark:hover:text-white font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors">
              <ArrowLeft size={18} /> {t('quiz.exit')}
            </button>
            <div className="flex items-center gap-4 flex-1 max-w-xs justify-end">
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-brand-blue h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap tracking-widest">{answeredCount}/{questions.length}</span>
            </div>
            <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden ml-4 p-2.5 text-brand-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-xl transition-all active:scale-90">
                <LayoutGrid size={22} />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-855 rounded-[40px] shadow-sm border-2 border-gray-50 dark:border-gray-800 p-8 md:p-12 mb-8 min-h-[260px] flex flex-col justify-center relative overflow-hidden transition-colors">
            <div className="absolute top-8 left-8">
                 <h3 className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">{t('quiz.question_prefix')} {currentQuestionIndex + 1}</h3>
            </div>
            <p className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-[1.3] text-center pt-8">{currentQuestion.term}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = (selectedOption === option) || (userSelections[currentQuestionIndex] === option);
              
              let buttonStyle = "bg-white dark:bg-gray-855 border-2 border-gray-100 dark:border-gray-800 hover:border-brand-blue dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 text-gray-800 dark:text-gray-200";
              let badgeStyle = "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border border-gray-100 dark:border-gray-700";

              if (isSelected) {
                 buttonStyle = "border-brand-blue bg-blue-50/50 dark:bg-blue-900/30 ring-4 ring-brand-blue/5 text-brand-blue dark:text-blue-300";
                 badgeStyle = "bg-brand-blue text-white border-brand-blue";
              }

              return (
                <button key={idx} onClick={() => handleOptionSelect(option)} className={`group p-6 text-left rounded-[28px] transition-all duration-300 flex items-center gap-5 active:scale-[0.98] ${buttonStyle}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm transition-colors ${badgeStyle}`}>
                      {isSelected ? <Check size={20} strokeWidth={4} /> : String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-bold text-base md:text-lg leading-tight">{option}</span>
                </button>
              );
            })}
          </div>

          {isAllAnswered && (
              <div className="flex justify-end animate-fade-in">
                  <button onClick={() => setIsReviewing(true)} className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-2xl shadow-brand-blue/20 transition-all transform hover:-translate-y-1 active:scale-95">
                      {t('quiz.to_submit_page')} <ArrowRight size={18} />
                  </button>
              </div>
          )}
      </div>

      {/* Navigation Sidebar (Desktop) */}
      <div className={`fixed inset-0 bg-black/50 z-[160] lg:static lg:bg-transparent lg:z-auto lg:w-80 flex-shrink-0 ${showGrid ? 'flex justify-end' : 'hidden lg:block'}`} onClick={() => setShowGrid(false)}>
         <div className="bg-white dark:bg-gray-800 h-full w-80 lg:w-full lg:h-auto lg:rounded-[32px] lg:shadow-sm lg:border-2 lg:border-gray-50 dark:lg:border-gray-800 p-8 overflow-y-auto transition-colors" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase text-xs tracking-widest">
                    <LayoutGrid size={18} className="text-brand-blue" /> 
                    {t('quiz.list_questions')}
                </h3>
                <button onClick={() => setShowGrid(false)} className="lg:hidden text-gray-400 hover:text-gray-900 transition-colors"><XCircle size={24} /></button>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {questions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    let statusClass = "bg-gray-50 dark:bg-gray-855 text-gray-400 dark:text-gray-600 border-transparent hover:border-gray-200 dark:hover:border-gray-700";
                    if (index === currentQuestionIndex) {
                        statusClass = "bg-brand-blue text-white shadow-lg shadow-brand-blue/20 scale-110 z-10 border-transparent";
                    } else if (hasAnswered) {
                        statusClass = "bg-blue-50 dark:bg-blue-900/30 text-brand-blue dark:text-blue-400 font-black border-blue-100 dark:border-blue-900/50";
                    }

                    return (
                        <button key={index} onClick={() => handleJumpToQuestion(index)} className={`aspect-square rounded-2xl flex items-center justify-center text-xs font-black border transition-all ${statusClass}`}>
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
