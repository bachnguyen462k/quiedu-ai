
import React from 'react';
import { Loader2, Snowflake, Sparkles, Leaf } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface ThemeLoaderProps {
  size?: number;
  className?: string;
}

const ThemeLoader: React.FC<ThemeLoaderProps> = ({ size = 24, className = "" }) => {
  const { eventTheme } = useApp();

  switch (eventTheme) {
    case 'CHRISTMAS':
      return <Snowflake size={size} className={`animate-spin text-red-500 dark:text-red-400 ${className}`} style={{ animationDuration: '3s' }} />;
    case 'TET':
      return <Sparkles size={size} className={`animate-pulse text-orange-500 dark:text-orange-400 ${className}`} />;
    case 'AUTUMN':
      return <Leaf size={size} className={`animate-bounce text-amber-600 dark:text-amber-500 ${className}`} />;
    default:
      return <Loader2 size={size} className={`animate-spin text-indigo-600 dark:text-indigo-400 ${className}`} />;
  }
};

export default ThemeLoader;
