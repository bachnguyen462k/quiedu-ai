import React, { useState } from 'react';
import { UserRole } from '../types';
import { BrainCircuit, GraduationCap, School, ArrowRight, Loader2, Mail, Lock, User, CheckCircle, ChevronLeft, KeyRound, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useTranslation } from 'react-i18next';

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
  
  // Global State
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Login & Register Form State
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState(''); // Biến này lưu "username" trong form đăng nhập
  const [password, setPassword] = useState('');
  
  // Register specific
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password Flow State
  const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  // --- Handlers ---

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
          await register({
              email,
              password,
              name: fullName,
              role: selectedRole
          });
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

  // --- Forgot Password Handlers ---

  const handleSendResetEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetEmail.trim()) return;
      
      setIsLoading(true);
      try {
          await requestPasswordReset(resetEmail);
          addNotification(t('login.success_otp_sent', { email: resetEmail }), 'success');
          setForgotStep('OTP');
      } catch (error) {
          addNotification(t('login.error_send_email'), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!otpCode.trim()) return;

      setIsLoading(true);
      try {
          await verifyResetCode(resetEmail, otpCode);
          addNotification(t('login.success_verify'), 'success');
          setForgotStep('NEW_PASSWORD');
      } catch (error) {
          addNotification(t('login.error_otp'), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newResetPassword !== confirmResetPassword) {
          addNotification(t('login.error_password_mismatch'), 'warning');
          return;
      }

      setIsLoading(true);
      try {
          await confirmPasswordReset(resetEmail, newResetPassword);
          addNotification(t('login.success_reset'), 'success');
          setAuthMode('LOGIN');
          // Reset states
          setResetEmail('');
          setOtpCode('');
          setForgotStep('EMAIL');
      } catch (error) {
          addNotification(t('login.error_reset'), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  // Helper to fill mock data
  const fillMockData = (role: UserRole) => {
      setSelectedRole(role);
      setEmail('admin');
      setPassword('admin');
  };

  // --- RENDERERS ---

  const renderLogin = () => (
      <>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('login.login_title')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{t('login.welcome_back')}</p>

        {/* Quick Fill Helper */}
        <div className="flex gap-2 mb-6">
             <button onClick={() => fillMockData('TEACHER')} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-300">Fill Admin</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('login.password_label')}</label>
                    <button 
                        type="button"
                        onClick={() => { setAuthMode('FORGOT_PASSWORD'); setForgotStep('EMAIL'); setResetEmail(''); }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                        {t('login.forgot_link')}
                    </button>
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            <button 
                type="submit"
                disabled={isLoading || isGoogleSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{t('login.btn_login')} <ArrowRight size={18} /></>}
            </button>
        </form>
      </>
  );

  const renderRegister = () => (
      <>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('login.register_title')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{t('login.welcome_join')}</p>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <button 
                type="button"
                onClick={() => setSelectedRole('STUDENT')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    selectedRole === 'STUDENT' 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 text-gray-500 dark:text-gray-400'
                }`}
            >
                <GraduationCap size={24} />
                <span className="font-bold text-sm">{t('login.role_student')}</span>
            </button>
            <button 
                type="button"
                onClick={() => setSelectedRole('TEACHER')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    selectedRole === 'TEACHER' 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 text-gray-500 dark:text-gray-400'
                }`}
            >
                <School size={24} />
                <span className="font-bold text-sm">{t('login.role_teacher')}</span>
            </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.name_label')}</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.email_label')}</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@school.edu.vn"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.password_label')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.confirm_password_label')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit"
                disabled={isLoading || isGoogleSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{t('login.btn_register')} <ArrowRight size={18} /></>}
            </button>
        </form>
      </>
  );

  const renderForgotPassword = () => {
      return (
          <div className="space-y-6 animate-fade-in">
              <button 
                  onClick={() => setAuthMode('LOGIN')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
              >
                  <ChevronLeft size={16} /> {t('login.back_login')}
              </button>

              <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {forgotStep === 'EMAIL' && t('login.forgot_title')}
                      {forgotStep === 'OTP' && t('login.otp_label')}
                      {forgotStep === 'NEW_PASSWORD' && t('login.change_password')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                      {forgotStep === 'EMAIL' && t('login.step_email_desc')}
                      {forgotStep === 'OTP' && t('login.step_otp_desc')}
                      {forgotStep === 'NEW_PASSWORD' && t('login.step_new_pass_desc')}
                  </p>
              </div>

              {/* Step 1: Input Email */}
              {forgotStep === 'EMAIL' && (
                  <form onSubmit={handleSendResetEmail} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.email_label')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                required
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                         {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('login.send_code')}
                      </button>
                  </form>
              )}

              {/* Step 2: Input OTP */}
              {forgotStep === 'OTP' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.otp_label')}</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="123456"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all tracking-widest font-bold text-lg"
                            />
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                         {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('login.verify')}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setForgotStep('EMAIL')}
                        className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                          {t('login.resend_code')}
                      </button>
                  </form>
              )}

              {/* Step 3: New Password */}
              {forgotStep === 'NEW_PASSWORD' && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.new_password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={newResetPassword}
                                onChange={(e) => setNewResetPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('login.confirm_password_label')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                required
                                value={confirmResetPassword}
                                onChange={(e) => setConfirmResetPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                      </div>
                      <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                         {isLoading ? <Loader2 className="animate-spin" size={20} /> : t('login.change_password')}
                      </button>
                  </form>
              )}
          </div>
      );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors relative">
      <div className="absolute top-4 right-4 z-50">
        <button
            onClick={changeLanguage}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1"
            title={t('common.language')}
        >
            <Globe size={20} />
            <span className="text-xs font-bold uppercase">{i18n.language}</span>
        </button>
      </div>

      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row transition-colors">
        
        {/* Left Side: Branding */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600">
                  <BrainCircuit size={24} />
                </div>
                <span className="text-2xl font-bold tracking-tight">QuizEdu</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">
                  {authMode === 'LOGIN' ? t('login.welcome_back') : authMode === 'REGISTER' ? t('login.welcome_join') : t('login.forgot_title')}
              </h2>
              <p className="text-indigo-100 text-lg">
                  {authMode === 'LOGIN' 
                    ? t('landing.hero_desc')
                    : authMode === 'REGISTER'
                    ? t('login.welcome_join')
                    : t('login.welcome_forgot')
                  }
              </p>
           </div>
           
           <div className="relative z-10 mt-12">
             <div className="flex -space-x-4 mb-4">
                {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-400"></div>
                ))}
             </div>
             <p className="text-sm text-indigo-200">{t('landing.user_count')}</p>
           </div>

           {/* Decor circle */}
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-2xl"></div>
           <div className="absolute top-12 -left-12 w-48 h-48 bg-purple-500 rounded-full opacity-30 blur-2xl"></div>
        </div>

        {/* Right Side: Dynamic Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center animate-slide-in">
            
            {authMode === 'LOGIN' && renderLogin()}
            {authMode === 'REGISTER' && renderRegister()}
            {authMode === 'FORGOT_PASSWORD' && renderForgotPassword()}

            {/* Divider (Only show for Login/Register) */}
            {authMode !== 'FORGOT_PASSWORD' && (
                <>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('common.or_continue')}</span>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading || isGoogleSubmitting}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGoogleSubmitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        <span>{authMode === 'LOGIN' ? t('login.google_login') : t('login.google_register')}</span>
                    </button>
                    
                    <div className="mt-6 text-center text-sm">
                        {authMode === 'LOGIN' ? (
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('login.no_account')} <button onClick={() => setAuthMode('REGISTER')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">{t('login.btn_register')}</button>
                            </p>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('login.has_account')} <button onClick={() => setAuthMode('LOGIN')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">{t('login.btn_login')}</button>
                            </p>
                        )}
                    </div>
                </>
            )}

            <button onClick={onBack} className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 block w-full">
                {t('common.back_home')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;