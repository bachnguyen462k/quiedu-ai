
import React, { useState, useEffect } from 'react';
import { BookOpen, Zap, ArrowRight, Globe, ScanLine, Check, Star, BrainCircuit, Keyboard, FileText, Sparkles, ChevronRight, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Moon, Sun } from 'lucide-react';
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
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-50">
        <BrandLogo size="md" />
        
        <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">{t('landing.nav_features')}</a>
            <a href="#creation-methods" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">{t('landing.nav_teachers')}</a>
            <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-blue-400 font-bold transition-colors">Đánh giá</a>
        </div>
        <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={theme === 'dark' ? t('header.light_mode') : t('header.dark_mode')}
            >
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>

            <button
                onClick={changeLanguage}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 mr-2"
                title={t('common.language')}
            >
                <Globe size={20} />
                <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>

            <button 
              onClick={onStart}
              className="text-gray-700 dark:text-gray-300 hover:text-brand-blue dark:hover:text-white font-bold transition-colors hidden sm:block px-3"
            >
              {t('landing.nav_login')}
            </button>
            <button 
              onClick={onRegister}
              className="bg-brand-blue text-white px-6 py-2.5 rounded-full font-black hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/20 dark:shadow-none"
            >
              {t('landing.nav_register')}
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24 grid md:grid-cols-2 gap-16 items-center">
        <div className="relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-brand-orange font-black text-xs mb-6 uppercase tracking-widest animate-bounce">
             {t('landing.hero_badge')}
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] mb-8">
            {t('landing.hero_title_1')} <span className="text-brand-blue">{t('landing.hero_title_highlight')}</span>
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-400 mb-10 leading-relaxed max-w-lg">
            {t('landing.hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => handleAction('/dashboard')}
              className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-xl shadow-brand-blue/25 dark:shadow-none flex items-center justify-center gap-3"
            >
              {t('landing.btn_start')} <ArrowRight size={22} />
            </button>
            <button className="px-8 py-4 rounded-2xl font-black text-lg text-gray-800 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-blue dark:hover:border-blue-400 hover:text-brand-blue dark:hover:border-blue-400 transition-all">
              {t('landing.btn_demo')}
            </button>
          </div>
          
          <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                      <img key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  ))}
              </div>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  <span className="text-brand-blue dark:text-blue-400 font-black">{t('landing.user_count')}</span>
              </p>
          </div>
        </div>

        {/* RIGHT SIDE: INTERACTIVE CARD STACK */}
        <div className="relative h-[500px] hidden md:flex items-center justify-center perspective-1000">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-brand-blue/10 dark:bg-brand-blue/5 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            
            <div className={`relative z-50 w-80 h-96 transition-transform duration-500 ${isHeroCardFlipped ? '-rotate-2' : 'rotate-3'}`}>
                <div 
                    className={`flip-card-inner cursor-pointer ${isHeroCardFlipped ? 'is-flipped' : ''}`}
                    onClick={() => setIsHeroCardFlipped(!isHeroCardFlipped)}
                >
                    <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-850 p-8 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-brand-blue bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase tracking-widest">Mặt trước</span>
                            <Star size={18} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center px-2">
                            <p className="text-2xl font-black text-gray-900 dark:text-white leading-snug">
                                Nguyên tử khối của <br/> <span className="text-brand-orange">Oxy</span> là bao nhiêu?
                            </p>
                        </div>
                        <div className="text-center text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">
                            Nhấn để lật thẻ
                        </div>
                    </div>
                    
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand-blue p-8 rounded-[32px] shadow-2xl flex flex-col justify-between text-white">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Đáp án</span>
                            <Check size={20} strokeWidth={4} />
                        </div>
                        <div className="flex-1 flex items-center justify-center text-center">
                            <div>
                                <p className="text-5xl font-black mb-2">16</p>
                                <p className="text-sm font-bold opacity-80">(đơn vị khối lượng nguyên tử)</p>
                            </div>
                        </div>
                        <div className="text-center text-[10px] font-black uppercase tracking-widest">
                            Tuyệt vời! +10 điểm
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute z-20 translate-x-32 translate-y-12 -rotate-6 bg-white dark:bg-gray-850 p-6 rounded-[28px] shadow-2xl border border-gray-100 dark:border-gray-800 w-72 h-80 animate-fade-in pointer-events-none opacity-90 transition-transform" style={{ animationDelay: '0.2s' }}>
                <div className="space-y-4">
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-brand-orange animate-pulse"></div>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">Kiểm tra: Lịch sử VN</p>
                    <div className="space-y-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm"><Check size={12} strokeWidth={4} /></div>
                            <span className="text-xs font-bold text-green-700 dark:text-green-400">Chiến thắng Điện Biên Phủ</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center gap-3 opacity-60">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Chiến dịch HCM</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute z-40 -translate-x-44 translate-y-40 bg-white dark:bg-gray-850 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in border border-gray-100 dark:border-gray-800 pointer-events-none" style={{ animationDelay: '0.5s' }}>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-brand-orange rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase text-brand-orange leading-none mb-1">AI Smart Scan</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-200 whitespace-nowrap">Đã tạo xong 20 câu hỏi!</p>
                </div>
            </div>
        </div>
      </div>

      {/* 4 CREATION METHODS */}
      <div id="creation-methods" className="py-24 bg-gray-50 dark:bg-gray-850 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                    Cách tạo học phần cực nhanh
                  </h2>
                  <p className="text-gray-700 dark:text-gray-400 font-medium max-w-2xl mx-auto">
                    BrainQnA cung cấp bộ công cụ mạnh mẽ nhất để bạn biến tài liệu thô thành bài giảng sinh động chỉ trong vài giây.
                  </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1,2,3,4].map(num => (
                    <button 
                        key={num}
                        onClick={() => handleAction(num === 4 ? '/ai-planner' : '/create')}
                        className={`bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group text-left flex flex-col active:scale-95 ${num === 4 ? 'hover:border-pink-500 relative overflow-hidden' : num === 1 ? 'hover:border-purple-500' : num === 2 ? 'hover:border-brand-orange' : 'hover:border-blue-500'}`}
                    >
                        {num === 4 && (
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-pink-100 text-pink-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter animate-pulse">PRO</span>
                            </div>
                        )}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${num === 1 ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : num === 2 ? 'bg-orange-50 dark:bg-orange-900/30 text-brand-orange' : num === 3 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'}`}>
                            {num === 1 ? <BrainCircuit size={28} /> : num === 2 ? <ScanLine size={28} /> : num === 3 ? <Keyboard size={28} /> : <FileText size={28} />}
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{t(`landing.create_method_${num}_title`)}</h3>
                        <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                            {t(`landing.create_method_${num}_desc`)}
                        </p>
                        <div className={`flex items-center font-black text-xs uppercase tracking-widest gap-1 group-hover:gap-2 transition-all ${num === 1 ? 'text-purple-600' : num === 2 ? 'text-brand-orange' : num === 3 ? 'text-blue-600' : 'text-pink-600'}`}>
                            Thử ngay <ChevronRight size={14} />
                        </div>
                    </button>
                  ))}
              </div>
          </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="bg-white dark:bg-gray-900 py-24 transition-colors relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">{t('landing.feature_title')}</h2>
                <p className="text-gray-700 dark:text-gray-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">{t('landing.feature_desc')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
                {[
                    { icon: BookOpen, color: 'blue', key: 'feature_flashcard' },
                    { icon: Zap, color: 'orange', key: 'feature_ai' },
                    { icon: ScanLine, color: 'green', key: 'feature_class' }
                ].map((item, idx) => (
                    <div key={idx} className="group bg-white dark:bg-gray-850 p-10 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-300 ${item.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30 text-brand-blue group-hover:bg-brand-blue group-hover:text-white' : item.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/30 text-brand-orange group-hover:bg-brand-orange group-hover:text-white' : 'bg-green-50 dark:bg-green-900/30 text-green-600 group-hover:bg-green-600 group-hover:text-white'}`}>
                            <item.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{t(`landing.${item.key}`)}</h3>
                        <p className="text-gray-700 dark:text-gray-400 leading-relaxed font-medium">{t(`landing.${item.key}_desc`)}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="py-24 bg-gray-50 dark:bg-gray-850 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">{t('landing.testimonial_title')}</h2>
                <p className="text-gray-700 dark:text-gray-400 max-w-2xl mx-auto font-medium text-lg leading-relaxed">{t('landing.testimonial_desc')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {TESTIMONIALS.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-md border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-xl transition-all">
                        <div className="flex gap-1 text-yellow-400 mb-6">
                            {[...Array(item.rating)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 italic mb-8 flex-1 leading-relaxed">
                            "{item.text}"
                        </p>
                        <div className="flex items-center gap-4">
                            <img src={item.avatar} alt={item.name} className="w-14 h-14 rounded-full border-4 border-gray-50 dark:border-gray-700 shadow-sm" />
                            <div>
                                <h4 className="font-black text-gray-900 dark:text-white text-sm">{item.name}</h4>
                                <p className="text-[11px] font-bold text-brand-blue uppercase tracking-tighter">{item.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 pt-20 pb-10 border-t border-gray-100 dark:border-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                  <div className="lg:col-span-1">
                      <BrandLogo size="md" className="mb-6" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                          {t('landing.footer_about')}
                      </p>
                      <div className="flex gap-4">
                          {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                              <a key={i} href="#" className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all">
                                  <Icon size={20} />
                              </a>
                          ))}
                      </div>
                  </div>

                  <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">{t('landing.footer_links_prod')}</h4>
                      <ul className="space-y-4">
                          {['Trang chủ', 'Flashcards', 'AI Chấm điểm', 'Lớp học', 'Soạn giáo án'].map(link => (
                              <li key={link}><a href="#" className="text-gray-600 dark:text-gray-400 text-sm hover:text-brand-blue transition-colors font-medium">{link}</a></li>
                          ))}
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">{t('landing.footer_links_comp')}</h4>
                      <ul className="space-y-4">
                          {['Về chúng tôi', 'Đội ngũ', 'Đối tác', 'Tin tức', 'Liên hệ'].map(link => (
                              <li key={link}><a href="#" className="text-gray-600 dark:text-gray-400 text-sm hover:text-brand-blue transition-colors font-medium">{link}</a></li>
                          ))}
                      </ul>
                  </div>

                  <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Liên hệ</h4>
                      <ul className="space-y-4">
                          <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <Mail size={18} className="text-brand-blue" /> info@brainqna.edu.vn
                          </li>
                          <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <Phone size={18} className="text-brand-blue" /> (+84) 123 456 789
                          </li>
                          <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                              <MapPin size={18} className="text-brand-blue shrink-0" /> Tòa nhà Công nghệ, Quận 1, TP. HCM
                          </li>
                      </ul>
                  </div>
              </div>

              <div className="pt-10 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      © {new Date().getFullYear()} BrainQnA. {t('landing.footer_rights')}
                  </p>
                  <div className="flex gap-8">
                      <a href="#" className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">Quy định sử dụng</a>
                      <a href="#" className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300">Chính sách bảo mật</a>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default LandingPage;
