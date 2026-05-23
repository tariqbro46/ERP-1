import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { Loader2, RefreshCw, Cpu, Database, Network, CircleDot } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoaderContextType {
  isLoading: boolean;
  currentPhrase: string;
  startLoader: (actionLabel?: string, duration?: number) => void;
  stopLoader: () => void;
  withLoader: <T>(promise: Promise<T> | (() => Promise<T>), actionLabel?: string) => Promise<T>;
}

const LoaderContext = createContext<LoaderContextType>({
  isLoading: false,
  currentPhrase: '',
  startLoader: () => {},
  stopLoader: () => {},
  withLoader: async (promise) => {
    if (typeof promise === 'function') return promise();
    return promise;
  }
});

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const { loaderBlurStyle = 'md', loaderIconStyle = 'spinner', loaderPhrases, loaderTheme = 'glass' } = useSettings();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phraseIndexRef = useRef(0);

  const getPhrases = (customLabel?: string): string[] => {
    // If a custom label is provided like "Saving Voucher", we can generate adaptive steps!
    if (customLabel) {
      return [
        `Connecting for ${customLabel}...`,
        `Requesting server to ${customLabel.toLowerCase()}...`,
        `Waiting for response...`,
        `Almost Done...`,
        `Done! Here we go.`
      ];
    }

    // Default or customized via settings
    if (loaderPhrases) {
      return loaderPhrases.split(',').map(p => p.trim()).filter(Boolean);
    }

    return [
      'Connecting to server...',
      'Requesting to server...',
      'Waiting for response...',
      'Almost Done...',
      'Here We go!'
    ];
  };

  const startLoader = (actionLabel?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const phrases = getPhrases(actionLabel);
    phraseIndexRef.current = 0;
    setCurrentPhrase(phrases[0] || 'Processing...');
    setIsLoading(true);

    // Transition phrases every 800ms to 1200ms to look realistic & progressive
    timerRef.current = setInterval(() => {
      phraseIndexRef.current += 1;
      if (phraseIndexRef.current < phrases.length) {
        setCurrentPhrase(phrases[phraseIndexRef.current]);
      } else {
        // Loop back or stay at "Almost done"
        setCurrentPhrase(phrases[phrases.length - 1]);
      }
    }, 1000);
  };

  const stopLoader = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsLoading(false);
    setCurrentPhrase('');
  };

  const withLoader = async <T,>(
    promise: Promise<T> | (() => Promise<T>),
    actionLabel?: string
  ): Promise<T> => {
    startLoader(actionLabel);
    try {
      const result = await (typeof promise === 'function' ? promise() : promise);
      // Give a tiny 400ms lag to let the "Done" state be visible before disappearing
      const phrases = getPhrases(actionLabel);
      setCurrentPhrase(phrases[phrases.length - 1]);
      await new Promise(resolve => setTimeout(resolve, 400));
      return result;
    } finally {
      stopLoader();
    }
  };

  const [previewConfigs, setPreviewConfigs] = useState<{
    blur?: any;
    icon?: any;
    phrases?: string;
    theme?: any;
  } | null>(null);

  useEffect(() => {
    const handleMockLoader = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      
      setPreviewConfigs({
        blur: detail.blur,
        icon: detail.icon,
        phrases: detail.phrases,
        theme: detail.theme
      });

      const phrasesStr = detail.phrases || '';
      const phrases = phrasesStr.split(',').map((p: string) => p.trim()).filter(Boolean);
      const defaultPhrases = [
        'Connecting to server...',
        'Requesting to server...',
        'Waiting for response...',
        'Almost Done...',
        'Here We go!'
      ];
      const activePhrases = phrases.length > 0 ? phrases : defaultPhrases;

      setIsLoading(true);
      setCurrentPhrase(activePhrases[0]);
      
      let index = 0;
      const interval = setInterval(() => {
        index += 1;
        if (index < activePhrases.length) {
          setCurrentPhrase(activePhrases[index]);
        } else {
          setCurrentPhrase(activePhrases[activePhrases.length - 1]);
        }
      }, 700);

      setTimeout(() => {
        clearInterval(interval);
        setIsLoading(false);
        setCurrentPhrase('');
        setPreviewConfigs(null);
      }, 3500);
    };

    window.addEventListener('trigger-mock-loader', handleMockLoader as any);
    return () => {
      window.removeEventListener('trigger-mock-loader', handleMockLoader as any);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Blur styles mapper
  const blurClasses = {
    none: '',
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  // Theme style mapper
  const themeClasses = {
    light: 'bg-white/80 border-gray-100 text-gray-800 shadow-xl',
    dark: 'bg-black/80 border-gray-900 text-gray-100 shadow-2xl',
    glass: 'bg-background/40 backdrop-blur-md border-border/50 text-foreground shadow-lg'
  };

  const activeBlur = previewConfigs?.blur || loaderBlurStyle;
  const activeIcon = previewConfigs?.icon || loaderIconStyle;
  const activeTheme = previewConfigs?.theme || loaderTheme;

  return (
    <LoaderContext.Provider value={{ isLoading, currentPhrase, startLoader, stopLoader, withLoader }}>
      {children}
      
      {isLoading && (
        <div 
          id="global-loading-screen"
          className={cn(
            "fixed inset-0 z-[10000] flex items-center justify-center transition-all duration-300",
            blurClasses[activeBlur] || 'backdrop-blur-md',
            activeTheme === 'dark' ? 'bg-black/30' : 'bg-background/20'
          )}
        >
          {/* Centered customizable Loading Icon */}
          <div className="flex flex-col items-center gap-3">
            {activeIcon === 'spinner' && (
              <Loader2 className="w-10 h-10 animate-spin text-primary stroke-[1.5]" />
            )}
            {activeIcon === 'dots' && (
              <div className="flex items-center gap-1.5 h-10">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
              </div>
            )}
            {activeIcon === 'circle-bar' && (
              <div className="relative w-12 h-12 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary/80 stroke-[2]" />
                <CircleDot className="absolute w-4 h-4 text-primary animate-pulse" />
              </div>
            )}
            {activeIcon === 'quantum' && (
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-t-primary rounded-full animate-spin" />
                <div className="absolute inset-2 border-2 border-dashed border-primary/40 rounded-full animate-spin [animation-duration:3s]" />
                <Cpu className="w-4 h-4 text-primary animate-pulse" />
              </div>
            )}
          </div>

          {/* Bottom Right Corner Adaptive Loading text */}
          <div 
            className={cn(
              "absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border font-mono text-[11px] uppercase tracking-widest transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
              themeClasses[activeTheme] || themeClasses.glass
            )}
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-black tracking-tighter">PROGRESS STATUS</span>
              <span className="text-foreground font-bold">{currentPhrase}</span>
            </div>
          </div>
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export const useLoader = () => useContext(LoaderContext);
