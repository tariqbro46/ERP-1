import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

// Simple global cache to share listeners for the same pageId across components
const contentCache: Record<string, any> = {};
const listeners: Record<string, {
  unsub: () => void,
  subscribers: Set<(data: any) => void>
}> = {};

export function useSiteContent(pageId: string, defaultContent: any) {
  const { language } = useLanguage();
  const [content, setContent] = useState(contentCache[pageId] || defaultContent);
  const [loading, setLoading] = useState(!contentCache[pageId]);

  useEffect(() => {
    // If we've already cached something, use it as immediate state
    if (contentCache[pageId]) {
      const data = contentCache[pageId];
      const languageContent = data[`content_${language}`] || data.content || {};
      setContent({ ...defaultContent, ...languageContent });
    }

    const updateContext = (data: any) => {
      const languageContent = data[`content_${language}`] || data.content || {};
      setContent({ ...defaultContent, ...languageContent });
      setLoading(false);
    };

    if (!listeners[pageId]) {
      const subscribers = new Set<(data: any) => void>();
      subscribers.add(updateContext);

      const unsub = onSnapshot(doc(db, 'site_content', pageId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          contentCache[pageId] = data;
          subscribers.forEach(cb => cb(data));
        } else {
          subscribers.forEach(cb => cb({}));
        }
      }, (error) => {
        if (!error.message?.includes('Quota exceeded')) {
          console.error(`Error listening to content for ${pageId}:`, error);
        }
        setLoading(false);
      });

      listeners[pageId] = { unsub, subscribers };
    } else {
      listeners[pageId].subscribers.add(updateContext);
      if (contentCache[pageId]) {
        updateContext(contentCache[pageId]);
      }
    }

    return () => {
      if (listeners[pageId]) {
        listeners[pageId].subscribers.delete(updateContext);
        if (listeners[pageId].subscribers.size === 0) {
          listeners[pageId].unsub();
          delete listeners[pageId];
        }
      }
    };
  }, [pageId, language]); // Removed defaultContent dependency to prevent infinite loops

  return { content, loading };
}
