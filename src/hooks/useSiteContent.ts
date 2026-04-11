import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';

export function useSiteContent(pageId: string, defaultContent: any) {
  const { language } = useLanguage();
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to fetch language-specific content first, then fallback to base content
    const unsub = onSnapshot(doc(db, 'site_content', pageId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const languageContent = data[`content_${language}`] || data.content || {};
        setContent({ ...defaultContent, ...languageContent });
      } else {
        setContent(defaultContent);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error listening to content for ${pageId}:`, error);
      setLoading(false);
    });

    return () => unsub();
  }, [pageId, language, JSON.stringify(defaultContent)]);

  return { content, loading };
}
