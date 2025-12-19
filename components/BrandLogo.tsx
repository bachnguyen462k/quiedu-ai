
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
    sm: { icon: 24, font: 'text-lg' },
    md: { icon: 40, font: 'text-2xl' },
    lg: { icon: 64, font: 'text-4xl' },
    xl: { icon: 120, font: 'text-6xl' }
  };

  const currentSize = sizeMap[size];

  // Logic màu sắc và trang trí theo chủ đề
  const getThemeConfig = () => {
    switch (eventTheme) {
        case 'CHRISTMAS':
            return {
                leftColor: '#D42426', // Đỏ Noel
                rightColor: '#165B33', // Xanh thông
                decoration: (
                    <g transform="translate(45, 5) scale(0.6)">
                        <path d="M0 20 L25 0 L50 20 Z" fill="#D42426" />
                        <circle cx="25" cy="0" r="5" fill="white" />
                        <rect x="0" y="15" width="50" height="8" rx="4" fill="white" />
                    </g>
                )
            };
        case 'TET':
            return {
                leftColor: '#E60000', // Đỏ Tết
                rightColor: '#FFD700', // Vàng mai
                decoration: (
                    <g transform="translate(70, 15) scale(0.5)">
                        <circle cx="20" cy="20" r="15" fill="#FFD700" />
                        <circle cx="20" cy="20" r="5" fill="#E60000" />
                        {[0, 72, 144, 216, 288].map(deg => (
                            <ellipse key={deg} cx="20" cy="5" rx="6" ry="10" fill="#FFD700" transform={`rotate(${deg}, 20, 20)`} />
                        ))}
                    </g>
                )
            };
        case 'AUTUMN':
            return {
                leftColor: '#92400E', // Nâu đất
                rightColor: '#D97706', // Vàng lá úa
                decoration: (
                    <g transform="translate(10, 10) rotate(-15) scale(0.4)">
                         <path d="M20 0 L40 20 L30 20 L40 40 L20 30 L0 40 L10 20 L0 20 Z" fill="#D97706" />
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
    <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-3 ${className}`}>
      <div className="relative">
        <svg 
            width={currentSize.icon} 
            height={currentSize.icon} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0 drop-shadow-sm overflow-visible"
        >
            {/* Logo base */}
            <path 
            d="M50 85C30 85 15 70 15 50C15 35 25 20 45 15C48 14.5 50 16 50 18V85Z" 
            fill={themeConfig.leftColor} 
            className="transition-colors duration-500"
            />
            <path 
            d="M50 85C70 85 85 70 85 50C85 35 75 20 55 15C52 14.5 50 16 50 18V85Z" 
            fill={themeConfig.rightColor} 
            className="transition-colors duration-500"
            />
            
            <path d="M35 30C30 35 30 45 35 50M65 30C70 35 70 45 65 50" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
            
            <g>
            <rect x="20" y="38" width="25" height="18" rx="6" fill="white" stroke="#1F2937" strokeWidth="3"/>
            <rect x="55" y="38" width="25" height="18" rx="6" fill="white" stroke="#1F2937" strokeWidth="3"/>
            <path d="M45 47H55" stroke="#1F2937" strokeWidth="3"/>
            <path d="M18 47H20M80 47H82" stroke="#1F2937" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="32.5" cy="47" r="4" fill="#1F2937"/>
            <circle cx="67.5" cy="47" r="4" fill="#1F2937"/>
            </g>
            <path d="M40 70C45 75 55 75 60 70" stroke="white" strokeWidth="3" strokeLinecap="round"/>

            {/* Decoration based on theme */}
            {themeConfig.decoration}
        </svg>
      </div>

      {showText && (
        <div className={`flex flex-col ${vertical ? 'items-center' : ''}`}>
          <div className={`${currentSize.font} font-black tracking-tight flex`}>
            <span 
                className="transition-colors duration-500" 
                style={{ color: eventTheme === 'DEFAULT' ? '' : themeConfig.leftColor }}
            >
                {eventTheme === 'DEFAULT' ? <span className="text-brand-blue dark:text-blue-400">Brain</span> : 'Brain'}
            </span>
            <span 
                className="transition-colors duration-500"
                style={{ color: eventTheme === 'DEFAULT' ? '' : themeConfig.rightColor }}
            >
                {eventTheme === 'DEFAULT' ? <span className="text-brand-orange">QnA</span> : 'QnA'}
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[0.4em] font-bold text-gray-500 dark:text-gray-400 -mt-1 uppercase tracking-[0.2em] whitespace-nowrap">
              {t('common.slogan')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
