import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';
import { normalizeScreenshotUrl } from '../constants/helpContent';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { ImageNotFoundFrame } from './ImageNotFoundFrame';

export interface AppScreenshotCardProps {
  src?: string | null;
  alt: string;
  caption?: string;
  route?: string;
  className?: string;
  imageContainerClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  fallbackSublabel?: string;
  forceLightSurface?: boolean;
  forcePending?: boolean;
  onImageError?: () => void;
  onImageLoad?: (dims: { width: number; height: number }) => void;
}

export const AppScreenshotCard: React.FC<AppScreenshotCardProps> = ({
  src,
  alt,
  caption,
  route,
  className,
  imageContainerClassName,
  imageClassName,
  fallbackClassName,
  fallbackSublabel,
  forceLightSurface = false,
  forcePending = false,
  onImageError,
  onImageLoad,
}) => {
  const { t } = useLanguage();
  const [hasError, setHasError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const normalizedSrc = normalizeScreenshotUrl(src);
  const isImageReady = Boolean(normalizedSrc && !hasError && !forcePending);

  useEffect(() => {
    setHasError(false);
    setIsLightboxOpen(false);
  }, [normalizedSrc, forcePending]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isLightboxOpen]);

  const expandLabel = t('docs.screenshot.clickToExpand');
  const displayCaption =
    !isImageReady && hasError
      ? t('docs.screenshot.loadError')
      : caption || (!isImageReady ? t('docs.screenshot.pendingDesc') : '');

  const lightboxModal =
    isLightboxOpen && isImageReady && normalizedSrc
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-[100] bg-slate-950/88 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 md:p-8"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative w-full max-w-[96vw] max-h-[94vh] flex flex-col rounded-xl border overflow-hidden shadow-2xl',
                forceLightSurface
                  ? 'bg-white border-slate-200/80'
                  : 'bg-white dark:bg-[#0d1320] border-slate-200/80 dark:border-slate-800'
              )}
            >
              <div
                className={cn(
                  'px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0',
                  forceLightSurface
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1320]'
                )}
              >
                <div className="min-w-0 flex flex-wrap items-center gap-2.5">
                  {route && (
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[11px] font-semibold shrink-0',
                        forceLightSurface
                          ? 'bg-blue-50 text-blue-700 border-blue-200/90'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/70'
                      )}
                    >
                      {route}
                    </span>
                  )}
                  {displayCaption && (
                    <p
                      className={cn(
                        'text-xs font-semibold truncate',
                        forceLightSurface ? 'text-slate-950' : 'text-slate-950 dark:text-white'
                      )}
                    >
                      {displayCaption}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  aria-label={t('docs.screenshot.closeLightbox')}
                  className={cn(
                    'p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0',
                    forceLightSurface
                      ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className={cn(
                  'flex-1 min-h-0 overflow-auto p-2.5 sm:p-5 flex items-center justify-center',
                  forceLightSurface ? 'bg-slate-100' : 'bg-slate-100 dark:bg-slate-950'
                )}
              >
                <img
                  src={normalizedSrc}
                  alt={alt}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setHasError(true);
                    setIsLightboxOpen(false);
                    onImageError?.();
                  }}
                  className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-lg"
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <figure
        className={cn(
          'rounded-xl border overflow-hidden',
          forceLightSurface
            ? 'bg-white border-slate-200/90'
            : 'bg-white dark:bg-[#0d1320] border-slate-200/90 dark:border-slate-800',
          className
        )}
      >
        {/* Image (or ImageNotFoundFrame) First — Zero Top Clutter */}
        {isImageReady && normalizedSrc ? (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            title={expandLabel}
            aria-label={`${alt} — ${expandLabel}`}
            className={cn(
              'group relative w-full block cursor-zoom-in focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600/50',
              forceLightSurface ? 'bg-slate-100/70' : 'bg-slate-100/70 dark:bg-slate-950/80',
              imageContainerClassName || 'p-2.5 sm:p-4'
            )}
          >
            <img
              src={normalizedSrc}
              alt={alt}
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                const img = e.currentTarget;
                onImageLoad?.({ width: img.naturalWidth, height: img.naturalHeight });
              }}
              onError={() => {
                setHasError(true);
                onImageError?.();
              }}
              className={cn(
                'w-full h-auto object-contain rounded-lg border mx-auto',
                forceLightSurface
                  ? 'border-slate-200/80 bg-white'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900',
                imageClassName
              )}
            />

            {/* Hover Zoom Symbol Overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/15 group-focus-visible:bg-slate-950/15 transition-colors duration-200"
            >
              <span className="w-11 h-11 rounded-full bg-slate-950/80 text-white border border-white/25 shadow-lg backdrop-blur-xs flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-all duration-200">
                <ZoomIn className="w-5 h-5" />
              </span>
            </div>
          </button>
        ) : (
          <ImageNotFoundFrame
            tone={forceLightSurface ? 'auto' : 'auto'}
            className={cn(
              'w-full rounded-none border-0',
              forceLightSurface && 'bg-slate-50/90 text-slate-600',
              fallbackClassName || 'min-h-[240px] sm:min-h-[300px]'
            )}
            sublabel={fallbackSublabel}
          />
        )}

        {/* Highlighted Route Badge + Caption Below Image (No Redundant App Name) */}
        {(route || displayCaption) && (
          <figcaption
            className={cn(
              'px-4 py-3 border-t text-xs leading-relaxed flex flex-wrap items-center gap-2.5',
              forceLightSurface
                ? 'border-slate-200/80 text-slate-600 bg-white'
                : 'border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            )}
          >
            {route && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[11px] font-semibold tracking-tight shrink-0',
                  forceLightSurface
                    ? 'bg-blue-50 text-blue-700 border-blue-200/90'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/70'
                )}
              >
                {route}
              </span>
            )}
            {displayCaption && <span className="min-w-0 flex-1">{displayCaption}</span>}
          </figcaption>
        )}
      </figure>

      {lightboxModal}
    </>
  );
};

export default AppScreenshotCard;
