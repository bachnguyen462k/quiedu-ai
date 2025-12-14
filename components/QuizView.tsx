import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, QuizQuestion, Review, User } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, LayoutGrid, Clock, Check, X, Send, ArrowRight, HelpCircle, Star, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { v4 as uuidv4 } from 'uuid';

interface QuizViewProps {
  set: StudySet;
  currentUser: User;
  onBack: () => void;
  onAddReview: (setId: string, review: Review) => void;
}

const COLORS = ['#10B981', '#EF4444', '#E5E7EB'];

const QuizView: React.FC<QuizViewProps> = ({ set, currentUser, onBack, onAddReview }) => {
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
      alert("Cần ít nhất 4 thẻ để tạo bài kiểm tra.");
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
        options
      };
    });
    
    // Shuffle questions
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffledQuestions);
    // Initialize states
    setAnswers(new Array(shuffledQuestions.length).fill(null));
    setUserSelections(new Array(shuffledQuestions.length).fill(null));
  }, [set, onBack]);

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
          alert("Vui lòng chọn số sao đánh giá");
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

  if (quizQuestions.length === 0) return <div className="p-8 text-center">Đang tạo bài kiểm tra...</div>;

  // 1. Result View (Final - After Submission)
  if (isCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const data = [
      { name: 'Đúng', value: score },
      { name: 'Sai', value: quizQuestions.length - score },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
         <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-8">Kết quả bài làm</h2>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 max-w-2xl mx-auto">
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
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                </div>
                
                <div className="text-5xl font-bold text-indigo-600 mb-2">{percentage}%</div>
                <p className="text-gray-500 mb-6">
                    Bạn đã trả lời đúng {score} trên {quizQuestions.length} câu hỏi.
                </p>

                <div className="flex justify-center gap-4">
                    <button 
                        onClick={onBack}
                        className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Quay lại chi tiết
                    </button>
                    <button 
                        onClick={restartQuiz}
                        className="px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium flex items-center gap-2"
                    >
                        <RefreshCw size={20} /> Làm lại bài
                    </button>
                </div>
            </div>

            {/* REVIEW SECTION IN RESULT */}
            {!reviewSubmitted ? (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 max-w-2xl mx-auto mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <MessageSquare size={80} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">Đánh giá học phần này</h3>
                    <p className="text-gray-500 mb-4 text-sm relative z-10">Ý kiến của bạn giúp cải thiện chất lượng bài học.</p>
                    
                    <div className="flex justify-center gap-2 mb-4 relative z-10">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button 
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star 
                                    size={32} 
                                    className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                            </button>
                        ))}
                    </div>
                    
                    <div className="relative z-10">
                        <textarea
                            className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Nhập nhận xét của bạn..."
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                        <button 
                            onClick={handleSubmitReview}
                            className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            Gửi đánh giá
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 max-w-2xl mx-auto mb-8 flex flex-col items-center justify-center animate-fade-in">
                    <CheckCircle size={40} className="text-green-500 mb-2" />
                    <h3 className="text-lg font-bold text-green-800">Cảm ơn đánh giá của bạn!</h3>
                </div>
            )}
         </div>

         {/* Detailed Statistics */}
         <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Chi tiết bài làm & Đáp án</h3>
            
            {quizQuestions.map((question, idx) => {
                const userAnswer = userSelections[idx];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                    <div 
                        key={idx} 
                        className={`p-6 rounded-xl border-2 ${
                            isCorrect 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
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
                                <h4 className="font-bold text-gray-900 mb-3 text-lg">
                                    <span className="text-gray-500 text-sm font-normal mr-2">Câu {idx + 1}:</span>
                                    {question.question}
                                </h4>
                                
                                <div className="space-y-2">
                                    <div className={`flex items-center gap-2 text-sm font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                        <span className="w-24 flex-shrink-0">Bạn chọn:</span>
                                        <span>{userAnswer || 'Chưa trả lời'}</span>
                                    </div>
                                    
                                    {!isCorrect && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                            <span className="w-24 flex-shrink-0">Đáp án đúng:</span>
                                            <span>{question.correctAnswer}</span>
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
                 <button onClick={() => setIsReviewing(false)} className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2">
                    <ArrowLeft size={20} /> Xem lại câu hỏi
                 </button>
             </div>

             <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <HelpCircle size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Bạn đã sẵn sàng nộp bài?</h2>
                 <p className="text-gray-500 mb-6">Hãy kiểm tra kỹ các câu trả lời. Sau khi nộp, hệ thống sẽ chấm điểm ngay lập tức.</p>
                 
                 <div className="flex justify-center">
                    <button 
                        onClick={handleSubmitQuiz}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-transform hover:-translate-y-1"
                    >
                        <Send size={20} /> Xác nhận Nộp bài
                    </button>
                 </div>
             </div>

             <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <LayoutGrid size={20} /> Tổng quan bài làm
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
                {quizQuestions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    let statusClass = "bg-gray-100 text-gray-400";
                    if (hasAnswered) statusClass = "bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500"; 

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
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      
      {/* Main Quiz Area */}
      <div className="flex-1">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={onBack} className="text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2">
                <ArrowLeft size={20} /> Thoát
              </button>
              <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 hidden sm:inline">Tiến độ</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
              </div>
              <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden p-2 text-indigo-600 bg-indigo-50 rounded-lg">
                  <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6 min-h-[200px] flex flex-col justify-center relative">
            <div className="flex justify-between items-start mb-4">
                 <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">Câu hỏi {currentQuestionIndex + 1}</h3>
            </div>
            <p className="text-2xl font-medium text-gray-900 leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = (selectedOption === option) || (userSelections[currentQuestionIndex] === option);
              
              let buttonStyle = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
              let icon = <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold group-hover:border-indigo-400 group-hover:text-indigo-500">{String.fromCharCode(65 + idx)}</span>;

              if (isSelected) {
                 buttonStyle = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 text-indigo-900";
                 icon = <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center"><Check size={14} className="text-white" /></div>;
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md"
                  >
                      Đến trang nộp bài <ArrowRight size={20} />
                  </button>
              </div>
          )}
      </div>

      {/* Navigation Grid */}
      <div className={`
        fixed inset-0 bg-black/50 z-40 lg:static lg:bg-transparent lg:z-auto lg:w-80 flex-shrink-0
        ${showGrid ? 'flex justify-end' : 'hidden lg:block'}
      `}>
         <div className="bg-white h-full w-80 lg:w-full lg:h-auto lg:rounded-2xl lg:shadow-sm lg:border lg:border-gray-200 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <LayoutGrid size={20} className="text-indigo-600" /> 
                    Danh sách câu hỏi
                </h3>
                <button onClick={() => setShowGrid(false)} className="lg:hidden text-gray-500">
                    <XCircle size={24} />
                </button>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {quizQuestions.map((_, index) => {
                    const hasAnswered = !!userSelections[index];
                    
                    let statusClass = "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200";
                    if (index === currentQuestionIndex) {
                        statusClass = "ring-2 ring-indigo-600 bg-white text-indigo-700 border-indigo-200";
                    } else if (hasAnswered) {
                        statusClass = "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold";
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

            <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-indigo-50 border border-indigo-200"></div>
                        <span>Đã trả lời</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                        <span>Chưa trả lời</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-white ring-2 ring-indigo-600"></div>
                        <span>Đang chọn</span>
                    </div>
                </div>
            </div>
            
            {/* Submit Button in Sidebar */}
            {isAllAnswered && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <button 
                        onClick={() => setIsReviewing(true)}
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} /> Nộp bài
                    </button>
                </div>
            )}
         </div>
      </div>

    </div>
  );
};

export default QuizView;