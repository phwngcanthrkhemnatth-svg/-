import React, { useState } from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  alt?: string;
  priority?: boolean;
}

const SIZE_MAP: Record<string, { img: string; text: string; badge: string }> = {
  xs: { img: 'w-6 h-6', text: 'text-base', badge: 'text-[9px] px-1 py-0.2' },
  sm: { img: 'w-8 h-8', text: 'text-lg', badge: 'text-[9px] px-1.5 py-0.5' },
  md: { img: 'w-10 h-10', text: 'text-xl', badge: 'text-[10px] px-1.5 py-0.5' },
  lg: { img: 'w-12 h-12', text: 'text-2xl', badge: 'text-[11px] px-2 py-0.5' },
  xl: { img: 'w-16 h-16', text: 'text-3xl', badge: 'text-xs px-2.5 py-1' },
  '2xl': { img: 'w-20 h-20', text: 'text-4xl', badge: 'text-xs px-3 py-1' },
};

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  showBadge = false,
  badgeText = 'TH',
  className = '',
  imgClassName = '',
  onClick,
  alt = 'SkillsWop Logo',
}) => {
  const [imgSrc, setImgSrc] = useState('/logo.png');

  const sizeConfig = typeof size === 'string' && SIZE_MAP[size]
    ? SIZE_MAP[size]
    : SIZE_MAP.md;

  const customStyle = typeof size === 'number'
    ? { width: `${size}px`, height: `${size}px` }
    : undefined;

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      onClick={onClick}
    >
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-2xl overflow-hidden transition-all duration-200 ${
          typeof size === 'string' ? sizeConfig.img : ''
        } ${imgClassName}`}
        style={customStyle}
      >
        <img
          src={imgSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(99,102,241,0.35)] transition-transform duration-200 group-hover:scale-105"
          onError={() => {
            // Fallback to SVG if PNG fails
            if (imgSrc !== '/logo.svg') {
              setImgSrc('/logo.svg');
            }
          }}
        />
      </div>

      {showText && (
        <div className="flex items-center gap-1.5 leading-tight">
          <span className={`font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent ${sizeConfig.text}`}>
            SkillsWop
          </span>
          {showBadge && (
            <span className={`font-semibold uppercase rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800 ${sizeConfig.badge}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return content;
};
