
import React from 'react';

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
  const sizeMap = {
    sm: { icon: 24, font: 'text-lg' },
    md: { icon: 40, font: 'text-2xl' },
    lg: { icon: 64, font: 'text-4xl' },
    xl: { icon: 120, font: 'text-6xl' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-3 ${className}`}>
      {/* Brain Icon SVG */}
      <svg 
        width={currentSize.icon} 
        height={currentSize.icon} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        {/* Blue Half (Left) */}
        <path 
          d="M50 85C30 85 15 70 15 50C15 35 25 20 45 15C48 14.5 50 16 50 18V85Z" 
          fill="#005EB8" 
        />
        {/* Orange Half (Right) */}
        <path 
          d="M50 85C70 85 85 70 85 50C85 35 75 20 55 15C52 14.5 50 16 50 18V85Z" 
          fill="#F37321" 
        />
        {/* Brain Details */}
        <path d="M35 30C30 35 30 45 35 50M65 30C70 35 70 45 65 50" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
        
        {/* Glasses */}
        <g>
          <rect x="20" y="38" width="25" height="18" rx="6" fill="white" stroke="#1F2937" strokeWidth="3"/>
          <rect x="55" y="38" width="25" height="18" rx="6" fill="white" stroke="#1F2937" strokeWidth="3"/>
          <path d="M45 47H55" stroke="#1F2937" strokeWidth="3"/>
          <path d="M18 47H20M80 47H82" stroke="#1F2937" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32.5" cy="47" r="4" fill="#1F2937"/>
          <circle cx="67.5" cy="47" r="4" fill="#1F2937"/>
        </g>
        
        {/* Smile */}
        <path d="M40 70C45 75 55 75 60 70" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      </svg>

      {showText && (
        <div className={`flex flex-col ${vertical ? 'items-center' : ''}`}>
          <div className={`${currentSize.font} font-black tracking-tight flex`}>
            {/* Sử dụng CSS variable hoặc class để text Brain có màu xanh dễ nhìn hơn trong dark mode */}
            <span className="text-brand-blue dark:text-blue-400 transition-colors">Brain</span>
            <span className="text-brand-orange transition-colors">QnA</span>
          </div>
          {size !== 'sm' && (
            <span className="text-[0.4em] font-bold text-gray-500 dark:text-gray-400 -mt-1 uppercase tracking-[0.2em] whitespace-nowrap">
              Hỏi trước - Nhớ lâu - Hiểu sâu
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
