
import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { ArrowRight, Mail, Lock, User as UserIcon, Globe, ChevronLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
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

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Sync ref with state to avoid stale closure in Google callback
  useEffect(() => {
    selectedRoleRef.current = selectedRole;
  }, [selectedRole]);

  // Initialize Google Login
  useEffect(() => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === "undefined") {
      console.error("GOOGLE_CLIENT_ID is not configured.");
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

    let retryCount = 0;
    const maxRetries = 10;

    const initGsi = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCallback,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: theme === 'dark' ? 'filled_blue' : 'outline',
                    size: 'large',
                    width: googleButtonRef.current.offsetWidth || 350,
                    text: authMode === 'REGISTER' ? 'signup_with' : 'signin_with',
                    shape: 'pill'
                });
            }
        } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initGsi, 500); 
        }
    };

    if (authMode !== 'FORGOT_PASSWORD') {
        initGsi();
    }
  }, [theme, authMode, loginWithGoogle, addNotification, t]);

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
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : t('login.error_login'));
        addNotification(errorMessage, 'error');
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
          const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : t('login.error_register'));
          addNotification(errorMessage, 'error');
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
          const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : t('login.error_otp'));
          addNotification(errorMessage, 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const RoleSelector = () => (
    <div className="flex gap-2 sm:gap-4 mb-6">
        <button 
            type="button"
            onClick={() => setSelectedRole('USER')} 
            className={`flex-1 py-3 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-2 text-xs sm:text-sm ${selectedRole === 'USER' ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30 text-brand-blue dark:text-blue-400' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
        >
            <ShieldCheck size={18} /> {t('common.role_student')}
        </button>
        <button 
            type="button"
            onClick={() => setSelectedRole('TEACHER')} 
            className={`flex-1 py-3 rounded-2xl border-2 font-black transition-all flex items-center justify-center gap-2 text-xs sm:text-sm ${selectedRole === 'TEACHER' ? 'border-brand-orange bg-orange-50 dark:bg-orange-900/30 text-brand-orange' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
        >
            <UserIcon size={18} /> {t('common.role_teacher')}
        </button>
    </div>
  );

  const renderLogin = () => (
      <>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">{t('login.welcome_back')}</h3>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 font-medium">{t('login.login_desc')}</p>
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">{t('login.username_label')}</label>
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input 
                      type="text" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder={t('login.username_ph')} 
                      className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium text-sm sm:text-base"
                    />
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('login.password_label')}</label>
                    <button 
                      type="button" 
                      tabIndex={-1}
                      onClick={() => { setAuthMode('FORGOT_PASSWORD'); setForgotStep('EMAIL'); }} 
                      className="text-[10px] sm:text-xs font-black text-brand-blue hover:text-blue-700 dark:text-blue-400 outline-none"
                    >
                      {t('login.forgot_link')}
                    </button>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder={t('login.password_ph')} 
                      className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium text-sm sm:text-base"
                    />
                </div>
            </div>
            <button type="submit" disabled={isLoading || isGoogleSubmitting} className="w-full bg-brand-blue text-white py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 mt-4 sm:mt-6 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:scale-95">
                {isLoading ? <ThemeLoader className="text-white" size={22} /> : <>{t('login.btn_login')} <ArrowRight size={22} /></>}
            </button>
        </form>
      </>
  );

  const renderRegister = () => (
      <>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">{t('login.register_title')}</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 font-medium">{t('login.welcome_join')}</p>
        
        <RoleSelector />

        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
            <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('login.name_label')} className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium text-sm sm:text-base"/>
            </div>
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium text-sm sm:text-base"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.password_label')} className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium text-sm sm:text-base"/>
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('login.confirm_password_label')} className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all font-medium text-sm sm:text-base"/>
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-3 mt-4 disabled:opacity-70">
                {isLoading ? <ThemeLoader className="text-white" size={22} /> : <>{t('login.btn_register')} <ArrowRight size={22} /></>}
            </button>
        </form>
      </>
  );

  const renderForgotPassword = () => (
      <>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">{t('login.forgot_title')}</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">
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
                {isLoading ? <ThemeLoader className="text-white" size={22} /> : (
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 transition-colors relative overflow-hidden">
      {/* Background Decor - Only desktop */}
      <div className="hidden lg:block absolute -top-32 -left-32 w-80 h-80 bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="hidden lg:block absolute -bottom-32 -right-32 w-80 h-80 bg-brand-orange/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="absolute top-4 right-4 z-50">
        <button onClick={changeLanguage} className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1">
            <Globe size={18} />
            <span className="text-[10px] font-black uppercase">{i18n.language}</span>
        </button>
      </div>

      <div className="max-w-5xl w-full bg-white dark:bg-gray-800 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-500">
        {/* Left Branding Panel */}
        <div className="md:w-5/12 lg:w-1/2 bg-brand-blue p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <div className="mb-8 md:mb-16">
                <BrandLogo size="sm" className="text-white bg-white/10 p-4 rounded-2xl backdrop-blur-md inline-flex border border-white/20" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 leading-tight">
                  {authMode === 'LOGIN' ? t('login.hero_title') : authMode === 'REGISTER' ? t('login.register_title') : t('login.forgot_title')}
              </h2>
              <p className="text-indigo-100 text-base sm:text-lg lg:text-xl font-medium leading-relaxed max-w-sm hidden sm:block">
                  {t('login.hero_desc')}
              </p>
           </div>
           
           <div className="relative z-10 mt-8 md:mt-12 flex items-center gap-4 text-indigo-200">
               <div className="flex -space-x-3">
                   {[1,2,3].map(i => <img key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-brand-blue" src={`https://i.pravatar.cc/100?img=${i+20}`} alt="user"/>)}
               </div>
               <span className="text-[10px] sm:text-sm font-bold">{t('landing.user_count')}</span>
           </div>

           <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-brand-orange/20 rounded-full blur-[80px]"></div>
        </div>

        {/* Right Form Panel */}
        <div className="md:w-7/12 lg:w-1/2 p-6 sm:p-10 md:p-16 flex flex-col justify-center bg-white dark:bg-gray-850">
            {authMode === 'LOGIN' ? renderLogin() : authMode === 'REGISTER' ? renderRegister() : renderForgotPassword()}
            
            {authMode !== 'FORGOT_PASSWORD' && (
                <>
                    <div className="relative my-6 sm:my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-700"></div></div>
                        <div className="relative flex justify-center text-[10px]"><span className="px-4 bg-white dark:bg-gray-855 text-gray-400 font-bold uppercase tracking-widest">{t('common.or_continue')}</span></div>
                    </div>

                    <div className="mb-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Vai trò tham gia:</p>
                        <RoleSelector />
                    </div>

                    {clientConfigError ? (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 mb-4 text-xs text-red-600 dark:text-red-400 font-medium">
                            <AlertTriangle size={16} className="shrink-0" />
                            <p>Thiếu cấu hình Google Client. Vui lòng kiểm tra lại môi trường.</p>
                        </div>
                    ) : (
                        <div ref={googleButtonRef} className="w-full min-h-[50px] mb-4 overflow-hidden flex justify-center scale-90 sm:scale-100 origin-center"></div>
                    )}
                    
                    {isGoogleSubmitting && (
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-brand-blue font-bold">
                            <ThemeLoader size={18} /> Đang xử lý...
                        </div>
                    )}
                </>
            )}

            <div className="mt-8 sm:mt-10 text-center">
                {authMode === 'LOGIN' ? (
                    <p className="text-gray-500 font-bold text-xs sm:text-sm">
                        {t('login.no_account')} <button onClick={() => setAuthMode('REGISTER')} className="text-brand-blue hover:underline">{t('landing.nav_register')}</button>
                    </p>
                ) : authMode === 'REGISTER' ? (
                    <p className="text-gray-500 font-bold text-xs sm:text-sm">
                        {t('login.has_account')} <button onClick={() => setAuthMode('LOGIN')} className="text-brand-blue hover:underline">{t('login.btn_login')}</button>
                    </p>
                ) : null}
                <button onClick={onBack} className="mt-6 text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto text-[10px] sm:text-xs font-bold transition-colors">
                    <ChevronLeft size={16} /> {t('common.back_home')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
