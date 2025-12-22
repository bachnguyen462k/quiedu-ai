
import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Zap, ArrowRight, Globe, ScanLine, Check, Star, BrainCircuit, Keyboard, FileText, Sparkles, ChevronRight, Facebook, Twitter, Instagram, Youtube, Mail, Phone, Moon, Sun, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import BrandLogo from './BrandLogo';
import { settingEventService } from '../services/settingEventService';

interface LandingPageProps {
  onStart: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onRegister }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, setEventTheme } = useApp();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isHeroCardFlipped, setIsHeroCardFlipped] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  
  const hasFetchedTheme = useRef(false);

  useEffect(() => {
      const handleScroll = () => {
          // Hiện nút nổi sau khi cuộn qua 400px (hết phần hero)
          if (window.scrollY > 400) {
              setShowFloatingActions(true);
          } else {
              setShowFloatingActions(false);
          }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      if (hasFetchedTheme.current) return;
      const fetchTheme = async () => {
          hasFetchedTheme.current = true;
          try {
              const themeFromApi = await settingEventService.getGlobalEventTheme();
              setEventTheme(themeFromApi);
          } catch (e) {
              console.error("Theme fetch failed", e);
          }
      };
      fetchTheme();
  }, [setEventTheme]);

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  const handleAction = (path: string) => {
      setIsMobileMenuOpen(false);
      if (isAuthenticated) {
          navigate(path);
      } else {
          onStart();
      }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-[100] border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <BrandLogo size="sm" />
          
          <div className="hidden lg:flex gap-8">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">{t('landing.nav_features')}</a>
              <a href="#creation-methods" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">{t('landing.nav_teachers')}</a>
              <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">Đánh giá</a>
          </div>

          <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                </button>
                <button onClick={changeLanguage} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 mr-2">
                    <Globe size={20} />
                    <span className="text-xs font-bold uppercase">{i18n.language}</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-3">
                <button onClick={onStart} className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-white font-bold transition-colors px-3">{t('landing.nav_login')}</button>
                <button onClick={onRegister} className="bg-brand-blue text-white px-6 py-2.5 rounded-full font-black hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/20">{t('landing.nav_register')}</button>
              </div>

              {/* Mobile Hamburger */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-0 right-0 w-full max-w-xs h-full bg-white dark:bg-gray-900 shadow-2xl p-8 flex flex-col animate-slide-in">
            <div className="flex justify-between items-center mb-10">
              <BrandLogo size="sm" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={28} /></button>
            </div>
            <div className="flex flex-col gap-6 mb-10">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black text-gray-900 dark:text-white hover:text-brand-blue">Tính năng</a>
              <a href="#creation-methods" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black text-gray-900 dark:text-white hover:text-brand-blue">Phương pháp</a>
              <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-black text-gray-900 dark:text-white hover:text-brand-blue">Đánh giá</a>
            </div>
            <div className="mt-auto space-y-4">
              <button onClick={onStart} className="w-full py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 font-black dark:text-white text-lg active:scale-95 transition-transform">Đăng nhập</button>
              <button onClick={onRegister} className="w-full py-4 rounded-2xl bg-brand-blue text-white font-black text-lg shadow-xl shadow-brand-blue/20 active:scale-95 transition-transform">Đăng ký ngay</button>
              <div className="flex justify-center gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button onClick={toggleTheme} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">{theme === 'dark' ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} />}</button>
                <button onClick={changeLanguage} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center gap-2"><Globe size={24} /><span className="font-black uppercase text-gray-900 dark:text-white">{i18n.language}</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar for Mobile (Always visible when scrolling) */}
      <div className={`fixed bottom-0 left-0 right-0 z-[90] p-4 lg:hidden transition-all duration-500 transform ${showFloatingActions ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-100 dark:border-gray-700 shadow-2xl rounded-[32px] p-3 flex gap-3">
              <button onClick={onStart} className="flex-1 py-4 px-4 rounded-2xl font-black text-sm text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700 active:scale-95 transition-transform">
                  Đăng nhập
              </button>
              <button onClick={onRegister} className="flex-[1.5] py-4 px-4 bg-brand-blue text-white rounded-2xl font-black text-sm shadow-lg shadow-brand-blue/25 active:scale-95 transition-transform">
                  Bắt đầu miễn phí
              </button>
          </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 md:py-48 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10 text-center lg:text-left">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-brand-orange font-black text-[10px] md:text-xs mb-6 uppercase tracking-widest">
             {t('landing.hero_badge')}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] mb-8">
            {t('landing.hero_title_1')} <span className="text-brand-blue">{t('landing.hero_title_highlight')}</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-400 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
            {t('landing.hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button 
              onClick={() => handleAction('/dashboard')}
              className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/25 flex items-center justify-center gap-3"
            >
              {t('landing.btn_start')} <ArrowRight size={22} />
            </button>
            <button className="px-8 py-4 rounded-2xl font-black text-lg text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-blue transition-all">
              {t('landing.btn_demo')}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: ANIMATED CARDS */}
        <div className="relative h-[300px] sm:h-[400px] md:h-[500px] flex items-center justify-center perspective-1000">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[400px] md:w-[450px] h-[280px] sm:h-[400px] md:h-[450px] bg-brand-blue/10 dark:bg-brand-blue/5 rounded-full blur-[60px] md:blur-[100px] -z-10 animate-pulse"></div>
            
            <div className={`relative z-50 w-56 sm:w-64 md:w-80 h-72 sm:h-80 md:h-96 transition-transform duration-500 ${isHeroCardFlipped ? '-rotate-2' : 'rotate-3'}`}>
                <div 
                    className={`flip-card-inner cursor-pointer ${isHeroCardFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsHeroCardFlipped(!isHeroCardFlipped)}
                >
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-850 p-6 md:p-8 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">Mặt trước</span>
                            <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center px-2">
                            <p className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-snug">
                                Nguyên tử khối của <br/> <span className="text-brand-orange">Oxy</span> là bao nhiêu?
                            </p>
                        </div>
                        <div className="text-center text-[9px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Nhấn lật thẻ</div>
                    </div>
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-blue p-8 rounded-[32px] shadow-2xl flex flex-col justify-between text-white">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Đáp án</span><Check size={20} strokeWidth={4} /></div>
                        <div className="flex-1 flex items-center justify-center text-center">
                            <div><p className="text-4xl sm:text-5xl font-black mb-2">16</p><p className="text-xs font-bold opacity-80">(đvC)</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Helper Card - Hidden on very small screens */}
            <div className="absolute z-20 translate-x-12 sm:translate-x-24 md:translate-x-32 translate-y-12 sm:translate-y-8 md:translate-y-12 -rotate-6 bg-white dark:bg-gray-850 p-4 md:p-6 rounded-[24px] md:rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 w-48 sm:w-56 md:w-72 h-56 sm:h-64 md:h-80 hidden xs:block">
                <div className="space-y-4">
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-brand-orange"></div></div>
                    <p className="text-[10px] sm:text-xs md:text-sm font-black text-gray-900 dark:text-white">Kiểm tra: Lịch sử VN</p>
                    <div className="space-y-2">
                        <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <Check size={12} className="text-green-600" strokeWidth={4} />
                            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-green-700 dark:text-green-400 truncate">Chiến thắng Điện Biên Phủ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Methods Section */}
      <div id="creation-methods" className="py-24 bg-gray-50 dark:bg-gray-850 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Cực nhanh với BrainQnA AI</h2>
                  <p className="text-gray-700 dark:text-gray-400 font-medium max-w-2xl mx-auto text-sm md:text-base">Biến tài liệu thô thành bài giảng sinh động chỉ trong vài giây.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1,2,3,4].map(num => (
                    <button 
                        key={num}
                        onClick={() => handleAction(num === 4 ? '/ai-planner' : '/create')}
                        className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group text-left flex flex-col active:scale-95"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${num === 1 ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' : num === 2 ? 'bg-orange-50 dark:bg-orange-900/30 text-brand-orange' : num === 3 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600'}`}>
                            {num === 1 ? <BrainCircuit size={28} /> : num === 2 ? <ScanLine size={28} /> : num === 3 ? <Keyboard size={28} /> : <FileText size={28} />}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{t(`landing.create_method_${num}_title`)}</h3>
                        <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{t(`landing.create_method_${num}_desc`)}</p>
                        <div className="flex items-center font-black text-[10px] uppercase tracking-widest gap-2 text-brand-blue">Thử ngay <ChevronRight size={14} /></div>
                    </button>
                  ))}
              </div>
          </div>
      </div>
      
      {/* Features */}
      <div id="features" className="bg-white dark:bg-gray-900 py-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6">{t('landing.feature_title')}</h2>
                <p className="text-gray-700 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">{t('landing.feature_desc')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: BookOpen, color: 'text-brand-blue', bg: 'bg-blue-50 dark:bg-blue-900/20', key: 'feature_flashcard' },
                    { icon: Zap, color: 'text-brand-orange', bg: 'bg-orange-50 dark:bg-orange-900/20', key: 'feature_ai' },
                    { icon: ScanLine, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', key: 'feature_class' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-855 p-10 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${item.bg} ${item.color}`}><item.icon size={32} /></div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{t(`landing.${item.key}`)}</h3>
                        <p className="text-gray-700 dark:text-gray-400 font-medium">{t(`landing.${item.key}_desc`)}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      <footer className="bg-white dark:bg-gray-950 pt-20 pb-24 lg:pb-10 border-t border-gray-100 dark:border-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                  <div className="lg:col-span-1 flex flex-col items-center md:items-start">
                      <BrandLogo size="md" className="mb-6" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">{t('landing.footer_about')}</p>
                      <div className="flex gap-4">
                          {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                              <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-brand-blue transition-all"><Icon size={20} /></a>
                          ))}
                      </div>
                  </div>
                  <div className="hidden sm:block">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-6">{t('landing.footer_links_prod')}</h4>
                      <ul className="space-y-4">{['Trang chủ', 'Flashcards', 'AI Chấm điểm', 'Lớp học'].map(l => <li key={l}><a href="#" className="text-gray-600 dark:text-gray-400 text-sm hover:text-brand-blue font-medium">{l}</a></li>)}</ul>
                  </div>
                  <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-6">Liên hệ</h4>
                      <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                          <li className="flex items-center justify-center md:justify-start gap-3"><Mail size={18} className="text-brand-blue" /> info@brainqna.edu.vn</li>
                          <li className="flex items-center justify-center md:justify-start gap-3"><Phone size={18} className="text-brand-blue" /> (+84) 123 456 789</li>
                      </ul>
                  </div>
              </div>
              <div className="pt-10 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">© 2025 BrainQnA. {t('landing.footer_rights')}</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
