import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Camera, Save, Shield, CheckCircle, Lock, Key, AlertCircle, Moon, Sun } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';

interface SettingsViewProps {
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdateUser }) => {
  const { theme, toggleTheme } = useApp();
  const { t } = useTranslation();

  // Profile State
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [profileMessage, setProfileMessage] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Update local state if prop changes
  useEffect(() => {
    setName(currentUser.name);
    setEmail(currentUser.email);
    setAvatar(currentUser.avatar || '');
  }, [currentUser]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      alert(t('notifications.enter_name_email'));
      return;
    }

    onUpdateUser({
      ...currentUser,
      name,
      email,
      avatar
    });

    setProfileMessage(t('notifications.profile_updated'));
    setTimeout(() => setProfileMessage(''), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Basic Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordMessage({ type: 'error', text: t('notifications.fill_all_fields') });
        return;
    }

    if (newPassword.length < 6) {
        setPasswordMessage({ type: 'error', text: t('notifications.pass_min_length') });
        return;
    }

    if (newPassword !== confirmPassword) {
        setPasswordMessage({ type: 'error', text: t('notifications.pass_mismatch') });
        return;
    }

    if (currentPassword === newPassword) {
        setPasswordMessage({ type: 'error', text: t('notifications.pass_same') });
        return;
    }

    // Simulate API call success
    setTimeout(() => {
        setPasswordMessage({ type: 'success', text: t('notifications.pass_changed') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }, 800);
  };

  const handleRandomAvatar = () => {
    const randomColor = Math.floor(Math.random()*16777215).toString(16);
    const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff&size=128`;
    setAvatar(newAvatar);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-20 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Cài đặt tài khoản</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Theme */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors">
            <div className="relative inline-block mb-4 group cursor-pointer">
               <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 dark:border-indigo-900 mx-auto">
                 <img 
                    src={avatar || "https://picsum.photos/200"} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                 />
               </div>
               <div 
                onClick={handleRandomAvatar}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <Camera className="text-white" size={24} />
               </div>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{currentUser.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</p>
            
            <button 
                onClick={handleRandomAvatar}
                className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline"
            >
                Tạo avatar ngẫu nhiên
            </button>
          </div>

          {/* Theme Toggle Widget */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
             <h4 className="font-bold text-gray-900 dark:text-white mb-4">Giao diện</h4>
             <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
             >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-yellow-400 text-white'}`}>
                        {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {theme === 'dark' ? 'Chế độ tối (Dark)' : 'Chế độ sáng (Light)'}
                    </span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                </div>
             </button>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
            
            {/* 1. Personal Information Form */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 flex items-center gap-2">
                    <UserIcon size={20} className="text-indigo-600 dark:text-indigo-400" /> Thông tin cá nhân
                </h3>
                
                {profileMessage && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800 animate-fade-in text-sm font-medium">
                        <CheckCircle size={18} /> {profileMessage}
                    </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Họ và tên</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Nhập tên hiển thị"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Địa chỉ Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Nhập email"
                            />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Đường dẫn Avatar (URL)</label>
                         <input 
                                type="text" 
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm text-gray-600 dark:text-gray-400"
                                placeholder="https://..."
                            />
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vai trò (Không thể thay đổi)</label>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                            <Shield size={18} />
                            <span className="font-medium">{currentUser.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button 
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                        >
                            <Save size={18} /> Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>

            {/* 2. Change Password Form */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4 flex items-center gap-2">
                    <Lock size={20} className="text-indigo-600 dark:text-indigo-400" /> Đổi mật khẩu
                </h3>

                {passwordMessage && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 border animate-fade-in text-sm font-medium ${
                        passwordMessage.type === 'success' 
                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                    }`}>
                        {passwordMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {passwordMessage.text}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu hiện tại</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu mới</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nhập lại mật khẩu mới</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            * Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số để tăng cường bảo mật.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <button 
                            type="submit"
                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
                        >
                            Cập nhật mật khẩu
                        </button>
                    </div>
                </form>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;