
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, Moon, Sun, X, FileText, GraduationCap, Clock, Trash2, Globe, Loader2, Sparkles, Menu } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { StudySet, AiGenerationRecord, EventTheme } from '../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    sets: StudySet[];
    history: AiGenerationRecord[];
    onSelectSet: (set: StudySet) => void;
    onSelectHistory: (record: AiGenerationRecord) => void;
    onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sets, history, onSelectSet, onSelectHistory, onToggleSidebar }) => {
  const { theme, toggleTheme, notifications, removeNotification, eventTheme, toggleGlobalEvent, addNotification } = useApp();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [visibleNotifLimit, setVisibleNotifLimit] = useState(10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSearchResults(false);
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
    const quizzes = sets.filter(s => s.title.toLowerCase().includes(lowerQuery) || s.description.toLowerCase().includes(lowerQuery));
    return { quizzes };
  }, [searchQuery, sets]);

  const hasResults = filteredResults.quizzes.length > 0;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 sticky top-0 z-[120] transition-colors">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        
        {/* LEFT: Toggle Sidebar & Mobile Search Icon */}
        <div className="flex items-center gap-3">
            <button 
                onClick={onToggleSidebar}
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <Menu size={24} />
            </button>
            <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                        {!hasResults ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">{t('header.search_no_result')}</div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
                                <div className="px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('header.search_quizzes')}</div>
                                {filteredResults.quizzes.slice(0, visibleLimit).map(set => (
                                    <button key={set.id} onClick={() => { onSelectSet(set); setShowSearchResults(false); }} className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0"><GraduationCap size={16} /></div>
                                        <div className="min-w-0 font-medium text-sm text-gray-900 dark:text-white truncate">{set.title}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-4">
            <button onClick={changeLanguage} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1" title={t('common.language')}><Globe size={20} /><span className="text-[10px] font-black uppercase hidden xs:block">{i18n.language}</span></button>

            <button 
                onClick={handleToggleEvent}
                disabled={isUpdatingEvent}
                className={`p-2 rounded-full transition-colors ${eventTheme !== 'DEFAULT' ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Bật/Tắt sự kiện toàn trang"
            >
                {isUpdatingEvent ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            </button>

            <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}><Bell size={20} />{notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white rounded-full animate-pulse"></span>}</button>
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-72 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[200] animate-fade-in origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center"><h3 className="font-bold text-sm dark:text-white">{t('header.notifications')}</h3></div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? <div className="p-8 text-center text-gray-400 text-xs">{t('header.no_notifications')}</div> : <div className="divide-y divide-gray-100 dark:divide-gray-700">{notifications.slice(0, visibleNotifLimit).map(notif => (<div key={notif.id} className="p-3 text-xs dark:text-gray-200">{notif.message}</div>))}</div>}
                        </div>
                    </div>
                )}
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
