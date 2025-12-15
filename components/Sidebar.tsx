import React, { useState, useEffect } from 'react';
import { BrainCircuit, LayoutDashboard, PlusCircle, Library, Users, Settings, LogOut, ChevronLeft, ChevronRight, HelpCircle, Shield } from 'lucide-react';
import { ViewState, User, UserRole } from '../types';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
    currentView: ViewState;
    currentUser: User | null;
    onChangeView: (view: ViewState) => void;
    onLogout: () => void;
    onStartTour: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    view: ViewState;
    allowedRoles: UserRole[]; // Roles that can see this menu
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, currentUser, onChangeView, onLogout, onStartTour }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();

  // Tự động thu gọn sidebar trên thiết bị di động/tablet khi tải trang
  useEffect(() => {
    if (window.innerWidth < 1024) {
        setIsCollapsed(true);
    }
  }, []);

  const menuItems: MenuItem[] = [
    { 
        id: 'DASHBOARD', 
        label: t('sidebar.dashboard'), 
        icon: LayoutDashboard, 
        view: 'DASHBOARD',
        allowedRoles: ['TEACHER', 'STUDENT'] 
    },
    { 
        id: 'CREATE', 
        label: t('sidebar.create'), 
        icon: PlusCircle, 
        view: 'CREATE',
        allowedRoles: ['TEACHER', 'STUDENT']
    },
    { 
        id: 'LIBRARY', 
        label: t('sidebar.library'), 
        icon: Library, 
        view: 'LIBRARY',
        allowedRoles: ['TEACHER', 'STUDENT'] 
    },
    { 
        id: 'CLASSES', 
        label: t('sidebar.classes'), 
        icon: Users, 
        view: 'CLASSES',
        allowedRoles: ['TEACHER', 'STUDENT'] 
    },
  ];

  if (!currentUser) return null; // Should not happen in main layout

  // Filter menu items based on user roles
  const filteredMenuItems = menuItems.filter(item => 
      item.allowedRoles.some(role => currentUser.roles.includes(role))
  );

  return (
    <aside 
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full p-1.5 shadow-md z-50 transition-colors transform hover:scale-110"
        title={isCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div 
        className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            isCollapsed ? 'justify-center px-2' : 'px-6 gap-3'
        }`}
        onClick={() => onChangeView('DASHBOARD')}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
          <BrainCircuit size={20} />
        </div>
        <span className={`text-xl font-bold text-indigo-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        }`}>
            QuizEdu
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && (
            <p className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 animate-fade-in">{t('sidebar.menu')}</p>
        )}
        
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            id={`sidebar-${item.id.toLowerCase()}`}
            onClick={() => onChangeView(item.view as ViewState)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative ${
              currentView === item.view 
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            } ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
          >
            <item.icon size={20} className={`shrink-0 transition-transform ${isCollapsed && currentView === item.view ? 'scale-110' : ''}`} />
            
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'
            }`}>
                {item.label}
            </span>
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                </div>
            )}
          </button>
        ))}

        <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-4">
            {!isCollapsed && (
                <p className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 animate-fade-in">{t('sidebar.personal')}</p>
            )}
            
            {/* Tour Button */}
             <button 
                onClick={onStartTour}
                title={isCollapsed ? t('sidebar.help') : ''}
                className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
            >
                <HelpCircle size={20} className="shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'
                }`}>
                    {t('sidebar.help')}
                </span>
                 {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {t('sidebar.help')}
                    </div>
                )}
            </button>

            {/* Terms & Policies Button */}
            <button 
                title={isCollapsed ? t('sidebar.terms') : ''}
                className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
            >
                <Shield size={20} className="shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'
                }`}>
                    {t('sidebar.terms')}
                </span>
                 {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {t('sidebar.terms')}
                    </div>
                )}
            </button>

            <button 
                onClick={() => onChangeView('SETTINGS')}
                title={isCollapsed ? t('sidebar.settings') : ''}
                className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative ${
                  currentView === 'SETTINGS'
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                } ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
            >
                <Settings size={20} className="shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'
                }`}>
                    {t('sidebar.settings')}
                </span>
                 {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {t('sidebar.settings')}
                    </div>
                )}
            </button>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className={`border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div 
            onClick={() => onChangeView('SETTINGS')}
            className={`flex items-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer mb-2 ${
                isCollapsed ? 'justify-center p-1' : 'gap-3 p-2'
            }`}
            title={isCollapsed ? currentUser.name : ''}
        >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden border border-gray-300 dark:border-gray-500 shrink-0">
                <img 
                    src={currentUser.avatar || "https://picsum.photos/100/100"} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser.roles.map(r => r === 'TEACHER' ? t('common.role_teacher') : t('common.role_student')).join(', ')}
                </p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            title={isCollapsed ? t('sidebar.logout') : ''}
            className={`w-full flex items-center justify-center text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${
                isCollapsed ? 'p-3' : 'gap-2 py-2'
            }`}
        >
            <LogOut size={16} /> 
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
            }`}>
                {t('sidebar.logout')}
            </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;