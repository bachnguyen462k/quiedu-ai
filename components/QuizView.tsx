import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, QuizQuestion, Review, User } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, LayoutGrid, Clock, Check, X, Send, ArrowRight, HelpCircle, Star, MessageSquare, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

interface QuizViewProps {
  set: StudySet;
  currentUser: User;
  onBack: () => void;
  onAddReview: (setId: string, review: Review) => void;
}

const COLORS = ['#10B981', '#EF4444', '#E5E7EB'];

const QuizView: React.FC<QuizViewProps> = ({ set, currentUser, onBack, onAddReview }) => {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // 'answers' tracks Correct(true)/Incorrect(false) status. 
  const [answers, setAnswers] = useState<(boolean | null)[]>([]); 
  
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); // Track specific answers chosen
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [showGrid, setShowGrid] = useState(false);

  // Review State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Generate questions from the study set
  useEffect(() => {
    if (set.cards.length < 4) {
      alert(t('quiz.error_min_cards'));
      onBack();
      return;
    }

    const questions: QuizQuestion[] = set.cards.map((card) => {
      const otherCards = set.cards.filter(c => c.id !== card.id);
      const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3).map(c => c.definition);
      const options = [...distractors, card.definition].sort(() => 0.5 - Math.random());

      return {
        id: card.id,
        question: card.term,
        correctAnswer: card.definition,
        options,
        relatedLink: card.relatedLink // Map link from flashcard
      };
    });
    
    // Shuffle questions
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffledQuestions);
    // Initialize states
    setAnswers(new Array(shuffledQuestions.length).fill(null));
    setUserSelections(new Array(shuffledQuestions.length).fill(null));
  }, [set, onBack, t]);

  const handleOptionSelect = (option: string) => {
    if (isCompleted) return;
    
    setSelectedOption(option);

    const newUserSelections = [...userSelections];
    newUserSelections[currentQuestionIndex] = option;
    setUserSelections(newUserSelections);

    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setIsReviewing(true);
      }
    }, 400);
  };

  const restartQuiz = () => {
    setIsCompleted(false);
    setIsReviewing(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setAnswers(new Array(quizQuestions.length).fill(null));
    setUserSelections(new Array(quizQuestions.length).fill(null));
    setQuizQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
    setReviewSubmitted(false);
    setRating(0);
    setComment('');
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedOption(null);
    setShowGrid(false);
    setIsReviewing(false); 
  };

  const handleSubmitQuiz = () => {
      let calculatedScore = 0;
      const finalAnswers = quizQuestions.map((q, idx) => {
          const isCorrect = userSelections[idx] === q.correctAnswer;
          if (isCorrect) calculatedScore++;
          return isCorrect;
      });

      setScore(calculatedScore);
      setAnswers(finalAnswers);
      setIsReviewing(false);
      setIsCompleted(true);
  };

  const handleSubmitReview = () => {
      if (rating === 0) {
          alert(t('quiz.alert_rating'));
          return;
      }
      
      const newReview: Review = {
          id: uuidv4(),
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          rating: rating,
          comment: comment,
          createdAt: Date.now()
      };

      onAddReview(set.id, newReview);
      setReviewSubmitted(true);
  };

  if (quizQuestions.length === 0) return <div className="p-8 text-center dark:text-white">{t('quiz.generating')}</div>;

  // 1. Result View (Final - After Submission)
  if (isCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const data = [
      { name: t('quiz.correct'), value: score },
      { name: t('quiz.incorrect'), value: quizQuestions.length - score },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
         <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">{t('quiz.result_title')}</h2>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8 max-w-2xl mx-auto transition-colors">
                <div className="h-64 w-full flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    </PieChart>
                </ResponsiveContainer>
                </div>
                
                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{percentage}%</div>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {t('quiz.result_desc', { score, total: quizQuestions.length })}
                </p>

                <div className="flex justify-center gap-4">
                    <button 
                        onClick={onBack}
                        className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                        {t('quiz.back_detail')}
                    </button>
                    <button 
                        onClick={restartQuiz}
                        className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={20} /> {t('quiz.retry')}
                    </button>
                </div>
            </div>

            {/* REVIEW SECTION IN RESULT */}
            {!reviewSubmitted ? (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/30 max-w-2xl mx-auto mb-8 relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MessageSquare size={80} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">{t('quiz.review_title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm relative z-10">{t('quiz.review_desc')}</p>
                    
                    <div className="flex justify-center gap-2 mb-4 relative z-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star 
                                    size={32} 
                                    className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                                />
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative z-10">
                        <textarea
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-colors"
                            placeholder={t('quiz.review_ph')}
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                        <button 
                            onClick={handleSubmitReview}
                            className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            {t('quiz.send_review')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 max-w-2xl mx-auto mb-8 flex flex-col items-center justify-center animate-fade-in transition-colors">
                    <CheckCircle size={40} className="text-green-500 mb-2" />
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300">{t('quiz.review_thanks_title')}</h3>
                </div>
            )}
         </div>

         {/* Detailed Statistics */}
         <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{t('quiz.detail_title')}</h3>
            
            {quizQuestions.map((question, idx) => {
                const userAnswer = userSelections[idx];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                    <div 
                        key={idx} 
                        className={`p-6 rounded-xl border-2 transition-colors ${
                            isCorrect 
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white
                                ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
                            `}>
                                {isCorrect ? <Check size={18} /> : <X size={18} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                                    <span className="text-gray-500 dark:text-gray-400 text-sm font-normal mr-2">{t('quiz.question_prefix')} {idx + 1}:</span>
                                    {question.question}
                                </h4>
                                
                                <div className="space-y-2">
                                    <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        <span className="w-24 flex-shrink-0">{t('quiz.your_choice')}</span>
                                        <span>{userAnswer || t('quiz.not_answered')}</span>
                                    </div>
                                    
                                    {!isCorrect && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                                            <span className="w-24 flex-shrink-0">{t('quiz.correct_answer')}</span>
                                            <span>{question.correctAnswer}</span>
                                        </div>
                                    )}

                                    {/* Display Related Link if available */}
                                    {question.relatedLink && (
                                        <div className="pt-2 mt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                            <a 
                                                href={question.relatedLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium hover:underline transition-colors"
                                            >
                                                <ExternalLink size={14} /> {t('quiz.ref_link')}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>
    );
  }

  // 2. Review View (Before Submit)
  if (isReviewing) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
             <div className="mb-6">
                 <button onClick={() => setIsReviewing(false)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium flex items-center gap-2 transition-colors">
                    <ArrowLeft size={20} /> {t('quiz.review_questions')}
                 </button>
             </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 text-center mb-8 transition-colors">
                 <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                     <HelpCircle size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('quiz.ready_submit')}</h2>
                 <p className="text-gray-500 dark:text-gray-400 mb-6">{t('quiz.ready_desc')}</p>
                 
                 <div className="flex justify-center">
                    <button 
                        onClick={handleSubmitQuiz}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-transform hover:-translate-y-1"
                    >
                        <Send size={20} /> {t('quiz.confirm_submit')}
                    </button>
                 </div>
             </div>

             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <LayoutGrid size={20} /> {t('quiz.overview')}
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                {quizQuestions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    let statusClass = "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600";
                    if (hasAnswered) statusClass = "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 ring-2 ring-indigo-500 dark:ring-indigo-600"; 

                    return (
                        <button
                            key={index}
                            onClick={() => handleJumpToQuestion(index)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center font-bold text-lg border transition-all hover:scale-105 ${statusClass}`}
                        >
                            {index + 1}
                            {hasAnswered && <Check size={14} className="mt-1" />}
                        </button>
                    )
                })}
             </div>
        </div>
      );
  }

  // 3. Question View (Active Quiz)
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const answeredCount = userSelections.filter(a => a !== null).length;
  const progress = (answeredCount / quizQuestions.length) * 100;
  const isAllAnswered = userSelections.every(a => a !== null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 animate-fade-in">
      
      {/* Main Quiz Area */}
      <div className="flex-1">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium flex items-center gap-2 transition-colors">
                <ArrowLeft size={20} /> {t('quiz.exit')}
              </button>
              <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:inline">{t('quiz.progress')}</span>
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
              </div>
              <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 mb-6 min-h-[200px] flex flex-col justify-center relative transition-colors">
            <div className="flex justify-between items-start mb-4">
                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wide">{t('quiz.question_prefix')} {currentQuestionIndex + 1}</h3>
            </div>
            <p className="text-2xl font-medium text-gray-900 dark:text-white leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = (selectedOption === option) || (userSelections[currentQuestionIndex] === option);
              
              let buttonStyle = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-200";
              let icon = <span className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-bold group-hover:border-indigo-400 group-hover:text-indigo-500 transition-colors">{String.fromCharCode(65 + idx)}</span>;

              if (isSelected) {
                 buttonStyle = "border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 ring-1 ring-indigo-600 dark:ring-indigo-500 text-indigo-900 dark:text-white";
                 icon = <div className="w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center"><Check size={14} className="text-white" /></div>;
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  className={`group p-5 text-left rounded-xl border-2 transition-all duration-200 flex justify-between items-center ${buttonStyle}`}
                >
                  <div className="flex items-center gap-4">
                      {icon}
                      <span className="font-medium text-lg">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Button to go back to Review Screen if all answered */}
          {isAllAnswered && (
              <div className="flex justify-end">
                  <button 
                    onClick={() => setIsReviewing(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-colors"
                  >
                      {t('quiz.to_submit_page')} <ArrowRight size={20} />
                  </button>
              </div>
          )}
      </div>

      {/* Navigation Grid */}
      <div className={`
        fixed inset-0 bg-black/50 z-40 lg:static lg:bg-transparent lg:z-auto lg:w-80 flex-shrink-0
        ${showGrid ? 'flex justify-end' : 'hidden lg:block'}
      `}>
         <div className="bg-white dark:bg-gray-800 h-full w-80 lg:w-full lg:h-auto lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-200 dark:lg:border-gray-700 p-6 overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <LayoutGrid size={20} className="text-indigo-600 dark:text-indigo-400" /> 
                    {t('quiz.list_questions')}
                </h3>
                <button onClick={() => setShowGrid(false)} className="lg:hidden text-gray-500 dark:text-gray-400">
                    <XCircle size={24} />
                </button>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {quizQuestions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    
                    let statusClass = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600";
                    if (index === currentQuestionIndex) {
                        statusClass = "ring-2 ring-indigo-600 dark:ring-indigo-400 bg-white dark:bg-gray-600 text-indigo-700 dark:text-white border-indigo-200 dark:border-indigo-500";
                    } else if (hasAnswered) {
                        statusClass = "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-bold";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleJumpToQuestion(index)}
                            className={`aspect-square rounded-lg flex items-center justify-center text-sm border transition-all ${statusClass}`}
                        >
                            {index + 1}
                        </button>
                    )
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"></div>
                        <span>{t('quiz.status_answered')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"></div>
                        <span>{t('quiz.status_unanswered')}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-white dark:bg-gray-600 ring-2 ring-indigo-600 dark:ring-indigo-400"></div>
                        <span>{t('quiz.status_current')}</span>
                    </div>
                </div>
            </div>
            
            {/* Submit Button in Sidebar */}
            {isAllAnswered && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button 
                        onClick={() => setIsReviewing(true)}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
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