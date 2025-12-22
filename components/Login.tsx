
import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { ArrowRight, Mail, Lock, User as UserIcon, Globe, ChevronLeft, ShieldCheck, TriangleAlert, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';
import ThemeLoader from './ThemeLoader';

interface LoginProps {
  onBack: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type ForgotStep = 'EMAIL' | 'OTP' | 'NEW_PASSWORD';

declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC<LoginProps> = ({ onBack, initialMode = 'LOGIN' }) => {
  const { login, register, loginWithGoogle, requestPasswordReset, verifyResetCode, confirmPasswordReset } = useAuth();
  const { addNotification, theme } = useApp();
  const { t, i18n } = useTranslation();
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [clientConfigError, setClientConfigError] = useState(false);

  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const selectedRoleRef = useRef<UserRole>('USER');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  useEffect(() => {
    // Sử dụng cơ chế check an toàn cho process.env
    const clientId = (process.env as any).GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "undefined") {
      setClientConfigError(true);
      return;
    }

    const handleGoogleCallback = async (response: any) => {
        setIsGoogleSubmitting(true);
        try {
            await loginWithGoogle(response.credential, selectedRoleRef.current);
            addNotification(t('login.success_login'), 'success');
        } catch (error: any) {
            addNotification(error.message || t('login.error_google'), 'error');
        } finally {
            setIsGoogleSubmitting(false);
        }
    };

    const initGsi = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCallback,
                auto_select: false,
            });

            if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: theme === 'dark' ? 'filled_blue' : 'outline',
                    size: 'large',
                    width: googleButtonRef.current.offsetWidth || 300,
                    text: authMode === 'REGISTER' ? 'signup_with' : 'signin_with',
                    shape: 'pill'
                });
            }
        } else {
            setTimeout(initGsi, 500); 
        }
    };

    if (authMode !== 'FORGOT_PASSWORD') initGsi();
  }, [theme, authMode, loginWithGoogle, addNotification, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await login({ email, password });
        addNotification(t('login.success_login'), 'success');
    } catch (error: any) {
        addNotification(t('login.error_login'), 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (password !== confirmPassword) {
          addNotification(t('login.error_password_mismatch'), 'warning');
          return;
      }
      setIsLoading(true);
      try {
          await register({ email, password, name: fullName, role: selectedRole });
          addNotification(t('login.success_register'), 'success');
      } catch (error: any) {
          addNotification(t('login.error_register'), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          if (forgotStep === 'EMAIL') {
              await requestPasswordReset(email);
              setForgotStep('OTP');
          } else if (forgotStep === 'OTP') {
              await verifyResetCode(email, otpCode);
              setForgotStep('NEW_PASSWORD');
          } else {
              await confirmPasswordReset(email, newPassword);
              setAuthMode('LOGIN');
              addNotification(t('login.success_reset'), 'success');
          }
      } catch (error: any) {
          addNotification(error.toString(), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const RoleSelector = () => (
    <div className="flex gap-3 mb-6">
        <button type="button" onClick={() => setSelectedRole('USER')} className={`flex-1 py-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest ${selectedRole === 'USER' ? 'border-brand-blue bg-blue-50 text-brand-blue dark:bg-blue-900/20' : 'border-gray-100 text-gray-400 dark:border-gray-700'}`}>
            <ShieldCheck size={20} /> Học sinh
        </button>
        <button type="button" onClick={() => setSelectedRole('TEACHER')} className={`flex-1 py-3.5 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-widest ${selectedRole === 'TEACHER' ? 'border-brand-orange bg-orange-50 text-brand-orange dark:bg-orange-900/20' : 'border-gray-100 text-gray-400 dark:border-gray-700'}`}>
            <UserIcon size={20} /> Giáo viên
        </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-0 sm:p-4 transition-colors overflow-x-hidden">
      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-screen sm:min-h-[600px]">
        
        {/* Left Panel - Hidden on small mobile or reduced */}
        <div className="md:w-5/12 bg-brand-blue p-8 md:p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
           <div className="relative z-10">
              <BrandLogo size="sm" className="mb-6 md:mb-12 bg-white/10 p-4 rounded-[24px] backdrop-blur-md inline-flex border border-white/20" showText={false} />
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6 leading-tight">
                  {authMode === 'LOGIN' ? "Chào mừng trở lại!" : authMode === 'REGISTER' ? "Bắt đầu hành trình." : "Khôi phục tài khoản."}
              </h2>
              <p className="text-indigo-100 text-base md:text-lg font-medium leading-relaxed max-w-xs opacity-90">Hỏi trước - Nhớ lâu - Hiểu sâu cùng BrainQnA.</p>
           </div>
           <div className="relative z-10 hidden md:flex items-center gap-4 text-indigo-200 mt-12">
               <div className="flex -space-x-3">
                   {[1,2,3].map(i => <img key={i} className="w-10 h-10 rounded-full border-2 border-brand-blue" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="u"/>)}
               </div>
               <span className="text-xs font-black uppercase tracking-widest">10,000+ Students</span>
           </div>
           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Right Panel (Form) */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-gray-855 transition-colors">
            {authMode === 'LOGIN' ? (
                <div className="animate-fade-in">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Đăng nhập</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Truy cập vào kho tàng kiến thức của bạn.</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email tài khoản..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        </div>
                        <div className="text-right">
                            <button type="button" onClick={() => setAuthMode('FORGOT_PASSWORD')} className="text-sm font-bold text-brand-blue hover:underline">Quên mật khẩu?</button>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-blue/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Đăng nhập ngay <ArrowRight size={22} /></>}
                        </button>
                    </form>
                </div>
            ) : authMode === 'REGISTER' ? (
                <div className="animate-fade-in">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Đăng ký</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Tham gia cộng đồng học tập thông minh.</p>
                    <RoleSelector />
                    <form onSubmit={handleRegister} className="space-y-3">
                        <input type="text" required value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Họ và tên..." className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email liên hệ..." className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu..." className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                            <input type="password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Xác nhận..." className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-blue/20 mt-4 active:scale-95 transition-all">
                            {isLoading ? <Loader2 size={24} className="animate-spin mx-auto" /> : "Tạo tài khoản miễn phí"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Quên mật khẩu</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Lấy lại mật khẩu qua email của bạn.</p>
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                        {forgotStep === 'EMAIL' && (
                            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Nhập email của bạn..." className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        )}
                        {forgotStep === 'OTP' && (
                            <input type="text" required value={otpCode} onChange={e=>setOtpCode(e.target.value)} placeholder="Mã OTP 6 số..." className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold text-center tracking-[1em]" maxLength={6} />
                        )}
                        {forgotStep === 'NEW_PASSWORD' && (
                            <input type="password" required value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Mật khẩu mới..." className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-transparent focus:bg-white focus:ring-4 focus:ring-brand-blue/10 outline-none font-bold transition-all" />
                        )}
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-blue/20 transition-all flex items-center justify-center gap-3">
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : forgotStep === 'EMAIL' ? "Gửi mã xác thực" : forgotStep === 'OTP' ? "Xác nhận OTP" : "Đổi mật khẩu"}
                        </button>
                        <button type="button" onClick={() => { setAuthMode('LOGIN'); setForgotStep('EMAIL'); }} className="w-full text-center text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Quay lại đăng nhập</button>
                    </form>
                </div>
            )}

            {authMode !== 'FORGOT_PASSWORD' && (
                <div className="mt-8 text-center space-y-4">
                    <div className="flex items-center gap-4 text-gray-300 dark:text-gray-600"><div className="flex-1 h-px bg-current"></div><span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Tiếp tục với</span><div className="flex-1 h-px bg-current"></div></div>
                    <div ref={googleButtonRef} className="w-full flex justify-center min-h-[50px]"></div>
                    
                    <p className="text-sm font-bold text-gray-500">
                        {authMode === 'LOGIN' ? "Chưa có tài khoản?" : "Đã có tài khoản?"} 
                        <button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-brand-blue hover:underline ml-1">
                            {authMode === 'LOGIN' ? "Đăng ký ngay" : "Đăng nhập ngay"}
                        </button>
                    </p>
                </div>
            )}
            
            <button onClick={onBack} className="mt-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto transition-colors">
                <ChevronLeft size={16} /> Quay lại trang chủ
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
