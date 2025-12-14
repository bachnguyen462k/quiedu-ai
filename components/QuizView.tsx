import React, { useState, useMemo, useEffect } from 'react';
import { StudySet, QuizQuestion } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, LayoutGrid, Clock, Check, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface QuizViewProps {
  set: StudySet;
  onBack: () => void;
}

const COLORS = ['#10B981', '#EF4444', '#E5E7EB'];

const QuizView: React.FC<QuizViewProps> = ({ set, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]); // Track correct/incorrect per index
  const [userSelections, setUserSelections] = useState<(string | null)[]>([]); // Track specific answers chosen
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [showGrid, setShowGrid] = useState(false); // Mobile grid toggle

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
    setAnswers(new Array(shuffledQuestions.length).fill(null));
    setUserSelections(new Array(shuffledQuestions.length).fill(null));
  }, [set, onBack]);

  const handleOptionSelect = (option: string) => {
    if (showFeedback || answers[currentQuestionIndex] !== null) return;
    
    setSelectedOption(option);
    setShowFeedback(true);

    const isCorrect = option === quizQuestions[currentQuestionIndex].correctAnswer;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = isCorrect;
    setAnswers(newAnswers);

    // Save user selection
    const newUserSelections = [...userSelections];
    newUserSelections[currentQuestionIndex] = option;
    setUserSelections(newUserSelections);

    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Auto advance after short delay
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedOption(null);
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Check if all questions are answered
        const allAnswered = newAnswers.every(a => a !== null);
        if (allAnswered) {
             setIsCompleted(true);
        }
      }
    }, 1200);
  };

  const restartQuiz = () => {
    setIsCompleted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setAnswers(new Array(quizQuestions.length).fill(null));
    setUserSelections(new Array(quizQuestions.length).fill(null));
    setQuizQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedOption(null);
    setShowFeedback(false);
    setShowGrid(false);
  };

  if (quizQuestions.length === 0) return <div className="p-8 text-center">Đang tạo bài kiểm tra...</div>;

  // Result View
  if (isCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const data = [
      { name: 'Đúng', value: score },
      { name: 'Sai', value: quizQuestions.length - score },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
         <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-8">Kết quả kiểm tra</h2>
            
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
         </div>

         {/* Detailed Statistics */}
         <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">Chi tiết bài làm</h3>
            
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
                                        <span className="w-24">Bạn chọn:</span>
                                        <span>{userAnswer || 'Chưa trả lời'}</span>
                                    </div>
                                    
                                    {!isCorrect && (
                                        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                                            <span className="w-24">Đáp án đúng:</span>
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

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((answers.filter(a => a !== null).length) / quizQuestions.length) * 100;

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
                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
              </div>
              <button onClick={() => setShowGrid(!showGrid)} className="lg:hidden p-2 text-indigo-600 bg-indigo-50 rounded-lg">
                  <LayoutGrid size={20} />
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6 min-h-[200px] flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
                 <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">Câu hỏi {currentQuestionIndex + 1}</h3>
            </div>
            <p className="text-2xl font-medium text-gray-900 leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => {
              let buttonStyle = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
              let icon = <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-400 font-bold group-hover:border-indigo-400 group-hover:text-indigo-500">{String.fromCharCode(65 + idx)}</span>;

              if (showFeedback || answers[currentQuestionIndex] !== null) {
                // If question is already answered
                const isThisCorrect = option === currentQuestion.correctAnswer;
                const isThisSelected = option === selectedOption || (answers[currentQuestionIndex] !== null && option === selectedOption); // Simplified logic

                if (isThisCorrect) {
                  buttonStyle = "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500";
                  icon = <CheckCircle size={24} className="text-green-600" />;
                } else if (option === selectedOption && !isThisCorrect) {
                  buttonStyle = "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500";
                  icon = <XCircle size={24} className="text-red-500" />;
                } else {
                  buttonStyle = "border-gray-200 opacity-50";
                }
              } else if (selectedOption === option) {
                 buttonStyle = "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500";
              }

              return (
                <button
                  key={idx}
                  disabled={showFeedback || answers[currentQuestionIndex] !== null}
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
      </div>

      {/* Navigation Grid (Sidebar on Desktop, Modal/Drawer on Mobile) */}
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
                    let statusClass = "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200";
                    if (index === currentQuestionIndex) {
                        statusClass = "ring-2 ring-indigo-600 bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else if (answers[index] === true) {
                        statusClass = "bg-green-100 text-green-700 border-green-200";
                    } else if (answers[index] === false) {
                        statusClass = "bg-red-100 text-red-700 border-red-200";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleJumpToQuestion(index)}
                            className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm border transition-all ${statusClass}`}
                        >
                            {index + 1}
                        </button>
                    )
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                        <span>Đã trả lời đúng</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
                        <span>Đã trả lời sai</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div>
                        <span>Chưa trả lời</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-indigo-50 ring-2 ring-indigo-600"></div>
                        <span>Đang chọn</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default QuizView;