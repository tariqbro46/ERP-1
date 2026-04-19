import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportPrintHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function ReportPrintHeader({ title, subtitle, className }: ReportPrintHeaderProps) {
  const settings = useSettings();
  const { company } = useAuth();
  const { language } = useLanguage();

  if (!settings) return null;

  return (
    <div className={cn("hidden print:block mb-8 border-b-2 border-primary/20 pb-6", className)}>
      <div className="flex justify-between items-start gap-8">
        {/* Company Info */}
        <div className="flex-1 space-y-2">
          {settings.showPrintHeader && (
            <h1 className="text-3xl font-black text-primary uppercase tracking-tighter">
              {settings.printHeader || company?.name || 'Your Company'}
            </h1>
          )}
          
          <div className="text-xs font-semibold text-gray-600 space-y-1">
            {settings.showPrintPhone && settings.printPhone && (
              <p>Phone: {settings.printPhone}</p>
            )}
            {settings.showPrintEmail && settings.printEmail && (
              <p>Email: {settings.printEmail}</p>
            )}
            {settings.showPrintWebsite && settings.printWebsite && (
              <p>Website: {settings.printWebsite}</p>
            )}
          </div>
        </div>

        {/* Report Title */}
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 font-medium mt-1 uppercase">{subtitle}</p>}
          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
            Printed on {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ReportPrintFooter() {
  const settings = useSettings();

  if (!settings) return null;

  return (
    <div className="hidden print:block mt-20 pt-10 border-t border-gray-100">
      {/* Signatures */}
      <div className={cn(
        "grid grid-cols-3 gap-12",
        settings.signatureAlignment === 'right' ? "justify-items-end" : 
        settings.signatureAlignment === 'center' ? "justify-items-center" : "justify-items-start"
      )}>
        {settings.showSignature1 && (
          <div className="text-center space-y-2 w-48">
            <div className="h-px bg-gray-300 w-full" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {settings.printSignature1 || 'Authorized Signatory'}
            </p>
          </div>
        )}
        {settings.showSignature2 && (
          <div className="text-center space-y-2 w-48">
            <div className="h-px bg-gray-300 w-full" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {settings.printSignature2 || 'Checked By'}
            </p>
          </div>
        )}
        {settings.showSignature3 && (
          <div className="text-center space-y-2 w-48">
            <div className="h-px bg-gray-300 w-full" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {settings.printSignature3 || 'Receiver Signatory'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Text */}
      {settings.showPrintFooter && settings.printFooter && (
        <div className="mt-12 text-center">
          <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
            {settings.printFooter}
          </p>
        </div>
      )}
    </div>
  );
}
