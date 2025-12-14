import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';
import { ArrowLeft, ArrowRight, RotateCcw, Copy } from 'lucide-react';

interface FlashcardViewProps {
  set: StudySet;
  onBack: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ set, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = set.cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < set.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, set.cards.length]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-gray-600 hover:text-indigo-600 flex items-center gap-2 font-medium transition-colors"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>
        <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {currentIndex + 1} / {set.cards.length}
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{set.title}</h1>
      <p className="text-gray-500 mb-8">{set.description}</p>

      {/* Card Container */}
      <div className="flex flex-col items-center">
        <div 
          className="perspective-1000 w-full h-96 cursor-pointer group"
          onClick={handleFlip}
        >
          <div className={`relative w-full h-full text-center transition-all duration-500 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* Front */}
            <div className="absolute w-full h-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl backface-hidden border-2 border-transparent hover:border-indigo-100">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4 absolute top-6">Thuật ngữ</span>
              <div className="text-3xl md:text-4xl font-medium text-gray-800 break-words max-w-full">
                {currentCard.term}
              </div>
              <div className="absolute bottom-6 text-gray-400 text-sm">Nhấn để lật</div>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full flex flex-col items-center justify-center p-8 bg-indigo-50 rounded-2xl backface-hidden rotate-y-180 border-2 border-indigo-200">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-4 absolute top-6">Định nghĩa</span>
              <div className="text-2xl md:text-3xl text-gray-800 break-words max-w-full">
                {currentCard.definition}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mt-8">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`p-4 rounded-full border-2 transition-all ${
              currentIndex === 0 
                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <ArrowLeft size={24} />
          </button>

          <button 
            onClick={() => { setIsFlipped(false); setCurrentIndex(0); }}
            className="text-gray-500 hover:text-indigo-600 transition-colors p-2"
            title="Làm lại từ đầu"
          >
            <RotateCcw size={20} />
          </button>

          <button 
            onClick={handleNext}
            disabled={currentIndex === set.cards.length - 1}
            className={`p-4 rounded-full border-2 transition-all ${
              currentIndex === set.cards.length - 1
                ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
      
      {/* List view below */}
      <div className="mt-16">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Danh sách thuật ngữ trong học phần này ({set.cards.length})</h3>
        <div className="grid gap-4">
          {set.cards.map((card, idx) => (
            <div key={card.id} className={`p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-start ${idx === currentIndex ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
              <div className="md:w-1/3 font-medium text-gray-800 border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 pr-4">
                {card.term}
              </div>
              <div className="md:w-2/3 text-gray-600">
                {card.definition}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashcardView;