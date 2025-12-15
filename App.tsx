import React, { useState, useEffect } from 'react';
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
import { BookOpen, GraduationCap, X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

// Mock data generation function (Giữ nguyên mock data cho content)
const generateMockSets = (count: number): StudySet[] => {
    const subjects = ['Toán', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'Anh', 'GDCD'];
    const authors = ['Cô Thu Lan', 'Thầy Hùng', 'Cô Mai', 'Bạn'];
    
    return Array.from({ length: count }).map((_, i) => ({
        id: `mock-${i}`,
        title: `${subjects[i % subjects.length]} 12 - Bài ôn tập số ${i + 1}`,
        description: `Bộ câu hỏi ôn tập kiến thức trọng tâm chương ${i % 5 + 1}. Bao gồm các câu hỏi trắc nghiệm và tự luận.`,
        author: authors[i % authors.length],
        createdAt: Date.now() - Math.floor(Math.random() * 1000000000),
        plays: Math.floor(Math.random() * 5000),
        averageScore: 60 + Math.floor(Math.random() * 40),
        cards: Array.from({ length: 5 }).map((_, j) => ({
            id: `card-${i}-${j}`,
            term: `Câu hỏi số ${j + 1} của bài ${i + 1}?`,
            definition: `Đáp án đúng là lựa chọn A`,
            options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']
        })),
        reviews: [],
        privacy: 'PUBLIC',
        subject: subjects[i % subjects.length],
        level: 'Lớp 12',
        school: 'THPT Chu Văn An',
        isFavorite: Math.random() > 0.8 
    }));
};

const BASE_SETS: StudySet[] = [
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
    ],
    privacy: 'PUBLIC',
    subject: 'Tiếng Anh',
    level: 'Lớp 6',
    topic: 'Family',
    isFavorite: true
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
    ],
    privacy: 'PUBLIC',
    subject: 'Hóa Học',
    level: 'Lớp 10',
    school: 'THPT Amsterdam'
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
    reviews: [],
    privacy: 'PUBLIC',
    subject: 'Lịch Sử',
    level: 'Lớp 12',
    topic: 'Lịch sử Việt Nam'
  }
];

const INITIAL_SETS = [...BASE_SETS, ...generateMockSets(50)];

// Inner App Component
const AppContent: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING'); 
  const [sets, setSets] = useState<StudySet[]>(INITIAL_SETS);
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [aiHistory, setAiHistory] = useState<AiGenerationRecord[]>([]);
  const [runTour, setRunTour] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  const { addNotification } = useApp();
  const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const { t } = useTranslation();

  const activeSet = sets.find(s => s.id === activeSetId);

  // Sync Auth State with View
  useEffect(() => {
      if (!isLoading) {
          if (isAuthenticated && (view === 'LANDING' || view === 'LOGIN')) {
              setView('DASHBOARD');
          } else if (!isAuthenticated && view !== 'LANDING' && view !== 'LOGIN') {
              setView('LANDING');
          }
      }
  }, [isAuthenticated, isLoading, view]);

  const handleLogout = () => {
    logout();
    addNotification(t('notifications.logged_out'), 'info');
  };

  const handleUpdateUser = (updatedUser: User) => {
    updateUser(updatedUser);
    addNotification(t('notifications.profile_updated'), 'success');
  };

  const handleSaveSet = (newSet: StudySet) => {
    const setWithAuthor = { ...newSet, author: user?.name || 'Bạn' };
    setSets([setWithAuthor, ...sets]);
    setView('DASHBOARD');
    addNotification(t('notifications.set_created'), 'success');
  };

  const handleAddToAiHistory = (record: AiGenerationRecord) => {
    setAiHistory([record, ...aiHistory]);
  };

  const handleSelectSet = (set: StudySet) => {
    setActiveSetId(set.id);
    setView('SET_DETAILS');
  };

  const handleSelectHistory = (record: AiGenerationRecord) => {
      setView('AI_CREATOR');
      addNotification(t('notifications.file_opened', { fileName: record.fileName }), 'info');
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
    addNotification(t('notifications.review_submitted'), 'success');
  };

  // Toggle favorite status
  const handleToggleFavorite = (setId: string) => {
      setSets(prevSets => prevSets.map(s => 
          s.id === setId ? { ...s, isFavorite: !s.isFavorite } : s
      ));
      
      const set = sets.find(s => s.id === setId);
      if (set) {
          if (!set.isFavorite) {
              addNotification(t('notifications.favorite_added'), 'success');
          } else {
              addNotification(t('notifications.favorite_removed'), 'info');
          }
      }
  };

  const handleNavigation = (newView: ViewState) => {
      setView(newView);
      if (newView !== 'STUDY' && newView !== 'QUIZ' && newView !== 'SET_DETAILS') {
          setActiveSetId(null);
      }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
      );
  }

  // Render Landing Page
  if (view === 'LANDING') {
    return <LandingPage 
        onStart={() => { setInitialAuthMode('LOGIN'); setView('LOGIN'); }} 
        onRegister={() => { setInitialAuthMode('REGISTER'); setView('LOGIN'); }} 
    />;
  }

  // Render Login Page
  if (view === 'LOGIN') {
    return <Login onBack={() => setView('LANDING')} initialMode={initialAuthMode} />;
  }

  // Ensure user is logged in for other views
  if (!user) {
      // This is handled by the useEffect above, but just in case
      return null;
  }

  // Content renderer for Dashboard layout
  const renderMainContent = () => {
    switch (view) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            sets={sets} 
            onCreateNew={() => setView('CREATE')}
            onSelectSet={handleSelectSet}
            onToggleFavorite={handleToggleFavorite}
            isLibrary={false}
          />
        );
      case 'LIBRARY':
        return (
          <Dashboard 
            sets={sets} 
            uploads={aiHistory}
            currentUser={user}
            onCreateNew={() => setView('CREATE')}
            onSelectSet={handleSelectSet}
            onSelectUpload={handleSelectHistory}
            onToggleFavorite={handleToggleFavorite}
            isLibrary={true}
          />
        );
      
      case 'CLASSES':
        return <ClassManagement currentUser={user} sets={sets} />;

      case 'CREATE':
        return (
          <CreateSet 
            onSave={handleSaveSet}
            onCancel={() => setView('DASHBOARD')}
            onGoToAiTextbook={() => setView('AI_CREATOR')}
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
              onBack={() => setView('CREATE')}
           />
        );
      
      case 'SETTINGS':
        return (
            <SettingsView 
                currentUser={user}
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
                onToggleFavorite={handleToggleFavorite}
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
                    currentUser={user}
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
        currentUser={user}
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
      {user && (
        <UserTour 
            currentUser={user} 
            run={runTour}
            onStop={() => setRunTour(false)}
        />
      )}
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
      <AuthProvider>
        <AppContent />
        <NotificationContainer />
      </AuthProvider>
    </AppProvider>
  );
};

export default App;