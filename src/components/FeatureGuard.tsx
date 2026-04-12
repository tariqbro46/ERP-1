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

  // If no plan is found or the feature is not in the plan's features list
  const hasAccess = plan && plan.features.includes(featureId);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 text-center space-y-4 bg-card border border-border rounded-xl">
      <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Feature Restricted</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
          Your current subscription plan does not include this feature.
        </p>
      </div>
      <Link 
        to="/settings/company" 
        className="inline-block px-6 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-all"
      >
        Upgrade Plan
      </Link>
    </div>
  );
};
