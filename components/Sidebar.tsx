import React, { useState } from 'react';
import { BrainCircuit, LayoutDashboard, PlusCircle, Library, Users, Settings, LogOut, Sparkles, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
    currentView: ViewState;
    currentUser: User | null;
    onChangeView: (view: ViewState) => void;
    onLogout: () => void;
    onStartTour: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, currentUser, onChangeView, onLogout, onStartTour }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'DASHBOARD', label: 'Trang chủ', icon: LayoutDashboard, view: 'DASHBOARD' },
    { id: 'CREATE', label: 'Tạo học phần', icon: PlusCircle, view: 'CREATE' },
    { id: 'LIBRARY', label: 'Thư viện', icon: Library, view: 'LIBRARY' },
    { id: 'CLASSES', label: 'Lớp học', icon: Users, view: 'CLASSES' },
  ];

  // Add specific menu for Teachers
  if (currentUser?.role === 'TEACHER') {
      menuItems.splice(1, 0, { id: 'AI_CREATOR', label: 'Soạn bài AI', icon: Sparkles, view: 'AI_CREATOR' });
  }

  if (!currentUser) return null; // Should not happen in main layout

  return (
    <aside 
      className={`bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-50 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-9 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 rounded-full p-1.5 shadow-md z-50 transition-colors transform hover:scale-110"
        title={isCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div 
        className={`h-20 flex items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
            isCollapsed ? 'justify-center px-2' : 'px-6 gap-3'
        }`}
        onClick={() => onChangeView('DASHBOARD')}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
          <BrainCircuit size={20} />
        </div>
        <span className={`text-xl font-bold text-indigo-900 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        }`}>
            QuizEdu
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && (
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 animate-fade-in">Menu</p>
        )}
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            id={`sidebar-${item.id.toLowerCase()}`}
            onClick={() => onChangeView(item.view as ViewState)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative ${
              currentView === item.view 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

        <div className="mt-8 border-t border-gray-100 pt-4">
            {!isCollapsed && (
                <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 animate-fade-in">Cá nhân</p>
            )}
            
            {/* Tour Button */}
             <button 
                onClick={onStartTour}
                title={isCollapsed ? "Hướng dẫn sử dụng" : ''}
                className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative text-gray-600 hover:bg-gray-50 hover:text-indigo-600 ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
            >
                <HelpCircle size={20} className="shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'
                }`}>
                    Hướng dẫn sử dụng
                </span>
                 {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Hướng dẫn sử dụng
                    </div>
                )}
            </button>

            <button 
                onClick={() => onChangeView('SETTINGS')}
                title={isCollapsed ? "Cài đặt" : ''}
                className={`w-full flex items-center rounded-lg font-medium transition-all duration-200 group relative ${
                  currentView === 'SETTINGS'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'}`}
            >
                <Settings size={20} className="shrink-0" />
                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100 static'
                }`}>
                    Cài đặt
                </span>
                 {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Cài đặt
                    </div>
                )}
            </button>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className={`border-t border-gray-100 bg-white transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div 
            onClick={() => onChangeView('SETTINGS')}
            className={`flex items-center rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-2 ${
                isCollapsed ? 'justify-center p-1' : 'gap-3 p-2'
            }`}
            title={isCollapsed ? currentUser.name : ''}
        >
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
                <img 
                    src={currentUser.avatar || "https://picsum.photos/100/100"} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                />
            </div>
            <div className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">
                    {currentUser.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                </p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            title={isCollapsed ? "Đăng xuất" : ''}
            className={`w-full flex items-center justify-center text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
                isCollapsed ? 'p-3' : 'gap-2 py-2'
            }`}
        >
            <LogOut size={16} /> 
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'
            }`}>
                Đăng xuất
            </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;