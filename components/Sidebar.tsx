import React from 'react';
import { BrainCircuit, LayoutDashboard, PlusCircle, Library, Users, Settings, LogOut, Sparkles } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
    currentView: ViewState;
    currentUser: User | null;
    onChangeView: (view: ViewState) => void;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, currentUser, onChangeView, onLogout }) => {
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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 z-50">
      {/* Logo Area */}
      <div 
        className="h-20 flex items-center gap-3 px-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onChangeView('DASHBOARD')}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
          <BrainCircuit size={20} />
        </div>
        <span className="text-xl font-bold text-indigo-900 tracking-tight">QuizEdu</span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.view as ViewState)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentView === item.view 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm translate-x-1' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}

        <div className="mt-8">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cá nhân</p>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Settings size={20} /> Cài đặt
            </button>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <img 
                    src={currentUser.avatar || "https://picsum.photos/100/100"} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">
                    {currentUser.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                </p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors"
        >
            <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;