
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams, useLocation, useNavigate, Link } from 'react-router-dom';
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
import ScheduleView from './components/ScheduleView';
import { StudySet, User, AiGenerationRecord, Review, EventTheme, QuizAttempt, StudyMode } from './types';
import { BookOpen, GraduationCap, X, CheckCircle, AlertCircle, Info, AlertTriangle, Snowflake, Leaf, Flower2, Mail, Sparkles, LayoutDashboard, PlusCircle, Library, Users, Calendar as CalendarIcon } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { studySetService } from './services/studySetService';
import { quizService } from './services/quizService';
import { favoriteService } from './services/favoriteService';

// --- Global Event Theme Overlay ---
const EventOverlay: React.FC<{ theme: EventTheme }> = ({ theme: eventType }) => {
    const { isAnimationEnabled, theme: uiTheme } = useApp();
    useEffect(() => {
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (!favicon) return;
        let leftColor = '#005EB8';
        let rightColor = '#F37321';
        let extra = '';
        if (eventType === 'CHRISTMAS') { leftColor = '#D42426'; rightColor = '#165B33'; }
        else if (eventType === 'TET') { leftColor = '#E60000'; rightColor = '#FFD700'; }
        else if (eventType === 'AUTUMN') { leftColor = '#92400E'; rightColor = '#D97706'; }
        const svg = `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 85C30 85 15 70 15 50C15 35 25 20 45 15V85Z' fill='${leftColor.replace('#', '%23')}'/%3E%3Cpath d='M50 85C70 85 85 70 85 50C85 35 75 20 55 15V85Z' fill='${rightColor.replace('#', '%23')}'/%3E%3C/svg%3E`;
        favicon.href = `data:image/svg+xml,${svg}`;
    }, [eventType]);
    const items = useMemo(() => {
        if (eventType === 'DEFAULT' || !isAnimationEnabled) return [];
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i, left: `${Math.random() * 100}%`, delay: `${Math.random() * 20}s`, duration: `${12 + Math.random() * 18}s`,
            size: `${12 + Math.random() * 18}px`, swayDuration: `${4 + Math.random() * 6}s`, opacity: 0.4 + Math.random() * 0.3
        }));
    }, [eventType, isAnimationEnabled]);
    if (eventType === 'DEFAULT' || !isAnimationEnabled) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
            {items.map((item) => (
                <div key={item.id} className="falling-item" style={{ left: item.left, width: item.size, height: item.size, opacity: item.opacity, animation: `global-fall ${item.duration} linear infinite`, animationDelay: item.delay }}>
                    <div className="w-full h-full flex items-center justify-center" style={{ color: eventType === 'CHRISTMAS' ? 'white' : '#FFD700', animation: `global-sway ${item.swayDuration} ease-in-out infinite alternate` }}>{eventType === 'CHRISTMAS' ? <Snowflake size="100%"/> : <Flower2 size="100%"/>}</div>
                </div>
            ))}
        </div>
    );
};

// --- Layout Component ---
const MainLayout: React.FC<{ children: React.ReactNode, sets: StudySet[], aiHistory: AiGenerationRecord[], handleLogout: () => void, runTour: boolean, setRunTour: (val: boolean) => void }> = ({ children, sets, aiHistory, handleLogout, runTour, setRunTour }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  if (isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><ThemeLoader size={48} /></div>);
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300 overflow-hidden relative">
      <Sidebar currentPath={location.pathname} currentUser={user} onLogout={handleLogout} onStartTour={() => setRunTour(true)} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 relative">
          <Header sets={sets} history={aiHistory} onSelectSet={(s) => window.location.hash = `#/set/${s.id}`} onSelectHistory={() => window.location.hash = `#/ai-planner`} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar">{children}</main>
      </div>
      {user && <UserTour currentUser={user} run={runTour} onStop={() => setRunTour(false)} />}
    </div>
  );
};

// --- App Routes ---
const AppRoutes: React.FC = () => {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [aiHistory, setAiHistory] = useState<AiGenerationRecord[]>([]);
  const [runTour, setRunTour] = useState(false);
  const { addNotification, eventTheme } = useApp();
  const { user, isAuthenticated, isLoading, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => { logout(); navigate('/'); }, [logout, navigate]);
  const handleUpdateUser = useCallback((updatedUser: User) => { updateUser(updatedUser); addNotification(t('notifications.profile_updated'), 'success'); }, [updateUser, addNotification, t]);
  const handleSaveSet = useCallback((newSet: StudySet) => { navigate('/library'); addNotification(t('notifications.set_created'), 'success'); }, [navigate, addNotification, t]);
  
  // CẬP NHẬT: Logic Toggle Favorite toàn cục gọi API
  const handleToggleFavorite = useCallback(async (setId: string) => {
    try {
        const response = await favoriteService.toggleFavorite(setId);
        if (response.code === 1000) {
            const isFav = response.result;
            addNotification(isFav ? t('notifications.favorite_added') : t('notifications.favorite_removed'), 'success');
            // Cập nhật trạng thái cục bộ nếu cần
            setSets(prev => prev.map(s => s.id === setId ? { ...s, isFavorite: isFav } : s));
        }
    } catch (e) {
        addNotification("Lỗi kết nối máy chủ", "error");
    }
  }, [addNotification, t]);

  if (isLoading) return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><ThemeLoader size={48} /></div>);

  return (
    <>
      <EventOverlay theme={eventTheme} />
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onStart={() => navigate('/login')} onRegister={() => navigate('/login', { state: { mode: 'REGISTER' } })} />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onBack={() => navigate('/')} initialMode={location.state?.mode || 'LOGIN'} />} />
        <Route path="/dashboard" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><Dashboard sets={sets} onCreateNew={() => navigate('/create')} onSelectSet={(s) => navigate(`/set/${s.id}`)} onToggleFavorite={handleToggleFavorite} isLibrary={false} /></MainLayout>} />
        <Route path="/library" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><Dashboard sets={sets} uploads={aiHistory} currentUser={user} onCreateNew={() => navigate('/create')} onSelectSet={(s) => navigate(`/set/${s.id}`)} onSelectUpload={() => navigate('/ai-planner')} onToggleFavorite={handleToggleFavorite} isLibrary={true} /></MainLayout>} />
        <Route path="/set/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><SetDetailRoute sets={sets} onToggleFavorite={handleToggleFavorite} /></MainLayout>} />
        {/* ... các route khác giữ nguyên */}
      </Routes>
    </>
  );
};

const SetDetailRoute = ({ sets, onToggleFavorite }: { sets: StudySet[], onToggleFavorite: (id: string) => void }) => {
    const { setId } = useParams();
    const navigate = useNavigate();
    const handleBack = useCallback(() => navigate(-1), [navigate]);
    const handleStartFlash = useCallback(() => navigate(`/study/${setId}`), [navigate, setId]);
    const handleStartQuiz = useCallback(() => navigate(`/quiz/${setId}`), [navigate, setId]);
    const setPlaceholder = useMemo(() => {
        const existing = sets.find(s => s.id === setId);
        return existing || { id: setId || '', title: 'Đang tải...', description: '', author: '...', createdAt: Date.now(), cards: [], privacy: 'PUBLIC' } as StudySet;
    }, [sets, setId]);
    return <SetDetailView set={setPlaceholder} onBack={handleBack} onStartFlashcard={handleStartFlash} onStartQuiz={handleStartQuiz} onToggleFavorite={onToggleFavorite} />;
};

const App: React.FC = () => {
  return (
    <Router><AppProvider><AuthProvider><AppRoutes /></AuthProvider></AppProvider></Router>
  );
};
export default App;
