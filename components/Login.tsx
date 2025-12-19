
import React, { useState } from 'react';
import { UserRole } from '../types';
import { GraduationCap, ArrowRight, Loader2, Mail, Lock, User as UserIcon, Globe, ChevronLeft, ShieldCheck, KeyRound } from 'lucide-react';
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

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

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

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
          if (forgotStep === 'EMAIL') {
              await requestPasswordReset(email);
              addNotification(t('login.success_otp_sent', { email }), 'success');
              setForgotStep('OTP');
          } else if (forgotStep === 'OTP') {
              await verifyResetCode(email, otpCode);
              addNotification(t('login.success_verify'), 'success');
              setForgotStep('NEW_PASSWORD');
          } else if (forgotStep === 'NEW_PASSWORD') {
              if (newPassword !== confirmPassword) {
                  addNotification(t('login.error_password_mismatch'), 'warning');
                  return;
              }
              await confirmPasswordReset(email, newPassword);
              addNotification(t('login.success_reset'), 'success');
              setAuthMode('LOGIN');
          }
      } catch (error: any) {
          addNotification(error.message || t('login.error_otp'), 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const renderLogin = () => (
      <>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('login.welcome_back')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">{t('login.login_desc')}</p>
        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('login.username_label')}</label>
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input 
                      type="text" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder={t('login.username_ph')} 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all font-medium"
                    />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('login.password_label')}</label>
                    <button type="button" onClick={() => { setAuthMode('FORGOT_PASSWORD'); setForgotStep('EMAIL'); }} className="text-xs font-black text-brand-blue hover:text-blue-700 dark:text-blue-400">{t('login.forgot_link')}</button>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder={t('login.password_ph')} 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all font-medium"
                    />
                </div>
            </div>
            <button type="submit" disabled={isLoading || isGoogleSubmitting} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 mt-6 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" size={22} /> : <>{t('login.btn_login')} <ArrowRight size={22} /></>}
            </button>
        </form>
      </>
  );

  const renderRegister = () => (
      <>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('login.register_title')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">{t('login.welcome_join')}</p>
        
        <div className="flex gap-4 mb-6">
            <button onClick={() => setSelectedRole('STUDENT')} className={`flex-1 py-3 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-2 ${selectedRole === 'STUDENT' ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30 text-brand-blue dark:text-blue-400' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}>
                <GraduationCap size={20} /> {t('common.role_student')}
            </button>
            <button onClick={() => setSelectedRole('TEACHER')} className={`flex-1 py-3 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-2 ${selectedRole === 'TEACHER' ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/30 text-brand-orange' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}>
                <UserIcon size={20} /> {t('common.role_teacher')}
            </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('login.name_label')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"/>
            </div>
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.password_label')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"/>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('login.confirm_password_label')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"/>
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 mt-4 disabled:opacity-70">
                {isLoading ? <Loader2 className="animate-spin" size={22} /> : <>{t('login.btn_register')} <ArrowRight size={22} /></>}
            </button>
        </form>
      </>
  );

  const renderForgotPassword = () => (
      <>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{t('login.forgot_title')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
            {forgotStep === 'EMAIL' ? t('login.step_email_desc') : 
             forgotStep === 'OTP' ? t('login.step_otp_desc') : t('login.step_new_pass_desc')}
        </p>

        <form onSubmit={handleForgotPassword} className="space-y-5">
            {forgotStep === 'EMAIL' && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('login.email_label')}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                        <input 
                            type="email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder={t('login.email_ph')} 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"
                        />
                    </div>
                </div>
            )}

            {forgotStep === 'OTP' && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('login.otp_label')}</label>
                    <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                        <input 
                            type="text" 
                            required 
                            maxLength={6}
                            value={otpCode} 
                            onChange={(e) => setOtpCode(e.target.value)} 
                            placeholder={t('login.otp_ph')} 
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium tracking-[0.5em] text-center"
                        />
                    </div>
                    <button type="button" onClick={() => requestPasswordReset(email)} className="mt-3 text-xs font-bold text-brand-blue hover:underline">{t('login.resend_code')}</button>
                </div>
            )}

            {forgotStep === 'NEW_PASSWORD' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('login.new_password')}</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                            <input 
                                type="password" 
                                required 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder={t('login.password_ph')} 
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('login.confirm_password_label')}</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                            <input 
                                type="password" 
                                required 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                placeholder={t('login.password_ph')} 
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 mt-6 disabled:opacity-70 transform hover:-translate-y-0.5 active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" size={22} /> : (
                    <>
                        {forgotStep === 'EMAIL' ? t('login.send_code') : 
                         forgotStep === 'OTP' ? t('login.verify') : t('login.change_password')}
                        <ArrowRight size={22} />
                    </>
                )}
            </button>
            <button type="button" onClick={() => setAuthMode('LOGIN')} className="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-700">{t('login.back_login')}</button>
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

      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500">
        <div className="md:w-1/2 bg-brand-blue p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="mb-16">
                <BrandLogo size="lg" className="text-white bg-white/10 p-5 rounded-[32px] backdrop-blur-md inline-flex border border-white/20" />
              </div>
              <h2 className="text-5xl font-black mb-6 leading-tight">
                  {authMode === 'LOGIN' ? t('login.hero_title') : authMode === 'REGISTER' ? t('login.register_title') : t('login.forgot_title')}
              </h2>
              <p className="text-indigo-100 text-xl font-medium leading-relaxed max-w-sm">
                  {t('login.hero_desc')}
              </p>
           </div>
           
           <div className="relative z-10 mt-12 flex items-center gap-4 text-indigo-200">
               <div className="flex -space-x-3">
                   {[1,2,3].map(i => <img key={i} className="w-10 h-10 rounded-full border-2 border-brand-blue" src={`https://i.pravatar.cc/100?img=${i+20}`} alt="user"/>)}
               </div>
               <span className="text-sm font-bold">{t('landing.user_count')}</span>
           </div>

           <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-brand-orange/20 rounded-full blur-[100px]"></div>
           <div className="absolute -top-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-gray-850">
            {authMode === 'LOGIN' ? renderLogin() : authMode === 'REGISTER' ? renderRegister() : renderForgotPassword()}
            
            {authMode !== 'FORGOT_PASSWORD' && (
                <>
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-700"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-gray-850 text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('common.or_continue')}</span></div>
                    </div>

                    <button 
                        type="button" 
                        onClick={loginWithGoogle} 
                        className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-white py-4 rounded-2xl font-black hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        <span>Google</span>
                    </button>
                </>
            )}

            <div className="mt-10 text-center">
                {authMode === 'LOGIN' ? (
                    <p className="text-gray-500 font-bold text-sm">
                        {t('login.no_account')} <button onClick={() => setAuthMode('REGISTER')} className="text-brand-blue hover:underline">{t('landing.nav_register')}</button>
                    </p>
                ) : authMode === 'REGISTER' ? (
                    <p className="text-gray-500 font-bold text-sm">
                        {t('login.has_account')} <button onClick={() => setAuthMode('LOGIN')} className="text-brand-blue hover:underline">{t('login.btn_login')}</button>
                    </p>
                ) : null}
                <button onClick={onBack} className="mt-6 text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto text-xs font-bold transition-colors">
                    <ChevronLeft size={16} /> {t('common.back_home')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
