import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useSiteContent(pageId: string, defaultContent: any) {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);

  // Use useMemo to stabilize defaultContent if it's an object
  // or just rely on the fact that it changes when language changes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', pageId), (snap) => {
      if (snap.exists()) {
        setContent({ ...defaultContent, ...snap.data().content });
      } else {
        setContent(defaultContent);
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error listening to content for ${pageId}:`, error);
      setLoading(false);
    });

    return () => unsub();
  }, [pageId, JSON.stringify(defaultContent)]);

  return { content, loading };
}
