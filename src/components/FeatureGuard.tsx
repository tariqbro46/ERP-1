import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGuardProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({ featureId, children, fallback }) => {
  const { company, isSuperAdmin } = useAuth();
  const { subscriptionPlans } = useSettings();

  // Super admins have access to everything
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  if (!company) {
    return null;
  }

  // Find the company's plan
  const plan = subscriptionPlans.find(p => p.id === company.planId);

  // Check if feature is in plan or granted as extra
  const hasAccess = (plan && plan.features.includes(featureId)) || 
                    (company.extraFeatures?.includes(featureId));

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-12 text-center space-y-6 bg-card border border-border rounded-2xl shadow-sm max-w-lg mx-auto my-8">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
        <ShieldAlert className="w-8 h-8 text-primary" />
      </div>
      <div className="space-y-3">
        <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">Premium Feature</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
          This feature is not included in your current <span className="text-primary font-bold">{plan?.name || 'Free'}</span> plan. 
          Upgrade your subscription to unlock this and many other powerful tools.
        </p>
      </div>
      <div className="pt-4">
        <Link 
          to="/subscription" 
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          View Upgrade Options
        </Link>
      </div>
    </div>
  );
};
