import React, { useState } from 'react';
import { StudySet } from '../types';
import { Plus, Search, Layers, Trophy, Flame, Target, Calendar } from 'lucide-react';

interface DashboardProps {
  sets: StudySet[];
  onCreateNew: () => void;
  onSelectSet: (set: StudySet) => void;
}

// Mock Leaderboard Data
const LEADERBOARD_DATA = {
  DAY: [
    { id: '1', name: 'Nguyễn Văn Nam', score: 980, quizzes: 5, questions: 120, avatar: 'https://ui-avatars.com/api/?name=Van+Nam&background=FCD34D&color=fff' },
    { id: '2', name: 'Trần Thị B', score: 850, quizzes: 4, questions: 90, avatar: 'https://ui-avatars.com/api/?name=Thi+B&background=9CA3AF&color=fff' },
    { id: '3', name: 'Lê Văn C', score: 720, quizzes: 3, questions: 60, avatar: 'https://ui-avatars.com/api/?name=Van+C&background=B45309&color=fff' },
    { id: '4', name: 'Phạm Thu Hà', score: 650, quizzes: 3, questions: 55, avatar: 'https://ui-avatars.com/api/?name=Thu+Ha&background=E5E7EB&color=6B7280' },
    { id: '5', name: 'Hoàng Minh', score: 600, quizzes: 2, questions: 40, avatar: 'https://ui-avatars.com/api/?name=Hoang+Minh&background=E5E7EB&color=6B7280' },
  ],
  MONTH: [
    { id: '2', name: 'Trần Thị B', score: 4500, quizzes: 20, questions: 500, avatar: 'https://ui-avatars.com/api/?name=Thi+B&background=FCD34D&color=fff' },
    { id: '1', name: 'Nguyễn Văn Nam', score: 4200, quizzes: 18, questions: 450, avatar: 'https://ui-avatars.com/api/?name=Van+Nam&background=9CA3AF&color=fff' },
    { id: '5', name: 'Hoàng Minh', score: 3800, quizzes: 15, questions: 300, avatar: 'https://ui-avatars.com/api/?name=Hoang+Minh&background=B45309&color=fff' },
  ],
  YEAR: [
    { id: '1', name: 'Nguyễn Văn Nam', score: 15000, quizzes: 80, questions: 2000, avatar: 'https://ui-avatars.com/api/?name=Van+Nam&background=FCD34D&color=fff' },
    { id: '3', name: 'Lê Văn C', score: 12000, quizzes: 60, questions: 1500, avatar: 'https://ui-avatars.com/api/?name=Van+C&background=9CA3AF&color=fff' },
  ]
};

const Dashboard: React.FC<DashboardProps> = ({ sets, onCreateNew, onSelectSet }) => {
  const [timeFilter, setTimeFilter] = useState<'DAY' | 'MONTH' | 'YEAR'>('DAY');

  const currentLeaderboard = LEADERBOARD_DATA[timeFilter] || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      
      {/* Leaderboard Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="text-yellow-500" /> Bảng vàng thành tích
                </h2>
                <p className="text-gray-500 text-sm mt-1">Vinh danh những học sinh xuất sắc nhất</p>
            </div>
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
                <button 
                    onClick={() => setTimeFilter('DAY')}
                    className={`px-4 py-1.5 rounded-md transition-all ${timeFilter === 'DAY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Hôm nay
                </button>
                <button 
                    onClick={() => setTimeFilter('MONTH')}
                    className={`px-4 py-1.5 rounded-md transition-all ${timeFilter === 'MONTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Tháng này
                </button>
                <button 
                    onClick={() => setTimeFilter('YEAR')}
                    className={`px-4 py-1.5 rounded-md transition-all ${timeFilter === 'YEAR' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Năm học
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Top 1 */}
            {currentLeaderboard[0] && (
                <div className="bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 p-6 rounded-2xl shadow-sm relative md:order-2 transform md:-translate-y-4">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">1</div>
                    <div className="flex flex-col items-center text-center">
                        <img src={currentLeaderboard[0].avatar} alt="" className="w-20 h-20 rounded-full border-4 border-yellow-100 mb-3 shadow-sm" />
                        <h3 className="font-bold text-gray-900 text-lg">{currentLeaderboard[0].name}</h3>
                        <div className="text-3xl font-extrabold text-yellow-500 my-2">{currentLeaderboard[0].score} <span className="text-xs text-gray-400 font-normal">điểm</span></div>
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> {currentLeaderboard[0].quizzes} bài thi</span>
                            <span className="flex items-center gap-1"><Target size={14} className="text-blue-500" /> {currentLeaderboard[0].questions} câu</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Top 2 */}
            {currentLeaderboard[1] && (
                 <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm relative md:order-1 mt-4 md:mt-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">2</div>
                    <div className="flex flex-col items-center text-center">
                        <img src={currentLeaderboard[1].avatar} alt="" className="w-16 h-16 rounded-full border-4 border-gray-100 mb-3" />
                        <h3 className="font-bold text-gray-900">{currentLeaderboard[1].name}</h3>
                        <div className="text-2xl font-extrabold text-gray-700 my-2">{currentLeaderboard[1].score}</div>
                         <div className="flex gap-4 text-xs text-gray-500">
                             <span>{currentLeaderboard[1].quizzes} bài thi</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Top 3 */}
            {currentLeaderboard[2] && (
                 <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm relative md:order-3 mt-4 md:mt-0">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">3</div>
                    <div className="flex flex-col items-center text-center">
                        <img src={currentLeaderboard[2].avatar} alt="" className="w-16 h-16 rounded-full border-4 border-gray-100 mb-3" />
                        <h3 className="font-bold text-gray-900">{currentLeaderboard[2].name}</h3>
                        <div className="text-2xl font-extrabold text-orange-700 my-2">{currentLeaderboard[2].score}</div>
                         <div className="flex gap-4 text-xs text-gray-500">
                             <span>{currentLeaderboard[2].quizzes} bài thi</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        {/* Rest of the list */}
        {currentLeaderboard.length > 3 && (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {currentLeaderboard.slice(3).map((student, idx) => (
                    <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <span className="w-6 text-center font-bold text-gray-400">{idx + 4}</span>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                     <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-medium text-gray-900">{student.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-sm text-gray-500 hidden sm:inline">{student.quizzes} bài thi</span>
                            <span className="font-bold text-gray-900 w-16 text-right">{student.score}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Library Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-t border-gray-100 pt-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Thư viện học liệu</h1>
           <p className="text-gray-500 mt-1 text-sm">Khám phá các bài học từ giáo viên và cộng đồng</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm học phần..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
            </div>
            <button 
            onClick={onCreateNew}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 text-sm whitespace-nowrap"
            >
            <Plus size={18} /> Tạo mới
            </button>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
          <Layers size={64} className="mx-auto text-gray-300 mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có học phần nào</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Hãy tạo học phần đầu tiên của bạn để bắt đầu học tập hiệu quả hơn với sự trợ giúp của AI.</p>
          <button 
            onClick={onCreateNew}
            className="text-indigo-600 font-bold hover:underline"
          >
            Tạo ngay bây giờ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map(set => (
            <div 
              key={set.id}
              onClick={() => onSelectSet(set)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-indigo-200 cursor-pointer transition-all duration-300 flex flex-col h-60"
            >
              <div className="p-6 flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-tight">
                    {set.title}
                </h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{set.description}</p>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                    {set.cards.length} thuật ngữ
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-gray-500">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                      {set.author.charAt(0)}
                   </div>
                   <span className="text-xs font-medium truncate max-w-[100px]">{set.author}</span>
                </div>
                {set.author === 'Bạn' && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Của tôi</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;