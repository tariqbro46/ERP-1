import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  CheckSquare,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  EyeOff,
  FileImage,
  Globe,
  GripVertical,
  Info,
  LayoutDashboard,
  LayoutGrid,
  ListTree,
  Loader2,
  Package,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Square,
  Trash2,
  UserCog,
  Volume2,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { NAV_ITEMS } from '../../constants/navigation';
import { FeatureCategory } from '../../constants/features';
import { DEFAULT_APP_BRANDING } from '../../constants/appIdentity';
import { erpService, deduplicateMenuConfig } from '../../services/erpService';
import { soundService } from '../../services/soundService';
import { useSettings, SIDEBAR_BG_OPTIONS, SIDEBAR_TEXT_OPTIONS } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { MenuConfig, MenuGroupConfig, MenuItemConfig, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface FounderSystemSettingsViewProps {
  currentUser: UserProfile | null;
  onDirtyChange: (dirty: boolean) => void;
  onNavigateAppBranding?: () => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FounderSystemSettingsView: React.FC<FounderSystemSettingsViewProps> = ({
  currentUser,
  onDirtyChange,
  onNavigateAppBranding,
  showNotification,
}) => {
  const { language } = useLanguage();
  const {
    appIdentity,
    appFeatures,
    updateSystemSettings,
    updateFeaturesSettings,
    showGoToShortcut,
    showTopbarSearch,
    showTopbarNotifications,
    showTopbarInstructions,
    appVersion,
    developerContactText,
    developerContactAlignment,
    maintenanceEnabled,
    maintenanceEndTime,
    maintenanceReason,
    maintenanceUpdates,
    alterPageUiStyle,
    reportsPageUiStyle,
    reportsColumnsPerRow,
    searchPageUiStyle,
    alterColumnsPerRow,
    enableUserSortViewPref,
    uiStyle,
    glassBackground,
    statusOnlineText,
    statusOfflineText,
    statusErrorText,
    notificationDuration,
    notificationAnimationStyle,
    notificationStyle,
    notificationPosition,
    searchPlaceholder,
    searchHelpText,
    showSearchShortcut,
    globalDashboardDesign,
    menuBarStyle,
    loaderBlurStyle,
    loaderIconStyle,
    loaderPhrases,
    loaderTheme,
    showQuickCalculator,
    showPinnedBookmarks,
    customControlCenterTheme,
    customWelcomeMessage,
    splashSubDesign,
    adaptiveLoaderEnabled,
    sidebarBgColor,
    sidebarTextColor,
    skeletonEnabled,
    skeletonDashboardOnly,
    skeletonType,
    skeletonSpeed,
    skeletonTheme,
    skeletonRows,
    skeletonWaveColor,
    voucherLayout,
    voucherFieldSize,
    warningSelectItemsInPhysicalStock,
    warningInvalidQtyInPhysicalStock,
    warningPrefixSelectFill,
    warningPartyName,
    warningSupplierName,
    warningSalesLedger,
    warningPurchaseLedger,
    warningItemsListEmpty,
    warningItemNameEmpty,
    warningQuantityEmpty,
    warningRateEmpty,
    warningConsumptionItems,
    warningSourceItemName,
    warningSourceItemQty,
    warningProductionItems,
    warningDestItemName,
    warningDestItemQty,
    warningSingleAccount,
    warningSingleParticulars,
    warningSingleAmount,
    warningJournalLedgerName,
    warningJournalDebitCreditAmount,
    warningJournalNotBalanced,
    soundEnabled,
    soundVolume,
    soundScheme,
    soundSuccess,
    soundError,
    soundWarning,
    soundDelete,
    soundClick,
    soundNavigation,
  } = useSettings();

  const [subTab, setSubTab] = useState<'global' | 'menu' | 'features'>('global');
  const [systemSubTab, setSystemSubTab] = useState<
    'general' | 'theme' | 'notifications' | 'search' | 'loader' | 'skeleton' | 'warnings' | 'sounds'
  >('general');
  const [settingsFilterQuery, setSettingsFilterQuery] = useState('');
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const [isSavingAppVersion, setIsSavingAppVersion] = useState(false);

  // Global config snapshot & draft
  const initialGlobalSnapshot = useMemo(
    () => ({
      maintenanceEnabled: maintenanceEnabled || false,
      maintenanceEndTime: maintenanceEndTime || '',
      maintenanceReason: maintenanceReason || '',
      maintenanceUpdates: maintenanceUpdates || '',
      statusOnlineText: statusOnlineText || 'Status: Online',
      statusOfflineText: statusOfflineText || 'Status: Offline',
      statusErrorText: statusErrorText || 'Database Error',
      appVersion: appVersion || 'v1.8.5',
      developerContactText: developerContactText || appIdentity.softwareFooterText || DEFAULT_APP_BRANDING.softwareFooterText,
      developerContactAlignment: (developerContactAlignment || appIdentity.softwareFooterAlignment || 'center') as 'left' | 'center' | 'right',
      uiStyle: uiStyle || 'UI/UX 1',
      menuBarStyle: menuBarStyle || 'classic',
      alterPageUiStyle: alterPageUiStyle || 'classic',
      reportsPageUiStyle: reportsPageUiStyle || 'classic',
      searchPageUiStyle: searchPageUiStyle || 'classic',
      reportsColumnsPerRow: reportsColumnsPerRow || 4,
      alterColumnsPerRow: alterColumnsPerRow || 3,
      enableUserSortViewPref: enableUserSortViewPref || false,
      sidebarBgColor: sidebarBgColor || 'default',
      sidebarTextColor: sidebarTextColor || 'default',
      glassBackground: glassBackground || 'default',
      notificationDuration: notificationDuration || 5000,
      notificationAnimationStyle: notificationAnimationStyle || 'default',
      notificationStyle: notificationStyle || 'default',
      notificationPosition: notificationPosition || 'bottom-right',
      showGoToShortcut: showGoToShortcut ?? true,
      showTopbarSearch: showTopbarSearch ?? true,
      showTopbarNotifications: showTopbarNotifications ?? true,
      showTopbarInstructions: showTopbarInstructions ?? true,
      searchPlaceholder: searchPlaceholder || '',
      searchHelpText: searchHelpText || '',
      showSearchShortcut: showSearchShortcut ?? true,
      dashboardDesign: globalDashboardDesign || 'Design 1',
      loaderBlurStyle: loaderBlurStyle || 'md',
      loaderIconStyle: loaderIconStyle || 'spinner',
      loaderPhrases: loaderPhrases || 'Connecting to server, Requesting data, Waiting for response, Almost done, Here we go!',
      loaderTheme: loaderTheme || 'glass',
      adaptiveLoaderEnabled: adaptiveLoaderEnabled ?? true,
      showQuickCalculator: showQuickCalculator ?? true,
      showPinnedBookmarks: showPinnedBookmarks ?? true,
      customControlCenterTheme: customControlCenterTheme || 'emerald',
      customWelcomeMessage: customWelcomeMessage || 'Executive Command Center',
      splashSubDesign: splashSubDesign || 'grid',
      skeletonEnabled: skeletonEnabled ?? true,
      skeletonDashboardOnly: skeletonDashboardOnly ?? true,
      skeletonType: skeletonType || 'automatic',
      skeletonSpeed: skeletonSpeed || 'normal',
      skeletonTheme: skeletonTheme || 'modern',
      skeletonRows: skeletonRows ?? 5,
      skeletonWaveColor: skeletonWaveColor || 'indigo',
      voucherLayout: voucherLayout || 'Layout 1',
      voucherFieldSize: voucherFieldSize || 'medium',
      warningSelectItemsInPhysicalStock: warningSelectItemsInPhysicalStock || 'Please select Item Name in the item table.',
      warningInvalidQtyInPhysicalStock: warningInvalidQtyInPhysicalStock || 'Please fill in a valid Quantity for all selected items.',
      warningPrefixSelectFill: warningPrefixSelectFill || 'Please select or fill in:',
      warningPartyName: warningPartyName || 'Party Name',
      warningSupplierName: warningSupplierName || 'Supplier Name',
      warningSalesLedger: warningSalesLedger || 'Sales Ledger',
      warningPurchaseLedger: warningPurchaseLedger || 'Purchase Ledger',
      warningItemsListEmpty: warningItemsListEmpty || 'Items List (Please add at least one item)',
      warningItemNameEmpty: warningItemNameEmpty || 'Item Name',
      warningQuantityEmpty: warningQuantityEmpty || 'Quantity (for all items)',
      warningRateEmpty: warningRateEmpty || 'Rate (for all items)',
      warningConsumptionItems: warningConsumptionItems || 'Consumption Items',
      warningSourceItemName: warningSourceItemName || 'Source Item Name',
      warningSourceItemQty: warningSourceItemQty || 'Source Item Quantity',
      warningProductionItems: warningProductionItems || 'Production Items',
      warningDestItemName: warningDestItemName || 'Destination Item Name',
      warningDestItemQty: warningDestItemQty || 'Destination Item Quantity',
      warningSingleAccount: warningSingleAccount || 'Account (Bank/Cash)',
      warningSingleParticulars: warningSingleParticulars || 'Particulars Ledger',
      warningSingleAmount: warningSingleAmount || 'Amount for Particulars',
      warningJournalLedgerName: warningJournalLedgerName || 'Please select Ledger Name under Particulars.',
      warningJournalDebitCreditAmount: warningJournalDebitCreditAmount || 'Please enter Debit or Credit Amount.',
      warningJournalNotBalanced:
        warningJournalNotBalanced || 'Voucher is not balanced. Difference: ৳ {DIFF} (Debit: ৳ {DEBIT}, Credit: ৳ {CREDIT})',
      soundEnabled: soundEnabled ?? true,
      soundVolume: soundVolume ?? 0.5,
      soundScheme: soundScheme || 'system',
      soundSuccess: soundSuccess || '',
      soundError: soundError || '',
      soundWarning: soundWarning || '',
      soundDelete: soundDelete || '',
      soundClick: soundClick || '',
      soundNavigation: soundNavigation || '',
    }),
    [
      maintenanceEnabled,
      maintenanceEndTime,
      maintenanceReason,
      maintenanceUpdates,
      statusOnlineText,
      statusOfflineText,
      statusErrorText,
      appVersion,
      developerContactText,
      developerContactAlignment,
      appIdentity.softwareFooterText,
      appIdentity.softwareFooterAlignment,
      uiStyle,
      menuBarStyle,
      alterPageUiStyle,
      reportsPageUiStyle,
      searchPageUiStyle,
      reportsColumnsPerRow,
      alterColumnsPerRow,
      enableUserSortViewPref,
      sidebarBgColor,
      sidebarTextColor,
      glassBackground,
      notificationDuration,
      notificationAnimationStyle,
      notificationStyle,
      notificationPosition,
      showGoToShortcut,
      showTopbarSearch,
      showTopbarNotifications,
      showTopbarInstructions,
      searchPlaceholder,
      searchHelpText,
      showSearchShortcut,
      globalDashboardDesign,
      loaderBlurStyle,
      loaderIconStyle,
      loaderPhrases,
      loaderTheme,
      adaptiveLoaderEnabled,
      showQuickCalculator,
      showPinnedBookmarks,
      customControlCenterTheme,
      customWelcomeMessage,
      splashSubDesign,
      skeletonEnabled,
      skeletonDashboardOnly,
      skeletonType,
      skeletonSpeed,
      skeletonTheme,
      skeletonRows,
      skeletonWaveColor,
      voucherLayout,
      voucherFieldSize,
      warningSelectItemsInPhysicalStock,
      warningInvalidQtyInPhysicalStock,
      warningPrefixSelectFill,
      warningPartyName,
      warningSupplierName,
      warningSalesLedger,
      warningPurchaseLedger,
      warningItemsListEmpty,
      warningItemNameEmpty,
      warningQuantityEmpty,
      warningRateEmpty,
      warningConsumptionItems,
      warningSourceItemName,
      warningSourceItemQty,
      warningProductionItems,
      warningDestItemName,
      warningDestItemQty,
      warningSingleAccount,
      warningSingleParticulars,
      warningSingleAmount,
      warningJournalLedgerName,
      warningJournalDebitCreditAmount,
      warningJournalNotBalanced,
      soundEnabled,
      soundVolume,
      soundScheme,
      soundSuccess,
      soundError,
      soundWarning,
      soundDelete,
      soundClick,
      soundNavigation,
    ]
  );

  const [draft, setDraft] = useState(initialGlobalSnapshot);
  const isGlobalDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialGlobalSnapshot),
    [draft, initialGlobalSnapshot]
  );

  useEffect(() => {
    if (!isGlobalDirty) {
      setDraft(initialGlobalSnapshot);
    }
  }, [initialGlobalSnapshot]);

  // Features draft
  const [editableFeatures, setEditableFeatures] = useState<FeatureCategory[]>([]);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);

  useEffect(() => {
    if (subTab === 'features' && appFeatures.length > 0) {
      setEditableFeatures(JSON.parse(JSON.stringify(appFeatures)));
    }
  }, [subTab, appFeatures]);

  const isFeaturesDirty = useMemo(() => {
    if (subTab !== 'features') return false;
    return JSON.stringify(editableFeatures) !== JSON.stringify(appFeatures);
  }, [subTab, editableFeatures, appFeatures]);

  useEffect(() => {
    onDirtyChange(isGlobalDirty || isFeaturesDirty);
  }, [isGlobalDirty, isFeaturesDirty, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange(false);
  }, [onDirtyChange]);

  // Dynamic Menu state (subscribed ONLY while subTab === 'menu')
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);
  const [menuBusy, setMenuBusy] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroupConfig | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<{ groupId: string; item: MenuItemConfig } | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [confirmResetMenu, setConfirmResetMenu] = useState(false);

  useEffect(() => {
    if (subTab !== 'menu') return;
    let mounted = true;
    erpService.getMenuConfig().then((cfg) => {
      if (mounted && cfg) setMenuConfig(cfg);
    }).catch(() => {});
    const unsubscribe = erpService.subscribeToMenuConfig((cfg) => {
      if (cfg) setMenuConfig(cfg);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [subTab]);

  const displayMenuGroups = useMemo(() => {
    if (!menuConfig) return [];
    const cleaned = deduplicateMenuConfig(menuConfig);
    return cleaned ? cleaned.groups : [];
  }, [menuConfig]);

  const seedInitialMenu = async () => {
    try {
      setMenuBusy(true);
      const initialGroups: MenuGroupConfig[] = NAV_ITEMS.map((group) => ({
        id: group.id,
        group: group.group,
        groupKey: group.groupKey,
        items: group.items.map((item) => {
          const menuItem: MenuItemConfig = {
            id: item.id,
            to: item.to,
            icon: item.iconName,
            label: item.label,
            labelKey: item.labelKey,
            hidden: item.hidden || false,
          };
          if (item.feature) menuItem.feature = item.feature;
          if (item.adminOnly !== undefined) menuItem.adminOnly = item.adminOnly;
          if (item.superAdminOnly !== undefined) menuItem.superAdminOnly = item.superAdminOnly;
          if (item.permission) menuItem.permission = item.permission;
          return menuItem;
        }),
      }));

      const config: MenuConfig = { groups: initialGroups, updatedAt: new Date() };
      await erpService.updateMenuConfig(config);
      setMenuConfig(config);
      showNotification('Menu seeded successfully from defaults.', 'success');
    } catch {
      showNotification('Failed to seed menu.', 'error');
    } finally {
      setMenuBusy(false);
      setConfirmResetMenu(false);
    }
  };

  const syncMenuWithDefaults = async () => {
    if (!menuConfig) {
      await seedInitialMenu();
      return;
    }
    try {
      setMenuBusy(true);
      const dynamicGroupsMap = new Map<string, MenuGroupConfig>(
        menuConfig.groups.map((g) => [g.id, { ...g, items: [...g.items] }])
      );
      const allItemIds = new Set<string>();
      menuConfig.groups.forEach((g) => g.items.forEach((i) => allItemIds.add(i.id)));

      let updated = false;
      NAV_ITEMS.forEach((coreGroup) => {
        if (!dynamicGroupsMap.has(coreGroup.id)) {
          const uniqueItems = coreGroup.items.filter((i) => !allItemIds.has(i.id));
          if (uniqueItems.length > 0) {
            dynamicGroupsMap.set(coreGroup.id, {
              id: coreGroup.id,
              group: coreGroup.group,
              groupKey: coreGroup.groupKey,
              items: uniqueItems.map((i) => ({
                id: i.id,
                to: i.to,
                icon: i.iconName,
                label: i.label,
                labelKey: i.labelKey,
                feature: i.feature,
                permission: i.permission,
                adminOnly: i.adminOnly,
                superAdminOnly: i.superAdminOnly,
                hidden: i.hidden || false,
              })),
            });
            uniqueItems.forEach((i) => allItemIds.add(i.id));
            updated = true;
          }
        } else {
          const dynGroup = dynamicGroupsMap.get(coreGroup.id)!;
          const missing = coreGroup.items.filter((i) => !allItemIds.has(i.id));
          if (missing.length > 0) {
            dynGroup.items = [
              ...dynGroup.items,
              ...missing.map((i) => ({
                id: i.id,
                to: i.to,
                icon: i.iconName,
                label: i.label,
                labelKey: i.labelKey,
                feature: i.feature,
                permission: i.permission,
                adminOnly: i.adminOnly,
                superAdminOnly: i.superAdminOnly,
                hidden: i.hidden || false,
              })),
            ];
            missing.forEach((i) => allItemIds.add(i.id));
            updated = true;
          }
        }
      });

      if (updated) {
        const cleaned = deduplicateMenuConfig({
          ...menuConfig,
          groups: Array.from(dynamicGroupsMap.values()),
          updatedAt: new Date(),
        }) as MenuConfig;
        await erpService.updateMenuConfig(cleaned);
        setMenuConfig(cleaned);
        showNotification('Menu synchronized successfully.', 'success');
      } else {
        showNotification('Menu is already up to date with defaults.', 'info');
      }
    } catch {
      showNotification('Failed to sync menu.', 'error');
    } finally {
      setMenuBusy(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!menuConfig) return;
    try {
      setMenuBusy(true);
      const cleaned = deduplicateMenuConfig(menuConfig);
      if (cleaned) {
        await erpService.updateMenuConfig(cleaned);
        setMenuConfig(cleaned);
        showNotification('Menu deduplicated successfully.', 'success');
      }
    } catch {
      showNotification('Failed to cleanup duplicates.', 'error');
    } finally {
      setMenuBusy(false);
    }
  };

  const handleBulkUpdateMenu = async (updates: Partial<MenuItemConfig>) => {
    if (!menuConfig) return;
    const newGroups = menuConfig.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => (selectedItemIds.has(item.id) ? { ...item, ...updates } : item)),
    }));
    const newConfig = { ...menuConfig, groups: newGroups, updatedAt: new Date() };
    try {
      await erpService.updateMenuConfig(newConfig);
      setMenuConfig(newConfig);
      setSelectedItemIds(new Set());
      showNotification('Bulk update successful.', 'success');
    } catch {
      showNotification('Failed to update items.', 'error');
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !menuConfig) return;
    const { source, destination, type } = result;
    if (type === 'group') {
      const newGroups = Array.from(menuConfig.groups);
      const [removed] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, removed);
      const newConfig = deduplicateMenuConfig({ ...menuConfig, groups: newGroups }) as MenuConfig;
      setMenuConfig(newConfig);
      erpService.updateMenuConfig(newConfig);
      showNotification('Menu groups reordered.', 'success');
      return;
    }

    const sourceGroupIndex = displayMenuGroups.findIndex((g) => g.id === source.droppableId);
    const destGroupIndex = displayMenuGroups.findIndex((g) => g.id === destination.droppableId);
    if (sourceGroupIndex === -1 || destGroupIndex === -1) return;

    const newGroups = Array.from(displayMenuGroups);
    const sourceGroup = { ...newGroups[sourceGroupIndex], items: [...newGroups[sourceGroupIndex].items] };
    const destGroup =
      source.droppableId === destination.droppableId
        ? sourceGroup
        : { ...newGroups[destGroupIndex], items: [...newGroups[destGroupIndex].items] };

    const [removed] = sourceGroup.items.splice(source.index, 1);
    destGroup.items.splice(destination.index, 0, removed);
    newGroups[sourceGroupIndex] = sourceGroup;
    newGroups[destGroupIndex] = destGroup;

    const newConfig = deduplicateMenuConfig({ ...menuConfig, groups: newGroups }) as MenuConfig;
    setMenuConfig(newConfig);
    erpService.updateMenuConfig(newConfig);
    showNotification('Menu items reordered.', 'success');
  };

  const checkFilter = (labels: string[]) => {
    if (!settingsFilterQuery) return true;
    const q = settingsFilterQuery.toLowerCase();
    return labels.some((l) => l && l.toLowerCase().includes(q));
  };

  const handleSaveGlobalConfig = async () => {
    setIsSavingGlobal(true);
    try {
      await updateSystemSettings({ ...draft });
      showNotification('System configuration updated successfully.', 'success');
    } catch {
      showNotification('Failed to update system configuration.', 'error');
    } finally {
      setIsSavingGlobal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('global')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'global' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            Global Config
            {isGlobalDirty && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('menu')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'menu' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ListTree className="w-3.5 h-3.5" />
            Dynamic Menu
          </button>
          <button
            type="button"
            onClick={() => setSubTab('features')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'features' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Package className="w-3.5 h-3.5" />
            App Features
            {isFeaturesDirty && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
        </div>

        {subTab === 'global' && (
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateAppBranding && (
              <button
                type="button"
                onClick={onNavigateAppBranding}
                className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
              >
                <FileImage className="w-3.5 h-3.5 text-primary" />
                Open App Identity & Branding
              </button>
            )}
            {isGlobalDirty && (
              <button
                type="button"
                onClick={() => setDraft(initialGlobalSnapshot)}
                className="px-3.5 py-2 rounded-xl border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </button>
            )}
            <button
              type="button"
              disabled={isSavingGlobal}
              onClick={handleSaveGlobalConfig}
              className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingGlobal ? 'Saving...' : 'Save Global Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* Sub-tab 1: Global Config */}
      {subTab === 'global' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
            {[
              { id: 'general', label: 'General & Status', desc: 'Alerts, version, shortcuts', icon: Activity },
              { id: 'theme', label: 'Theme & Layout', desc: 'UI styles, navigations', icon: Palette },
              { id: 'notifications', label: 'Popup Notifications', desc: 'Designs, positions, durations', icon: Bell },
              { id: 'search', label: 'Search Engine', desc: 'Placeholders, key binds', icon: Search },
              { id: 'loader', label: 'Loading Screen', desc: 'Icon styles, blur, texts', icon: RefreshCw },
              { id: 'skeleton', label: 'Skeleton Shimmer', desc: 'Bone structures, speeds', icon: Sparkles },
              { id: 'warnings', label: 'Voucher Warnings', desc: 'Validation messages', icon: AlertCircle },
              { id: 'sounds', label: 'Sound Schemes', desc: 'Global audio setup', icon: Volume2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = systemSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSystemSubTab(tab.id as any)}
                  className={cn(
                    'w-auto lg:w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 shrink-0',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="text-left hidden md:block">
                    <p className="text-[11px] font-bold leading-none">{tab.label}</p>
                    <p className={cn('text-[8px] mt-1 leading-none uppercase tracking-tight', isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
                      {tab.desc}
                    </p>
                  </div>
                  <span className="text-xs font-bold md:hidden leading-none block">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 space-y-6 min-w-0">
            <div className="relative bg-card border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search or filter option configurations..."
                  value={settingsFilterQuery}
                  onChange={(e) => setSettingsFilterQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-14 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {settingsFilterQuery && (
                  <button
                    type="button"
                    onClick={() => setSettingsFilterQuery('')}
                    className="absolute right-3 top-1.5 text-muted-foreground hover:text-foreground text-xs uppercase font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
              <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase bg-muted/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0">
                <Settings className="w-3.5 h-3.5 text-primary" />
                FILTER ENGINE LIVE
              </span>
            </div>

            {systemSubTab === 'general' && (
              <div className="space-y-6">
                {checkFilter(['app version', 'identity', 'version']) && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">App Version &amp; Identity</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open_whats_new'))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{language === 'bn' ? 'বর্তমান সংস্করণ ও রিলিজ নোটস' : "View What's New"}</span>
                      </button>
                    </div>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={draft.appVersion}
                        onChange={(e) => setDraft((p) => ({ ...p, appVersion: e.target.value }))}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSavingAppVersion || !draft.appVersion.trim() || draft.appVersion.trim() === appVersion}
                        onClick={async () => {
                          const cleanTarget = draft.appVersion.trim();
                          if (!cleanTarget) return;
                          setIsSavingAppVersion(true);
                          try {
                            await updateSystemSettings({ appVersion: cleanTarget });
                            localStorage.setItem('tallyflow_active_version', cleanTarget);
                            localStorage.setItem('swr_app_version', cleanTarget);
                            showNotification(`App version saved to ${cleanTarget}`, 'success');
                          } catch {
                            showNotification('Failed to update app version', 'error');
                          } finally {
                            setIsSavingAppVersion(false);
                          }
                        }}
                        className="px-3 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSavingAppVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  </div>
                )}

                {currentUser?.companyId && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Remote App Force-Refresh (Active Company)
                      </h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Broadcast a live session reload signal for all connected tabs under the active company.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await erpService.updateCompany(currentUser.companyId, { forceRefreshAt: Date.now() });
                          showNotification('Force refresh command sent!', 'success');
                        } catch {
                          showNotification('Failed to broadcast refresh command.', 'error');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Broadcast Live Refresh
                    </button>
                  </div>
                )}

                {checkFilter(['maintenance', 'break', 'timer', 'downtime', 'updates', 'reason']) && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs relative overflow-hidden">
                    <div className={cn('absolute left-0 top-0 bottom-0 w-1', draft.maintenanceEnabled ? 'bg-amber-500' : 'bg-slate-500')} />
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Wrench className={cn('w-4 h-4', draft.maintenanceEnabled ? 'text-amber-500' : 'text-slate-400')} />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Maintenance Break System</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, maintenanceEnabled: !p.maintenanceEnabled }))}
                        className={cn(
                          'relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors',
                          draft.maintenanceEnabled ? 'bg-amber-500' : 'bg-neutral-600'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                            draft.maintenanceEnabled ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase font-semibold text-muted-foreground">State:</span>
                        <span className={cn('text-[10px] uppercase font-bold px-2.5 py-1 rounded-full', draft.maintenanceEnabled ? 'bg-amber-500/15 text-amber-500' : 'bg-slate-500/10 text-slate-400')}>
                          {draft.maintenanceEnabled ? 'Maintenance Active' : 'Online/Normal'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                          Scheduled End Time
                        </label>
                        <input
                          type="datetime-local"
                          value={draft.maintenanceEndTime}
                          onChange={(e) => setDraft((p) => ({ ...p, maintenanceEndTime: e.target.value }))}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={draft.maintenanceReason}
                      onChange={(e) => setDraft((p) => ({ ...p, maintenanceReason: e.target.value }))}
                      placeholder="Reason / Purpose of Maintenance Break"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    />
                    <textarea
                      rows={3}
                      value={draft.maintenanceUpdates}
                      onChange={(e) => setDraft((p) => ({ ...p, maintenanceUpdates: e.target.value }))}
                      placeholder="Upcoming improvements shown to users..."
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                )}

                {checkFilter(['online', 'offline', 'error', 'connection', 'status']) && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                      <Globe className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Connection Status Indicators</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={draft.statusOnlineText}
                        onChange={(e) => setDraft((p) => ({ ...p, statusOnlineText: e.target.value }))}
                        placeholder="Online Text"
                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={draft.statusOfflineText}
                        onChange={(e) => setDraft((p) => ({ ...p, statusOfflineText: e.target.value }))}
                        placeholder="Offline Text"
                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={draft.statusErrorText}
                        onChange={(e) => setDraft((p) => ({ ...p, statusErrorText: e.target.value }))}
                        placeholder="Error Text"
                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                )}

                {checkFilter(['shortcut', 'search icon', 'notifications icon', 'instructions', 'header', 'topbar']) && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                      Header Features &amp; Toggle Switches
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'showGoToShortcut' as const, title: 'Show "Alt + G" Shortcut Hint' },
                        { key: 'showTopbarSearch' as const, title: 'Show Search Icon in Top Bar' },
                        { key: 'showTopbarNotifications' as const, title: 'Show Notifications Icon in Top Bar' },
                        { key: 'showTopbarInstructions' as const, title: 'Show Instructions Icon in Top Bar' },
                      ].map((t) => (
                        <div key={t.key} className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                          <span className="text-xs font-bold text-foreground">{t.title}</span>
                          <button
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, [t.key]: !p[t.key] }))}
                            className={cn('w-10 h-5.5 rounded-full transition-colors relative shrink-0', draft[t.key] ? 'bg-blue-600' : 'bg-gray-300')}
                          >
                            <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all', draft[t.key] ? 'right-0.5' : 'left-0.5')} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {checkFilter(['developer', 'footer', 'alignment']) && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Software Footer Fallback (Legacy System Config)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Managed centrally in App Identity &amp; Branding ({appIdentity.appName})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={draft.developerContactText}
                        onChange={(e) => setDraft((p) => ({ ...p, developerContactText: e.target.value }))}
                        className="md:col-span-2 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
                      />
                      <select
                        value={draft.developerContactAlignment}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            developerContactAlignment: e.target.value as 'left' | 'center' | 'right',
                          }))
                        }
                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {systemSubTab === 'theme' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                    Visual Aesthetic Profile &amp; Active Canvas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Global UI Style</label>
                      <select
                        value={draft.uiStyle}
                        onChange={(e) => setDraft((p) => ({ ...p, uiStyle: e.target.value as any }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="UI/UX 1">UI/UX 1 (Classic)</option>
                        <option value="UI/UX 2">UI/UX 2 (Modern Colorized)</option>
                        <option value="UI/UX 3">UI/UX 3 (Glassmorphism macOS)</option>
                        <option value="UI/UX 4">UI/UX 4 (Aurora Holographic Carbon)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Canvas Gradient (UI/UX 3 &amp; 4)</label>
                      <select
                        value={draft.glassBackground}
                        onChange={(e) => setDraft((p) => ({ ...p, glassBackground: e.target.value as any }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="default">Default Cyber Carbon</option>
                        <option value="sunset">Sunset Glow</option>
                        <option value="ocean">Deep Ocean</option>
                        <option value="aurora">Aurora Borealis</option>
                        <option value="minimal">Minimal Soft Dark</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                    Navigation &amp; Desktop Frame Layout
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={draft.menuBarStyle}
                      onChange={(e) => setDraft((p) => ({ ...p, menuBarStyle: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="classic">Classic Sidebar</option>
                      <option value="firebase_console">Firebase Console Style</option>
                      <option value="ribbon">Microsoft Office Ribbon</option>
                      <option value="macos">macOS Top Menu Bar</option>
                      <option value="windows11">Windows 11 Taskbar Style</option>
                      <option value="colorful">Classic Professional</option>
                    </select>
                    <select
                      value={draft.sidebarBgColor}
                      onChange={(e) => setDraft((p) => ({ ...p, sidebarBgColor: e.target.value }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      {SIDEBAR_BG_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    <select
                      value={draft.sidebarTextColor}
                      onChange={(e) => setDraft((p) => ({ ...p, sidebarTextColor: e.target.value }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      {SIDEBAR_TEXT_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                    Alter, Reports &amp; Voucher Dimensions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={draft.searchPageUiStyle}
                      onChange={(e) => setDraft((p) => ({ ...p, searchPageUiStyle: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="classic">Search: Classic</option>
                      <option value="modern">Search: Modern</option>
                    </select>
                    <select
                      value={draft.alterPageUiStyle}
                      onChange={(e) => setDraft((p) => ({ ...p, alterPageUiStyle: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="classic">Alter: Classic</option>
                      <option value="modern">Alter: Modern</option>
                    </select>
                    <select
                      value={draft.reportsPageUiStyle}
                      onChange={(e) => setDraft((p) => ({ ...p, reportsPageUiStyle: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="classic">Reports: Classic</option>
                      <option value="modern">Reports: Modern</option>
                      <option value="grid">Reports: Dynamic Grid</option>
                    </select>
                    <select
                      value={draft.alterColumnsPerRow}
                      onChange={(e) => setDraft((p) => ({ ...p, alterColumnsPerRow: Number(e.target.value) }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>Alter: {n} Columns</option>
                      ))}
                    </select>
                    <select
                      value={draft.reportsColumnsPerRow}
                      onChange={(e) => setDraft((p) => ({ ...p, reportsColumnsPerRow: Number(e.target.value) }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>Reports: {n} Columns</option>
                      ))}
                    </select>
                    <select
                      value={draft.enableUserSortViewPref ? 'true' : 'false'}
                      onChange={(e) => setDraft((p) => ({ ...p, enableUserSortViewPref: e.target.value === 'true' }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="false">User Sort/View Prefs: Disabled</option>
                      <option value="true">User Sort/View Prefs: Enabled</option>
                    </select>
                    <select
                      value={draft.voucherLayout}
                      onChange={(e) => setDraft((p) => ({ ...p, voucherLayout: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="Layout 1">Voucher Layout 1</option>
                      <option value="Layout 2">Voucher Layout 2 (Compact)</option>
                    </select>
                    <select
                      value={draft.voucherFieldSize}
                      onChange={(e) => setDraft((p) => ({ ...p, voucherFieldSize: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="small">Field Size: Small</option>
                      <option value="semi-compact">Field Size: Semi-Compact</option>
                      <option value="medium">Field Size: Medium</option>
                      <option value="large">Field Size: Large</option>
                    </select>
                    <select
                      value={draft.dashboardDesign}
                      onChange={(e) => setDraft((p) => ({ ...p, dashboardDesign: e.target.value as any }))}
                      className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                    >
                      {['Design 1', 'Design 2', 'Design 3', 'Design 4', 'Design 5', 'Design 6'].map((d) => (
                        <option key={d} value={d}>Dashboard: {d}</option>
                      ))}
                    </select>
                  </div>

                  {(draft.dashboardDesign === 'Design 5' || draft.dashboardDesign === 'Design 6') && (
                    <div className="p-4 bg-muted/20 border border-border rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={draft.customWelcomeMessage}
                        onChange={(e) => setDraft((p) => ({ ...p, customWelcomeMessage: e.target.value }))}
                        placeholder="Custom Splash Welcome Message"
                        className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      />
                      <div className="flex gap-2">
                        {(['emerald', 'indigo', 'slate', 'cyber'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setDraft((p) => ({ ...p, customControlCenterTheme: t }))}
                            className={cn(
                              'flex-1 py-1.5 rounded border text-[10px] font-bold uppercase',
                              draft.customControlCenterTheme === t ? 'bg-foreground text-background' : 'bg-background border-border'
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {systemSubTab === 'notifications' && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Global Popup Notification Styling
                  </h4>
                  <div className="flex gap-1.5">
                    {(['success', 'error', 'info', 'warning'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => showNotification(`Test ${t} notification`, t)}
                        className="px-2.5 py-1 text-[9px] font-bold uppercase rounded-lg border border-border hover:bg-muted"
                      >
                        Test {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    'google', 'facebook', 'figma', 'erpnext', 'apple_ios',
                    'linear_dark', 'stripe', 'windows11', 'neon_cyber', 'default',
                  ].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, notificationStyle: id as any }))}
                      className={cn(
                        'p-2.5 rounded-lg border text-[10px] font-bold uppercase',
                        draft.notificationStyle === id ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                      )}
                    >
                      {id.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={draft.notificationPosition}
                    onChange={(e) => setDraft((p) => ({ ...p, notificationPosition: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                  <select
                    value={draft.notificationAnimationStyle}
                    onChange={(e) => setDraft((p) => ({ ...p, notificationAnimationStyle: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    {['default', 'neon', 'snake', 'liquid', 'glitch', 'shimmer'].map((a) => (
                      <option key={a} value={a}>Border: {a}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={draft.notificationDuration}
                    onChange={(e) => setDraft((p) => ({ ...p, notificationDuration: Number(e.target.value) }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {systemSubTab === 'search' && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                  Global Search Engine Settings
                </h4>
                <input
                  type="text"
                  value={draft.searchPlaceholder}
                  onChange={(e) => setDraft((p) => ({ ...p, searchPlaceholder: e.target.value }))}
                  placeholder="Default Search Placeholder..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                />
                <textarea
                  rows={2}
                  value={draft.searchHelpText}
                  onChange={(e) => setDraft((p) => ({ ...p, searchHelpText: e.target.value }))}
                  placeholder="Keyboard Help Text..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                />
                <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                  <span className="text-xs font-bold text-foreground">Show &quot;ESC&quot; Shortcut Hint</span>
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, showSearchShortcut: !p.showSearchShortcut }))}
                    className={cn('w-10 h-5.5 rounded-full relative transition-colors', draft.showSearchShortcut ? 'bg-emerald-500' : 'bg-border')}
                  >
                    <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all', draft.showSearchShortcut ? 'right-0.5' : 'left-0.5')} />
                  </button>
                </div>
              </div>
            )}

            {systemSubTab === 'loader' && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Adaptive Loading Screen</h4>
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent('trigger-mock-loader', {
                          detail: {
                            phrases: draft.loaderPhrases,
                            blur: draft.loaderBlurStyle,
                            icon: draft.loaderIconStyle,
                            theme: draft.loaderTheme,
                          },
                        })
                      )
                    }
                    className="px-3 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase rounded-lg"
                  >
                    Live Preview Loader
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                  <span className="text-xs font-bold">Adaptive Loading Screen Styling</span>
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, adaptiveLoaderEnabled: !p.adaptiveLoaderEnabled }))}
                    className={cn('w-10 h-5.5 rounded-full relative transition-colors', draft.adaptiveLoaderEnabled ? 'bg-emerald-500' : 'bg-border')}
                  >
                    <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all', draft.adaptiveLoaderEnabled ? 'right-0.5' : 'left-0.5')} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={draft.loaderBlurStyle}
                    onChange={(e) => setDraft((p) => ({ ...p, loaderBlurStyle: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="none">Blur: None</option>
                    <option value="sm">Blur: Subtle (4px)</option>
                    <option value="md">Blur: Medium (8px)</option>
                    <option value="lg">Blur: Deep Frost (16px)</option>
                  </select>
                  <select
                    value={draft.loaderIconStyle}
                    onChange={(e) => setDraft((p) => ({ ...p, loaderIconStyle: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="spinner">Icon: Calm Spinner</option>
                    <option value="dots">Icon: Bouncing Dots</option>
                    <option value="circle-bar">Icon: Metropolitan Bar</option>
                    <option value="quantum">Icon: Quantum Matrix</option>
                  </select>
                  <select
                    value={draft.loaderTheme}
                    onChange={(e) => setDraft((p) => ({ ...p, loaderTheme: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="glass">Theme: Aero Glass</option>
                    <option value="dark">Theme: Cosmic Obsidian</option>
                    <option value="light">Theme: Snow Alabaster</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={draft.loaderPhrases}
                  onChange={(e) => setDraft((p) => ({ ...p, loaderPhrases: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg p-3 text-xs font-mono"
                />
              </div>
            )}

            {systemSubTab === 'skeleton' && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                  Skeleton Shimmer Loading Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                    <span className="text-xs font-bold">Enable App-Wide Skeletons</span>
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, skeletonEnabled: !p.skeletonEnabled }))}
                      className={cn('w-10 h-5.5 rounded-full relative transition-colors', draft.skeletonEnabled ? 'bg-emerald-500' : 'bg-border')}
                    >
                      <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all', draft.skeletonEnabled ? 'right-0.5' : 'left-0.5')} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                    <span className="text-xs font-bold">Dashboard-Only Skeleton Mode</span>
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, skeletonDashboardOnly: !p.skeletonDashboardOnly }))}
                      className={cn('w-10 h-5.5 rounded-full relative transition-colors', draft.skeletonDashboardOnly ? 'bg-emerald-500' : 'bg-border')}
                    >
                      <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all', draft.skeletonDashboardOnly ? 'right-0.5' : 'left-0.5')} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={draft.skeletonTheme}
                    onChange={(e) => setDraft((p) => ({ ...p, skeletonTheme: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="classic">Classic</option>
                    <option value="modern">Modern</option>
                    <option value="glass">Glass</option>
                    <option value="neon">Neon</option>
                  </select>
                  <select
                    value={draft.skeletonWaveColor}
                    onChange={(e) => setDraft((p) => ({ ...p, skeletonWaveColor: e.target.value }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    {['slate', 'indigo', 'cyan', 'rose', 'emerald', 'amber'].map((c) => (
                      <option key={c} value={c}>Wave: {c}</option>
                    ))}
                  </select>
                  <select
                    value={draft.skeletonSpeed}
                    onChange={(e) => setDraft((p) => ({ ...p, skeletonSpeed: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="slow">Speed: Slow</option>
                    <option value="normal">Speed: Normal</option>
                    <option value="fast">Speed: Fast</option>
                  </select>
                  <select
                    value={draft.skeletonType}
                    onChange={(e) => setDraft((p) => ({ ...p, skeletonType: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="automatic">Auto-Route</option>
                    <option value="table">Table/Ledger</option>
                    <option value="cards">Bento Cards</option>
                    <option value="profile">Profile</option>
                    <option value="form">Form/Voucher</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Rows:</span>
                  <input
                    type="range"
                    min={3}
                    max={15}
                    value={draft.skeletonRows}
                    onChange={(e) => setDraft((p) => ({ ...p, skeletonRows: Number(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="font-mono text-xs font-bold px-2 py-0.5 border border-border rounded">{draft.skeletonRows}</span>
                </div>
              </div>
            )}

            {systemSubTab === 'warnings' && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-3">
                  Customizable Voucher Validation Warnings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    ['warningPrefixSelectFill', 'Error Message Prefix'],
                    ['warningPartyName', 'Party Name Label'],
                    ['warningSupplierName', 'Supplier Name Label'],
                    ['warningSalesLedger', 'Sales Ledger Label'],
                    ['warningPurchaseLedger', 'Purchase Ledger Label'],
                    ['warningSelectItemsInPhysicalStock', 'Physical Stock: Missing Item'],
                    ['warningInvalidQtyInPhysicalStock', 'Physical Stock: Invalid Qty'],
                    ['warningItemsListEmpty', 'Empty Items List'],
                    ['warningItemNameEmpty', 'Missing Item Name'],
                    ['warningQuantityEmpty', 'Missing Quantity'],
                    ['warningRateEmpty', 'Missing Rate'],
                    ['warningConsumptionItems', 'Missing Consumption Section'],
                    ['warningSourceItemName', 'Missing Source Item Name'],
                    ['warningSourceItemQty', 'Missing Source Item Qty'],
                    ['warningProductionItems', 'Missing Production Section'],
                    ['warningDestItemName', 'Missing Destination Item Name'],
                    ['warningDestItemQty', 'Missing Destination Item Qty'],
                    ['warningSingleAccount', 'Single Entry: Account'],
                    ['warningSingleParticulars', 'Single Entry: Particulars'],
                    ['warningSingleAmount', 'Single Entry: Amount'],
                    ['warningJournalLedgerName', 'Journal: Missing Ledger'],
                    ['warningJournalDebitCreditAmount', 'Journal: Missing Dr/Cr Amount'],
                    ['warningJournalNotBalanced', 'Journal: Out of Balance ({DIFF}, {DEBIT}, {CREDIT})'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground font-mono">{label}</label>
                      <input
                        type="text"
                        value={draft[key]}
                        onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {systemSubTab === 'sounds' && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Global Sound Scheme Configuration
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        soundSuccess: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-84.wav',
                        soundError: 'https://assets.mixkit.co/active_storage/sfx/951/951-84.wav',
                        soundWarning: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',
                        soundDelete: 'https://assets.mixkit.co/active_storage/sfx/2205/2205-84.wav',
                        soundClick: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',
                        soundNavigation: 'https://assets.mixkit.co/active_storage/sfx/2324/2324-84.wav',
                      }))
                    }
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-[10px] font-bold uppercase rounded-lg"
                  >
                    Load Preset URLs
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl">
                    <span className="text-xs font-bold">Operational Sounds</span>
                    <button
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
                      className={cn('w-10 h-5.5 rounded-full relative transition-colors', draft.soundEnabled ? 'bg-primary' : 'bg-muted')}
                    >
                      <span className={cn('absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all', draft.soundEnabled ? 'right-0.5' : 'left-0.5')} />
                    </button>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-center gap-3">
                    <span className="text-xs font-bold">Volume</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={draft.soundVolume}
                      onChange={(e) => setDraft((p) => ({ ...p, soundVolume: parseFloat(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono font-bold">{Math.round(draft.soundVolume * 100)}%</span>
                  </div>
                  <select
                    value={draft.soundScheme}
                    onChange={(e) => setDraft((p) => ({ ...p, soundScheme: e.target.value as any }))}
                    className="bg-background border border-border rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="system">Synthesized (Web Audio)</option>
                    <option value="custom">Custom URLs</option>
                    <option value="off">Full Mute</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    ['soundClick', 'click', 'Click'],
                    ['soundNavigation', 'navigation', 'Navigation'],
                    ['soundSuccess', 'success', 'Success'],
                    ['soundWarning', 'warning', 'Warning'],
                    ['soundError', 'error', 'Error'],
                    ['soundDelete', 'delete', 'Delete'],
                  ] as const).map(([field, evKey, label]) => (
                    <div key={field} className="flex items-center gap-2">
                      <input
                        type="url"
                        disabled={draft.soundScheme !== 'custom' || !draft.soundEnabled}
                        value={draft[field]}
                        onChange={(e) => setDraft((p) => ({ ...p, [field]: e.target.value }))}
                        placeholder={`${label} URL`}
                        className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          soundService.setSettings(draft.soundEnabled, draft.soundVolume, draft.soundScheme as any, {
                            success: draft.soundSuccess,
                            error: draft.soundError,
                            warning: draft.soundWarning,
                            delete: draft.soundDelete,
                            click: draft.soundClick,
                            navigation: draft.soundNavigation,
                          });
                          soundService.play(evKey);
                        }}
                        className="px-2.5 py-1.5 bg-muted border border-border rounded-lg text-[10px] font-bold uppercase"
                      >
                        Test
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Dynamic Menu Management */}
      {subTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Dynamic Menu Management</h2>
              <p className="text-sm text-muted-foreground">Control the sidebar navigation structure and items.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={menuBusy}
                onClick={() => setConfirmResetMenu(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-600 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Reset
              </button>
              <button
                type="button"
                disabled={menuBusy}
                onClick={syncMenuWithDefaults}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Items
              </button>
              <button
                type="button"
                disabled={menuBusy}
                onClick={cleanupDuplicates}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Cleanup
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditingGroup({
                    id: `group-${Date.now()}`,
                    group: '',
                    groupKey: '',
                    items: [],
                    hidden: false,
                  })
                }
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Group
              </button>
            </div>
          </div>

          {selectedItemIds.size > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {selectedItemIds.size} Items Selected
                </span>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateMenu({ adminOnly: true })}
                  className="px-3 py-1.5 bg-background border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5"
                >
                  <Shield className="w-3 h-3" />
                  Admin Only
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateMenu({ superAdminOnly: true })}
                  className="px-3 py-1.5 bg-background border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5"
                >
                  <UserCog className="w-3 h-3" />
                  Founder Only
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateMenu({ hidden: true })}
                  className="px-3 py-1.5 bg-background border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5"
                >
                  <EyeOff className="w-3 h-3" />
                  Hide
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateMenu({ adminOnly: false, superAdminOnly: false, hidden: false })}
                  className="px-3 py-1.5 bg-background border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Flags
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemIds(new Set())}
                className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase"
              >
                Clear
              </button>
            </div>
          )}

          {!menuConfig ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4">
              <ListTree className="w-10 h-10 text-muted-foreground mx-auto opacity-30" />
              <p className="text-muted-foreground">No menu configuration found. Seed from defaults to start.</p>
              <button
                type="button"
                onClick={seedInitialMenu}
                className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest"
              >
                Seed Initial Menu
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="menu-groups" type="group">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {displayMenuGroups
                      .filter((g) => g.group !== 'System Configuration')
                      .map((group, index) => (
                        <Draggable key={group.id} draggableId={group.id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className={cn(
                                'bg-card border border-border rounded-xl overflow-hidden shadow-sm',
                                snap.isDragging && 'shadow-2xl ring-2 ring-primary/20'
                              )}
                            >
                              <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border">
                                <div className="flex items-center gap-3">
                                  <div {...prov.dragHandleProps} className="p-1 hover:bg-foreground/5 rounded cursor-grab">
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <LayoutGrid className="w-5 h-5 text-primary" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                                        {group.group || 'Unnamed Group'}
                                      </h3>
                                      {group.hidden && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-full font-bold uppercase">
                                          Hidden
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono">{group.groupKey}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingGroup(group)}
                                    className="p-2 hover:bg-foreground/5 rounded-lg text-muted-foreground hover:text-primary"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newConfig = {
                                        ...menuConfig,
                                        groups: menuConfig.groups.filter((g) => g.id !== group.id),
                                      };
                                      erpService.updateMenuConfig(newConfig);
                                      setMenuConfig(newConfig);
                                      showNotification('Group removed.', 'success');
                                    }}
                                    className="p-2 hover:bg-rose-500/10 rounded-lg text-muted-foreground hover:text-rose-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="p-4">
                                <Droppable droppableId={group.id} type="item">
                                  {(dropProv) => (
                                    <div
                                      {...dropProv.droppableProps}
                                      ref={dropProv.innerRef}
                                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[50px]"
                                    >
                                      {group.items.map((item, itemIdx) => (
                                        <Draggable key={item.id} draggableId={item.id} index={itemIdx}>
                                          {(itemProv) => (
                                            <div
                                              ref={itemProv.innerRef}
                                              {...itemProv.draggableProps}
                                              className="p-3 border border-border rounded-lg flex items-center justify-between group bg-card"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const next = new Set(selectedItemIds);
                                                    if (next.has(item.id)) next.delete(item.id);
                                                    else next.add(item.id);
                                                    setSelectedItemIds(next);
                                                  }}
                                                  className={selectedItemIds.has(item.id) ? 'text-primary' : 'text-muted-foreground'}
                                                >
                                                  {selectedItemIds.has(item.id) ? (
                                                    <CheckSquare className="w-4 h-4" />
                                                  ) : (
                                                    <Square className="w-4 h-4" />
                                                  )}
                                                </button>
                                                <div {...itemProv.dragHandleProps} className="p-1 cursor-grab">
                                                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                                                  <p className="text-[9px] text-muted-foreground font-mono truncate">{item.to}</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingMenuItem({ groupId: group.id, item })}
                                                  className="p-1.5 hover:bg-foreground/5 rounded-md text-muted-foreground hover:text-primary"
                                                >
                                                  <Settings className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const newGroups = menuConfig.groups.map((g) =>
                                                      g.id === group.id
                                                        ? { ...g, items: g.items.filter((i) => i.id !== item.id) }
                                                        : g
                                                    );
                                                    const newConfig = { ...menuConfig, groups: newGroups };
                                                    erpService.updateMenuConfig(newConfig);
                                                    setMenuConfig(newConfig);
                                                    showNotification('Item removed.', 'success');
                                                  }}
                                                  className="p-1.5 hover:bg-rose-500/10 rounded-md text-muted-foreground hover:text-rose-500"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                      ))}
                                      {dropProv.placeholder}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingMenuItem({
                                            groupId: group.id,
                                            item: {
                                              id: `item-${Date.now()}`,
                                              to: '',
                                              icon: 'Package',
                                              label: '',
                                              labelKey: '',
                                            },
                                          })
                                        }
                                        className="p-3 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50"
                                      >
                                        <Plus className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Add Item</span>
                                      </button>
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}

      {/* Sub-tab 3: Features Management */}
      {subTab === 'features' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-foreground">Features Management</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Group and describe application features
              </p>
            </div>
            <button
              type="button"
              disabled={isSavingFeatures}
              onClick={async () => {
                setIsSavingFeatures(true);
                try {
                  await updateFeaturesSettings(editableFeatures);
                  showNotification('Feature definitions updated successfully.', 'success');
                } catch {
                  showNotification('Failed to update features.', 'error');
                } finally {
                  setIsSavingFeatures(false);
                }
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {isSavingFeatures ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              Save Changes
            </button>
          </div>

          <div className="space-y-6">
            {editableFeatures.map((category, catIndex) => (
              <div key={category.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                  <div>
                    <input
                      type="text"
                      value={category.label}
                      onChange={(e) => {
                        const next = editableFeatures.map((c, idx) =>
                          idx === catIndex ? { ...c, label: e.target.value } : c
                        );
                        setEditableFeatures(next);
                      }}
                      className="bg-transparent text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                    />
                    <span className="text-[8px] text-muted-foreground font-mono ml-2">ID: {category.id}</span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.features.map((feature, featIndex) => (
                    <div key={feature.id} className="p-4 border border-border/50 rounded-xl space-y-2 bg-muted/10">
                      <input
                        type="text"
                        value={feature.label}
                        onChange={(e) => {
                          const next = editableFeatures.map((c, cIdx) =>
                            cIdx === catIndex
                              ? {
                                  ...c,
                                  features: c.features.map((f, fIdx) =>
                                    fIdx === featIndex ? { ...f, label: e.target.value } : f
                                  ),
                                }
                              : c
                          );
                          setEditableFeatures(next);
                        }}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs font-bold"
                      />
                      <textarea
                        value={feature.description || ''}
                        onChange={(e) => {
                          const next = editableFeatures.map((c, cIdx) =>
                            cIdx === catIndex
                              ? {
                                  ...c,
                                  features: c.features.map((f, fIdx) =>
                                    fIdx === featIndex ? { ...f, description: e.target.value } : f
                                  ),
                                }
                              : c
                          );
                          setEditableFeatures(next);
                        }}
                        rows={2}
                        className="w-full bg-background border border-border rounded-lg p-2 text-[10px] resize-none"
                        placeholder="Feature description..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Reset Menu Modal */}
      <AnimatePresence>
        {confirmResetMenu && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Reset Menu to Factory Defaults?</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                This will overwrite your current sidebar menu configuration with default routes and groups.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmResetMenu(false)}
                  className="px-4 py-2 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={seedInitialMenu}
                  className="px-4 py-2 bg-amber-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-amber-600"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Menu Group Modal */}
      <AnimatePresence>
        {editingGroup && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Edit Menu Group</h2>
                <button type="button" onClick={() => setEditingGroup(null)} className="p-2 hover:bg-foreground/5 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <input
                  type="text"
                  value={editingGroup.group}
                  onChange={(e) => setEditingGroup({ ...editingGroup, group: e.target.value })}
                  placeholder="Group Name (e.g. Masters)"
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                />
                <input
                  type="text"
                  value={editingGroup.groupKey}
                  onChange={(e) => setEditingGroup({ ...editingGroup, groupKey: e.target.value })}
                  placeholder="Translation Key (e.g. nav.masters)"
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                />
                <input
                  type="text"
                  value={editingGroup.to || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, to: e.target.value })}
                  placeholder="Optional Route (e.g. /reports)"
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                />
                <label className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGroup.hidden || false}
                    onChange={(e) => setEditingGroup({ ...editingGroup, hidden: e.target.checked })}
                  />
                  <span className="text-xs font-bold">Hide Group from Sidebar</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingGroup(null)}
                    className="flex-1 py-2 border border-border rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextConfig: MenuConfig = !menuConfig
                        ? { groups: [editingGroup], updatedAt: new Date() }
                        : {
                            ...menuConfig,
                            groups: menuConfig.groups.some((g) => g.id === editingGroup.id)
                              ? menuConfig.groups.map((g) => (g.id === editingGroup.id ? editingGroup : g))
                              : [...menuConfig.groups, editingGroup],
                          };
                      await erpService.updateMenuConfig(nextConfig);
                      setMenuConfig(nextConfig);
                      setEditingGroup(null);
                      showNotification('Menu group saved.', 'success');
                    }}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase"
                  >
                    Save Group
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Menu Item Modal */}
      <AnimatePresence>
        {editingMenuItem && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Edit Menu Item</h2>
                <button type="button" onClick={() => setEditingMenuItem(null)} className="p-2 hover:bg-foreground/5 rounded-lg">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editingMenuItem.item.label}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, label: e.target.value } })
                    }
                    placeholder="Label"
                    className="bg-background border border-border rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editingMenuItem.item.labelKey}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, labelKey: e.target.value } })
                    }
                    placeholder="Translation Key"
                    className="bg-background border border-border rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editingMenuItem.item.to}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, to: e.target.value } })
                    }
                    placeholder="Route (e.g. /ledgers)"
                    className="bg-background border border-border rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editingMenuItem.item.icon}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, icon: e.target.value } })
                    }
                    placeholder="Icon Name"
                    className="bg-background border border-border rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editingMenuItem.item.feature || ''}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, feature: e.target.value } })
                    }
                    placeholder="Feature Flag"
                    className="bg-background border border-border rounded-lg p-2 text-sm"
                  />
                  <input
                    type="text"
                    value={editingMenuItem.item.permission || ''}
                    onChange={(e) =>
                      setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, permission: e.target.value } })
                    }
                    placeholder="Permission"
                    className="bg-background border border-border rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(editingMenuItem.item.adminOnly)}
                      onChange={(e) =>
                        setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, adminOnly: e.target.checked } })
                      }
                    />
                    Admin Only
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(editingMenuItem.item.superAdminOnly)}
                      onChange={(e) =>
                        setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, superAdminOnly: e.target.checked } })
                      }
                    />
                    Founder Only
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(editingMenuItem.item.hidden)}
                      onChange={(e) =>
                        setEditingMenuItem({ ...editingMenuItem, item: { ...editingMenuItem.item, hidden: e.target.checked } })
                      }
                    />
                    Hidden
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMenuItem(null)}
                    className="flex-1 py-2 border border-border rounded-lg text-[10px] font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!menuConfig) return;
                      const newGroups = menuConfig.groups.map((g) => {
                        if (g.id !== editingMenuItem.groupId) return g;
                        const exists = g.items.some((i) => i.id === editingMenuItem.item.id);
                        return {
                          ...g,
                          items: exists
                            ? g.items.map((i) => (i.id === editingMenuItem.item.id ? editingMenuItem.item : i))
                            : [...g.items, editingMenuItem.item],
                        };
                      });
                      const newConfig = { ...menuConfig, groups: newGroups };
                      await erpService.updateMenuConfig(newConfig);
                      setMenuConfig(newConfig);
                      setEditingMenuItem(null);
                      showNotification('Menu item saved.', 'success');
                    }}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
