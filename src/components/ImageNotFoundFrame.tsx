import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export interface ImageNotFoundFrameProps {
  className?: string;
  compact?: boolean;
  label?: string;
  sublabel?: string;
  tone?: 'auto' | 'dark';
}

export const ImageNotFoundFrame: React.FC<ImageNotFoundFrameProps> = ({
  className,
  compact = false,
  label,
  sublabel,
  tone = 'auto',
}) => {
  const { t } = useLanguage();
  const resolvedLabel = label || t('common.imageNotFound');
  const isDarkForced = tone === 'dark';

  return (
    <div
      role="img"
      aria-label={resolvedLabel}
      className={cn(
        'relative flex flex-col items-center justify-center text-center select-none overflow-hidden rounded-lg border',
        isDarkForced
          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
          : 'bg-slate-50/90 dark:bg-[#0d1320] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300',
        compact ? 'p-1.5 gap-1' : 'p-6 sm:p-8 gap-2.5',
        className
      )}
    >
      {/* Subtle Inner Image-Frame Corner Brackets */}
      {!compact && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-3">
          <span
            className={cn(
              'absolute top-0 left-0 w-2.5 h-2.5 border-t border-l',
              isDarkForced ? 'border-slate-700' : 'border-slate-300/90 dark:border-slate-700'
            )}
          />
          <span
            className={cn(
              'absolute top-0 right-0 w-2.5 h-2.5 border-t border-r',
              isDarkForced ? 'border-slate-700' : 'border-slate-300/90 dark:border-slate-700'
            )}
          />
          <span
            className={cn(
              'absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l',
              isDarkForced ? 'border-slate-700' : 'border-slate-300/90 dark:border-slate-700'
            )}
          />
          <span
            className={cn(
              'absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r',
              isDarkForced ? 'border-slate-700' : 'border-slate-300/90 dark:border-slate-700'
            )}
          />
        </div>
      )}

      {/* Symbol on Top */}
      <div
        className={cn(
          'flex items-center justify-center border shrink-0',
          isDarkForced
            ? 'bg-slate-950/90 border-slate-700 text-slate-400'
            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-700 text-slate-400 dark:text-slate-500',
          compact ? 'w-6 h-6 rounded-md' : 'w-11 h-11 rounded-xl'
        )}
      >
        <ImageOff className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
      </div>

      {/* "image not found" Text Directly Below */}
      <span
        className={cn(
          'font-mono font-medium tracking-[0.02em] leading-tight',
          isDarkForced ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300',
          compact ? 'text-[8.5px] leading-[1.15] px-0.5' : 'text-xs sm:text-[13px]'
        )}
      >
        {resolvedLabel}
      </span>

      {/* Optional Quiet Sublabel */}
      {!compact && sublabel && (
        <p
          className={cn(
            'text-[11.5px] max-w-md leading-relaxed',
            isDarkForced ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
          )}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
};

export interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
  compact?: boolean;
  fallbackLabel?: string;
  fallbackSublabel?: string;
  fallbackTone?: 'auto' | 'dark';
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt = '',
  className,
  fallbackClassName,
  compact = false,
  fallbackLabel,
  fallbackSublabel,
  fallbackTone = 'auto',
  onError,
  referrerPolicy = 'no-referrer',
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const trimmedSrc = typeof src === 'string' ? src.trim() : '';

  if (!trimmedSrc || hasError) {
    return (
      <ImageNotFoundFrame
        className={fallbackClassName || className}
        compact={compact}
        label={fallbackLabel}
        sublabel={fallbackSublabel}
        tone={fallbackTone}
      />
    );
  }

  return (
    <img
      src={trimmedSrc}
      alt={alt}
      referrerPolicy={referrerPolicy}
      className={className}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
};

export default ImageNotFoundFrame;
