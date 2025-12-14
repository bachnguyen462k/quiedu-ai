import React from 'react';
import { BrainCircuit, BookOpen, GraduationCap, Zap, ArrowRight, Users } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <BrainCircuit size={24} />
          </div>
          <span className="text-2xl font-bold text-indigo-900 dark:text-white tracking-tight">QuizEdu</span>
        </div>
        <div className="hidden md:flex gap-8">
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Tính năng</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Dành cho Giáo viên</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Trường học</a>
        </div>
        <button 
          onClick={onStart}
          className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-5 py-2 rounded-full font-bold transition-colors"
        >
          Đăng nhập
        </button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold text-sm mb-6">
             🚀 Nền tảng học tập số 1 Việt Nam
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            Học tập thông minh hơn với <span className="text-indigo-600 dark:text-indigo-400">AI & Flashcards</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Hệ thống bài giảng và trắc nghiệm được biên soạn bởi giáo viên hàng đầu. 
            Tạo bài học trong vài giây với sự trợ giúp của AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onStart}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-transform hover:-translate-y-1 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              Bắt đầu học ngay <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 rounded-xl font-bold text-lg text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Xem Demo
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
             <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900" src="https://picsum.photos/100/100?random=1" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900" src="https://picsum.photos/100/100?random=2" alt="User" />
                <img className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900" src="https://picsum.photos/100/100?random=3" alt="User" />
             </div>
             <p>Hơn 10,000 học sinh & giáo viên tin dùng</p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-yellow-200 dark:bg-yellow-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-10 right-10 w-72 h-72 bg-pink-200 dark:bg-pink-900/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          
          <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-3xl border border-white/50 dark:border-gray-700 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-4 border-l-4 border-indigo-500 dark:border-indigo-400">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Tiếng Anh 12 - Unit 1</h3>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded font-bold">Mới</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">25 thuật ngữ • Tác giả: Cô Lan Anh</p>
             </div>
             
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-4 border-l-4 border-orange-500 dark:border-orange-400">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">Lịch Sử: Chiến tranh thế giới</h3>
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-2 py-1 rounded font-bold">Hot</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">40 câu hỏi trắc nghiệm • Tác giả: Thầy Hùng</p>
             </div>

             <div className="bg-indigo-600 dark:bg-indigo-700 rounded-xl p-6 text-white flex items-center justify-between shadow-md">
                <div>
                    <p className="font-bold text-lg">Đã sẵn sàng?</p>
                    <p className="text-indigo-200 text-sm">Tham gia lớp học ngay</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                    <Zap className="text-yellow-300" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Mọi thứ bạn cần để dạy và học</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Công cụ hỗ trợ toàn diện cho giáo viên soạn bài và học sinh ôn tập</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                        <BookOpen size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Flashcards Thông minh</h3>
                    <p className="text-gray-500 dark:text-gray-400">Chế độ học thẻ ghi nhớ với thuật toán lặp lại ngắt quãng giúp ghi nhớ lâu hơn.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                        <Zap size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tạo Quiz với AI</h3>
                    <p className="text-gray-500 dark:text-gray-400">Chỉ cần nhập chủ đề, AI sẽ tự động tạo bộ câu hỏi và bài học trong vài giây.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                        <Users size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Lớp học Tương tác</h3>
                    <p className="text-gray-500 dark:text-gray-400">Giáo viên quản lý lớp học, giao bài tập và theo dõi tiến độ của từng học sinh.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;