
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
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
import AdminThemeSettings from './components/AdminThemeSettings';
import UserTour from './components/UserTour';
import ThemeLoader from './components/ThemeLoader';
import { StudySet, User, AiGenerationRecord, Review, EventTheme } from './types';
import { BookOpen, GraduationCap, X, CheckCircle, AlertCircle, Info, AlertTriangle, Snowflake, Leaf, Flower2, Mail, Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// --- Global Event Theme Overlay Component ---
const EventOverlay: React.FC<{ theme: EventTheme }> = ({ theme: eventType }) => {
    const { isAnimationEnabled, theme: uiTheme } = useApp();
    
    useEffect(() => {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (!favicon) return;

        let leftColor = '#005EB8';
        let rightColor = '#F37321';
        let extra = '';

        if (eventType === 'CHRISTMAS') {
            leftColor = '#D42426';
            rightColor = '#165B33';
            extra = `%3Ccircle cx='80' cy='20' r='15' fill='white'/%3E%3Cpath d='M72 20 L88 20 M80 12 L80 28 M74 14 L86 26 M74 26 L86 14' stroke='%23D42426' stroke-width='3'/%3E`;
        } else if (eventType === 'TET') {
            leftColor = '#E60000';
            rightColor = '#FFD700';
            extra = `%3Ccircle cx='80' cy='20' r='12' fill='%23FFD700'/%3E%3Ccircle cx='80' cy='20' r='4' fill='%23E60000'/%3E`;
        } else if (eventType === 'AUTUMN') {
            leftColor = '#92400E';
            rightColor = '#D97706';
            extra = `%3Cpath d='M70 15 L85 10 L80 25 L95 20 L90 35 L75 30 L80 45 L65 40 Z' fill='%23D97706'/%3E`;
        }

        const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 85C30 85 15 70 15 50C15 35 25 20 45 15V85Z' fill='${leftColor.replace('#', '%23')}'/%3E%3Cpath d='M50 85C70 85 85 70 85 50C85 35 75 20 55 15V85Z' fill='${rightColor.replace('#', '%23')}'/%3E%3Crect x='20' y='38' width='25' height='18' rx='6' fill='white' stroke='%231F2937' stroke-width='3'/%3E%3Crect x='55' y='38' width='25' height='18' rx='6' fill='white' stroke='%231F2937' stroke-width='3'/%3E%3Cpath d='M45 47H55' stroke='%231F2937' stroke-width='3'/%3E%3Ccircle cx='32.5' cy='47' r='4' fill='%231F2937'/%3E%3Ccircle cx='67.5' cy='47' r='4' fill='%231F2937'/%3E%3Cpath d='M40 70C45 75 55 75 60 70' stroke='white' stroke-width='3'/%3E${extra}%3C/svg%3E`;
        favicon.href = `data:image/svg+xml,${svg}`;
    }, [eventType]);
    
    const items = useMemo(() => {
        if (eventType === 'DEFAULT' || !isAnimationEnabled) return [];
        let count = 40;
        if (eventType === 'AUTUMN') count = 25; 
        if (eventType === 'CHRISTMAS') count = 45; 
        if (eventType === 'TET') count = 30;

        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 20}s`,
            duration: `${12 + Math.random() * 18}s`,
            size: eventType === 'CHRISTMAS' ? `${10 + Math.random() * 15}px` : `${12 + Math.random() * 18}px`,
            swayDuration: `${4 + Math.random() * 6}s`,
            opacity: 0.4 + Math.random() * 0.3,
            variant: Math.random() > 0.6 ? 'A' : Math.random() > 0.3 ? 'B' : 'C'
        }));
    }, [eventType, isAnimationEnabled]);

    if (eventType === 'DEFAULT' || !isAnimationEnabled) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
            {items.map((item) => {
                let style: React.CSSProperties = {};
                let content: React.ReactNode = null;

                if (eventType === 'CHRISTMAS') {
                    const isDarkMode = uiTheme === 'dark';
                    style = { color: '#FFFFFF', filter: isDarkMode ? 'drop-shadow(0 0 3px rgba(255,255,255,0.4))' : 'drop-shadow(0 0 2px rgba(0,0,0,0.15))' };
                    content = <Snowflake size="100%" strokeWidth={2.5} />;
                } else if (eventType === 'TET') {
                    if (item.variant === 'A') {
                        style = { color: Math.random() > 0.5 ? '#FFD700' : '#FF69B4', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' };
                        content = <Flower2 size="100%" strokeWidth={1.5} fill="currentColor" fillOpacity={0.2} />;
                    } else if (item.variant === 'B') {
                        style = { color: '#E60000', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' };
                        content = (
                            <div className="w-full h-full relative flex items-center justify-center">
                                <Mail size="100%" strokeWidth={2} />
                                <div className="absolute inset-0 flex items-center justify-center pb-0.5"><div className="w-1/2 h-1/2 bg-yellow-400 rounded-full scale-50 opacity-80" /></div>
                            </div>
                        );
                    } else {
                        style = { color: '#4ADE80', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))' };
                        content = <Leaf size="100%" strokeWidth={2} fill="currentColor" fillOpacity={0.1} />;
                    }
                    style.transform = `rotate(${Math.random() * 360}deg)`;
                } else if (eventType === 'AUTUMN') {
                    style = { color: item.variant === 'A' ? '#D97706' : '#B45309', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))', transform: `rotate(${Math.random() * 360}deg)` };
                    content = <Leaf size="100%" strokeWidth={2} fill="currentColor" fillOpacity={0.2} />;
                }

                return (
                    <div key={item.id} className="falling-item" style={{ left: item.left, width: item.size, height: item.size, opacity: item.opacity, animation: `global-fall ${item.duration} linear infinite`, animationDelay: item.delay }}>
                        <div className="w-full h-full flex items-center justify-center" style={{ ...style, animation: `global-sway ${item.swayDuration} ease-in-out infinite alternate` }}>{content}</div>
                    </div>
                );
            })}
            {eventType === 'TET' && (<><div className="absolute top-0 left-0 w-32 h-32 text-4xl p-4 opacity-20 animate-pulse">🧧</div><div className="absolute top-0 right-0 w-32 h-32 text-4xl p-4 opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>🏮</div></>)}
            {eventType === 'CHRISTMAS' && (<div className="absolute top-0 left-0 w-32 h-32 text-4xl p-4 opacity-40 animate-pulse">🎄</div>)}
        </div>
    );
};

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
        cards: Array.from({ length: 5 }).map((_, j) => ({ id: `card-${i}-${j}`, term: `Câu hỏi số ${j + 1} của bài ${i + 1}?`, definition: `Lựa chọn đúng`, options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'] })),
        privacy: 'PUBLIC',
        subject: subjects[i % subjects.length],
        level: 'Lớp 12',
        school: 'THPT Chu Văn An',
        isFavorite: Math.random() > 0.8 
    }));
};

const INITIAL_SETS = [...generateMockSets(10)];

// --- Layout Component ---
const MainLayout: React.FC<{ children: React.ReactNode, sets: StudySet[], aiHistory: AiGenerationRecord[], handleLogout: () => void, runTour: boolean, setRunTour: (val: boolean) => void }> = ({ children, sets, aiHistory, handleLogout, runTour, setRunTour }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><ThemeLoader size={48} /></div>);
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300 overflow-hidden relative">
      <Sidebar currentPath={location.pathname} currentUser={user} onLogout={handleLogout} onStartTour={() => setRunTour(true)} />
      <div className="flex-1 flex flex-col min-w-0">
          <Header sets={sets} history={aiHistory} onSelectSet={(s) => window.location.hash = `#/set/${s.id}`} onSelectHistory={() => window.location.hash = `#/ai-planner`} />
          <main className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar">{children}</main>
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
  const { addNotification, eventTheme } = useApp();
  const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { localStorage.setItem('studySets', JSON.stringify(sets)); }, [sets]);

  const handleLogout = () => { logout(); addNotification(t('notifications.logged_out'), 'info'); navigate('/'); };
  const handleUpdateUser = (updatedUser: User) => { updateUser(updatedUser); addNotification(t('notifications.profile_updated'), 'success'); };
  const handleSaveSet = (newSet: StudySet) => { const setWithAuthor = { ...newSet, author: user?.name || 'Bạn' }; setSets([setWithAuthor, ...sets]); navigate('/library'); addNotification(t('notifications.set_created'), 'success'); };
  const handleAddToAiHistory = (record: AiGenerationRecord) => { setAiHistory([record, ...aiHistory]); };
  const handleAddReview = (setId: string, review: Review) => { setSets(prevSets => prevSets.map(s => s.id === setId ? { ...s, reviews: [review, ...(s.reviews || [])] } : s)); addNotification(t('notifications.review_submitted'), 'success'); };
  const handleToggleFavorite = (setId: string) => { setSets(prevSets => prevSets.map(s => s.id === setId ? { ...s, isFavorite: !s.isFavorite } : s)); };

  if (isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><ThemeLoader size={48} /></div>);
  const isAdmin = user?.roles.includes('ADMIN');

  return (
    <>
      <EventOverlay theme={eventTheme} />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onStart={() => navigate('/login')} onRegister={() => navigate('/login', { state: { mode: 'REGISTER' } })} />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onBack={() => navigate('/')} initialMode={location.state?.mode || 'LOGIN'} />} />
        <Route path="/dashboard" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><Dashboard sets={sets} onCreateNew={() => navigate('/create')} onSelectSet={(s) => navigate(`/set/${s.id}`)} onToggleFavorite={handleToggleFavorite} isLibrary={false} /></MainLayout>} />
        <Route path="/library" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><Dashboard sets={sets} uploads={aiHistory} currentUser={user} onCreateNew={() => navigate('/create')} onSelectSet={(s) => navigate(`/set/${s.id}`)} onSelectUpload={() => navigate('/ai-planner')} onToggleFavorite={handleToggleFavorite} isLibrary={true} /></MainLayout>} />
        <Route path="/classes" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><ClassManagement currentUser={user!} sets={sets} /></MainLayout>} />
        <Route path="/create" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><CreateSet onSave={handleSaveSet} onCancel={() => navigate('/dashboard')} onGoToAiTextbook={() => navigate('/ai-planner')} history={aiHistory} onSelectHistory={(r) => navigate('/ai-planner')} /></MainLayout>} />
        <Route path="/ai-planner" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><AiTextbookCreator onSaveToLibrary={handleSaveSet} history={aiHistory} onAddToHistory={handleAddToAiHistory} onBack={() => navigate('/create')} /></MainLayout>} />
        <Route path="/settings" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><SettingsView currentUser={user!} onUpdateUser={handleUpdateUser} /></MainLayout>} />
        <Route path="/admin/theme" element={isAdmin ? <MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><AdminThemeSettings /></MainLayout> : <Navigate to="/dashboard" replace />} />
        <Route path="/set/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><SetDetailRoute sets={sets} onToggleFavorite={handleToggleFavorite} /></MainLayout>} />
        <Route path="/study/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode="FLASHCARD" /></MainLayout>} />
        <Route path="/quiz/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode="QUIZ" onAddReview={handleAddReview} /></MainLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// --- Sub-components for Routes ---
const SetDetailRoute = ({ sets, onToggleFavorite }: { sets: StudySet[], onToggleFavorite: (id: string) => void }) => {
    const { setId } = useParams();
    const navigate = useNavigate();
    // Chỉnh sửa: Tìm học phần trong local, nếu không thấy thì vẫn cho phép load để SetDetailView tự gọi API
    const existingSet = sets.find(s => s.id === setId);
    const setPlaceholder: StudySet = existingSet || { id: setId || '', title: 'Đang tải...', description: '', author: '...', createdAt: Date.now(), cards: [], privacy: 'PUBLIC' };
    return <SetDetailView set={setPlaceholder} onBack={() => navigate(-1)} onStartFlashcard={() => navigate(`/study/${setId}`)} onStartQuiz={() => navigate(`/quiz/${setId}`)} onToggleFavorite={onToggleFavorite} />;
};

const StudyRoute = ({ sets, mode, onAddReview }: { sets: StudySet[], mode: 'FLASHCARD' | 'QUIZ', onAddReview?: any }) => {
    const { setId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    // Chỉnh sửa: Tương tự SetDetailRoute, cho phép truy cập StudyRoute để lấy dữ liệu từ server nếu cần
    const set = sets.find(s => s.id === setId);
    if (!set && !setId) return <div className="p-8 text-center text-gray-500">Học phần không tồn tại.</div>;
    // Lưu ý: FlashcardView và QuizView hiện tại phụ thuộc vào `set.cards`. 
    // Trong một ứng dụng thực tế, bạn cũng nên fetch dữ liệu tại đây nếu `set` trống.
    return (
        <div className="pb-20 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-2 flex gap-4 overflow-x-auto">
                    <button onClick={() => navigate(`/study/${setId}`)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'FLASHCARD' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><BookOpen size={18} /> Thẻ ghi nhớ</button>
                    <button onClick={() => navigate(`/quiz/${setId}`)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'QUIZ' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><GraduationCap size={18} /> Kiểm tra</button>
                </div>
            </div>
            {set ? (mode === 'FLASHCARD' ? <FlashcardView set={set} onBack={() => navigate(`/set/${setId}`)} /> : <QuizView set={set} currentUser={user!} onBack={() => navigate(`/set/${setId}`)} onAddReview={onAddReview} />) : <div className="p-20 text-center"><ThemeLoader size={48} /></div>}
        </div>
    );
};

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
