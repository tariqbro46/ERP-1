import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { erpService } from '../services/erpService';
import { MenuConfig } from '../types';
import { EditableHeader } from './EditableHeader';

export const GroupDashboard: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const [menuConfig, setMenuConfig] = React.useState<MenuConfig | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
      setMenuConfig(config);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const group = menuConfig?.groups.find(g => g.id === groupId || g.group.toLowerCase() === groupId?.toLowerCase());

  if (!group) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Group Not Found</h2>
        <p className="text-muted-foreground">The requested menu group could not be found.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <EditableHeader 
          pageId={`group_${groupId}`}
          defaultTitle={group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey) : group.group}
          defaultSubtitle="Quick access to all items in this section."
        />
        {isSuperAdmin && (
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mt-2 mb-2">Hidden from sidebar</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {group.items.filter(item => {
          // Hide specific items from Reports group dashboard as requested
          if (group.id === 'group-reports' || group.group.toLowerCase() === 'reports') {
            const itemsToHide = ['Balance Sheet', 'Profit & Loss', 'Stock Summary', 'Ratio Analysis', 'Display More Reports'];
            if (itemsToHide.includes(item.label)) return false;
          }
          
          return true;
        }).map((item, index) => {
          const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Package;
          
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.to}
                className="flex items-center gap-4 p-6 bg-card border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150" />
                
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors relative z-10">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                
                <div className="flex-1 relative z-10">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                  </h3>
                  {item.hidden && isSuperAdmin && (
                    <p className="text-[8px] uppercase font-bold text-gray-400 tracking-widest mt-0.5">
                      Hidden from sidebar
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    Open {item.label}
                  </p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors relative z-10" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
