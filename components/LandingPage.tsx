
import React from 'react';
import { BookOpen, Zap, ArrowRight, Globe, ScanLine, PenTool } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BrandLogo from './BrandLogo';

interface LandingPageProps {
  onStart: () => void;
  onRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onRegister }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = () => {
      const newLang = i18n.language === 'vi' ? 'en' : 'vi';
      i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <BrandLogo size="md" />
        
        <div className="hidden md:flex gap-8">
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-indigo-400 font-medium transition-colors">{t('landing.nav_features')}</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-indigo-400 font-medium transition-colors">{t('landing.nav_teachers')}</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-indigo-400 font-medium transition-colors">{t('landing.nav_schools')}</a>
        </div>
        <div className="flex items-center gap-3">
            <button
                onClick={changeLanguage}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 mr-2"
                title={t('common.language')}
            >
                <Globe size={20} />
                <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>

            <button 
              onClick={onStart}
              className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-white font-medium transition-colors"
            >
              {t('landing.nav_login')}
            </button>
            <button 
              onClick={onRegister}
              className="bg-brand-blue text-white px-5 py-2 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {t('landing.nav_register')}
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-bold text-sm mb-6 uppercase tracking-wider">
             Hỏi trước - Nhớ lâu - Hiểu sâu
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            Học thông minh cùng <span className="text-brand-blue">Brain</span><span className="text-brand-orange">QnA</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {t('landing.hero_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onStart}
              className="bg-brand-blue text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-transform hover:-translate-y-1 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              {t('landing.btn_start')} <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 rounded-xl font-bold text-lg text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-brand-blue dark:hover:border-indigo-400 hover:text-brand-blue dark:hover:text-indigo-400 transition-colors">
              {t('landing.btn_demo')}
            </button>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-blue/10 dark:bg-brand-blue/5 rounded-full blur-3xl animate-pulse"></div>
          <BrandLogo size="xl" vertical className="relative z-10 animate-fade-in" />
        </div>
      </div>
      
      {/* ... rest of the landing page stays same ... */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.feature_title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{t('landing.feature_desc')}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-brand-blue dark:text-blue-400 mb-6">
                        <BookOpen size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.feature_flashcard')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t('landing.feature_flashcard_desc')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-brand-orange dark:text-purple-400 mb-6">
                        <Zap size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.feature_ai')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t('landing.feature_ai_desc')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                        <ScanLine size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.feature_class')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{t('landing.feature_class_desc')}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
