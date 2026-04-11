import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useSiteContent(pageId: string, defaultContent: any) {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', pageId), (snap) => {
      if (snap.exists()) {
        setContent({ ...defaultContent, ...snap.data().content });
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error listening to content for ${pageId}:`, error);
      setLoading(false);
    });

    return () => unsub();
  }, [pageId]);

  return { content, loading };
}
