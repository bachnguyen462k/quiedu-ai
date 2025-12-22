
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, Moon, Sun, X, GraduationCap, Globe, Loader2, Sparkles, Menu } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { StudySet, AiGenerationRecord } from '../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    sets: StudySet[];
    history: AiGenerationRecord[];
    onSelectSet: (set: StudySet) => void;
    onSelectHistory: (record: AiGenerationRecord) => void;
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sets, history, onSelectSet, onSelectHistory, onToggleSidebar }) => {
  const { theme, toggleTheme, notifications, eventTheme, toggleGlobalEvent, addNotification } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
          setShowSearchResults(false);
          if (window.innerWidth < 768) setIsMobileSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  const handleToggleEvent = async () => {
      if (isUpdatingEvent) return;
      setIsUpdatingEvent(true);
      try {
          await toggleGlobalEvent();
          addNotification("Cập nhật sự kiện hệ thống thành công", "info");
      } catch (e) {
          addNotification("Lỗi cập nhật sự kiện", "error");
      } finally { setIsUpdatingEvent(false); }
  };

  const searchTheme = useMemo(() => {
      switch (eventTheme) {
          case 'CHRISTMAS': return { input: 'border-red-400 focus:ring-red-100', icon: 'text-red-500' };
          case 'TET': return { input: 'border-orange-300 focus:ring-orange-100', icon: 'text-orange-500' };
          case 'AUTUMN': return { input: 'border-amber-400 focus:ring-amber-100', icon: 'text-amber-600' };
          default: return { input: 'border-gray-200 focus:ring-indigo-500', icon: 'text-gray-400' };
      }
  }, [eventTheme]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return { quizzes: [] };
    const lowerQuery = searchQuery.toLowerCase();
    return { 
        quizzes: sets.filter(s => s.title.toLowerCase().includes(lowerQuery) || s.description.toLowerCase().includes(lowerQuery))
    };
  }, [searchQuery, sets]);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 sticky top-0 z-[120] transition-colors shadow-sm">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        
        {/* LEFT: Toggle Sidebar & Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
                onClick={onToggleSidebar}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
            >
                <Menu size={24} />
            </button>

            {/* Desktop Search / Mobile Toggle Button */}
            <div className={`relative flex-1 max-w-md ${isMobileSearchOpen ? 'fixed inset-x-0 top-0 h-16 bg-white dark:bg-gray-800 px-4 flex items-center z-[130]' : 'hidden md:block'}`} ref={searchRef}>
                {isMobileSearchOpen && (
                    <button onClick={() => setIsMobileSearchOpen(false)} className="mr-3 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                )}
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${isMobileSearchOpen ? 'ml-12' : ''}`}>
                    <Search size={18} className={searchTheme.icon} />
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                    onFocus={() => setShowSearchResults(true)}
                    placeholder={t('header.search_placeholder')}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-white focus:ring-2 sm:text-sm transition-all ${searchTheme.input}`}
                />
                
                {showSearchResults && searchQuery && (
                    <div className={`absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in ${isMobileSearchOpen ? 'fixed inset-x-4 top-16 w-auto' : ''}`}>
                        {filteredResults.quizzes.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('header.search_no_result')}</div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
                                {filteredResults.quizzes.slice(0, 10).map(set => (
                                    <button key={set.id} onClick={() => { onSelectSet(set); setShowSearchResults(false); setIsMobileSearchOpen(false); }} className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0"><GraduationCap size={16} /></div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-black text-sm text-gray-900 dark:text-white truncate">{set.title}</div>
                                            <div className="text-[10px] text-gray-400 truncate uppercase tracking-tighter">{set.author}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Search Icon */}
            <button 
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <Search size={24} />
            </button>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button onClick={changeLanguage} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1">
                <Globe size={20} />
                <span className="text-[10px] font-black uppercase hidden xs:block">{i18n.language}</span>
            </button>

            <button 
                onClick={handleToggleEvent}
                className={`p-2 rounded-full transition-colors ${eventTheme !== 'DEFAULT' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                {isUpdatingEvent ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            </button>

            <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <Bell size={20} />
                    {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[200] animate-fade-in origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                            <h3 className="font-bold text-sm dark:text-white">{t('header.notifications')}</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-xs">{t('header.no_notifications')}</div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {notifications.map(notif => (<div key={notif.id} className="p-4 text-xs dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{notif.message}</div>))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
