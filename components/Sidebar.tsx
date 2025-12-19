
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Library, Users, Settings, LogOut, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { User, UserRole } from '../types';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';

interface SidebarProps {
    currentPath: string;
    currentUser: User | null;
    onLogout: () => void;
    onStartTour: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    allowedRoles: UserRole[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, currentUser, onLogout, onStartTour }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
        setIsCollapsed(true);
    }
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'DASHBOARD', label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/dashboard', allowedRoles: ['TEACHER', 'STUDENT'] },
    { id: 'CREATE', label: t('sidebar.create'), icon: PlusCircle, path: '/create', allowedRoles: ['TEACHER', 'STUDENT'] },
    { id: 'LIBRARY', label: t('sidebar.library'), icon: Library, path: '/library', allowedRoles: ['TEACHER', 'STUDENT'] },
    { id: 'CLASSES', label: t('sidebar.classes'), icon: Users, path: '/classes', allowedRoles: ['TEACHER', 'STUDENT'] },
  ];

  if (!currentUser) return null;

  const filteredMenuItems = menuItems.filter(item => 
      item.allowedRoles.some(role => currentUser.roles.includes(role))
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 rounded-full p-1.5 shadow-md z-50 transition-colors transform hover:scale-110">
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <Link to="/dashboard" className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
        <BrandLogo size="sm" showText={!isCollapsed} />
      </Link>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4">{t('sidebar.menu')}</p>}
        
        {filteredMenuItems.map((item) => (
          <Link 
            key={item.id} 
            to={item.path} 
            id={`sidebar-${item.id.toLowerCase()}`} 
            title={isCollapsed ? item.label : ''} 
            className={`w-full flex items-center rounded-xl font-bold transition-all duration-200 group relative ${
                isActive(item.path) 
                ? 'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
            } ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
          >
            <item.icon size={20} className="shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'}`}>{item.label}</span>
            {isActive(item.path) && !isCollapsed && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-blue-400"></div>
            )}
          </Link>
        ))}

        <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
            {!isCollapsed && <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4">{t('sidebar.personal')}</p>}
            <button onClick={onStartTour} className={`w-full flex items-center rounded-xl font-bold transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-brand-blue dark:hover:text-blue-400 ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}>
                <HelpCircle size={20} className="shrink-0" /><span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'}`}>{t('sidebar.help')}</span>
            </button>
            <Link to="/settings" className={`w-full flex items-center rounded-xl font-bold transition-all duration-200 ${isActive('/settings') ? 'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'} ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}>
                <Settings size={20} className="shrink-0" /><span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'}`}>{t('sidebar.settings')}</span>
            </Link>
        </div>
      </div>

      <div className={`border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <button onClick={onLogout} className={`w-full flex items-center justify-center text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors ${isCollapsed ? 'p-3' : 'gap-2 py-3'}`}>
            <LogOut size={16} /><span className={isCollapsed ? 'hidden' : 'block'}>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
