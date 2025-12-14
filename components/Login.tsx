import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { BrainCircuit, GraduationCap, School, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');

  const handleLogin = () => {
    // Mock Login Data
    const mockUser: User = selectedRole === 'TEACHER' 
      ? {
          id: 't1',
          name: 'Cô Thu Lan',
          email: 'lan.gv@schools.edu',
          role: 'TEACHER',
          avatar: 'https://ui-avatars.com/api/?name=Thu+Lan&background=6366f1&color=fff'
        }
      : {
          id: 's1',
          name: 'Nguyễn Văn Nam',
          email: 'nam.hs@schools.edu',
          role: 'STUDENT',
          avatar: 'https://ui-avatars.com/api/?name=Van+Nam&background=10b981&color=fff'
        };
    
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Branding */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600">
                  <BrainCircuit size={24} />
                </div>
                <span className="text-2xl font-bold tracking-tight">QuizEdu</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Chào mừng trở lại!</h2>
              <p className="text-indigo-100 text-lg">Nền tảng học tập và kiểm tra trực tuyến thông minh dành cho nhà trường.</p>
           </div>
           
           <div className="relative z-10 mt-12">
             <div className="flex -space-x-4 mb-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-400"></div>
                ))}
             </div>
             <p className="text-sm text-indigo-200">Được tin dùng bởi hơn 500+ giáo viên.</p>
           </div>

           {/* Decor circle */}
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
           <div className="absolute top-12 -left-12 w-48 h-48 bg-purple-500 rounded-full opacity-30 blur-2xl"></div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h3>
            <p className="text-gray-500 mb-8">Chọn vai trò của bạn để tiếp tục</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                    onClick={() => setSelectedRole('STUDENT')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                        selectedRole === 'STUDENT' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 hover:border-indigo-200 text-gray-500'
                    }`}
                >
                    <GraduationCap size={32} />
                    <span className="font-bold">Học sinh</span>
                </button>
                <button 
                    onClick={() => setSelectedRole('TEACHER')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                        selectedRole === 'TEACHER' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 hover:border-indigo-200 text-gray-500'
                    }`}
                >
                    <School size={32} />
                    <span className="font-bold">Giáo viên</span>
                </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email / Tên đăng nhập</label>
                    <input 
                        type="email" 
                        defaultValue={selectedRole === 'TEACHER' ? 'lan.gv@schools.edu' : 'nam.hs@schools.edu'}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                    <input 
                        type="password" 
                        defaultValue="password123"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                    Đăng nhập ngay <ArrowRight size={18} />
                </button>
            </form>

            <button onClick={onBack} className="mt-6 text-center text-sm text-gray-500 hover:text-indigo-600">
                Quay lại trang chủ
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;