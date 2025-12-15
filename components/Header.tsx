import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Bell, Moon, Sun, X, FileText, User, GraduationCap, Clock, Trash2, Globe } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { StudySet, AiGenerationRecord } from '../types';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    sets: StudySet[];
    history: AiGenerationRecord[];
    onSelectSet: (set: StudySet) => void;
    onSelectHistory: (record: AiGenerationRecord) => void;
}

const Header: React.FC<HeaderProps> = ({ sets, history, onSelectSet, onSelectHistory }) => {
  const { theme, toggleTheme, notifications, removeNotification } = useApp();
  const { t, i18n } = useTranslation();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  // --- SEARCH LOGIC ---
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return { quizzes: [], teachers: [], files: [] };

    const lowerQuery = searchQuery.toLowerCase();

    // 1. Filter Quizzes (Study Sets)
    const quizzes = sets.filter(s => 
        s.title.toLowerCase().includes(lowerQuery) || 
        s.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    // 2. Filter Teachers (Extract unique authors from sets)
    const uniqueAuthors = Array.from(new Set(sets.map(s => s.author)));
    const teachers = uniqueAuthors
        .filter(author => (author as string).toLowerCase().includes(lowerQuery))
        .map(author => ({ name: author, avatar: `https://ui-avatars.com/api/?name=${author}&background=random` }))
        .slice(0, 3);

    // 3. Filter Files (AI History)
    const files = history.filter(h => 
        (h.fileName as string).toLowerCase().includes(lowerQuery) ||
        (h.result?.subject as unknown as string)?.toLowerCase().includes(lowerQuery)
    ).slice(0, 3);

    return { quizzes, teachers, files };
  }, [searchQuery, sets, history]);

  const hasResults = filteredResults.quizzes.length > 0 || filteredResults.teachers.length > 0 || filteredResults.files.length > 0;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 sticky top-0 z-40 transition-colors">
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* --- LEFT: SEARCH BAR --- */}
        <div className="flex-1 flex items-center max-w-xl gap-4 relative" ref={searchRef}>
            <div className="relative w-full max-w-md hidden md:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    placeholder={t('header.search_placeholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchQuery && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
                        {!hasResults ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                Không tìm thấy kết quả phù hợp.
                            </div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto">
                                {/* Quiz Section */}
                                {filteredResults.quizzes.length > 0 && (
                                    <div className="p-2">
                                        <div className="px-2 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Học phần (Quiz)</div>
                                        {filteredResults.quizzes.map(set => (
                                            <button 
                                                key={set.id}
                                                onClick={() => { onSelectSet(set); setShowSearchResults(false); }}
                                                className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                                    <GraduationCap size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{set.title}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{set.cards.length} thuật ngữ</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Teacher Section */}
                                {filteredResults.teachers.length > 0 && (
                                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                        <div className="px-2 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Giáo viên</div>
                                        {filteredResults.teachers.map((t, idx) => (
                                            <button 
                                                key={idx}
                                                className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                            >
                                                <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full" />
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Files Section */}
                                {filteredResults.files.length > 0 && (
                                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                        <div className="px-2 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tài liệu đã tải lên</div>
                                        {filteredResults.files.map(file => (
                                            <button 
                                                key={file.id}
                                                onClick={() => { onSelectHistory(file); setShowSearchResults(false); }}
                                                className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.fileName}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Clock size={10} /> {new Date(file.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Mobile Search Icon */}
            <button className="md:hidden text-gray-500 dark:text-gray-400">
                <Search size={20} />
            </button>
        </div>

        {/* --- RIGHT: ACTIONS --- */}
        <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Language Switcher */}
            <button
                onClick={changeLanguage}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                title={t('common.language')}
            >
                <Globe size={20} />
                <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 rounded-full transition-colors relative ${
                        showNotifications 
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></span>
                    )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{t('header.notifications')}</h3>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={() => notifications.forEach(n => removeNotification(n.id))}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> {t('header.clear_all')}
                                </button>
                            )}
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('header.no_notifications')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {notifications.map(notif => (
                                        <div key={notif.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 relative group">
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                                notif.type === 'success' ? 'bg-green-500' : 
                                                notif.type === 'error' ? 'bg-red-500' : 
                                                notif.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">Vừa xong</p>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Dark Mode Toggle */}
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}
            >
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
            
             <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;