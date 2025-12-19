
import React, { useState } from 'react';
import { UserRole } from '../types';
import { GraduationCap, School, ArrowRight, Loader2, Mail, Lock, User, KeyRound, Globe, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';

interface LoginProps {
  onBack: () => void;
  initialMode?: 'LOGIN' | 'REGISTER';
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type ForgotStep = 'EMAIL' | 'OTP' | 'NEW_PASSWORD';

const Login: React.FC<LoginProps> = ({ onBack, initialMode = 'LOGIN' }) => {
  const { login, register, loginWithGoogle, requestPasswordReset, verifyResetCode, confirmPasswordReset } = useAuth();
  const { addNotification } = useApp();
  const { t, i18n } = useTranslation();
  
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await login({ email, password });
        addNotification(t('login.success_login'), 'success');
    } catch (error) {
        addNotification(typeof error === 'string' ? error : t('login.error_login'), 'error');
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
      } catch (error) {
          addNotification(t('login.error_register'), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
      setIsGoogleSubmitting(true);
      try {
          await loginWithGoogle();
          addNotification(t('login.success_google'), 'success');
      } catch (error) {
          addNotification(t('login.error_google'), 'error');
      } finally {
          setIsGoogleSubmitting(false);
      }
  };

  const renderLogin = () => (
      <>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('login.login_title')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('login.welcome_back')}</p>
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"/>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('login.password_label')}</label>
                    <button type="button" onClick={() => { setAuthMode('FORGOT_PASSWORD'); setForgotStep('EMAIL'); }} className="text-xs font-bold text-brand-blue hover:text-indigo-500 dark:text-indigo-400">{t('login.forgot_link')}</button>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"/>
                </div>
            </div>
            <button type="submit" disabled={isLoading || isGoogleSubmitting} className="w-full bg-brand-blue text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{t('login.btn_login')} <ArrowRight size={18} /></>}
            </button>
        </form>
      </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors relative">
      <div className="absolute top-4 right-4 z-50">
        <button onClick={changeLanguage} className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1">
            <Globe size={20} />
            <span className="text-xs font-bold uppercase">{i18n.language}</span>
        </button>
      </div>

      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-colors">
        <div className="md:w-1/2 bg-brand-blue p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="mb-12">
                <BrandLogo size="lg" className="text-white bg-white/10 p-4 rounded-2xl backdrop-blur-sm inline-flex" />
              </div>
              <h2 className="text-4xl font-black mb-4">
                  {authMode === 'LOGIN' ? t('login.welcome_back') : authMode === 'REGISTER' ? t('login.welcome_join') : t('login.forgot_title')}
              </h2>
              <p className="text-indigo-100 text-lg">
                  Hỏi trước - Nhớ lâu - Hiểu sâu. Đồng hành cùng bạn trên con đường kiến thức.
              </p>
           </div>
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-brand-orange/20 rounded-full blur-3xl"></div>
        </div>

        <div className="md:w-1/2 p-12 flex flex-col justify-center">
            {authMode === 'LOGIN' && renderLogin()}
            {/* ... register and forgot password renders ... */}
            
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('common.or_continue')}</span></div>
            </div>

            <button type="button" onClick={handleGoogleLogin} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                <span>Google</span>
            </button>

            <button onClick={onBack} className="mt-8 text-center text-sm text-gray-500 hover:text-brand-blue block w-full">{t('common.back_home')}</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
