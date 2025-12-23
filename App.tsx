
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
        </div>
    );
};

// --- Mobile Navigation Bar ---
const MobileNavBar: React.FC = () => {
    const location = useLocation();
    
    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Trang chủ' },
        { path: '/schedule', icon: CalendarIcon, label: 'Lịch nhắc' },
        { path: '/create', icon: PlusCircle, label: 'Tạo mới' },
        { path: '/library', icon: Library, label: 'Thư viện' },
        { path: '/classes', icon: Users, label: 'Lớp học' },
    ];

    return (
        <div className="lg:hidden flex items-center justify-around bg-white dark:bg-gray-855 border-b border-gray-100 dark:border-gray-800 px-2 py-2 sticky top-16 z-[100] transition-colors shadow-sm">
            {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-brand-blue dark:text-blue-400 bg-brand-blue/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                        <item.icon size={20} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                    </Link>
                );
            })}
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
      <Sidebar 
        currentPath={location.pathname} 
        currentUser={user} 
        onLogout={handleLogout} 
        onStartTour={() => setRunTour(true)} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
          <Header 
            sets={sets} 
            history={aiHistory} 
            onSelectSet={(s) => window.location.hash = `#/set/${s.id}`} 
            onSelectHistory={() => window.location.hash = `#/ai-planner`} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
          <MobileNavBar />
          
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
  const handleAddToAiHistory = useCallback((record: AiGenerationRecord) => { setAiHistory(prev => [record, ...prev]); }, []);
  const handleAddReview = useCallback((setId: string, review: Review) => { addNotification(t('notifications.review_submitted'), 'success'); }, [addNotification, t]);
  const handleToggleFavorite = useCallback((setId: string) => { /* logic */ }, []);

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
        <Route path="/study/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode={StudyMode.FLASHCARD} /></MainLayout>} />
        <Route path="/quiz/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode={StudyMode.QUIZ} onAddReview={handleAddReview} /></MainLayout>} />
        <Route path="/quiz/review/:attemptId/:setId" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><StudyRoute sets={sets} mode={StudyMode.REVIEW} onAddReview={handleAddReview} /></MainLayout>} />
        <Route path="/schedule" element={<MainLayout sets={sets} aiHistory={aiHistory} handleLogout={handleLogout} runTour={runTour} setRunTour={setRunTour}><ScheduleView /></MainLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// --- Sub-components for Routes ---
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

const StudyRoute = ({ sets, mode, onAddReview }: { sets: StudySet[], mode: StudyMode, onAddReview?: any }) => {
    const { setId, attemptId } = useParams();
    const { user } = useAuth();
    const { addNotification } = useApp();
    const navigate = useNavigate();
    
    const [fullSet, setFullSet] = useState<StudySet | null>(null);
    const [quizAttempt, setQuizAttempt] = useState<QuizAttempt | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const fetchingId = useRef<string | null>(null);

    const handleBackToDetail = useCallback(() => navigate(`/set/${setId}`), [navigate, setId]);

    useEffect(() => {
        const fetchAllNeededData = async () => {
            if (!setId || (fetchingId.current === setId && mode !== StudyMode.REVIEW)) return;
            fetchingId.current = setId;
            setIsFetching(true);
            
            try {
                // 1. Fetch Flashcard/StudySet Data
                const response = await studySetService.getStudySetById(setId);
                if (response.code === 1000) {
                    const data = response.result;
                    setFullSet({
                        id: data.id.toString(),
                        title: data.title,
                        description: data.description,
                        author: data.author,
                        createdAt: new Date(data.createdAt).getTime(),
                        cards: data.cards.map((c: any) => ({
                            id: c.id.toString(),
                            term: c.term,
                            definition: c.definition,
                            options: c.options || [],
                            explanation: c.explanation || ''
                        })),
                        privacy: data.privacy || 'PUBLIC'
                    });
                }

                // 2. Quiz/Review logic
                if (mode === StudyMode.QUIZ) {
                    // CẬP NHẬT: Load tối đa 30 câu hỏi để tránh quá tải
                    const attempt = await quizService.startQuiz(setId, 30);
                    setQuizAttempt(attempt);
                } else if (mode === StudyMode.REVIEW && attemptId) {
                    // Logic review handled inside QuizView after component mount via initial results fetching
                }

            } catch (e) {
                console.error("Failed to fetch data", e);
                addNotification("Lỗi tải dữ liệu.", "error");
            } finally { setIsFetching(false); }
        };
        fetchAllNeededData();
    }, [setId, mode, attemptId, addNotification]);

    if (isFetching) return <div className="min-h-screen flex items-center justify-center"><ThemeLoader size={48} /></div>;
    if (!fullSet) return <div className="p-8 text-center text-gray-500">Học phần không tồn tại.</div>;

    return (
        <div className="pb-20 animate-fade-in">
            {mode === StudyMode.FLASHCARD && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-30 transition-colors">
                    <div className="max-w-4xl mx-auto px-4 py-2 flex gap-4 overflow-x-auto">
                        <button onClick={() => navigate(`/study/${setId}`)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700"><BookOpen size={18} /> Thẻ ghi nhớ</button>
                        <button onClick={() => navigate(`/quiz/${setId}`)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"><GraduationCap size={18} /> Kiểm tra</button>
                    </div>
                </div>
            )}
            
            {mode === StudyMode.FLASHCARD ? (
                <FlashcardView set={fullSet} onBack={handleBackToDetail} />
            ) : (
                <QuizView 
                    set={fullSet} 
                    allSets={sets}
                    currentUser={user!} 
                    onBack={handleBackToDetail} 
                    onAddReview={onAddReview}
                    serverAttempt={quizAttempt || undefined}
                    reviewAttemptId={mode === StudyMode.REVIEW ? attemptId : undefined}
                />
            )}
        </div>
    );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div key={notif.id} className="pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 p-4 flex items-start gap-3 min-w-[300px] animate-slide-in" style={{ borderColor: notif.type === 'success' ? '#10B981' : notif.type === 'error' ? '#EF4444' : notif.type === 'warning' ? '#F59E0B' : '#3B82F6' }}>
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
