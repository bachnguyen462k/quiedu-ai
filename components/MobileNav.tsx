
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Library, Users, Settings, LogOut, Palette } from 'lucide-react';
import { User, UserRole } from '../types';
import { useTranslation } from 'react-i18next';

interface MobileNavProps {
    currentUser: User | null;
    onLogout: () => void;
}

interface MobileMenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    allowedRoles: UserRole[];
}

const MobileNav: React.FC<MobileNavProps> = ({ currentUser, onLogout }) => {
    const { t } = useTranslation();
    const location = useLocation();
    
    if (!currentUser) return null;

    const isActive = (path: string) => location.pathname === path;

    const menuItems: MobileMenuItem[] = [
        { id: 'DASHBOARD', label: t('sidebar.dashboard'), icon: LayoutDashboard, path: '/dashboard', allowedRoles: ['USER', 'TEACHER', 'ADMIN'] },
        { id: 'CREATE', label: 'Tạo', icon: PlusCircle, path: '/create', allowedRoles: ['USER', 'TEACHER', 'ADMIN'] },
        { id: 'LIBRARY', label: t('sidebar.library'), icon: Library, path: '/library', allowedRoles: ['USER', 'TEACHER', 'ADMIN'] },
        { id: 'CLASSES', label: 'Lớp', icon: Users, path: '/classes', allowedRoles: ['USER', 'TEACHER', 'ADMIN'] },
        { id: 'ADMIN_THEME', label: "Sự kiện", icon: Palette, path: '/admin/theme', allowedRoles: ['ADMIN'] },
        { id: 'SETTINGS', label: 'Cài đặt', icon: Settings, path: '/settings', allowedRoles: ['USER', 'TEACHER', 'ADMIN'] },
    ];

    const filteredMenuItems = menuItems.filter(item => 
        item.allowedRoles.some(role => currentUser.roles.includes(role))
    );

    return (
        <nav className="lg:hidden sticky top-16 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 py-2">
                {filteredMenuItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-xs font-black transition-all duration-300 ${
                            isActive(item.path)
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                    </Link>
                ))}
                
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-2 shrink-0" />
                
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                    <LogOut size={16} />
                    <span>{t('sidebar.logout')}</span>
                </button>
            </div>
        </nav>
    );
};

export default MobileNav;
