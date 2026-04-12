import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';

export function useSubscription() {
  const { company } = useAuth();
  const { subscriptionPlans } = useSettings();
  const { showNotification } = useNotification();

  const activePlan = subscriptionPlans.find(p => p.id === company?.planId);

  const checkLimit = (type: 'vouchers' | 'items' | 'ledgers' | 'users' | 'godowns' | 'multiCurrency' | 'rolePermissions', currentCount?: number) => {
    if (!activePlan) return true;

    const limits = activePlan.limits;
    if (!limits) return true;

    if (type === 'multiCurrency') {
      if (!limits.multiCurrency) {
        showNotification('Multi-Currency is not available in your current plan. Please upgrade.', 'error');
        return false;
      }
      return true;
    }

    if (type === 'rolePermissions') {
      if (!limits.rolePermissions) {
        showNotification('Role-based permissions are not available in your current plan. Please upgrade.', 'error');
        return false;
      }
      return true;
    }

    const limit = (limits as any)[type];
    if (limit === -1) return true;

    if (currentCount !== undefined && currentCount >= limit) {
      showNotification(`Limit reached: Your current plan allows up to ${limit} ${type}. Please upgrade your plan.`, 'error');
      return false;
    }

    return true;
  };

  const isFeatureEnabled = (featureId: string) => {
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
