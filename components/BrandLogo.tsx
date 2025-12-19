
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../contexts/AppContext';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  vertical?: boolean;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = "", 
  vertical = false 
}) => {
  const { t } = useTranslation();
  const { eventTheme } = useApp();

  const sizeMap = {
    sm: { icon: 32, font: 'text-xl' },
    md: { icon: 48, font: 'text-2xl' },
    lg: { icon: 96, font: 'text-5xl' },
    xl: { icon: 180, font: 'text-7xl' }
  };

  const currentSize = sizeMap[size];

  const getThemeConfig = () => {
    switch (eventTheme) {
        case 'CHRISTMAS':
            return {
                leftColor: '#D42426', // Red
                rightColor: '#165B33', // Green
                decoration: (
                    <g className="animate-bounce">
                        {/* Santa Hat sitting on the brain */}
                        <path d="M35 15 Q50 -5 65 15 L70 18 Q50 10 30 18 Z" fill="#D42426" />
                        <circle cx="65" cy="5" r="5" fill="white" />
                        <rect x="30" y="14" width="40" height="6" rx="3" fill="white" />
                    </g>
                )
            };
        case 'TET':
            return {
                leftColor: '#E60000', // Lunar Red
                rightColor: '#FFD700', // Gold
                decoration: (
                    <g>
                        {/* Apricot blossom (Hoa Mai) near the top right */}
                        <g transform="translate(75, 10) scale(0.6)">
                            <circle cx="10" cy="10" r="4" fill="#E60000" />
                            {[0, 72, 144, 216, 288].map(deg => (
                                <circle key={deg} cx="10" cy="4" r="5" fill="#FFD700" transform={`rotate(${deg}, 10, 10)`} />
                            ))}
                        </g>
                        {/* Red envelope (Lì xì) hanging */}
                        <rect x="10" y="60" width="12" height="18" rx="2" fill="#E60000" transform="rotate(-15, 10, 60)" />
                        <text x="12" y="74" fontSize="8" fill="#FFD700" fontWeight="bold" transform="rotate(-15, 10, 60)">福</text>
                    </g>
                )
            };
        case 'AUTUMN':
            return {
                leftColor: '#92400E', // Earth Brown
                rightColor: '#D97706', // Amber Leaf
                decoration: (
                    <g>
                        {/* Maple leaf falling */}
                        <path d="M10 20 L15 15 L12 15 L18 8 L10 12 L2 8 L8 15 L5 15 Z" fill="#D97706" transform="translate(0, 5) rotate(-20)" />
                        <path d="M85 70 L90 65 L87 65 L93 58 L85 62 L77 58 L83 65 L80 65 Z" fill="#B45309" transform="rotate(15, 85, 70)" />
                    </g>
                )
            };
        default:
            return {
                leftColor: '#005EB8',
                rightColor: '#F37321',
                decoration: null
            };
    }
  };

  const themeConfig = getThemeConfig();

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-4 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <svg 
            width={currentSize.icon} 
            height={currentSize.icon} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible drop-shadow-md"
        >
            {/* Design gốc từ index.html */}
            <path 
                d="M50 85C30 85 15 70 15 50C15 35 25 20 45 15V85Z" 
                fill={themeConfig.leftColor} 
                className="transition-colors duration-700"
            />
            <path 
                d="M50 85C70 85 85 70 85 50C85 35 75 20 55 15V85Z" 
                fill={themeConfig.rightColor} 
                className="transition-colors duration-700"
            />
            
            {/* Kính */}
            <rect x="20" y="38" width="25" height="18" rx="6" fill="white" stroke="#1F2937" strokeWidth="3"/>
            <rect x="55" y="38" width="25" height="18" rx="6" fill="white" stroke="#1F2937" strokeWidth="3"/>
            <path d="M45 47H55" stroke="#1F2937" strokeWidth="3"/>
            
            {/* Mắt */}
            <circle cx="32.5" cy="47" r="4" fill="#1F2937"/>
            <circle cx="67.5" cy="47" r="4" fill="#1F2937"/>
            
            {/* Nụ cười */}
            <path d="M40 70C45 75 55 75 60 70" stroke="white" strokeWidth="3" strokeLinecap="round"/>

            {/* Trang trí theo chủ đề */}
            {themeConfig.decoration}
        </svg>
      </div>

      {showText && (
        <div className={`flex flex-col ${vertical ? 'items-center text-center' : ''}`}>
          <div className={`${currentSize.font} font-black tracking-tight leading-none`}>
            <span 
                className="transition-colors duration-700" 
                style={{ color: eventTheme === 'DEFAULT' ? '#005EB8' : themeConfig.leftColor }}
            >
                Brain
            </span>
            <span 
                className="transition-colors duration-700"
                style={{ color: eventTheme === 'DEFAULT' ? '#F37321' : themeConfig.rightColor }}
            >
                QnA
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[0.35em] font-black text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-[0.25em] whitespace-nowrap">
              {t('common.slogan')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
