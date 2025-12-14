import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CreateSet from './components/CreateSet';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import SetDetailView from './components/SetDetailView';
import ClassManagement from './components/ClassManagement';
import AiTextbookCreator from './components/AiTextbookCreator';
import { StudySet, ViewState, User } from './types';
import { BookOpen, GraduationCap } from 'lucide-react';

// Mock data
const INITIAL_SETS: StudySet[] = [
  {
    id: '1',
    title: 'Từ vựng Tiếng Anh - Chủ đề Gia đình',
    description: 'Các từ vựng cơ bản về các thành viên trong gia đình dành cho lớp 6.',
    author: 'Cô Thu Lan',
    createdAt: Date.now(),
    plays: 1250,
    averageScore: 85,
    cards: [
      { id: '1a', term: 'Father', definition: 'Bố, cha' },
      { id: '1b', term: 'Mother', definition: 'Mẹ, má' },
      { id: '1c', term: 'Brother', definition: 'Anh/em trai' },
      { id: '1d', term: 'Sister', definition: 'Chị/em gái' },
      { id: '1e', term: 'Grandfather', definition: 'Ông' },
      { id: '1f', term: 'Grandmother', definition: 'Bà' }
    ]
  },
  {
    id: '2',
    title: 'Hóa Học 10 - Nguyên tử',
    description: 'Tổng hợp kiến thức chương 1 về cấu tạo nguyên tử, hạt nhân và vỏ electron.',
    author: 'Thầy Hùng Hóa',
    createdAt: Date.now() - 100000,
    plays: 890,
    averageScore: 72,
    cards: [
      { id: '2a', term: 'Proton', definition: 'Hạt mang điện tích dương nằm trong hạt nhân' },
      { id: '2b', term: 'Electron', definition: 'Hạt mang điện tích âm chuyển động quanh hạt nhân' },
      { id: '2c', term: 'Neutron', definition: 'Hạt không mang điện nằm trong hạt nhân' },
      { id: '2d', term: 'Số khối A', definition: 'Tổng số hạt proton và neutron (A = Z + N)' },
      { id: '2e', term: 'Nguyên tố hóa học', definition: 'Tập hợp các nguyên tử có cùng điện tích hạt nhân' }
    ]
  },
  {
    id: '3',
    title: 'Lịch Sử 12 - Cách mạng tháng 8',
    description: 'Các sự kiện quan trọng trong cuộc tổng khởi nghĩa giành chính quyền năm 1945.',
    author: 'Cô Mai Sử',
    createdAt: Date.now() - 200000,
    plays: 3400,
    averageScore: 91,
    cards: [
      { id: '3a', term: '19/8/1945', definition: 'Khởi nghĩa giành chính quyền ở Hà Nội' },
      { id: '3b', term: '2/9/1945', definition: 'Bác Hồ đọc Tuyên ngôn độc lập' },
      { id: '3c', term: '23/8/1945', definition: 'Khởi nghĩa giành chính quyền ở Huế' },
      { id: '3d', term: '25/8/1945', definition: 'Khởi nghĩa giành chính quyền ở Sài Gòn' }
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING'); 
  const [sets, setSets] = useState<StudySet[]>(INITIAL_SETS);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const activeSet = sets.find(s => s.id === activeSetId);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LANDING');
  };

  const handleSaveSet = (newSet: StudySet) => {
    const setWithAuthor = { ...newSet, author: currentUser?.name || 'Bạn' };
    setSets([setWithAuthor, ...sets]);
    setView('DASHBOARD');
  };

  const handleSelectSet = (set: StudySet) => {
    setActiveSetId(set.id);
    setView('SET_DETAILS');
  };

  const handleNavigation = (newView: ViewState) => {
      setView(newView);
      if (newView !== 'STUDY' && newView !== 'QUIZ' && newView !== 'SET_DETAILS') {
          setActiveSetId(null);
      }
  };

  // Render Landing Page
  if (view === 'LANDING') {
    return <LandingPage onStart={() => setView('LOGIN')} />;
  }

  // Render Login Page
  if (view === 'LOGIN') {
    return <Login onLogin={handleLogin} onBack={() => setView('LANDING')} />;
  }

  // Ensure user is logged in for other views
  if (!currentUser) {
      setView('LOGIN');
      return null;
  }

  // Content renderer for Dashboard layout
  const renderMainContent = () => {
    switch (view) {
      case 'DASHBOARD':
      case 'LIBRARY':
        return (
          <Dashboard 
            sets={sets} 
            onCreateNew={() => setView('CREATE')}
            onSelectSet={handleSelectSet}
          />
        );
      
      case 'CLASSES':
        return <ClassManagement currentUser={currentUser} sets={sets} />;

      case 'CREATE':
        return (
          <CreateSet 
            onSave={handleSaveSet}
            onCancel={() => setView('DASHBOARD')}
          />
        );

      case 'AI_CREATOR':
        return (
           <AiTextbookCreator 
              onSaveToLibrary={(set) => {
                  handleSaveSet(set);
                  alert("Đã lưu học phần vào thư viện thành công!");
              }}
           />
        );

      case 'SET_DETAILS':
        if (!activeSet) return <div>Không tìm thấy học phần</div>;
        return (
            <SetDetailView 
                set={activeSet}
                onBack={() => setView('DASHBOARD')}
                onStartFlashcard={() => setView('STUDY')}
                onStartQuiz={() => setView('QUIZ')}
            />
        );

      case 'STUDY':
      case 'QUIZ':
        if (!activeSet) return <div>Không tìm thấy học phần</div>;
        
        return (
          <div className="pb-20">
             {/* Sub-header for mode selection */}
             <div className="bg-white border-b border-gray-200 shadow-sm mb-6 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto">
                    <button 
                        onClick={() => setView('STUDY')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${view === 'STUDY' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <BookOpen size={18} />
                        Thẻ ghi nhớ
                    </button>
                    <button 
                        onClick={() => setView('QUIZ')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${view === 'QUIZ' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <GraduationCap size={18} />
                        Kiểm tra
                    </button>
                </div>
             </div>

             {view === 'STUDY' ? (
                <FlashcardView 
                    set={activeSet} 
                    onBack={() => setView('SET_DETAILS')} 
                />
             ) : (
                <QuizView 
                    set={activeSet} 
                    onBack={() => setView('SET_DETAILS')} 
                />
             )}
          </div>
        );

      default:
        return <div>Lỗi trang</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar 
        currentView={view} 
        currentUser={currentUser}
        onChangeView={handleNavigation}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto h-screen relative">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default App;