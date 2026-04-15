import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';

export function useSubscription() {
  const { company } = useAuth();
  const { subscriptionPlans } = useSettings();
  const { showNotification } = useNotification();

  const activePlan = subscriptionPlans.find(p => p.id === company?.planId);

  const checkLimit = (type: 'vouchers' | 'items' | 'ledgers' | 'users' | 'godowns' | 'multiCurrency' | 'rolePermissions', currentCount?: number) => {
    // 1. Check Custom Limits first (Extra Features & Custom Limits)
    const customLimit = company?.customLimits?.[type];
    
    if (type === 'multiCurrency') {
      const isEnabled = customLimit ?? activePlan?.limits?.multiCurrency;
      if (!isEnabled) {
        showNotification('Multi-Currency is not available in your current plan. Please upgrade.', 'error');
        return false;
      }
      return true;
    }

    if (type === 'rolePermissions') {
      const isEnabled = customLimit ?? activePlan?.limits?.rolePermissions;
      if (!isEnabled) {
        showNotification('Role-based permissions are not available in your current plan. Please upgrade.', 'error');
        return false;
      }
      return true;
    }

    // For numeric limits
    const limit = (customLimit as number) ?? (activePlan?.limits as any)?.[type];
    
    if (limit === undefined) return true;
    if (limit === -1) return true;

    if (currentCount !== undefined && currentCount >= limit) {
      const limitSource = customLimit !== undefined ? 'custom limit' : 'current plan';
      showNotification(`Limit reached: Your ${limitSource} allows up to ${limit} ${type}. Please upgrade your plan.`, 'error');
      return false;
    }

    return true;
  };

  const isFeatureEnabled = (featureId: string) => {
    // Check extra features first
    if (company?.extraFeatures?.includes(featureId)) return true;
    
    if (!activePlan) return true;
    return activePlan.features.includes(featureId);
  };

  return {
    activePlan,
    checkLimit,
    isFeatureEnabled,
    limits: activePlan?.limits
  };
}
