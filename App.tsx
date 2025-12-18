
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { StudySet, User, AiGenerationRecord, Review } from './types';
import { BookOpen, GraduationCap, X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

// --- Mock Data Helpers ---
const generateMockSets = (count: number): StudySet[] => {
    const subjects = ['Toán', 'Lý', 'Hóa', 'Sinh', 'Sử', 'Địa', 'Anh', 'GDCD'];
    const authors = ['Cô Thu Lan', 'Thầy Hùng', 'Cô Mai', 'Bạn'];
    
    return Array.from({ length: count }).map((_, i) => ({
        id: `mock-${i}`,
        title: `${subjects[i % subjects.length]} 12 - Bài ôn tập số ${i + 1}`,
        description: `Bộ câu hỏi ôn tập kiến thức trọng tâm chương ${i % 5 + 1}.`,
        author: authors[i % authors.length],
        createdAt: Date.now() - Math.floor(Math.random() * 1000000000),
        plays: Math.floor(Math.random() * 5000),
        averageScore: 60 + Math.floor(Math.random() * 40),
        cards: Array.from({ length: 5 }).map((_, j) => ({
            id: `card-${i}-${j}`,
            term: `Câu hỏi số ${j + 1} của bài ${i + 1}?`,
            definition: `Lựa chọn đúng`,
            options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']
        })),
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
    description: 'Các từ vựng cơ bản về các thành viên trong gia đình.',
    author: 'Cô Thu Lan',
    createdAt: Date.now(),
    plays: 1250,
    averageScore: 85,
    cards: [
      { id: '1a', term: 'Father', definition: 'Bố, cha' },
      { id: '1b', term: 'Mother', definition: 'Mẹ, má' },
    ],
    privacy: 'PUBLIC',
    subject: 'Tiếng Anh',
    level: 'Lớp 6',
    isFavorite: true
  }
];

const INITIAL_SETS = [...BASE_SETS, ...generateMockSets(10)];

// --- Layout Component ---
const MainLayout: React.FC<{ 
  children: React.ReactNode,
  sets: StudySet[],
  aiHistory: AiGenerationRecord[],
  handleLogout: () => void,
  runTour: boolean,
  setRunTour: (val: boolean) => void
}> = ({ children, sets, aiHistory, handleLogout, runTour, setRunTour }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300 overflow-hidden">
      <Sidebar 
        currentPath={location.pathname}
        currentUser={user}
        onLogout={handleLogout}
        onStartTour={() => setRunTour(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
          <Header 
            sets={sets} 
            history={aiHistory} 
            onSelectSet={(s) => window.location.hash = `#/set/${s.id}`}
            onSelectHistory={() => window.location.hash = `#/ai-planner`}
          />
          <main className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar">
            {children}
          </main>
      </div>
      {user && <UserTour currentUser={user} run={runTour} onStop={() => setRunTour(false)} />}
    </div>
  );
};

// --- Routes Manager ---
const AppRoutes: React.FC = () => {
  const [sets, setSets] = useState<StudySet[]>(() => {
    const saved = localStorage.getItem('studySets');
    return saved ? JSON.parse(saved) : INITIAL_SETS;
  });
  const [aiHistory, setAiHistory] = useState<AiGenerationRecord[]>([]);
  const [runTour, setRunTour] = useState(false);
  
  const { addNotification } = useApp();
  const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('studySets', JSON.stringify(sets));
  }, [sets]);

  const handleLogout = () => {
    logout();
    addNotification(t('notifications.logged_out'), 'info');
    navigate('/');
  };

  const handleUpdateUser = (updatedUser: User) => {
    updateUser(updatedUser);
    addNotification(t('notifications.profile_updated'), 'success');
  };

  const handleSaveSet = (newSet: StudySet) => {
    const setWithAuthor = { ...newSet, author: user?.name || 'Bạn' };
    setSets([setWithAuthor, ...sets]);
    navigate('/library');
    addNotification(t('notifications.set_created'), 'success');
  };

  const handleAddToAiHistory = (record: AiGenerationRecord) => {
    setAiHistory([record, ...aiHistory]);
  };

  const handleAddReview = (setId: string, review: Review) => {
    setSets(prevSets => prevSets.map(s => {
        if (s.id === setId) {
            return { ...s, reviews: [review, ...(s.reviews || [])] };
        }
        return s;
    }));
    addNotification(t('notifications.review_submitted'), 'success');
  };

  const handleToggleFavorite = (setId: string) => {
      setSets(prevSets => prevSets.map(s => 
          s.id === setId ? { ...s, isFavorite: !s.isFavorite } : s
      ));
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
          </div>
      );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onStart={() => navigate('/login')} onRegister={() => navigate('/login', { state: { mode: 'REGISTER' } })} />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onBack={() => navigate('/')} initialMode={location.state?.mode || 'LOGIN'} />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><Dashboard sets={sets} onCreateNew={() => navigate('/create')} onSelectSet={(s) => navigate(`/set/${s.id}`)} onToggleFavorite={handleToggleFavorite} isLibrary={false} /></MainLayout>} />
      <Route path="/library" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><Dashboard sets={sets} uploads={aiHistory} currentUser={user} onCreateNew={() => navigate('/create')} onSelectSet={(s) => navigate(`/set/${s.id}`)} onSelectUpload={() => navigate('/ai-planner')} onToggleFavorite={handleToggleFavorite} isLibrary={true} /></MainLayout>} />
      <Route path="/classes" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><ClassManagement currentUser={user!} sets={sets} /></MainLayout>} />
      <Route path="/create" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><CreateSet onSave={handleSaveSet} onCancel={() => navigate('/dashboard')} onGoToAiTextbook={() => navigate('/ai-planner')} history={aiHistory} onSelectHistory={(r) => navigate('/ai-planner')} /></MainLayout>} />
      <Route path="/ai-planner" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><AiTextbookCreator onSaveToLibrary={handleSaveSet} history={aiHistory} onAddToHistory={handleAddToAiHistory} onBack={() => navigate('/create')} /></MainLayout>} />
      <Route path="/settings" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><SettingsView currentUser={user!} onUpdateUser={handleUpdateUser} /></MainLayout>} />
      
      {/* Detail Routes */}
      <Route path="/set/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><SetDetailRoute sets={sets} onToggleFavorite={handleToggleFavorite} /></MainLayout>} />
      <Route path="/study/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode="FLASHCARD" /></MainLayout>} />
      <Route path="/quiz/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode="QUIZ" onAddReview={handleAddReview} /></MainLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// --- Sub-components for Routes ---
const SetDetailRoute = ({ sets, onToggleFavorite }: { sets: StudySet[], onToggleFavorite: (id: string) => void }) => {
    const { setId } = useParams();
    const navigate = useNavigate();
    const set = sets.find(s => s.id === setId);
    if (!set) return <div className="p-8 text-center text-gray-500">Học phần không tồn tại.</div>;
    return <SetDetailView set={set} onBack={() => navigate(-1)} onStartFlashcard={() => navigate(`/study/${setId}`)} onStartQuiz={() => navigate(`/quiz/${setId}`)} onToggleFavorite={onToggleFavorite} />;
};

const StudyRoute = ({ sets, mode, onAddReview }: { sets: StudySet[], mode: 'FLASHCARD' | 'QUIZ', onAddReview?: any }) => {
    const { setId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const set = sets.find(s => s.id === setId);
    if (!set) return <div className="p-8 text-center text-gray-500">Học phần không tồn tại.</div>;

    return (
        <div className="pb-20 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-2 flex gap-4 overflow-x-auto">
                    <button 
                        onClick={() => navigate(`/study/${setId}`)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'FLASHCARD' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <BookOpen size={18} /> Thẻ ghi nhớ
                    </button>
                    <button 
                        onClick={() => navigate(`/quiz/${setId}`)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'QUIZ' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <GraduationCap size={18} /> Kiểm tra
                    </button>
                </div>
            </div>
            {mode === 'FLASHCARD' ? <FlashcardView set={set} onBack={() => navigate(`/set/${setId}`)} /> : <QuizView set={set} currentUser={user!} onBack={() => navigate(`/set/${setId}`)} onAddReview={onAddReview} />}
        </div>
    );
};

// --- Toast Notifications ---
const NotificationContainer = () => {
  const { notifications, removeNotification } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div key={notif.id} className="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 p-4 flex items-start gap-3 min-w-[320px] animate-slide-in" style={{ borderColor: notif.type === 'success' ? '#10B981' : notif.type === 'error' ? '#EF4444' : notif.type === 'warning' ? '#F59E0B' : '#3B82F6' }}>
          {notif.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
          {notif.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
          {notif.type === 'warning' && <AlertTriangle size={20} className="text-yellow-500" />}
          {notif.type === 'info' && <Info size={20} className="text-blue-500" />}
          <div className="flex-1"><p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{notif.message}</p></div>
          <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
        <AppProvider>
        <AuthProvider>
            <AppRoutes />
            <NotificationContainer />
        </AuthProvider>
        </AppProvider>
    </Router>
  );
};

export default App;
