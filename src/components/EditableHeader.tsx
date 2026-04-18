import React, { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface EditableHeaderProps {
  pageId: string;
  defaultTitle: string;
  defaultSubtitle?: string;
  className?: string;
}

export function EditableHeader({ pageId, defaultTitle, defaultSubtitle, className }: EditableHeaderProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHeader() {
      if (!user?.companyId) return;
      try {
        const settings = await erpService.getSettings(user.companyId);
        if (settings?.pageHeaders?.[pageId]) {
          setTitle(settings.pageHeaders[pageId].title || defaultTitle);
          setSubtitle(settings.pageHeaders[pageId].subtitle || defaultSubtitle || '');
        }
      } catch (err) {
        console.error('Error fetching page header:', err);
      }
    }
    fetchHeader();
  }, [user?.companyId, pageId, defaultTitle, defaultSubtitle]);

  const handleSave = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const settings = await erpService.getSettings(user.companyId) || {};
      const pageHeaders = settings.pageHeaders || {};
      pageHeaders[pageId] = { title, subtitle };
      await erpService.updateSettings(user.companyId, { ...settings, pageHeaders });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving page header:', err);
      alert('Failed to save header text.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("group relative", className)}>
      {isEditing ? (
        <div className="space-y-2 bg-white p-4 rounded-lg border border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-2xl font-bold text-gray-900 border-b border-gray-200 focus:border-primary outline-none bg-transparent"
            placeholder="Title"
            autoFocus
          />
          <input
            type="text"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            className="w-full text-sm text-gray-500 border-b border-gray-200 focus:border-primary outline-none bg-transparent"
            placeholder="Subtitle"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="p-1 hover:bg-primary/10 rounded text-primary"
              disabled={loading}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-primary"
            title="Edit Header"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
