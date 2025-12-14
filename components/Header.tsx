import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface HeaderProps {
    onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={onGoHome}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <BrainCircuit size={24} />
          </div>
          <span className="text-xl font-bold text-indigo-900 tracking-tight">QuizEdu</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
            <button onClick={onGoHome} className="font-medium text-gray-600 hover:text-indigo-600 transition-colors">Trang chủ</button>
            <button className="font-medium text-gray-600 hover:text-indigo-600 transition-colors">Thư viện</button>
            <button className="font-medium text-gray-600 hover:text-indigo-600 transition-colors">Lớp học</button>
        </nav>

        <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;