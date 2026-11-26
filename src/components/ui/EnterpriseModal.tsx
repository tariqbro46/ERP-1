import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type EnterpriseModalSize = 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface EnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: EnterpriseModalSize;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  overlayClassName?: string;
  hideCloseButton?: boolean;
  id?: string;
}

const SIZE_CLASSES: Record<EnterpriseModalSize, string> = {
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl',
};

let activeEnterpriseModals = 0;

export function EnterpriseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  headerExtra,
  footer,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  children,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
  overlayClassName,
  hideCloseButton = false,
  id,
}: EnterpriseModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    activeEnterpriseModals += 1;
    document.body.classList.add('erp-modal-open');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      activeEnterpriseModals = Math.max(0, activeEnterpriseModals - 1);
      if (activeEnterpriseModals === 0) {
        document.body.style.overflow = prevOverflow;
        const hasOtherModal = !!document.querySelector('[data-enterprise-modal="true"]');
        if (!hasOtherModal) {
          document.body.classList.remove('erp-modal-open');
        }
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id={id}
      data-enterprise-modal="true"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      className={cn(
        'fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150',
        overlayClassName
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative z-10 w-full bg-card text-card-foreground border border-border rounded-2xl shadow-[var(--shadow-modal)] flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150',
          SIZE_CLASSES[size],
          className
        )}
      >
        {(title || icon || headerExtra || !hideCloseButton) && (
          <div
            className={cn(
              'modal-header flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-border bg-card shrink-0',
              headerClassName
            )}
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              {icon && (
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight leading-snug truncate">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerExtra}
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className={cn('flex-1 overflow-y-auto p-5 sm:p-6 no-scrollbar', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              'px-5 sm:px-6 py-3.5 border-t border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 shrink-0',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
