import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';
import { AVAILABLE_FEATURES } from '../constants/features';

export function useSubscription() {
  const { company } = useAuth();
  const { subscriptionPlans } = useSettings();
  const settings = useSettings();
  const { showNotification } = useNotification();

    const activePlan = subscriptionPlans.find(p => p.id === company?.planId);
  
    const checkLimit = React.useCallback((type: 'vouchers' | 'items' | 'ledgers' | 'users' | 'godowns' | 'multiCurrency' | 'rolePermissions', currentCount?: number) => {
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
    }, [company, activePlan, showNotification]);

    const isFeatureEnabled = React.useCallback((featureId: string) => {
      // 0. Check settings toggles first for advanced modules
      const { 
        enableTax, 
        enableCRM, 
        enableSupplyChain, 
        enableInventory, 
        enableDataExport, 
        enableAI 
      } = settings;
  
      const settingsMap: Record<string, boolean> = {
        enableTax,
        enableCRM,
        enableSupplyChain,
        enableInventory,
        enableDataExport,
        enableAI
      };
  
      if (settingsMap[featureId] === false) return false;
      if (settingsMap[featureId] === true) return true;
  
      // Check extra features first
      if (company?.extraFeatures?.includes(featureId)) return true;
      
      if (!activePlan) return true;
  
      const planFeatures = activePlan.features || [];
      
      // 1. Direct match (e.g., 'pay' or 'pay_masters')
      if (planFeatures.includes(featureId)) return true;
      
      // 2. If featureId is a broad ID (like 'pay'), check if any granular ID that maps to this broad ID is enabled in the plan
      const granularIdsForBroadId = AVAILABLE_FEATURES
        .filter(f => f.subscriptionFeatureId === featureId)
        .map(f => f.id);
        
      if (granularIdsForBroadId.some(gid => planFeatures.includes(gid))) return true;
  
      // 3. If featureId is a granular ID (like 'pay_masters'), check if its broad ID ('pay') is enabled in the plan
      const featureProfile = AVAILABLE_FEATURES.find(f => f.id === featureId);
      if (featureProfile?.subscriptionFeatureId && planFeatures.includes(featureProfile.subscriptionFeatureId)) return true;
  
      // 4. Special case: If it's a Gold or Platinum plan, grant broad access to modules if they aren't explicitly excluded
      if (activePlan.tier >= 3) {
        const payrollFeatures = ['pay', 'pay_masters', 'pay_transactions', 'pay_reports'];
        if (payrollFeatures.includes(featureId)) return true;
  
        const orderFeatures = ['ord', 'ord_create', 'ord_process', 'ord_reports'];
        if (orderFeatures.includes(featureId)) return true;
  
        const machineFeatures = ['mac', 'mac_manage', 'mac_production'];
        if (machineFeatures.includes(featureId)) return true;
  
        const analyticsFeatures = ['adv_reports', 'ana_ratio', 'ana_cashflow', 'ana_ageing', 'insights'];
        if (analyticsFeatures.includes(featureId)) return true;
      }
  
      return false;
    }, [settings, company, activePlan]);
  
    return React.useMemo(() => ({
      activePlan,
      checkLimit,
      isFeatureEnabled,
      limits: activePlan?.limits
    }), [activePlan, checkLimit, isFeatureEnabled]);
  }
