import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const MobileNav: React.FC = () => {
  const settings = useSettings();
  const showMobileNav = settings?.showMobileNav ?? false;

  if (!showMobileNav) return null;

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between md:hidden">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={() => window.history.forward()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go forward"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
      <div className="text-sm font-medium text-gray-500 truncate max-w-[200px]">
        {window.location.pathname.split('/').pop() || 'Dashboard'}
      </div>
    </div>
  );
};
