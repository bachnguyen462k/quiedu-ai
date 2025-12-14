import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CreateSet from './components/CreateSet';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import SetDetailView from './components/SetDetailView';
import ClassManagement from './components/ClassManagement';
import AiTextbookCreator from './components/AiTextbookCreator';
import SettingsView from './components/SettingsView';
import UserTour from './components/UserTour';
import { StudySet, ViewState, User, AiGenerationRecord, Review } from './types';
import { BookOpen, GraduationCap, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';

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
    ],
    reviews: [
        { id: 'r1', userId: 'u1', userName: 'Hải Đăng', rating: 5, comment: 'Bài học rất dễ hiểu, cảm ơn cô!', createdAt: Date.now() - 1000000 },
        { id: 'r2', userId: 'u2', userName: 'Minh Thư', rating: 4, comment: 'Một số từ hơi khó nhớ nhưng hình ảnh minh họa tốt.', createdAt: Date.now() - 500000 }
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
    ],
    reviews: [
        { id: 'r3', userId: 'u3', userName: 'Tuấn Kiệt', rating: 5, comment: 'Kiến thức tổng hợp rất đầy đủ để ôn thi.', createdAt: Date.now() - 200000 }
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
    ],
    reviews: []
  }
];

// Inner App Component to access Context
const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING'); 
  const [sets, setSets] = useState<StudySet[]>(INITIAL_SETS);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [aiHistory, setAiHistory] = useState<AiGenerationRecord[]>([]);
  const [runTour, setRunTour] = useState(false);
  
  const { addNotification } = useApp();

  const activeSet = sets.find(s => s.id === activeSetId);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
    addNotification(`Chào mừng ${user.name} đã quay trở lại!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('LANDING');
    addNotification('Đã đăng xuất thành công.', 'info');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    addNotification('Cập nhật thông tin thành công!', 'success');
  };

  const handleSaveSet = (newSet: StudySet) => {
    const setWithAuthor = { ...newSet, author: currentUser?.name || 'Bạn' };
    setSets([setWithAuthor, ...sets]);
    setView('DASHBOARD');
    addNotification('Đã tạo học phần mới thành công!', 'success');
  };

  const handleAddToAiHistory = (record: AiGenerationRecord) => {
    setAiHistory([record, ...aiHistory]);
  };

  const handleSelectSet = (set: StudySet) => {
    setActiveSetId(set.id);
    setView('SET_DETAILS');
  };

  const handleSelectHistory = (record: AiGenerationRecord) => {
      // Logic to view history: Switch to AI_CREATOR view (it handles history display internally via props, 
      // but simpler here we just navigate to it. A real app would pass the ID or selected record prop)
      // For this demo, we can just switch view, and let user pick from history tab, OR modify AiTextbookCreator to accept a default.
      // Since AiTextbookCreator manages its own active record, we'll just navigate to the tab for now.
      setView('AI_CREATOR');
      addNotification(`Đã mở tài liệu: ${record.fileName}`, 'info');
  };

  const handleAddReview = (setId: string, review: Review) => {
    setSets(prevSets => prevSets.map(s => {
        if (s.id === setId) {
            return {
                ...s,
                reviews: [review, ...(s.reviews || [])]
            };
        }
        return s;
    }));
    addNotification('Cảm ơn đánh giá của bạn!', 'success');
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
              }}
              history={aiHistory}
              onAddToHistory={handleAddToAiHistory}
           />
        );
      
      case 'SETTINGS':
        return (
            <SettingsView 
                currentUser={currentUser}
                onUpdateUser={handleUpdateUser}
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
             <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm mb-6 sticky top-0 z-30 transition-colors">
                <div className="max-w-4xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto">
                    <button 
                        onClick={() => setView('STUDY')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${view === 'STUDY' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <BookOpen size={18} />
                        Thẻ ghi nhớ
                    </button>
                    <button 
                        onClick={() => setView('QUIZ')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${view === 'QUIZ' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
                    currentUser={currentUser}
                    onBack={() => setView('SET_DETAILS')} 
                    onAddReview={handleAddReview}
                />
             )}
          </div>
        );

      default:
        return <div>Lỗi trang</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300 overflow-hidden">
      <Sidebar 
        currentView={view} 
        currentUser={currentUser}
        onChangeView={handleNavigation}
        onLogout={handleLogout}
        onStartTour={() => setRunTour(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
          <Header 
            sets={sets} 
            history={aiHistory} 
            onSelectSet={handleSelectSet}
            onSelectHistory={handleSelectHistory}
          />
          <main className="flex-1 overflow-y-auto relative scroll-smooth">
            {renderMainContent()}
          </main>
      </div>
      
      {/* User Guide Tour */}
      <UserTour 
        currentUser={currentUser} 
        run={runTour}
        onStop={() => setRunTour(false)}
      />
    </div>
  );
};

// Toast Container Component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3 min-w-[300px] animate-slide-in transition-all"
          style={{
             borderColor: notif.type === 'success' ? '#10B981' : notif.type === 'error' ? '#EF4444' : notif.type === 'warning' ? '#F59E0B' : '#3B82F6'
          }}
        >
          {notif.type === 'success' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
          {notif.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
          {notif.type === 'warning' && <AlertTriangle size={20} className="text-yellow-500 shrink-0" />}
          {notif.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{notif.message}</p>
          </div>
          <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
      <NotificationContainer />
    </AppProvider>
  );
};

export default App;