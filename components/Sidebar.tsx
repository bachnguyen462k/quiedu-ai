
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Library, Users, Settings, LogOut, ChevronLeft, ChevronRight, HelpCircle, Palette, X, Calendar as CalendarIcon } from 'lucide-react';
import { User, UserRole } from '../types';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';

interface SidebarProps {
    currentPath: string;
    currentUser: User | null;
    onLogout: () => void;
    onStartTour: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    allowedRoles: UserRole[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, currentUser, onLogout, onStartTour, isOpen = false, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024) {
            setIsCollapsed(false);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
        case 'ADMIN': return t('common.role_admin');
        case 'TEACHER': return t('common.role_teacher');
        case 'USER': return t('common.role_user');
        default: return role;
    }
  };

  const menuItems: MenuItem[] = [
    { id: 'DASHBOARD', label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/dashboard', allowedRoles: ['TEACHER', 'USER', 'ADMIN'] },
    { id: 'SCHEDULE', label: t('sidebar.schedule'), icon: CalendarIcon, path: '/schedule', allowedRoles: ['TEACHER', 'USER', 'ADMIN'] },
    { id: 'CREATE', label: t('sidebar.create'), icon: PlusCircle, path: '/create', allowedRoles: ['TEACHER', 'USER', 'ADMIN'] },
    { id: 'LIBRARY', label: t('sidebar.library'), icon: Library, path: '/library', allowedRoles: ['TEACHER', 'USER', 'ADMIN'] },
    { id: 'CLASSES', label: t('sidebar.classes'), icon: Users, path: '/classes', allowedRoles: ['TEACHER', 'USER', 'ADMIN'] },
    { id: 'ADMIN_THEME', label: "Sự kiện", icon: Palette, path: '/admin/theme', allowedRoles: ['ADMIN'] },
  ];

  if (!currentUser) return null;

  const filteredMenuItems = menuItems.filter(item => 
      item.allowedRoles.some(role => currentUser.roles.includes(role))
  );

  const isActive = (path: string) => location.pathname === path;

  // Sidebar CSS Classes for responsive drawer
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[150] transition-transform duration-300 lg:static lg:translate-x-0
    bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen
    ${isOpen ? 'translate-x-0 w-[280px] sm:w-[320px]' : '-translate-x-full lg:translate-x-0'}
    ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
  `;

  return (
    <>
      {/* Mobile Overlay with Blur Effect */}
      <div 
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[140] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
          onClick={onClose}
      ></div>

      <aside className={sidebarClasses}>
        {/* Desktop Collapse Button */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="hidden lg:flex absolute -right-3 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 rounded-full p-1.5 shadow-md z-50 transition-colors transform hover:scale-110"
        >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 shrink-0 transition-colors">
            <Link to="/dashboard" onClick={onClose} className={`flex items-center ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
                <BrandLogo size="sm" showText={!isCollapsed} />
            </Link>
            {/* Mobile Close Button */}
            <button onClick={onClose} className="lg:hidden text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            {!isCollapsed && <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4">{t('sidebar.menu')}</p>}
            
            {filteredMenuItems.map((item) => (
                <Link 
                    key={item.id} 
                    id={`sidebar-${item.id.toLowerCase()}`}
                    to={item.path} 
                    onClick={onClose}
                    className={`w-full flex items-center rounded-2xl font-bold transition-all duration-200 group relative ${
                        isActive(item.path) 
                        ? 'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900'
                    } ${isCollapsed ? 'lg:justify-center py-3' : 'gap-4 px-4 py-3.5'}`}
                >
                    <item.icon size={22} className="shrink-0" />
                    <span className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'lg:hidden' : 'opacity-100'}`}>{item.label}</span>
                </Link>
            ))}

            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                {!isCollapsed && <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4">{t('sidebar.personal')}</p>}
                <button 
                    id="sidebar-help"
                    onClick={() => { onStartTour(); onClose?.(); }} 
                    className={`w-full flex items-center rounded-2xl font-bold transition-all duration-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 ${isCollapsed ? 'lg:justify-center py-3' : 'gap-4 px-4 py-3.5'}`}
                >
                    <HelpCircle size={22} /><span className={isCollapsed ? 'lg:hidden' : ''}>{t('sidebar.help')}</span>
                </button>
                <Link to="/settings" onClick={onClose} className={`w-full flex items-center rounded-2xl font-bold transition-all duration-200 ${isActive('/settings') ? 'text-brand-blue' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/50'} ${isCollapsed ? 'lg:justify-center py-3' : 'gap-4 px-4 py-3.5'}`}>
                    <Settings size={22} /><span className={isCollapsed ? 'lg:hidden' : ''}>{t('sidebar.settings')}</span>
                </Link>
            </div>
        </div>

        {/* Footer User Info */}
        <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 transition-colors">
            <div className={`flex items-center mb-6 ${isCollapsed ? 'lg:justify-center' : 'px-2 gap-4'}`}>
                <div className="w-10 h-10 shrink-0 rounded-full border-2 border-indigo-100 overflow-hidden bg-gray-50 shadow-sm">
                    <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`} alt="User" className="w-full h-full object-cover" />
                </div>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{getRoleLabel(currentUser.roles[0])}</p>
                    </div>
                )}
            </div>
            <button onClick={onLogout} className={`w-full flex items-center justify-center text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors py-4 ${isCollapsed ? 'lg:px-0' : 'gap-3'}`}>
                <LogOut size={18} />
                <span className={isCollapsed ? 'lg:hidden' : ''}>{t('sidebar.logout')}</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
