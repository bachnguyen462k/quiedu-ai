
import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, ArrowRight, Globe, ScanLine, Check, Star, BrainCircuit, Keyboard, FileText, Sparkles, ChevronRight, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Moon, Sun, LogIn } from 'lucide-react';
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

const TESTIMONIALS = [
    {
        name: "Nguyễn Văn Nam",
        role: "Giáo viên Tiếng Anh - THPT Chu Văn An",
        avatar: "https://i.pravatar.cc/150?img=11",
        rating: 5,
        text: "BrainQnA thực sự thay đổi cách tôi soạn bài. Việc trích xuất đề thi từ file PDF chỉ mất vài giây, giúp tôi tiết kiệm 80% thời gian chuẩn bị bài tập cho học sinh."
    },
    {
        name: "Lê Thị Hồng Hạnh",
        role: "Học sinh Lớp 12 - Chuyên Lê Hồng Phong",
        avatar: "https://i.pravatar.cc/150?img=32",
        rating: 5,
        text: "Nhờ bộ Flashcards AI mà mình ghi nhớ từ vựng và các công thức Hóa học cực nhanh. Giao diện rất đẹp và dễ sử dụng, mình học không còn thấy chán nữa."
    },
    {
        name: "Trần Minh Quân",
        role: "Phụ huynh Học sinh",
        avatar: "https://i.pravatar.cc/150?img=13",
        rating: 5,
        text: "Một ứng dụng giáo dục tuyệt vời. Tôi có thể theo dõi tiến độ học tập của con và hỗ trợ con ôn tập ngay tại nhà một cách khoa học."
    }
];

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onRegister }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, setEventTheme } = useApp();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isHeroCardFlipped, setIsHeroCardFlipped] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch global event theme on landing page load
  useEffect(() => {
      const fetchTheme = async () => {
          const themeFromApi = await settingEventService.getGlobalEventTheme();
          setEventTheme(themeFromApi);
      };

      fetchTheme();
  }, [setEventTheme]);

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  const handleAction = (path: string) => {
      if (isAuthenticated) {
          navigate(path);
      } else {
          onStart();
      }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm h-16' : 'bg-transparent h-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <BrandLogo size={scrolled ? "sm" : "md"} showText={window.innerWidth > 400} />
            
            <div className="hidden lg:flex gap-8">
                <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">{t('landing.nav_features')}</a>
                <a href="#creation-methods" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">{t('landing.nav_teachers')}</a>
                <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">Đánh giá</a>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <button
                    onClick={changeLanguage}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                >
                    <Globe size={18} />
                    <span className="text-[10px] font-black uppercase">{i18n.language}</span>
                </button>

                {/* LOGIN / REGISTER BUTTONS: Hidden on mobile (sm:hidden), shown on desktop (sm:flex) */}
                <div className="hidden sm:flex items-center gap-1 sm:gap-3">
                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                    <button 
                      onClick={onStart}
                      className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-white font-black text-xs px-3 py-2 transition-all flex items-center gap-1.5"
                    >
                      <span>{t('landing.nav_login')}</span>
                    </button>

                    <button 
                      onClick={onRegister}
                      className="bg-brand-blue text-white px-4 sm:px-6 py-2 rounded-full font-black text-xs sm:text-sm hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/20 active:scale-95"
                    >
                      {t('landing.nav_register')}
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 md:pt-48 md:pb-24 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="relative z-10 text-center md:text-left">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-brand-orange font-black text-[10px] sm:text-xs mb-6 uppercase tracking-widest animate-bounce">
             {t('landing.hero_badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] mb-6 md:mb-8">
            {t('landing.hero_title_1')} <span className="text-brand-blue">{t('landing.hero_title_highlight')}</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 md:mb-10 leading-relaxed max-w-lg mx-auto md:mx-0">
            {t('landing.hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-0">
            <button 
              onClick={() => handleAction('/dashboard')}
              className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-base sm:text-lg hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-xl shadow-brand-blue/25 flex items-center justify-center gap-3 order-1 sm:order-none"
            >
              {t('landing.btn_start')} <ArrowRight size={22} />
            </button>
            <button className="px-8 py-4 rounded-2xl font-black text-base sm:text-lg text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-blue transition-all flex items-center justify-center">
              {t('landing.btn_demo')}
            </button>
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                      <img key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  ))}
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
                  <span className="text-brand-blue dark:text-blue-400 font-black">{t('landing.user_count')}</span>
              </p>
          </div>
        </div>

        {/* RIGHT SIDE: INTERACTIVE CARD STACK */}
        <div className="relative h-[400px] md:h-[500px] flex items-center justify-center perspective-1000">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full md:w-[450px] h-[450px] bg-brand-blue/10 dark:bg-brand-blue/5 rounded-full blur-[80px] md:blur-[100px] -z-10 animate-pulse"></div>
            
            <div className={`relative z-50 w-64 h-80 sm:w-80 sm:h-96 transition-transform duration-500 ${isHeroCardFlipped ? '-rotate-2' : 'rotate-3'}`}>
                <div 
                    className={`flip-card-inner cursor-pointer ${isHeroCardFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsHeroCardFlipped(!isHeroCardFlipped)}
                >
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-855 p-6 sm:p-8 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] sm:text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">Mặt trước</span>
                            <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center px-2">
                            <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-snug">
                                Nguyên tử khối của <br/> <span className="text-brand-orange">Oxy</span> là bao nhiêu?
                            </p>
                        </div>
                        <div className="text-center text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest animate-pulse">
                            Nhấn để lật thẻ
                        </div>
                    </div>
                    
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-blue p-6 sm:p-8 rounded-[32px] shadow-2xl flex flex-col justify-between text-white">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] sm:text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Đáp án</span>
                            <Check size={20} strokeWidth={4} />
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center">
                            <div>
                                <p className="text-4xl sm:text-5xl font-black mb-2">16</p>
                                <p className="text-xs sm:text-sm font-bold opacity-80">(đơn vị khối lượng nguyên tử)</p>
                            </div>
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-center font-black uppercase tracking-widest">
                            Tuyệt vời! +10 điểm
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute z-20 translate-x-20 sm:translate-x-32 translate-y-12 -rotate-6 bg-white dark:bg-gray-855 p-4 sm:p-6 rounded-[24px] sm:rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 w-56 h-64 sm:w-72 sm:h-80 animate-fade-in pointer-events-none opacity-80 transition-transform" style={{ animationDelay: '0.2s' }}>
                <div className="space-y-4">
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-brand-orange animate-pulse"></div>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">Kiểm tra: Lịch sử VN</p>
                    <div className="space-y-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm shrink-0"><Check size={10} strokeWidth={4} /></div>
                            <span className="text-[10px] sm:textxs font-bold text-green-700 dark:text-green-400 truncate">Chiến thắng Điện Biên Phủ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Floating CTA for Mobile - Hidden on larger screens (sm:hidden) */}
      <div className={`fixed bottom-6 left-6 right-6 z-[55] sm:hidden transition-all duration-500 transform ${scrolled ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
          <div className="bg-indigo-600 rounded-2xl shadow-2xl p-2 flex gap-2 border border-white/20 backdrop-blur-lg">
              <button 
                onClick={onStart}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              >
                {t('landing.nav_login')}
              </button>
              <button 
                onClick={onRegister}
                className="flex-[1.5] bg-white text-indigo-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95"
              >
                {t('landing.nav_register')}
              </button>
          </div>
      </div>

      {/* 4 CREATION METHODS */}
      <div id="creation-methods" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-850 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 md:mb-16">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                    Cách tạo học phần cực nhanh
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
                    BrainQnA cung cấp bộ công cụ mạnh mẽ nhất để bạn biến tài liệu thô thành bài giảng sinh động chỉ trong vài giây.
                  </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[1,2,3,4].map(num => (
                    <button 
                        key={num}
                        onClick={() => handleAction(num === 4 ? '/ai-planner' : '/create')}
                        className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group text-left flex flex-col active:scale-95 ${num === 4 ? 'hover:border-pink-500 relative overflow-hidden' : num === 1 ? 'hover:border-purple-500' : num === 2 ? 'hover:border-brand-orange' : 'hover:border-blue-500'}`}
                    >
                        {num === 4 && (
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-pink-100 text-pink-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter animate-pulse">PRO</span>
                            </div>
                        )}
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${num === 1 ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : num === 2 ? 'bg-orange-50 dark:bg-orange-900/30 text-brand-orange' : num === 3 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'}`}>
                            {num === 1 ? <BrainCircuit size={24} /> : num === 2 ? <ScanLine size={24} /> : num === 3 ? <Keyboard size={24} /> : <FileText size={24} />}
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-2 md:mb-3">{t(`landing.create_method_${num}_title`)}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm leading-relaxed mb-6 flex-1">
                            {t(`landing.create_method_${num}_desc`)}
                        </p>
                        <div className={`flex items-center font-black text-[10px] md:text-xs uppercase tracking-widest gap-1 group-hover:gap-2 transition-all ${num === 1 ? 'text-purple-600' : num === 2 ? 'text-brand-orange' : num === 3 ? 'text-blue-600' : 'text-pink-600'}`}>
                            Thử ngay <ChevronRight size={14} />
                        </div>
                    </button>
                  ))}
              </div>
          </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="bg-white dark:bg-gray-900 py-16 md:py-24 transition-colors relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-20">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">{t('landing.feature_title')}</h2>
                <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">{t('landing.feature_desc')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 md:gap-10">
                {[
                    { icon: BookOpen, color: 'blue', key: 'feature_flashcard' },
                    { icon: Zap, color: 'orange', key: 'feature_ai' },
                    { icon: ScanLine, color: 'green', key: 'feature_class' }
                ].map((item, idx) => (
                    <div key={idx} className="group bg-white dark:bg-gray-850 p-8 md:p-10 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-300 ${item.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-blue group-hover:bg-brand-blue group-hover:text-white' : item.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/30 text-brand-orange group-hover:bg-brand-orange group-hover:text-white' : 'bg-green-50 dark:bg-green-900/30 text-green-600 group-hover:bg-green-600 group-hover:text-white'}`}>
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-4">{t(`landing.${item.key}`)}</h3>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{t(`landing.${item.key}_desc`)}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 pt-16 pb-10 border-t border-gray-100 dark:border-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                  <div className="sm:col-span-2 lg:col-span-1">
                      <BrandLogo size="md" className="mb-6" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
                          {t('landing.footer_about')}
                      </p>
                      <div className="flex gap-4">
                          {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                              <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
                                  <Icon size={18} />
                              </a>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">{t('landing.footer_links_prod')}</h4>
                      <ul className="space-y-3">
                          {['Flashcards', 'AI Chấm điểm', 'Lớp học', 'Soạn giáo án'].map(link => (
                              <li key={link}><a href="#" className="text-gray-500 dark:text-gray-400 text-sm hover:text-brand-blue transition-colors font-medium">{link}</a></li>
                          ))}
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Liên hệ</h4>
                      <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <Mail size={16} className="text-brand-blue" /> info@brainqna.edu.vn
                          </li>
                          <li className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                              <Phone size={16} className="text-brand-blue" /> (+84) 123 456 789
                          </li>
                      </ul>
                  </div>
              </div>

              <div className="pt-10 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center">
                      © {new Date().getFullYear()} BrainQnA. {t('landing.footer_rights')}
                  </p>
                  <div className="flex gap-6 sm:gap-8">
                      <a href="#" className="text-[10px] font-bold text-gray-400 hover:text-gray-700">Quy định</a>
                      <a href="#" className="text-[10px] font-bold text-gray-400 hover:text-gray-700">Bảo mật</a>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
