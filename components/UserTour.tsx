import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface UserTourProps {
  currentUser: User;
  run: boolean;
  onStop: () => void;
}

const UserTour: React.FC<UserTourProps> = ({ currentUser, run, onStop }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Define steps configuration
  const getSteps = () => {
      const baseSteps = [
        {
          target: 'body', 
          title: 'Chào mừng đến với QuizEdu! 👋',
          content: 'Hệ thống học tập thông minh giúp bạn tạo bài học và ôn tập hiệu quả. Hãy cùng điểm qua các chức năng chính nhé.'
        },
        {
          target: '#sidebar-dashboard',
          title: 'Trang chủ',
          content: 'Xem tổng quan hoạt động, các học phần đang xu hướng và truy cập nhanh vào các chức năng.',
        },
        {
          target: '#sidebar-library',
          title: 'Thư viện',
          content: 'Kho tàng kiến thức của bạn. Tìm kiếm, quản lý và ôn tập tất cả các học phần tại đây.',
        },
        {
          target: '#sidebar-classes',
          title: 'Lớp học',
          content: 'Không gian lớp học trực tuyến. Quản lý danh sách lớp, giao bài tập và theo dõi tiến độ của học sinh.',
        },
        {
          target: '#sidebar-ai_creator',
          title: 'Soạn bài với AI ✨',
          content: 'Tải lên tài liệu PDF/Sách/Ảnh, AI sẽ tự động phân tích và tạo bộ câu hỏi ôn tập cho bạn trong tích tắc. Rất hữu ích cho việc tự học!',
        },
        {
          target: '#sidebar-create',
          title: 'Tạo học phần',
          content: 'Công cụ tạo thẻ ghi nhớ (Flashcards) thủ công. Đơn giản và nhanh chóng.',
        },
      ];
      
      return baseSteps;
  };

  const steps = getSteps();
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    if (!run) {
        setStepIndex(0);
        return;
    }

    const updatePosition = () => {
        if (!currentStep || currentStep.target === 'body') {
            setCoords(null);
            return;
        }

        const el = document.querySelector(currentStep.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setCoords({
                x: rect.left,
                y: rect.top,
                w: rect.width,
                h: rect.height
            });
            // Try to scroll into view if needed
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    // Interval to handle layout shifts (like sidebar expanding)
    const timer = setInterval(updatePosition, 100);

    return () => {
        window.removeEventListener('resize', updatePosition);
        clearInterval(timer);
    };
  }, [run, stepIndex, currentStep?.target]);

  const handleNext = () => {
      if (isLastStep) {
          onStop();
          setTimeout(() => setStepIndex(0), 300);
      } else {
          setStepIndex(prev => prev + 1);
      }
  };

  const handlePrev = () => {
      setStepIndex(prev => Math.max(0, prev - 1));
  };

  if (!run || !currentStep) return null;

  // Calculate Tooltip Position
  // Default: To the right of the element
  let tooltipStyle: React.CSSProperties = {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      position: 'absolute'
  };

  if (coords) {
      const spaceRight = window.innerWidth - (coords.x + coords.w);
      
      // If enough space on right, place right
      if (spaceRight > 350) {
          tooltipStyle = {
              left: coords.x + coords.w + 20,
              top: coords.y,
              transform: 'none',
              position: 'absolute'
          };
      } 
      // Else place bottom center
      else {
           tooltipStyle = {
              left: '50%',
              top: coords.y + coords.h + 20,
              transform: 'translateX(-50%)',
              position: 'absolute'
           };
           
           // If too low (bottom of screen), flip to top
           if (coords.y + coords.h + 300 > window.innerHeight) {
                tooltipStyle = {
                    left: '50%',
                    top: coords.y - 20,
                    transform: 'translate(-50%, -100%)',
                    position: 'absolute'
                };
           }
      }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
        {/* Semi-transparent backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            onClick={onStop}
        ></div>

        {/* Highlight Box (Cutout simulation) */}
        {coords && (
            <div 
                className="absolute border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out pointer-events-none z-10 box-content"
                style={{
                    left: coords.x - 4,
                    top: coords.y - 4,
                    width: coords.w + 8,
                    height: coords.h + 8,
                }}
            >
                {/* Pulsing indicator */}
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
            </div>
        )}

        {/* Tooltip Content */}
        <div 
            className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-[90vw] transition-all duration-300 z-20 flex flex-col border border-gray-100"
            style={tooltipStyle}
        >
             <button onClick={onStop} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
             </button>

             <div className="mb-3 flex items-center gap-2">
                 <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                    Hướng dẫn {stepIndex + 1}/{steps.length}
                 </span>
             </div>
             
             <h3 className="text-xl font-bold text-gray-900 mb-3">{currentStep.title}</h3>
             <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                {currentStep.content}
             </p>

             <div className="flex justify-between items-center mt-auto">
                <button 
                    onClick={handlePrev}
                    disabled={stepIndex === 0}
                    className={`text-sm font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-opacity ${stepIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <ChevronLeft size={16} /> Quay lại
                </button>
                <button 
                    onClick={handleNext}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                    {isLastStep ? 'Hoàn tất' : 'Tiếp theo'}
                    {isLastStep ? <Check size={18} /> : <ChevronRight size={18} />}
                </button>
             </div>
        </div>
    </div>
  );
};

export default UserTour;