import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  where,
  orderBy,
  limit,
  Timestamp,
  getDoc,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Company, UserRole, UserProfile, AppNotification, SubscriptionPlan, MenuConfig, MenuGroupConfig, MenuItemConfig } from '../types';
import { NAV_ITEMS } from '../constants/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shield, 
  Activity, 
  BarChart3,
  Database, 
  Lock, 
  Unlock, 
  Calendar, 
  Search,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  Trash2,
  Mail,
  Phone,
  Globe,
  LayoutGrid,
  ListTree,
  Bell,
  Send,
  Plus,
  Box,
  ArrowRight,
  FileText,
  BookOpen,
  Package,
  ClipboardList,
  Printer,
  Cpu,
  Settings,
  LayoutDashboard,
  PieChart,
  StickyNote,
  CreditCard,
  Check,
  MessageSquare,
  Zap,
  Info,
  MapPin,
  GripVertical,
  RefreshCw,
  EyeOff,
  UserCog,
  Square,
  CheckSquare,
  Palette,
  FileImage,
  Save,
  Wrench,
  Sparkles,
  Volume2
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { erpService, deduplicateMenuConfig } from '../services/erpService';
import { useSettings, SIDEBAR_BG_OPTIONS, SIDEBAR_TEXT_OPTIONS } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { cn, ensureDate } from '../lib/utils';
import { SiteContentEditor } from './SiteContentEditor';
import { AVAILABLE_FEATURES, FeatureCategory } from '../constants/features';
import { errorService } from '../services/errorService';

interface CompanyStats extends Company {
  userCount: number;
  lastActivity?: any;
  voucherCount: number;
  ledgerCount: number;
  itemCount: number;
  creatorEmail?: string;
}

export default function FounderPanel() {
  const { updateFeaturesSettings, appFeatures } = useSettings();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'Founder' || currentUser?.role === 'Marketing Manager' || currentUser?.email === 'sapientman46@gmail.com';
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [viewMode, setViewMode] = useState<'companies' | 'users' | 'notifications' | 'activity' | 'settings' | 'siteContent' | 'plans' | 'orders' | 'menu' | 'features' | 'errorLogs' | 'inquiries'>('companies');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);
  const [isEditingMenu, setIsEditingMenu] = useState(false);

  const displayMenuGroups = React.useMemo(() => {
    if (!menuConfig) return [];
    const cleaned = deduplicateMenuConfig(menuConfig);
    return cleaned ? cleaned.groups : [];
  }, [menuConfig]);

  // Features editing state
  const [editableFeatures, setEditableFeatures] = useState<FeatureCategory[]>([]);
  const [isEditingFeatures, setIsEditingFeatures] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroupConfig | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<{groupId: string, item: MenuItemConfig} | null>(null);
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [aiFixModal, setAiFixModal] = useState<{
    isOpen: boolean;
    logId: string;
    logMessage: string;
    assembledPrompt: string;
  } | null>(null);

  useEffect(() => {
    if (viewMode === 'menu') {
      const unsubscribe = erpService.subscribeToMenuConfig((config) => {
        if (config) setMenuConfig(config);
      });
      return () => unsubscribe();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'errorLogs') {
      const unsubscribe = errorService.subscribeToLogs((logs: any[]) => {
        setErrorLogs(logs);
      });
      return () => unsubscribe();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'inquiries') {
      setInquiriesLoading(true);
      const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snap) => {
        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInquiries(list);
        setInquiriesLoading(false);
      }, (err) => {
        console.error("Error subscribing to inquiries:", err);
        setInquiriesLoading(false);
        handleFirestoreError(err, OperationType.GET, 'inquiries');
      });
      return () => unsubscribe();
    }
  }, [viewMode]);

  const onDragEnd = (result: any) => {
    if (!result.destination || !menuConfig) return;

    const { source, destination, type } = result;

    if (type === 'group') {
      const newGroups = Array.from(menuConfig.groups);
      const [removed] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, removed);

      const rawConfig = { ...menuConfig, groups: newGroups };
      const newConfig = deduplicateMenuConfig(rawConfig) as MenuConfig;
      setMenuConfig(newConfig);
      erpService.updateMenuConfig(newConfig);
      showNotification('Menu groups reordered', 'success');
      return;
    }

    // Item reordering
    const sourceGroupIndex = displayMenuGroups.findIndex(g => g.id === source.droppableId);
    const destGroupIndex = displayMenuGroups.findIndex(g => g.id === destination.droppableId);

    if (sourceGroupIndex === -1 || destGroupIndex === -1) return;

    const newGroups = Array.from(displayMenuGroups);
    const sourceGroup = { ...newGroups[sourceGroupIndex] };
    const destGroup = { ...newGroups[destGroupIndex] };

    const [removed] = sourceGroup.items.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceGroup.items.splice(destination.index, 0, removed);
      newGroups[sourceGroupIndex] = sourceGroup;
    } else {
      destGroup.items.splice(destination.index, 0, removed);
      newGroups[sourceGroupIndex] = sourceGroup;
      newGroups[destGroupIndex] = destGroup;
    }

    const rawConfig = { ...menuConfig, groups: newGroups };
    const newConfig = deduplicateMenuConfig(rawConfig) as MenuConfig;
    setMenuConfig(newConfig);
    erpService.updateMenuConfig(newConfig);
    showNotification('Menu items reordered', 'success');
  };
  const [subscriptionOrders, setSubscriptionOrders] = useState<any[]>([]);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    features: [],
    featureLimits: {},
    supportType: 'Email',
    supportHours: '24/7',
    trainingIncluded: false,
    customReports: false,
    apiAccess: false,
    setupFee: 0,
    customDomain: false,
    limits: {
      vouchers: -1,
      items: -1,
      ledgers: -1,
      users: -1,
      godowns: -1,
      multiCurrency: false,
      rolePermissions: false
    }
  });
  const [newNotification, setNewNotification] = useState<Partial<AppNotification>>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    status: 'sent',
    scheduledAt: Timestamp.now()
  });

  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const AVAILABLE_PERMISSIONS = [
    { id: 'Dashboard', label: 'Dashboard', icon: Activity },
    { id: 'Ledgers', label: 'Ledgers', icon: BookOpen },
    { id: 'Vouchers', label: 'Vouchers', icon: FileText },
    { id: 'Items', label: 'Items', icon: Package },
    { id: 'Employees', label: 'Employees', icon: Users },
    { id: 'Salary Sheets', label: 'Salary Sheets', icon: ClipboardList },
    { id: 'Order Management', label: 'Order Management', icon: Printer },
    { id: 'Machine Management', label: 'Machine Management', icon: Cpu },
    { id: 'Settings', label: 'Settings', icon: Settings }
  ];

  const { 
    showGoToShortcut, 
    showTopbarSearch,
    showTopbarNotifications,
    showTopbarInstructions,
    appVersion, 
    developerContactText,
    maintenanceEnabled,
    maintenanceEndTime,
    maintenanceReason,
    maintenanceUpdates,
    developerContactAlignment,
    alterPageUiStyle,
    reportsPageUiStyle,
    reportsColumnsPerRow,
    searchPageUiStyle,
    alterColumnsPerRow,
    enableUserSortViewPref,
    updateSettings, 
    updateSystemSettings, 
    uiStyle, 
    glassBackground, 
    statusOnlineText, 
    statusOfflineText, 
    statusErrorText, 
    systemLogo, 
    systemFavicon, 
    notificationDuration, 
    notificationAnimationStyle,
    searchPlaceholder,
    searchHelpText,
    showSearchShortcut,
    searchIconColor,
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
    soundNavigation
  } = useSettings();
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled ?? true);
  const [localSoundVolume, setLocalSoundVolume] = useState(soundVolume ?? 0.5);
  const [localSoundScheme, setLocalSoundScheme] = useState(soundScheme || 'system');
  const [localSoundSuccess, setLocalSoundSuccess] = useState(soundSuccess || '');
  const [localSoundError, setLocalSoundError] = useState(soundError || '');
  const [localSoundWarning, setLocalSoundWarning] = useState(soundWarning || '');
  const [localSoundDelete, setLocalSoundDelete] = useState(soundDelete || '');
  const [localSoundClick, setLocalSoundClick] = useState(soundClick || '');
  const [localSoundNavigation, setLocalSoundNavigation] = useState(soundNavigation || '');

  const [localAppVersion, setLocalAppVersion] = useState(appVersion || 'v1.0.1');
  const [localDeveloperContactText, setLocalDeveloperContactText] = useState(developerContactText || 'Powered by TallyFlow ERP | Developer Contact: +880 1700 000000');
  const [localDeveloperContactAlignment, setLocalDeveloperContactAlignment] = useState(developerContactAlignment || 'center');
  const [localVoucherLayout, setLocalVoucherLayout] = useState(voucherLayout || 'Layout 1');
  const [localVoucherFieldSize, setLocalVoucherFieldSize] = useState(voucherFieldSize || 'medium');
  const [localWarnings, setLocalWarnings] = useState({
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
    warningJournalNotBalanced: warningJournalNotBalanced || 'Voucher is not balanced. Difference: ৳ {DIFF} (Debit: ৳ {DEBIT}, Credit: ৳ {CREDIT})'
  });
  const [localAlterPageUiStyle, setLocalAlterPageUiStyle] = useState<'classic' | 'modern'>(alterPageUiStyle || 'classic');
  const [localReportsPageUiStyle, setLocalReportsPageUiStyle] = useState<'classic' | 'modern' | 'grid'>(reportsPageUiStyle || 'classic');
  const [localSearchPageUiStyle, setLocalSearchPageUiStyle] = useState<'classic' | 'modern'>(searchPageUiStyle || 'classic');
  const [localReportsColumnsPerRow, setLocalReportsColumnsPerRow] = useState<number>(reportsColumnsPerRow || 4);
  const [localAlterColumnsPerRow, setLocalAlterColumnsPerRow] = useState<number>(alterColumnsPerRow || 3);
  const [localEnableUserSortViewPref, setLocalEnableUserSortViewPref] = useState<boolean>(enableUserSortViewPref || false);
  const [localUIStyle, setLocalUIStyle] = useState(uiStyle || 'UI/UX 1');
  const [localMenuBarStyle, setLocalMenuBarStyle] = useState(menuBarStyle || 'classic');
  const [localSidebarBgColor, setLocalSidebarBgColor] = useState(sidebarBgColor || 'default');
  const [localSidebarTextColor, setLocalSidebarTextColor] = useState(sidebarTextColor || 'default');
  const [localDashboardDesign, setLocalDashboardDesign] = useState(globalDashboardDesign || 'Design 1');
  const [localGlassBackground, setLocalGlassBackground] = useState(glassBackground || 'default');
  const [localStatusOnline, setLocalStatusOnline] = useState(statusOnlineText || 'Status: Online');
  const [localStatusOffline, setLocalStatusOffline] = useState(statusOfflineText || 'Status: Offline');
  const [localStatusError, setLocalStatusError] = useState(statusErrorText || 'Database Error');
  const [localSystemLogo, setLocalSystemLogo] = useState(systemLogo || '');
  const [localSystemFavicon, setLocalSystemFavicon] = useState(systemFavicon || '');
  const [localNotificationDuration, setLocalNotificationDuration] = useState(notificationDuration || 5000);
  const [localNotificationAnimationStyle, setLocalNotificationAnimationStyle] = useState(notificationAnimationStyle || 'default');
  const [localShowGoToShortcut, setLocalShowGoToShortcut] = useState(showGoToShortcut ?? true);
  const [localShowTopbarSearch, setLocalShowTopbarSearch] = useState(showTopbarSearch ?? true);
  const [localShowTopbarNotifications, setLocalShowTopbarNotifications] = useState(showTopbarNotifications ?? true);
  const [localShowTopbarInstructions, setLocalShowTopbarInstructions] = useState(showTopbarInstructions ?? true);
  const [localSearchPlaceholder, setLocalSearchPlaceholder] = useState(searchPlaceholder || '');
  const [localSearchHelpText, setLocalSearchHelpText] = useState(searchHelpText || '');
  const [localShowSearchShortcut, setLocalShowSearchShortcut] = useState(showSearchShortcut ?? true);
  const [localSearchIconColor, setLocalSearchIconColor] = useState(searchIconColor || '');
  const [localLoaderBlurStyle, setLocalLoaderBlurStyle] = useState(loaderBlurStyle || 'md');
  const [localLoaderIconStyle, setLocalLoaderIconStyle] = useState(loaderIconStyle || 'spinner');
  const [localLoaderPhrases, setLocalLoaderPhrases] = useState(loaderPhrases || 'Connecting to server, Requesting data, Waiting for response, Almost done, Here we go!');
  const [localLoaderTheme, setLocalLoaderTheme] = useState(loaderTheme || 'glass');
  const [localAdaptiveLoaderEnabled, setLocalAdaptiveLoaderEnabled] = useState(adaptiveLoaderEnabled ?? true);
  const [localShowQuickCalculator, setLocalShowQuickCalculator] = useState(showQuickCalculator ?? true);
  const [localShowPinnedBookmarks, setLocalShowPinnedBookmarks] = useState(showPinnedBookmarks ?? true);
  const [localCustomControlCenterTheme, setLocalCustomControlCenterTheme] = useState(customControlCenterTheme || 'emerald');
  const [localCustomWelcomeMessage, setLocalCustomWelcomeMessage] = useState(customWelcomeMessage || 'Executive Command Center');
  const [localSplashSubDesign, setLocalSplashSubDesign] = useState(splashSubDesign || 'grid');
  const [localSkeletonEnabled, setLocalSkeletonEnabled] = useState(skeletonEnabled ?? true);
  const [localSkeletonDashboardOnly, setLocalSkeletonDashboardOnly] = useState(skeletonDashboardOnly ?? true);
  const [localSkeletonType, setLocalSkeletonType] = useState(skeletonType || 'automatic');
  const [localSkeletonSpeed, setLocalSkeletonSpeed] = useState(skeletonSpeed || 'normal');
  const [localSkeletonTheme, setLocalSkeletonTheme] = useState(skeletonTheme || 'modern');
  const [localSkeletonRows, setLocalSkeletonRows] = useState(skeletonRows ?? 5);
  const [localSkeletonWaveColor, setLocalSkeletonWaveColor] = useState(skeletonWaveColor || 'indigo');
  const [localMaintenanceEnabled, setLocalMaintenanceEnabled] = useState(maintenanceEnabled || false);
  const [localMaintenanceEndTime, setLocalMaintenanceEndTime] = useState(maintenanceEndTime || '');
  const [localMaintenanceReason, setLocalMaintenanceReason] = useState(maintenanceReason || '');
  const [localMaintenanceUpdates, setLocalMaintenanceUpdates] = useState(maintenanceUpdates || '');
  const [systemSubTab, setSystemSubTab] = useState<'general' | 'theme' | 'branding' | 'search' | 'loader' | 'skeleton' | 'warnings' | 'sounds'>('general');
  const [settingsFilterQuery, setSettingsFilterQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (viewMode === 'features' && appFeatures.length > 0) {
      setEditableFeatures(JSON.parse(JSON.stringify(appFeatures)));
    }
  }, [viewMode, appFeatures]);

  useEffect(() => {
    setLocalAppVersion(appVersion);
  }, [appVersion]);

  useEffect(() => {
    setLocalDeveloperContactText(developerContactText || 'Powered by TallyFlow ERP | Developer Contact: +880 1700 000000');
  }, [developerContactText]);

  useEffect(() => {
    setLocalDeveloperContactAlignment(developerContactAlignment || 'center');
  }, [developerContactAlignment]);

  useEffect(() => {
    setLocalUIStyle(uiStyle);
  }, [uiStyle]);

  useEffect(() => {
    setLocalMenuBarStyle(menuBarStyle || 'classic');
  }, [menuBarStyle]);

  useEffect(() => {
    setLocalDashboardDesign(globalDashboardDesign || 'Design 1');
  }, [globalDashboardDesign]);

  useEffect(() => {
    setLocalStatusOnline(statusOnlineText);
  }, [statusOnlineText]);

  useEffect(() => {
    setLocalStatusOffline(statusOfflineText);
  }, [statusOfflineText]);

  useEffect(() => {
    setLocalStatusError(statusErrorText);
  }, [statusErrorText]);

  useEffect(() => {
    setLocalMaintenanceEnabled(maintenanceEnabled || false);
  }, [maintenanceEnabled]);

  useEffect(() => {
    setLocalMaintenanceEndTime(maintenanceEndTime || '');
  }, [maintenanceEndTime]);

  useEffect(() => {
    setLocalMaintenanceReason(maintenanceReason || '');
  }, [maintenanceReason]);

  useEffect(() => {
    setLocalMaintenanceUpdates(maintenanceUpdates || '');
  }, [maintenanceUpdates]);

  useEffect(() => {
    setLocalSystemLogo(systemLogo || '');
  }, [systemLogo]);

  useEffect(() => {
    setLocalSystemFavicon(systemFavicon || '');
  }, [systemFavicon]);

  useEffect(() => {
    setLocalAlterPageUiStyle(alterPageUiStyle || 'classic');
  }, [alterPageUiStyle]);

  useEffect(() => {
    setLocalReportsPageUiStyle(reportsPageUiStyle || 'classic');
  }, [reportsPageUiStyle]);

  useEffect(() => {
    setLocalSearchPageUiStyle(searchPageUiStyle || 'classic');
  }, [searchPageUiStyle]);

  useEffect(() => {
    if (reportsColumnsPerRow !== undefined) {
      setLocalReportsColumnsPerRow(reportsColumnsPerRow);
    }
  }, [reportsColumnsPerRow]);

  useEffect(() => {
    if (alterColumnsPerRow !== undefined) {
      setLocalAlterColumnsPerRow(alterColumnsPerRow);
    }
  }, [alterColumnsPerRow]);

  useEffect(() => {
    if (enableUserSortViewPref !== undefined) {
      setLocalEnableUserSortViewPref(enableUserSortViewPref);
    }
  }, [enableUserSortViewPref]);

  useEffect(() => {
    setLocalNotificationDuration(notificationDuration);
  }, [notificationDuration]);

  useEffect(() => {
    setLocalNotificationAnimationStyle(notificationAnimationStyle);
  }, [notificationAnimationStyle]);

  useEffect(() => {
    setLocalShowGoToShortcut(showGoToShortcut);
  }, [showGoToShortcut]);

  useEffect(() => {
    setLocalShowTopbarSearch(showTopbarSearch ?? true);
  }, [showTopbarSearch]);

  useEffect(() => {
    setLocalShowTopbarNotifications(showTopbarNotifications ?? true);
  }, [showTopbarNotifications]);

  useEffect(() => {
    setLocalShowTopbarInstructions(showTopbarInstructions ?? true);
  }, [showTopbarInstructions]);

  useEffect(() => {
    setLocalSearchPlaceholder(searchPlaceholder || '');
  }, [searchPlaceholder]);

  useEffect(() => {
    setLocalSearchHelpText(searchHelpText || '');
  }, [searchHelpText]);

  useEffect(() => {
    setLocalShowSearchShortcut(showSearchShortcut ?? true);
  }, [showSearchShortcut]);

  useEffect(() => {
    setLocalSearchIconColor(searchIconColor || '');
  }, [searchIconColor]);

  useEffect(() => {
    setLocalGlassBackground(glassBackground);
  }, [glassBackground]);

  useEffect(() => {
    setLocalSidebarBgColor(sidebarBgColor || 'default');
  }, [sidebarBgColor]);

  useEffect(() => {
    setLocalSidebarTextColor(sidebarTextColor || 'default');
  }, [sidebarTextColor]);

  useEffect(() => {
    setLocalWarnings({
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
      warningJournalNotBalanced: warningJournalNotBalanced || 'Voucher is not balanced. Difference: ৳ {DIFF} (Debit: ৳ {DEBIT}, Credit: ৳ {CREDIT})'
    });
  }, [
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
    warningJournalNotBalanced
  ]);

  useEffect(() => {
    setLocalSoundEnabled(soundEnabled ?? true);
  }, [soundEnabled]);

  useEffect(() => {
    setLocalSoundVolume(soundVolume ?? 0.5);
  }, [soundVolume]);

  useEffect(() => {
    setLocalSoundScheme(soundScheme || 'system');
  }, [soundScheme]);

  useEffect(() => {
    setLocalSoundSuccess(soundSuccess || '');
  }, [soundSuccess]);

  useEffect(() => {
    setLocalSoundError(soundError || '');
  }, [soundError]);

  useEffect(() => {
    setLocalSoundWarning(soundWarning || '');
  }, [soundWarning]);

  useEffect(() => {
    setLocalSoundDelete(soundDelete || '');
  }, [soundDelete]);

  useEffect(() => {
    setLocalSoundClick(soundClick || '');
  }, [soundClick]);

  useEffect(() => {
    setLocalSoundNavigation(soundNavigation || '');
  }, [soundNavigation]);

  const safeFormat = (date: any, formatStr: string) => {
    try {
      if (!date) return 'N/A';
      const d = ensureDate(date);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesSnap, usersSnap, notificationsData, activityData, plansData, ordersData] = await Promise.all([
        erpService.getAllCompanies(),
        erpService.getAllUsers(),
        erpService.getNotifications(currentUser?.uid || '', currentUser?.companyId || '', true),
        erpService.getActivityLogs(),
        erpService.getSubscriptionPlans(),
        erpService.getSubscriptionOrders()
      ]);
      
      setAllUsers(usersSnap);
      setNotifications(notificationsData);
      setGlobalActivity(activityData);
      setSubscriptionPlans(plansData);
      setSubscriptionOrders(ordersData);
      const companyData = await Promise.all(
        companiesSnap.map(async (data) => {
          const creatorId = data.createdBy || data.ownerId;
          
          // Fetch Creator Email
          let creatorEmail = 'Unknown';
          if (creatorId) {
            const user = usersSnap.find(u => u.uid === creatorId);
            if (user) {
              creatorEmail = user.email;
            }
          }

          // Fetch User Count (from pre-fetched users)
          const userCount = usersSnap.filter(u => u.companyId === data.id).length;
          
          // Fetch Voucher Count (as a proxy for DB size/usage)
          const [vCount, lCount, iCount, lastActData] = await Promise.all([
            erpService.getCollectionCount('vouchers', data.id),
            erpService.getCollectionCount('ledgers', data.id),
            erpService.getCollectionCount('items', data.id),
            erpService.getActivityLogs(data.id, 1)
          ]);
          
          return {
            ...data,
            userCount,
            voucherCount: vCount,
            ledgerCount: lCount,
            itemCount: iCount,
            lastActivity: lastActData?.[0],
            creatorEmail
          } as CompanyStats;
        })
      );

      setCompanies(companyData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!menuConfig) return;
    try {
      setLoading(true);
      const cleaned = deduplicateMenuConfig(menuConfig);
      if (cleaned) {
        await erpService.updateMenuConfig(cleaned);
        setMenuConfig(cleaned);
        showNotification('Menu deduplicated and consolidated successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to cleanup duplicates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncMenuWithDefaults = async () => {
    if (!menuConfig) {
      await seedInitialMenu();
      return;
    }
    
    try {
      setLoading(true);
      
      const dynamicGroupsMap = new Map(menuConfig.groups.map(g => [g.id, { ...g, items: [...g.items] }]));
      const allItemIds = new Set();
      menuConfig.groups.forEach(group => {
        group.items.forEach(item => allItemIds.add(item.id));
      });

      let updated = false;

      NAV_ITEMS.forEach(coreGroup => {
        if (!dynamicGroupsMap.has(coreGroup.id)) {
          // Group completely missing, filter out items that are already somewhere else
          const uniqueItems = coreGroup.items.filter(item => !allItemIds.has(item.id));
          if (uniqueItems.length > 0) {
            const newGroup: MenuGroupConfig = {
              id: coreGroup.id,
              group: coreGroup.group,
              groupKey: coreGroup.groupKey,
              items: uniqueItems.map(item => ({
                id: item.id,
                to: item.to,
                icon: item.iconName,
                label: item.label,
                labelKey: item.labelKey,
                feature: item.feature,
                permission: item.permission,
                adminOnly: item.adminOnly,
                superAdminOnly: item.superAdminOnly,
                hidden: item.hidden || false
              }))
            };
            dynamicGroupsMap.set(coreGroup.id, newGroup);
            uniqueItems.forEach(item => allItemIds.add(item.id));
            updated = true;
          }
        } else {
          // Group exists, check for missing items (that aren't anywhere else)
          const dynamicGroup = dynamicGroupsMap.get(coreGroup.id)!;
          const missingCoreItems = coreGroup.items.filter(item => !allItemIds.has(item.id));
          
          if (missingCoreItems.length > 0) {
            const newItems = missingCoreItems.map(item => ({
              id: item.id,
              to: item.to,
              icon: item.iconName,
              label: item.label,
              labelKey: item.labelKey,
              feature: item.feature,
              permission: item.permission,
              adminOnly: item.adminOnly,
              superAdminOnly: item.superAdminOnly,
              hidden: item.hidden || false
            }));
            dynamicGroup.items = [...dynamicGroup.items, ...newItems];
            missingCoreItems.forEach(item => allItemIds.add(item.id));
            updated = true;
          }
        }
      });

      if (updated) {
        const rawConfig: MenuConfig = {
          ...menuConfig,
          groups: Array.from(dynamicGroupsMap.values()),
          updatedAt: new Date()
        };
        const cleaned = deduplicateMenuConfig(rawConfig) as MenuConfig;
        await erpService.updateMenuConfig(cleaned);
        setMenuConfig(cleaned);
        showNotification('Menu synchronized and consolidated successfully', 'success');
      } else {
        showNotification('Menu is already up to date with defaults', 'info');
      }
    } catch (error) {
      console.error('Error syncing menu:', error);
      showNotification('Failed to sync menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedInitialMenu = async () => {
    try {
      setLoading(true);
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
            hidden: item.hidden || false
          };
          
          if (item.feature) menuItem.feature = item.feature;
          if (item.adminOnly !== undefined) menuItem.adminOnly = item.adminOnly;
          if (item.superAdminOnly !== undefined) menuItem.superAdminOnly = item.superAdminOnly;
          if (item.permission) menuItem.permission = item.permission;
          
          return menuItem;
        })
      }));

      const config: MenuConfig = {
        groups: initialGroups,
        updatedAt: new Date()
      };

      await erpService.updateMenuConfig(config);
      setMenuConfig(config);
      showNotification('Menu seeded successfully from defaults', 'success');
    } catch (error) {
      console.error('Error seeding menu:', error);
      showNotification('Failed to seed menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (updates: Partial<MenuItemConfig>) => {
    if (!menuConfig) return;
    
    const newGroups = menuConfig.groups.map(group => ({
      ...group,
      items: group.items.map(item => {
        if (selectedItemIds.has(item.id)) {
          return { ...item, ...updates };
        }
        return item;
      })
    }));

    const newConfig = { ...menuConfig, groups: newGroups, updatedAt: new Date() };
    try {
      await erpService.updateMenuConfig(newConfig);
      setMenuConfig(newConfig);
      setSelectedItemIds(new Set());
      showNotification('Bulk update successful');
    } catch (err) {
      showNotification('Failed to update items', 'error');
    }
  };

  const fetchMenuConfig = async () => {
    try {
      const config = await erpService.getMenuConfig();
      setMenuConfig(config);
    } catch (error) {
      console.error('Error fetching menu config:', error);
    }
  };

  useEffect(() => {
    if (viewMode === 'menu') {
      fetchMenuConfig();
    }
  }, [viewMode]);

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleAccess = async (company: CompanyStats) => {
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        isAccessEnabled: !company.isAccessEnabled
      });
      setCompanies(companies.map(c => 
        c.id === company.id ? { ...c, isAccessEnabled: !c.isAccessEnabled } : c
      ));
    } catch (error) {
      console.error('Error toggling access:', error);
    }
  };

  const handleSavePlan = async () => {
    if (!currentPlan.name || !currentPlan.description) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const planData = {
      ...currentPlan,
      tier: currentPlan.tier || 1,
      discount: currentPlan.discount || { type: 'percentage', value: 0 }
    } as Omit<SubscriptionPlan, 'id'>;

    try {
      if (currentPlan.id) {
        await erpService.updateSubscriptionPlan(currentPlan.id, planData);
        showNotification('Subscription plan updated successfully');
      } else {
        await erpService.createSubscriptionPlan(planData);
        showNotification('Subscription plan created successfully');
      }
      setIsEditingPlan(false);
      setCurrentPlan({ 
        name: '', 
        description: '', 
        priceMonthly: 0, 
        priceYearly: 0, 
        features: [], 
        tier: 1, 
        discount: { type: 'percentage', value: 0 },
        supportType: 'Email',
        supportHours: '24/7',
        trainingIncluded: false,
        customReports: false,
        apiAccess: false,
        setupFee: 0,
        customDomain: false,
        featureLimits: {},
        limits: {
          vouchers: 100,
          items: 50,
          ledgers: 50,
          users: 1,
          godowns: 1,
          multiCurrency: false,
          rolePermissions: false
        }
      });
      fetchData();
    } catch (err) {
      showNotification('Failed to save subscription plan', 'error');
    }
  };

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const handleDeletePlan = async (id: string) => {
    setPlanToDelete(id);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await erpService.deleteSubscriptionPlan(planToDelete);
      showNotification('Subscription plan deleted successfully');
      setPlanToDelete(null);
      fetchData();
    } catch (err) {
      showNotification('Failed to delete subscription plan', 'error');
    }
  };

  const toggleFeatureForPlan = (featureId: string) => {
    setCurrentPlan(prev => {
      const features = prev.features || [];
      if (features.includes(featureId)) {
        return { ...prev, features: features.filter(f => f !== featureId) };
      } else {
        return { ...prev, features: [...features, featureId] };
      }
    });
  };

  const updateSubscription = async (companyId: string, updates: any) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, updates);
      
      const updatedCompanies = companies.map(c => 
        c.id === companyId ? { ...c, ...updates } : c
      );
      setCompanies(updatedCompanies);
      
      if (selectedCompany?.id === companyId) {
        setSelectedCompany({ ...selectedCompany, ...updates });
      }
      
      setIsEditingSubscription(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const deleteCompany = async (companyId: string) => {
    try {
      setLoading(true);
      await erpService.deleteCompany(companyId);
      
      const remainingCompanies = companies.filter(c => c.id !== companyId);
      setCompanies(remainingCompanies);
      setSelectedCompany(null);
      setCompanyToDelete(null);

      // If the Founder just deleted the company they were currently in, switch them to another one
      if (currentUser?.companyId === companyId) {
        if (remainingCompanies.length > 0) {
          await erpService.switchCompany(currentUser.uid, remainingCompanies[0].id);
        } else {
          // No companies left, set to placeholder
          await erpService.switchCompany(currentUser.uid, 'placeholder');
        }
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showNotification('Logo size should be less than 1MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSystemLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSystemFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 512 * 1024) {
        showNotification('Favicon size should be less than 512KB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSystemFavicon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) return;
    
    try {
      setLoading(true);
      const data: any = {
        ...newNotification,
        createdBy: currentUser?.uid
      };
      if (newNotification.status === 'sent') {
        data.sentAt = new Date();
      }
      await erpService.createNotification(data);
      setIsCreatingNotification(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        status: 'sent'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setLoading(true);
      await erpService.deleteNotification(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCompany = async (companyId: string) => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      await erpService.switchCompany(currentUser.uid, companyId);
      // The AuthContext will handle the state update and the UI will reflect the new company
      // We don't need to navigate away, but we should show a success indicator
    } catch (error) {
      console.error('Error switching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
        <Activity className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">Access Denied</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
            The Founder Panel is restricted to system administrators only.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col min-h-full transition-colors", uiStyle === 'UI/UX 2' && "bg-slate-50")}>
      {/* Sticky Header Section */}
      <div className={cn(
        "sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm px-4 lg:px-6 py-4 z-40",
        uiStyle === 'UI/UX 2' && "bg-white/80 border-blue-100 shadow-blue-500/5"
      )}>
        <header className="flex flex-col md:flex-row md:items-center justify-start gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <div className={cn(
            "grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap rounded-lg p-1 w-full sm:w-auto gap-1",
            uiStyle === 'UI/UX 2' ? "bg-blue-50" : "bg-muted"
          )}>
            <button
              onClick={() => setViewMode('companies')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'companies' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Companies
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'users' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListTree className="w-4 h-4" />
              User Tree
            </button>
            <button
              onClick={() => setViewMode('notifications')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'notifications' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setViewMode('activity')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'activity' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>
            <button
              onClick={() => setViewMode('siteContent')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'siteContent' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Site Content
            </button>
            <button
              onClick={() => setViewMode('plans')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'plans' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CreditCard className="w-4 h-4" />
              Plans
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'orders' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ClipboardList className="w-4 h-4" />
              Orders
            </button>
            <button
              onClick={() => setViewMode('menu')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'menu' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListTree className="w-4 h-4" />
              Menu
            </button>
            <button
              onClick={() => setViewMode('features')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'features' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="w-4 h-4" />
              Features
            </button>
             <button
              onClick={() => setViewMode('errorLogs')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'errorLogs' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <AlertCircle className="w-4 h-4" />
              Error Logs
            </button>
            <button
              onClick={() => setViewMode('inquiries')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'inquiries' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Inquiries
            </button>
            <button
              onClick={() => setViewMode('settings')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'settings' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="w-4 h-4" />
              System
            </button>
          </div>

          <div className="sm:ml-auto flex items-center gap-4">
            {(viewMode === 'companies' || viewMode === 'users') && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={viewMode === 'companies' ? "Search companies..." : "Search users..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-64"
                />
              </div>
            )}
            <button 
              onClick={fetchData}
              className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <Activity className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
    </div>

    <div className="p-4 lg:p-6 space-y-6">

      {(viewMode === 'companies' || viewMode === 'users') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={cn(
            "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
            uiStyle === 'UI/UX 2' ? "bg-blue-600 border-blue-700 text-white shadow-blue-200" : ""
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                uiStyle === 'UI/UX 2' ? "bg-white/20" : "bg-primary/10"
              )}>
                <Users className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-white" : "text-primary")} />
              </div>
              <div>
                <p className={cn(
                  "text-sm",
                  uiStyle === 'UI/UX 2' ? "text-blue-100" : "text-muted-foreground"
                )}>Total Users</p>
                <p className="text-2xl font-bold">{allUsers.length}</p>
              </div>
            </div>
          </div>

          <div className={cn(
            "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
            uiStyle === 'UI/UX 2' ? "bg-emerald-600 border-emerald-700 text-white shadow-emerald-200" : ""
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                uiStyle === 'UI/UX 2' ? "bg-white/20" : "bg-emerald-500/10"
              )}>
                <CheckCircle2 className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-white" : "text-emerald-500")} />
              </div>
              <div>
                <p className={cn(
                  "text-sm",
                  uiStyle === 'UI/UX 2' ? "text-emerald-100" : "text-muted-foreground"
                )}>Active Subscriptions</p>
                <p className="text-2xl font-bold">
                  {companies.filter(c => c.subscriptionStatus?.toLowerCase() === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className={cn(
            "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
            uiStyle === 'UI/UX 2' ? "bg-amber-500 border-amber-600 text-white shadow-amber-200" : ""
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                uiStyle === 'UI/UX 2' ? "bg-white/20" : "bg-amber-500/10"
              )}>
                <AlertCircle className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-white" : "text-amber-500")} />
              </div>
              <div>
                <p className={cn(
                  "text-sm",
                  uiStyle === 'UI/UX 2' ? "text-amber-100" : "text-muted-foreground"
                )}>Trial Users</p>
                <p className="text-2xl font-bold">
                  {companies.filter(c => c.subscriptionStatus?.toLowerCase() === 'trial').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'companies' ? (
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-sm overflow-x-auto",
          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
        )}>
          <div className="min-w-[1000px] lg:min-w-0">
            <table className="w-full text-left text-sm">
            <thead className={cn(
              "font-medium border-b border-border",
              uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-muted/50 text-muted-foreground"
            )}>
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className={cn(
                  "transition-colors group",
                  uiStyle === 'UI/UX 2' ? "hover:bg-blue-50/50" : "hover:bg-muted/30"
                )}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{company.name}</span>
                      <span className="text-xs text-muted-foreground">{company.email || 'No email'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${
                        company.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        company.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {company.subscriptionStatus}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Exp: {safeFormat(company.expiryDate, 'dd MMM yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" /> {company.userCount} Users
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {company.voucherCount} Vouchers
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {company.ledgerCount} Ledgers
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <Package className="w-3 h-3" /> {company.itemCount} Items
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {company.lastActivity ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground">{company.lastActivity.action}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {company.lastActivity.timestamp ? safeFormat(company.lastActivity.timestamp, 'dd MMM, HH:mm') : 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No activity</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      company.isAccessEnabled ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {company.isAccessEnabled ? (
                        <><CheckCircle2 className="w-4 h-4" /> Enabled</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> Disabled</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser?.companyId !== company.id ? (
                        <button 
                           onClick={() => handleSwitchCompany(company.id)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Switch to this Company"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="p-2 text-emerald-500" title="Currently Active">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      <button 
                        onClick={() => toggleAccess(company)}
                        className={`p-2 rounded-lg transition-colors ${
                          company.isAccessEnabled 
                            ? 'text-rose-500 hover:bg-rose-500/10' 
                            : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={company.isAccessEnabled ? 'Disable Access' : 'Enable Access'}
                      >
                        {company.isAccessEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => setCompanyToDelete(company.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedCompany(company)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : viewMode === 'siteContent' ? (
        <SiteContentEditor />
      ) : viewMode === 'users' ? (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[600px] lg:min-w-0 space-y-4">
            {allUsers
              .filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((user) => {
                const userCompanies = companies.filter(c => 
                  c.createdBy === user.uid || 
                  c.ownerId === user.uid || 
                  (c.email && c.email === user.email)
                );
                const isExpanded = expandedUsers.has(user.uid);

                return (
                  <div key={user.uid} className={cn(
                    "bg-card border border-border rounded-xl overflow-hidden transition-all",
                    uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                  )}>
                    <div 
                      onClick={() => toggleUserExpansion(user.uid)}
                      className={cn(
                        "p-4 flex items-center justify-between cursor-pointer transition-colors",
                        uiStyle === 'UI/UX 2' ? "hover:bg-blue-50/50" : "hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-primary/10 text-primary"
                        )}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={cn(
                            "text-sm font-bold",
                            uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
                          )}>{user.displayName || 'Unnamed User'}</h3>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPermissionsUser(user);
                            setSelectedPermissions(user.permissions || []);
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                            uiStyle === 'UI/UX 2' ? "text-blue-600 hover:bg-blue-50" : "text-primary hover:bg-primary/10"
                          )}
                          title="Manage Permissions"
                        >
                          <Shield className="w-4 h-4" />
                          Permissions
                        </button>
                        <span className={cn(
                          "text-[10px] uppercase font-bold px-2 py-1 rounded",
                          uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "text-gray-500 bg-muted"
                        )}>
                          {userCompanies.length} Companies
                        </span>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border bg-muted/10"
                        >
                          <div className="border-b border-border bg-muted/20 p-4">
                            <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-5">
                              {/* Left Profile Summary */}
                              <div className="flex items-center md:items-start gap-4">
                                <img 
                                  src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email || 'default'}`}
                                  alt={user.displayName}
                                  className="w-16 h-16 rounded-full border border-border object-cover bg-background shrink-0 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="space-y-1 min-w-0">
                                  <h4 className="text-sm font-bold text-foreground">User Profile Information</h4>
                                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                                    <span className="font-semibold text-foreground">Designation:</span> {user.designation || 'Not specified'}
                                  </p>
                                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                                    <span className="font-semibold text-foreground">Department:</span> {user.department || 'Not specified'}
                                  </p>
                                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                                    <span className="font-semibold text-foreground">Phone:</span> {user.phone || 'Not specified'}
                                  </p>
                                </div>
                              </div>
                              {/* Right Bio & Info */}
                              <div className="flex-1 space-y-1.5 md:border-l md:border-border md:pl-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  <p className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">City:</span> {user.city || 'N/A'}
                                  </p>
                                  <p className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">State:</span> {user.state || 'N/A'}
                                  </p>
                                  <p className="text-muted-foreground">
                                    <span className="font-semibold text-foreground">Country:</span> {user.country || 'N/A'}
                                  </p>
                                </div>
                                {user.address && (
                                  <p className="text-[11px] text-muted-foreground leading-normal italic pl-2 border-l-2 border-primary/40 mt-1">
                                    {user.address}
                                  </p>
                                )}
                                <div className="pt-1.5 border-t border-border mt-2">
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    <span className="font-semibold text-foreground block mb-0.5">Bio / Summary:</span>
                                    <span className="italic">{user.bio || 'No bio provided.'}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          {userCompanies.length > 0 ? (
                            <div className="p-4 space-y-4">
                              {userCompanies.map((company) => (
                                <div key={company.id} className="bg-background border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-foreground">{company.name}</h4>
                                      <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                        company.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                        company.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-rose-500/10 text-rose-500'
                                      }`}>
                                        {company.subscriptionStatus}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Mail className="w-3 h-3" />
                                        {company.email || 'N/A'}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Phone className="w-3 h-3" />
                                        {company.phone || 'N/A'}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <Globe className="w-3 h-3" />
                                        {company.website || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {currentUser?.companyId !== company.id ? (
                                      <button 
                                        onClick={() => handleSwitchCompany(company.id)}
                                        className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded hover:opacity-90 transition-all flex items-center gap-1"
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                        Switch
                                      </button>
                                    ) : (
                                      <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Active
                                      </div>
                                    )}
                                    <button 
                                      onClick={() => setSelectedCompany(company)}
                                      className="px-3 py-1.5 bg-muted text-foreground text-[10px] font-bold uppercase tracking-widest rounded hover:bg-muted/80 transition-all"
                                    >
                                      Manage
                                    </button>
                                    <button 
                                      onClick={() => setCompanyToDelete(company.id)}
                                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                      title="Delete Company"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <p className="text-xs text-muted-foreground italic">This user hasn't created any companies yet.</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
          </div>
        </div>
      ) : viewMode === 'activity' ? (
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-sm overflow-x-auto",
          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
        )}>
          <div className="min-w-[700px] lg:min-w-0">
            <div className={cn(
            "p-4 border-b border-border",
            uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-muted/30"
          )}>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className={cn("w-4 h-4", uiStyle === 'UI/UX 2' ? "text-white" : "text-primary")} />
              Global Activity Log (Last 50 Actions)
            </h2>
          </div>
          <div className="divide-y divide-border">
            {globalActivity && globalActivity.length > 0 ? (
              globalActivity.map((log) => {
                const company = companies.find(c => c.id === log.companyId);
                const user = allUsers.find(u => u.uid === log.userId);
                return (
                  <div key={log.id} className={cn(
                    "p-4 transition-colors flex items-center justify-between gap-4",
                    uiStyle === 'UI/UX 2' ? "hover:bg-blue-50/50" : "hover:bg-muted/30"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        uiStyle === 'UI/UX 2' ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                      )}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-bold",
                            uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
                          )}>{log.action}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {company?.name || log.companyName || 'System'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by <span className={cn(
                            "font-medium",
                            uiStyle === 'UI/UX 2' ? "text-blue-500" : "text-foreground"
                          )}>{user?.displayName || log.userName || 'Unknown User'}</span>
                          {log.details && ` • ${log.details}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {safeFormat(log.createdAt, 'dd MMM, HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
              </div>
            )}
          </div>
          </div>
        </div>
      ) : viewMode === 'orders' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>Subscription Orders</h2>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Total Orders: {subscriptionOrders.length}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer / Company</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan Details</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date & Time</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptionOrders.length > 0 ? (
                    subscriptionOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">{order.userName}</p>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{order.companyName}</p>
                            <div className="flex flex-col gap-0.5 text-[9px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {order.userEmail}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {order.userPhone}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {order.userAddress}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-foreground uppercase">{order.planName}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold">{order.planType}</p>
                            {order.notes && (
                              <p className="text-[9px] text-amber-600 italic mt-1 max-w-[200px] line-clamp-2">" {order.notes} "</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-foreground">{order.amount} ৳</p>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                            order.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                            order.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                            order.status === 'rejected' ? "bg-rose-500/10 text-rose-500" :
                            "bg-gray-500/10 text-gray-500"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {safeFormat(order.createdAt, 'dd MMM yyyy, HH:mm')}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={async () => {
                                    if (confirm('Approve this order and update company plan?')) {
                                      try {
                                        // 1. Update order status
                                        await erpService.updateSubscriptionOrder(order.id, { status: 'approved' });
                                        // 2. Update company plan
                                        await erpService.updateCompanySubscription(order.companyId, {
                                          planId: order.planId,
                                          planType: order.planType,
                                          subscriptionStatus: 'active',
                                          expiryDate: order.planType === 'monthly' 
                                            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                                            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                                        });
                                        showNotification('Order approved and company plan updated');
                                        fetchData();
                                      } catch (err) {
                                        showNotification('Failed to approve order', 'error');
                                      }
                                    }
                                  }}
                                  className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    const reason = prompt('Reason for rejection:');
                                    if (reason !== null) {
                                      try {
                                        await erpService.updateSubscriptionOrder(order.id, { 
                                          status: 'rejected',
                                          founderNotes: reason 
                                        });
                                        showNotification('Order rejected');
                                        fetchData();
                                      } catch (err) {
                                        showNotification('Failed to reject order', 'error');
                                      }
                                    }
                                  }}
                                  className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm('Delete this order record?')) {
                                  try {
                                    await erpService.deleteSubscriptionOrder(order.id);
                                    showNotification('Order deleted');
                                    fetchData();
                                  } catch (err) {
                                    showNotification('Failed to delete order', 'error');
                                  }
                                }
                              }}
                              className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-sm text-muted-foreground italic">No subscription orders found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : viewMode === 'inquiries' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>Visitor Inquiries ({inquiries.length})</h2>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Live updates via firestore
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sender Info</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inquiry Subject</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Message Details</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timestamp</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inquiriesLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground italic">
                        Loading inquiries details...
                      </td>
                    </tr>
                  ) : inquiries.length > 0 ? (
                    inquiries.map((inquiry) => {
                      const date = inquiry.createdAt?.toDate 
                        ? inquiry.createdAt.toDate().toLocaleString() 
                        : inquiry.createdAt?.seconds 
                          ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString() 
                          : 'N/A';
                      return (
                        <tr key={inquiry.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-foreground">{inquiry.name}</p>
                              <p className="text-xs text-muted-foreground font-mono select-all">{inquiry.email}</p>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-xs text-foreground">
                            {inquiry.subject}
                          </td>
                          <td className="p-4 max-w-sm">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {inquiry.message}
                            </p>
                          </td>
                          <td className="p-4 text-xs font-mono text-muted-foreground">
                            {date}
                          </td>
                          <td className="p-4 text-right px-6">
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this inquiry record?')) {
                                  try {
                                    await deleteDoc(doc(db, 'inquiries', inquiry.id));
                                    showNotification('Inquiry deleted successfully');
                                  } catch (err) {
                                    showNotification('Failed to delete inquiry', 'error');
                                  }
                                }
                              }}
                              className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-sm text-muted-foreground italic">No inquiries found yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : viewMode === 'errorLogs' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>System Error Logs</h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Total Logs: {errorLogs.length}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Error Details</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">User / Location</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Severity</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {errorLogs.length > 0 ? (
                    errorLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="p-4 max-w-md">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground break-words">{log.message}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate cursor-help" title={log.stack}>
                              {log.componentName || 'Global'} • {log.path}
                            </p>
                            {log.stack && (
                                <details className="mt-2 text-[8px] font-mono bg-muted p-2 rounded max-h-40 overflow-auto">
                                    <summary className="cursor-pointer hover:text-primary list-none flex items-center gap-1 font-bold uppercase">
                                        <ChevronDown className="w-3 h-3 text-current group-open:rotate-180 transition-transform" /> View Stack Trace
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap leading-relaxed opacity-70 border-l border-primary/20 pl-2">{log.stack}</pre>
                                </details>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-foreground">{log.userEmail || 'Anonymous'}</p>
                            <p className="text-[9px] text-muted-foreground truncate max-w-[150px]" title={log.browserInfo}>{log.browserInfo}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                            log.severity === 'critical' ? "bg-rose-500 text-white" :
                            log.severity === 'error' ? "bg-rose-500/10 text-rose-500 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.2)]" :
                            log.severity === 'warning' ? "bg-amber-500/10 text-amber-500" :
                            "bg-blue-500/10 text-blue-500"
                          )}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-4">
                            <select 
                                value={log.status}
                                onChange={async (e) => {
                                    errorService.updateLogStatus(log.id, e.target.value as any);
                                }}
                                className={cn(
                                    "bg-transparent text-[10px] font-bold uppercase tracking-wider border border-border p-1 rounded focus:ring-0 cursor-pointer outline-none",
                                    log.status === 'new' ? "text-rose-500 border-rose-500/20" :
                                    log.status === 'investigating' ? "text-amber-500 border-amber-500/20" :
                                    log.status === 'resolved' ? "text-emerald-500 border-emerald-500/20" :
                                    "text-muted-foreground border-border"
                                )}
                            >
                                <option value="new">New</option>
                                <option value="investigating">Investigating</option>
                                <option value="resolved">Resolved</option>
                                <option value="ignored">Ignored</option>
                            </select>
                        </td>
                        <td className="p-4">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {safeFormat(log.timestamp, 'dd MMM, HH:mm:ss')}
                          </p>
                        </td>
                        <td className="p-4 text-right px-6">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={async () => {
                                        const prompt = `Please fix the following system error log in the application:

### Error Details:
- **Message:** ${log.message}
- **Component:** ${log.componentName || 'Global'}
- **Source Path:** ${log.path}
- **Severity:** ${log.severity}
${log.stack ? `\n### Stack Trace:\n\`\`\`\n${log.stack}\n\`\`\`` : ''}
${log.metadata ? `\n### Metadata:\n\`\`\`json\n${JSON.stringify(log.metadata, null, 2)}\n\`\`\`` : ''}

### Goal:
Analyze the codebase, identify why this error is happening, find the relevant file, and modify any incorrect file to prevent or fix it permanently. Once done, explain what the issue was and how you fixed it.`;

                                        try {
                                            await navigator.clipboard.writeText(prompt);
                                            await errorService.updateLogAiStatus(log.id, 'requested', 'investigating');
                                            setAiFixModal({
                                                isOpen: true,
                                                logId: log.id,
                                                logMessage: log.message,
                                                assembledPrompt: prompt
                                            });
                                            showNotification('AI Fix prompt copied & registered!', 'success');
                                        } catch (err) {
                                            console.error('Clipboard copy failed:', err);
                                            await errorService.updateLogAiStatus(log.id, 'requested', 'investigating');
                                            setAiFixModal({
                                                isOpen: true,
                                                logId: log.id,
                                                logMessage: log.message,
                                                assembledPrompt: prompt
                                            });
                                        }
                                    }}
                                    className={cn(
                                        "px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1 shadow-sm transition-all border",
                                        log.aiStatus === 'requested'
                                            ? "bg-purple-950/20 text-purple-400 border-purple-500/30 font-mono shadow-[0_0_10px_rgba(168,85,247,0.15)] animate-pulse"
                                            : "bg-purple-600 hover:bg-purple-700 text-white border-purple-500/20 hover:scale-[1.02]"
                                    )}
                                    title="Click to instantly request AI bug-fix"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                                    {log.aiStatus === 'requested' ? 'REQUESTED' : '1-CLICK AI FIX'}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('Delete this log?')) {
                                            await errorService.deleteLog(log.id);
                                        }
                                    }}
                                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Delete Log"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                        No error logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : viewMode === 'plans' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>Subscription Plans</h2>
            <button
              onClick={() => {
                setCurrentPlan({ 
                  name: '', 
                  description: '', 
                  priceMonthly: 0, 
                  priceYearly: 0, 
                  features: [], 
                  tier: 1, 
                  discount: { type: 'percentage', value: 0 },
                  supportType: 'Email',
                  supportHours: '24/7',
                  trainingIncluded: false,
                  customReports: false,
                  apiAccess: false,
                  setupFee: 0,
                  customDomain: false,
                  featureLimits: {},
                  limits: {
                    vouchers: 100,
                    items: 50,
                    ledgers: 50,
                    users: 1,
                    godowns: 1,
                    multiCurrency: false,
                    rolePermissions: false
                  }
                });
                setIsEditingPlan(true);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md",
                uiStyle === 'UI/UX 2' 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-primary text-white hover:opacity-90"
              )}
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptionPlans.sort((a, b) => (a.tier || 0) - (b.tier || 0)).map((plan) => (
              <div key={plan.id} className={cn(
                "bg-card border border-border rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl",
                uiStyle === 'UI/UX 2' && "border-blue-100",
                plan.tier === 1 && "border-slate-200 bg-white",
                plan.tier === 2 && "border-slate-300 bg-slate-50",
                plan.tier === 3 && "border-amber-200 bg-amber-50/30",
                plan.tier === 4 && "border-blue-200 bg-blue-50/30"
              )}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">Tier {plan.tier}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentPlan(plan);
                        setIsEditingPlan(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Monthly</p>
                    <p className="text-xl font-bold text-primary">{plan.priceMonthly} {currentUser?.companyId ? '৳' : '$'}</p>
                  </div>
                  <div className="text-center border-l border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Yearly</p>
                    <p className="text-xl font-bold text-primary">{plan.priceYearly} {currentUser?.companyId ? '৳' : '$'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Features Included:</p>
                  <div className="flex flex-wrap gap-2">
                      {plan.features.map(fId => {
                        const feature = AVAILABLE_FEATURES.find(af => af.id === fId);
                        const limitText = plan.featureLimits?.[fId];
                        return (
                          <span key={fId} className="px-2 py-1 bg-muted rounded text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary" />
                            {feature?.label || fId}
                            {limitText && <span className="opacity-70 ml-1">({limitText})</span>}
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Plan Modal */}
          <AnimatePresence>
            {isEditingPlan && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">{currentPlan.id ? 'Edit Plan' : 'New Subscription Plan'}</h2>
                    <button 
                      onClick={() => setIsEditingPlan(false)}
                      className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-foreground">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Plan Name</label>
                        <input
                          type="text"
                          value={currentPlan.name || ''}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                          placeholder="e.g. Professional"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Plan Tier (1-4)</label>
                        <select
                          value={currentPlan.tier || 1}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, tier: Number(e.target.value) })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value={1}>Tier 1: Bronze (Free)</option>
                          <option value={2}>Tier 2: Silver</option>
                          <option value={3}>Tier 3: Gold</option>
                          <option value={4}>Tier 4: Platinum</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Description</label>
                        <input
                          type="text"
                          value={currentPlan.description || ''}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                          placeholder="Short description of the plan"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Monthly Price</label>
                        <input
                          type="number"
                          value={currentPlan.priceMonthly || 0}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, priceMonthly: Number(e.target.value) })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Yearly Price</label>
                        <input
                          type="number"
                          value={currentPlan.priceYearly || 0}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, priceYearly: Number(e.target.value) })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      
                      {/* Discount Fields */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Discount Type</label>
                        <select
                          value={currentPlan.discount?.type || 'percentage'}
                          onChange={(e) => setCurrentPlan({ 
                            ...currentPlan, 
                            discount: { 
                              type: e.target.value as 'percentage' | 'fixed', 
                              value: currentPlan.discount?.value || 0 
                            } 
                          })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (৳)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Discount Value</label>
                        <input
                          type="number"
                          value={currentPlan.discount?.value || 0}
                          onChange={(e) => setCurrentPlan({ 
                            ...currentPlan, 
                            discount: { 
                              type: currentPlan.discount?.type || 'percentage', 
                              value: Number(e.target.value) 
                            } 
                          })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Support Type</label>
                        <select
                          value={currentPlan.supportType || 'Email'}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, supportType: e.target.value as any })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="Email">Email</option>
                          <option value="Chat">Chat</option>
                          <option value="Phone">Phone</option>
                          <option value="Dedicated Manager">Dedicated Manager</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Support Hours</label>
                        <input
                          type="text"
                          value={currentPlan.supportHours || ''}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, supportHours: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                          placeholder="e.g. 24/7 or 9am-5pm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Setup Fee (৳)</label>
                        <input
                          type="number"
                          value={currentPlan.setupFee || 0}
                          onChange={(e) => setCurrentPlan({ ...currentPlan, setupFee: Number(e.target.value) })}
                          className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 pt-2 md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentPlan.trainingIncluded || false}
                            onChange={(e) => setCurrentPlan({ ...currentPlan, trainingIncluded: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Training Included</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentPlan.customReports || false}
                            onChange={(e) => setCurrentPlan({ ...currentPlan, customReports: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Custom Reports</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentPlan.apiAccess || false}
                            onChange={(e) => setCurrentPlan({ ...currentPlan, apiAccess: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">API Access</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentPlan.customDomain || false}
                            onChange={(e) => setCurrentPlan({ ...currentPlan, customDomain: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Custom Domain</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Plan Limits (-1 for Unlimited)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Vouchers</label>
                          <input
                            type="number"
                            value={currentPlan.limits?.vouchers || 0}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, vouchers: Number(e.target.value) } 
                            })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Items/Products</label>
                          <input
                            type="number"
                            value={currentPlan.limits?.items || 0}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, items: Number(e.target.value) } 
                            })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Ledgers</label>
                          <input
                            type="number"
                            value={currentPlan.limits?.ledgers || 0}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, ledgers: Number(e.target.value) } 
                            })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Users</label>
                          <input
                            type="number"
                            value={currentPlan.limits?.users || 0}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, users: Number(e.target.value) } 
                            })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">Godowns</label>
                          <input
                            type="number"
                            value={currentPlan.limits?.godowns || 0}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, godowns: Number(e.target.value) } 
                            })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentPlan.limits?.multiCurrency || false}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, multiCurrency: e.target.checked } 
                            })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Multi-Currency</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentPlan.limits?.rolePermissions || false}
                            onChange={(e) => setCurrentPlan({ 
                              ...currentPlan, 
                              limits: { ...currentPlan.limits!, rolePermissions: e.target.checked } 
                            })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Role Permissions</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Select Features</label>
                      <div className="space-y-6">
                        {appFeatures.map((category) => (
                          <div key={category.id} className="space-y-3">
                            <p className="text-[9px] uppercase font-black text-muted-foreground/50 tracking-tighter border-b border-border/30 pb-1">{category.label}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {category.features.map((feature) => {
                                const Icon = Box;
                                const isSelected = currentPlan.features?.includes(feature.id);
                                return (
                                  <div key={feature.id} className="space-y-2">
                                    <button
                                      onClick={() => toggleFeatureForPlan(feature.id)}
                                      className={cn(
                                        "w-full flex items-center gap-3 p-3 border rounded-xl transition-all text-left group relative",
                                        isSelected 
                                          ? "bg-primary/10 border-primary text-primary shadow-sm" 
                                          : "bg-background border-border text-muted-foreground hover:border-foreground"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                      )}>
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-widest break-words">{feature.label}</span>
                                        {feature.description && (
                                          <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                                            <Info className="w-2.5 h-2.5" />
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[8px] font-medium leading-relaxed rounded-lg shadow-xl border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                                              {feature.description}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {isSelected && <Check className="w-3 h-3 ml-auto" />}
                                    </button>
                                    {isSelected && (
                                      <input
                                        type="text"
                                        placeholder="Feature Limit Description"
                                        value={currentPlan.featureLimits?.[feature.id] || ''}
                                        onChange={(e) => {
                                          const newLimits = { ...(currentPlan.featureLimits || {}), [feature.id]: e.target.value };
                                          setCurrentPlan({ ...currentPlan, featureLimits: newLimits });
                                        }}
                                        className="w-full bg-background border border-border rounded-lg p-2 text-[9px] focus:ring-1 focus:ring-primary outline-none"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-border flex gap-4">
                    <button
                      onClick={() => setIsEditingPlan(false)}
                      className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-muted transition-all text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePlan}
                      className="flex-1 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    >
                      Save Plan
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Delete Plan Confirmation Modal */}
          <AnimatePresence>
            {planToDelete && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                  <div className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Delete Plan?</h2>
                    <p className="text-sm text-muted-foreground">Are you sure you want to delete this subscription plan? This action cannot be undone.</p>
                  </div>
                  <div className="p-6 border-t border-border flex gap-4">
                    <button
                      onClick={() => setPlanToDelete(null)}
                      className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-muted transition-all text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeletePlan}
                      className="flex-1 py-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : viewMode === 'notifications' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>System Notifications</h2>
            <button
              onClick={() => setIsCreatingNotification(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md",
                uiStyle === 'UI/UX 2' 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-primary text-white hover:opacity-90"
              )}
            >
              <Plus className="w-4 h-4" />
              New Notification
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className={cn(
                  "bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 transition-all",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      n.type === 'info' ? 'bg-blue-500/10 text-blue-500' :
                      n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                      n.type === 'system_update' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-rose-500/10 text-rose-500'
                    )}>
                      {n.type === 'system_update' ? <Activity className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-bold",
                          uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
                        )}>{n.title}</h3>
                        <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          n.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' :
                          n.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {n.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Target: {n.targetType.toUpperCase()} {n.targetId ? `(${n.targetId})` : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {n.status === 'scheduled' ? `Scheduled: ${safeFormat(n.scheduledAt, 'dd MMM, HH:mm')}` : `Sent: ${safeFormat(n.sentAt || n.createdAt, 'dd MMM, HH:mm')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground italic">No notifications sent yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'features' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={cn(
                "text-lg font-bold uppercase tracking-widest",
                uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
              )}>Features Management</h2>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Group and describe your application features</p>
            </div>
            <button
              onClick={async () => {
                try {
                  setIsEditingFeatures(true);
                  await updateFeaturesSettings(editableFeatures);
                  showNotification('Feature definitions updated successfully', 'success');
                } catch (err) {
                  showNotification('Failed to update features', 'error');
                } finally {
                  setIsEditingFeatures(false);
                }
              }}
              disabled={isEditingFeatures}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {isEditingFeatures ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              Save Changes
            </button>
          </div>

          <div className="space-y-8">
            {editableFeatures.map((category, catIndex) => (
              <div key={category.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                  <div className="flex flex-col">
                    <input 
                      type="text" 
                      value={category.label}
                      onChange={(e) => {
                        const newFeatures = [...editableFeatures];
                        newFeatures[catIndex].label = e.target.value;
                        setEditableFeatures(newFeatures);
                      }}
                      className="bg-transparent text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                    />
                    <span className="text-[8px] text-muted-foreground font-mono ml-1">ID: {category.id}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.features.map((feature, featIndex) => (
                      <div key={feature.id} className="p-4 border border-border/50 rounded-xl space-y-3 bg-muted/10 hover:bg-muted/20 transition-all">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase font-black text-muted-foreground tracking-tighter">Feature Name</label>
                              <input 
                                type="text"
                                value={feature.label}
                                onChange={(e) => {
                                  const newFeatures = [...editableFeatures];
                                  newFeatures[catIndex].features[featIndex].label = e.target.value;
                                  setEditableFeatures(newFeatures);
                                }}
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase font-black text-muted-foreground tracking-tighter">Description (Toolbox text)</label>
                              <textarea 
                                value={feature.description || ''}
                                onChange={(e) => {
                                  const newFeatures = [...editableFeatures];
                                  newFeatures[catIndex].features[featIndex].description = e.target.value;
                                  setEditableFeatures(newFeatures);
                                }}
                                className="w-full bg-background border border-border rounded-lg p-2 text-[10px] min-h-[60px] focus:ring-2 focus:ring-primary outline-none resize-none"
                                placeholder="Describe what this feature does..."
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/20">
                          <span className="text-[8px] font-mono text-muted-foreground uppercase opacity-50">ID: {feature.id}</span>
                          {feature.subscriptionFeatureId && (
                            <span className="text-[8px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Linked to Plan: {feature.subscriptionFeatureId}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'settings' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className={cn(
                "text-xl font-bold tracking-tight",
                uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
              )}>System Configuration</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage global default styles, offline modes, app assets, and search behaviors.</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={async () => {
                  try {
                    await updateSystemSettings({
                      maintenanceEnabled: localMaintenanceEnabled,
                      maintenanceEndTime: localMaintenanceEndTime,
                      maintenanceReason: localMaintenanceReason,
                      maintenanceUpdates: localMaintenanceUpdates,
                      statusOnlineText: localStatusOnline,
                      statusOfflineText: localStatusOffline,
                      statusErrorText: localStatusError,
                      appVersion: localAppVersion,
                      developerContactText: localDeveloperContactText,
                      developerContactAlignment: localDeveloperContactAlignment,
                      systemLogo: localSystemLogo,
                      systemFavicon: localSystemFavicon,
                      uiStyle: localUIStyle,
                      menuBarStyle: localMenuBarStyle,
                      alterPageUiStyle: localAlterPageUiStyle,
                      reportsPageUiStyle: localReportsPageUiStyle,
                      searchPageUiStyle: localSearchPageUiStyle,
                      reportsColumnsPerRow: localReportsColumnsPerRow,
                      alterColumnsPerRow: localAlterColumnsPerRow,
                      enableUserSortViewPref: localEnableUserSortViewPref,
                      sidebarBgColor: localSidebarBgColor,
                      sidebarTextColor: localSidebarTextColor,
                      glassBackground: localGlassBackground,
                      notificationDuration: localNotificationDuration,
                      notificationAnimationStyle: localNotificationAnimationStyle,
                      showGoToShortcut: localShowGoToShortcut,
                      showTopbarSearch: localShowTopbarSearch,
                      showTopbarNotifications: localShowTopbarNotifications,
                      showTopbarInstructions: localShowTopbarInstructions,
                      searchPlaceholder: localSearchPlaceholder,
                      searchHelpText: localSearchHelpText,
                      showSearchShortcut: localShowSearchShortcut,
                      searchIconColor: localSearchIconColor,
                      dashboardDesign: localDashboardDesign,
                      loaderBlurStyle: localLoaderBlurStyle,
                      loaderIconStyle: localLoaderIconStyle,
                      loaderPhrases: localLoaderPhrases,
                      loaderTheme: localLoaderTheme,
                      adaptiveLoaderEnabled: localAdaptiveLoaderEnabled,
                      showQuickCalculator: localShowQuickCalculator,
                      showPinnedBookmarks: localShowPinnedBookmarks,
                      customControlCenterTheme: localCustomControlCenterTheme,
                      customWelcomeMessage: localCustomWelcomeMessage,
                      splashSubDesign: localSplashSubDesign,
                      skeletonEnabled: localSkeletonEnabled,
                      skeletonDashboardOnly: localSkeletonDashboardOnly,
                      skeletonType: localSkeletonType,
                      skeletonSpeed: localSkeletonSpeed,
                      skeletonTheme: localSkeletonTheme,
                      skeletonRows: Number(localSkeletonRows),
                      skeletonWaveColor: localSkeletonWaveColor,
                      voucherLayout: localVoucherLayout,
                      voucherFieldSize: localVoucherFieldSize,
                      warningSelectItemsInPhysicalStock: localWarnings.warningSelectItemsInPhysicalStock,
                      warningInvalidQtyInPhysicalStock: localWarnings.warningInvalidQtyInPhysicalStock,
                      warningPrefixSelectFill: localWarnings.warningPrefixSelectFill,
                      warningPartyName: localWarnings.warningPartyName,
                      warningSupplierName: localWarnings.warningSupplierName,
                      warningSalesLedger: localWarnings.warningSalesLedger,
                      warningPurchaseLedger: localWarnings.warningPurchaseLedger,
                      warningItemsListEmpty: localWarnings.warningItemsListEmpty,
                      warningItemNameEmpty: localWarnings.warningItemNameEmpty,
                      warningQuantityEmpty: localWarnings.warningQuantityEmpty,
                      warningRateEmpty: localWarnings.warningRateEmpty,
                      warningConsumptionItems: localWarnings.warningConsumptionItems,
                      warningSourceItemName: localWarnings.warningSourceItemName,
                      warningSourceItemQty: localWarnings.warningSourceItemQty,
                      warningProductionItems: localWarnings.warningProductionItems,
                      warningDestItemName: localWarnings.warningDestItemName,
                      warningDestItemQty: localWarnings.warningDestItemQty,
                      warningSingleAccount: localWarnings.warningSingleAccount,
                      warningSingleParticulars: localWarnings.warningSingleParticulars,
                      warningSingleAmount: localWarnings.warningSingleAmount,
                      warningJournalLedgerName: localWarnings.warningJournalLedgerName,
                      warningJournalDebitCreditAmount: localWarnings.warningJournalDebitCreditAmount,
                      warningJournalNotBalanced: localWarnings.warningJournalNotBalanced,
                      soundEnabled: localSoundEnabled,
                      soundVolume: localSoundVolume,
                      soundScheme: localSoundScheme,
                      soundSuccess: localSoundSuccess,
                      soundError: localSoundError,
                      soundWarning: localSoundWarning,
                      soundDelete: localSoundDelete,
                      soundClick: localSoundClick,
                      soundNavigation: localSoundNavigation
                    });
                    showNotification('System configuration updated successfully', 'success');
                  } catch (err) {
                    showNotification('Failed to update system configuration', 'error');
                  }
                }}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2",
                  uiStyle === 'UI/UX 2' 
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" 
                    : "bg-primary text-white hover:opacity-90 shadow-primary/20"
                )}
              >
                <Save className="w-4 h-4" />
                Save Global Configuration
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar for System configuration sub-tabs */}
            <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar">
              {[
                { id: 'general', label: 'General & Status', desc: 'Alerts, version, shortcuts', icon: Activity },
                { id: 'theme', label: 'Theme & Layout', desc: 'UI styles, navigations', icon: Palette },
                { id: 'branding', label: 'Logo & Branding', desc: 'Default logo, mobile icon', icon: FileImage },
                { id: 'search', label: 'Search Engine', desc: 'Placeholders, key binds', icon: Search },
                { id: 'loader', label: 'Loading Screen', desc: 'Icon styles, blur, custom texts', icon: RefreshCw },
                { id: 'skeleton', label: 'Skeleton Shimmer', desc: 'Bone structures, speeds, designs', icon: Sparkles },
                { id: 'warnings', label: 'Voucher Warnings', desc: 'Customizable warning messages', icon: AlertCircle },
                { id: 'sounds', label: 'Sound Schemes', desc: 'Global audio setups & links', icon: Volume2 }
              ].map((tab) => {
                const SelectedIcon = tab.icon;
                const isSelected = systemSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSystemSubTab(tab.id as any)}
                    className={cn(
                      "w-auto lg:w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <SelectedIcon className="w-4 h-4 shrink-0" />
                    <div className="text-left hidden md:block">
                      <p className="text-[11px] font-bold leading-none">{tab.label}</p>
                      <p className={cn("text-[8px] mt-1 leading-none uppercase tracking-tight", isSelected ? "text-primary-foreground/75" : "text-muted-foreground")}>{tab.desc}</p>
                    </div>
                    <span className="text-xs font-bold md:hidden leading-none block">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content pane */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Settings Search bar */}
              <div className="relative bg-card border border-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search or filter option configurations instantly..."
                    value={settingsFilterQuery}
                    onChange={(e) => setSettingsFilterQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {settingsFilterQuery && (
                    <button
                      onClick={() => setSettingsFilterQuery('')}
                      className="absolute right-3 top-1.5 text-muted-foreground hover:text-foreground text-xs uppercase font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="text-[9px] font-black tracking-widest text-muted-foreground uppercase bg-muted/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 select-none">
                  <Settings className="w-3.5 h-3.5 text-primary" />
                  <span>FILTER ENGINE LIVE</span>
                </div>
              </div>

              {systemSubTab === 'general' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showIdentity = checkFilter(['app version', 'identity', 'build', 'version']);
                const showMaintenance = checkFilter(['maintenance', 'break', 'timer', 'downtime', 'updates', 'reason']);
                const showConnection = checkFilter(['online', 'offline', 'error', 'connection', 'status', 'text', 'network', 'sentinel']);
                const showHeader = checkFilter(['shortcut', 'g', 'search icon', 'notifications icon', 'instructions', 'guide', 'header', 'topbar', 'toggle']);
                const showDeveloper = checkFilter(['developer', 'footer', 'alignment', 'attribution', 'contact']);

                if (!showIdentity && !showMaintenance && !showConnection && !showHeader && !showDeveloper) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching options</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any general settings matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Group 1: General Info & Identity */}
                    {showIdentity && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Activity className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">App Version & Identity</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">App Version</label>
                            <input
                              type="text"
                              value={localAppVersion || ''}
                              onChange={(e) => setLocalAppVersion(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 1.5: Maintenance Break System Settings */}
                    {showMaintenance && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs relative overflow-hidden",
                        uiStyle === 'UI/UX 2' && "border-amber-100 shadow-md"
                      )}>
                        {/* Decorative side accent */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1 bg-amber-500",
                          !localMaintenanceEnabled && "bg-slate-500"
                        )} />
                        
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            <Wrench className={cn("w-4 h-4", localMaintenanceEnabled ? "text-amber-500 animate-spin [animation-duration:10s]" : "text-slate-400")} />
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Maintenance Break System</h4>
                              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium mt-0.5">Toggle live lockout, set countdown timers & display updates info.</p>
                            </div>
                          </div>
                          
                          {/* Modern toggle switch */}
                          <button
                            onClick={() => setLocalMaintenanceEnabled(!localMaintenanceEnabled)}
                            className={cn(
                              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
                              localMaintenanceEnabled ? "bg-amber-500" : "bg-neutral-600"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                localMaintenanceEnabled ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Maintenance State Badge */}
                            <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">Current State:</span>
                              <span className={cn(
                                "text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full",
                                localMaintenanceEnabled ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/15"
                              )}>
                                {localMaintenanceEnabled ? "Maintenance Active" : "Online/Normal Mode"}
                              </span>
                            </div>

                            {/* Scheduled End Datetime picker */}
                            <div className="space-y-1.5/4">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Scheduled End Time (Optional Timer)</label>
                              <input
                                type="datetime-local"
                                value={localMaintenanceEndTime}
                                onChange={(e) => setLocalMaintenanceEndTime(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-mono text-foreground"
                              />
                            </div>
                          </div>

                          {/* Reason for Maintenance Break */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Reason / Purpose of Maintenance Break</label>
                            <textarea
                              value={localMaintenanceReason}
                              onChange={(e) => setLocalMaintenanceReason(e.target.value)}
                              rows={3}
                              placeholder="Describe why the system is offline (e.g. We are moving our transaction log servers to high-performance SSD pools to ensure instant sub-millisecond reports calculations...)"
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed text-foreground"
                            />
                          </div>

                          {/* Anticipated Features or upcoming updates info */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Expected Future Upgrades Preview (Display list to users)</label>
                            <textarea
                              value={localMaintenanceUpdates}
                              onChange={(e) => setLocalMaintenanceUpdates(e.target.value)}
                              rows={4}
                              placeholder="Brief description of new features / fixes coming in this update... (e.g. 1. Instant Ledger Statements\n2. Real-time Voucher Autocomplete\n3. Responsive Founder Metrics)"
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed font-mono text-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 2: Connection Status Indicators */}
                    {showConnection && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Globe className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Connection Status Indicators</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Online Status Text</label>
                            <input
                              type="text"
                              value={localStatusOnline || ''}
                              onChange={(e) => setLocalStatusOnline(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Offline Status Text</label>
                            <input
                              type="text"
                              value={localStatusOffline || ''}
                              onChange={(e) => setLocalStatusOffline(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Error Status Text</label>
                            <input
                              type="text"
                              value={localStatusError || ''}
                              onChange={(e) => setLocalStatusError(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 3: Header Features & Toggles */}
                    {showHeader && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Header Features & Interactive Toggle Switches</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">Show "Alt + G" Shortcut Hint</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">Toggle safety help tips or accessibility indications on the topbar.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocalShowGoToShortcut(!localShowGoToShortcut)}
                              className={cn(
                                "w-10 h-5.5 rounded-full transition-colors relative shrink-0",
                                localShowGoToShortcut ? "bg-blue-600" : "bg-gray-300"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                                localShowGoToShortcut ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">Show Search Icon in Top Bar</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">Display or hide the search feature trigger button in the main header.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocalShowTopbarSearch(!localShowTopbarSearch)}
                              className={cn(
                                "w-10 h-5.5 rounded-full transition-colors relative shrink-0",
                                localShowTopbarSearch ? "bg-blue-600" : "bg-gray-300"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                                localShowTopbarSearch ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">Show Notifications Icon in Top Bar</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">Display or hide the notifications menu button from the navigation.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocalShowTopbarNotifications(!localShowTopbarNotifications)}
                              className={cn(
                                "w-10 h-5.5 rounded-full transition-colors relative shrink-0",
                                localShowTopbarNotifications ? "bg-blue-600" : "bg-gray-300"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                                localShowTopbarNotifications ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">Show Instructions/Guide Icon in Top Bar</p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">Display or hide the help and system guide/documentation trigger button.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocalShowTopbarInstructions(!localShowTopbarInstructions)}
                              className={cn(
                                "w-10 h-5.5 rounded-full transition-colors relative shrink-0",
                                localShowTopbarInstructions ? "bg-blue-600" : "bg-gray-300"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                                localShowTopbarInstructions ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 4: Developer Contact */}
                    {showDeveloper && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Info className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Developer Contact Options</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Developer Contact Footer Text</label>
                            <input
                              type="text"
                              value={localDeveloperContactText || ''}
                              onChange={(e) => setLocalDeveloperContactText(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Text Alignment</label>
                            <select
                              value={localDeveloperContactAlignment}
                              onChange={(e) => setLocalDeveloperContactAlignment(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="left font-sans">Left</option>
                              <option value="center font-sans">Center</option>
                              <option value="right font-sans">Right</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {systemSubTab === 'theme' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showProfile = checkFilter(['style', 'gradient', 'canvas', 'carbon', 'sunset', 'ocean', 'aurora', 'obsidian', 'glass bg', 'aesthetic']);
                const showNav = checkFilter(['sidebar', 'left menu', 'ribbon', 'macos font', 'windows11', 'taskbar', 'navigation', 'shell']);
                const showGrids = checkFilter(['alter', 'reports', 'columns', 'grid layout', 'interactivity', 'sort view']);
                const showForm = checkFilter(['duration', 'snackbars', 'voucher layout', 'field size', 'border animation', 'popup', 'warnings']);
                const showDash = checkFilter(['dashboard', 'quota fix', 'minimalist', 'splash welcome', 'design layout', 'books', 'pin bookmarks', 'bookmarks', 'zero read', 'command center']);

                if (!showProfile && !showNav && !showGrids && !showForm && !showDash) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching options</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any theme configurations matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Group 1: Visual Aesthetic Profile & Canvas Backdrop */}
                    {showProfile && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Palette className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Visual Aesthetic Profile & Active Canvas</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Global UI Style</label>
                            <select 
                              value={localUIStyle}
                              onChange={(e) => setLocalUIStyle(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="UI/UX 1">UI/UX 1 (Classic)</option>
                              <option value="UI/UX 2">UI/UX 2 (Modern Colorized)</option>
                              <option value="UI/UX 3">UI/UX 3 (Glassmorphism macOS)</option>
                              <option value="UI/UX 4">UI/UX 4 (Aurora Holographic Carbon)</option>
                            </select>
                            <p className="text-[9px] text-muted-foreground uppercase leading-tight font-black">Controls borders, shadow depth, and micro gradients.</p>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Default Canvas Gradient (UI/UX 3 & 4)</label>
                            <select 
                              value={localGlassBackground}
                              onChange={(e) => setLocalGlassBackground(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="default">Default Cyber Carbon (Dynamic Holographic)</option>
                              <option value="sunset">Sunset Glow (Warm Cosmic)</option>
                              <option value="ocean">Deep Ocean (Cool Nordic)</option>
                              <option value="aurora">Aurora Borealis (Green Matrix Neon)</option>
                              <option value="minimal">Minimal Soft Dark (Sleek Obsidian)</option>
                            </select>
                            <p className="text-[9px] text-muted-foreground uppercase leading-tight font-black font-mono">Applied as active backdrop vectors when holographic glass is chosen.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 2: Navigation & Desktop Frame Layout */}
                    {showNav && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <ListTree className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Navigation & Desktop Frame Layout</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Left Menu Style</label>
                            <select 
                              value={localMenuBarStyle}
                              onChange={(e) => setLocalMenuBarStyle(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="classic">Classic Sidebar (Default)</option>
                              <option value="ribbon">Microsoft Office Ribbon</option>
                              <option value="macos">macOS Top Menu Bar</option>
                              <option value="windows11">Windows 11 Taskbar Style</option>
                              <option value="colorful">Classic Professional (Colorful Sidebar)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Sidebar Background Style</label>
                            <select 
                              value={localSidebarBgColor}
                              onChange={(e) => setLocalSidebarBgColor(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {SIDEBAR_BG_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Sidebar Text Accent</label>
                            <select 
                              value={localSidebarTextColor}
                              onChange={(e) => setLocalSidebarTextColor(e.target.value)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {SIDEBAR_TEXT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 3: Alter & Reports Presentation Grids */}
                    {showGrids && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <LayoutGrid className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Alter, Reports & Search Presentation Grids</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Search Page UI Style</label>
                            <select 
                              value={localSearchPageUiStyle}
                              onChange={(e) => setLocalSearchPageUiStyle(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="classic">Classic UI/UX Layout (Standard)</option>
                              <option value="modern">Modern UI/UX Layout (Premium Bento + Stats)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Create & Alteration Page UI</label>
                            <select 
                              value={localAlterPageUiStyle}
                              onChange={(e) => setLocalAlterPageUiStyle(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="classic">Classic UI/UX Layout (Standard)</option>
                              <option value="modern">Modern UI/UX Layout (Upgraded Visuals)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Alter Columns per Row</label>
                            <select 
                              value={localAlterColumnsPerRow}
                              onChange={(e) => setLocalAlterColumnsPerRow(Number(e.target.value))}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={1}>1 Column (Full Width List)</option>
                              <option value={2}>2 Columns (Dual Grid Layout)</option>
                              <option value={3}>3 Columns (Triple Grid Layout)</option>
                              <option value={4}>4 Columns (Quad Grid Layout - Standard Auto)</option>
                              <option value={5}>5 Columns (Quad Grid Layout - Standard Auto)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Reports Page UI Style</label>
                            <select 
                              value={localReportsPageUiStyle}
                              onChange={(e) => setLocalReportsPageUiStyle(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="classic">Classic UI/UX Layout (Standard)</option>
                              <option value="modern">Modern UI/UX Layout (Upgraded Visuals)</option>
                              <option value="grid">Modern Dynamic Grid Layout (Custom Alignment/Tabs)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Reports Columns per Row</label>
                            <select 
                              value={localReportsColumnsPerRow}
                              onChange={(e) => setLocalReportsColumnsPerRow(Number(e.target.value))}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={1}>1 Column (Full Width List)</option>
                              <option value={2}>2 Columns (Dual Grid Layout)</option>
                              <option value={3}>3 Columns (Triple Grid Layout)</option>
                              <option value={4}>4 Columns (Quad Grid Layout - Standard Auto)</option>
                              <option value={5}>5 Columns (Quad Grid Layout - Standard Auto)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Alter & Reports Interactivity Override</label>
                            <select 
                              value={localEnableUserSortViewPref ? "true" : "false"}
                              onChange={(e) => setLocalEnableUserSortViewPref(e.target.value === "true")}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="false">Disabled (Default Classic/Modern layout styles)</option>
                              <option value="true">Enabled (Allow custom User "Sort By" and "Column View" dropdowns)</option>
                            </select>
                            <p className="text-[9px] text-muted-foreground uppercase leading-tight font-black mt-1">Enables active User-specific dropdown options for sorting and custom column layouts on both /#/alter and /#/reports pages.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 4: Form Entry Dimensions & Screen Popups */}
                    {showForm && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Clock className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Form Entry Dimensions & Screen Popups</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Voucher Entry Layout Model</label>
                            <select 
                              value={localVoucherLayout}
                              onChange={(e) => setLocalVoucherLayout(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="Layout 1">Layout 1 (Corrected Headers & Scrolling)</option>
                              <option value="Layout 2">Layout 2 (Compact Fields, Height Optimized)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Voucher Entry Field Size</label>
                            <select 
                              value={localVoucherFieldSize}
                              onChange={(e) => setLocalVoucherFieldSize(e.target.value as any)}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="small">Small (Extra Compact)</option>
                              <option value="semi-compact">Semi-Compact (Balanced)</option>
                              <option value="medium">Medium (Standard Compact)</option>
                              <option value="large">Large (Spacious & Easy Read)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Notification Duration (ms)</label>
                            <input
                              type="number"
                              value={localNotificationDuration || 3000}
                              onChange={(e) => setLocalNotificationDuration(Number(e.target.value))}
                              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              step="500"
                              min="1000"
                            />
                            <p className="text-[9px] text-muted-foreground uppercase leading-tight font-black mt-1">Time for popup snackbars to remain on viewport before hiding.</p>
                          </div>

                          <div className="space-y-3 pt-2 md:col-span-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Notification Border Animation Style</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {[
                                { id: 'default', label: 'Default Path', desc: 'Classic border trace' },
                                { id: 'neon', label: 'Neon Glow', desc: 'Pulsating neon border' },
                                { id: 'snake', label: 'Snake Chase', desc: 'Moving segment' },
                                { id: 'liquid', label: 'Liquid Flow', desc: 'Rotating gradient' },
                                { id: 'glitch', label: 'Cyber Glitch', desc: 'Digital distortion' },
                                { id: 'shimmer', label: 'Shimmer Sweep', desc: 'Elegant light sweep' }
                              ].map((style) => (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() => setLocalNotificationAnimationStyle(style.id as any)}
                                  className={cn(
                                    "flex flex-col items-start p-2.5 rounded-lg border transition-all text-left gap-1 opacity-90 hover:opacity-100",
                                    localNotificationAnimationStyle === style.id
                                      ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500"
                                      : "border-border bg-background hover:border-gray-400"
                                  )}
                                >
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider",
                                    localNotificationAnimationStyle === style.id ? "text-blue-500" : "text-foreground"
                                  )}>
                                    {style.label}
                                  </span>
                                  <span className="text-[8px] text-muted-foreground leading-tight font-black">
                                    {style.desc}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 5: Principal Workspace Dashboard Layout */}
                    {showDash && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <LayoutDashboard className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Principal Workspace Dashboard Layout</h4>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Dashboard Default Design Layouts</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { id: 'Design 1', label: 'Classic Design', desc: 'Full-featured with all metrics and primary charts.' },
                              { id: 'Design 2', label: 'Modern Design', desc: 'Clean, modern look with focus on KPI cards and trends.' },
                              { id: 'Design 3', label: 'Minimalist (Quota Fix)', desc: 'High-performance, minimal charts. Saves 50% reads by reducing complexity.' },
                              { id: 'Design 4', label: 'Executive Executive', desc: 'Dark-themed, focused only on essential numbers. Lowest quota usage.' },
                              { id: 'Design 5', label: 'Zero-Read Command Center', desc: 'No database queries printed on layout. Loaded locally with rich interactive workflow portals.' },
                              { id: 'Design 6', label: 'Minimalist Splash', desc: 'A clean, lightweight layout containing only a centered header greeting card.' }
                            ].map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => setLocalDashboardDesign(d.id as any)}
                                className={cn(
                                  "p-3 border rounded-xl text-left transition-all space-y-1 outline-none",
                                  localDashboardDesign === d.id
                                    ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                                    : "border-border bg-background hover:bg-muted"
                                )}
                              >
                                 <p className={cn("text-[10px] font-black uppercase tracking-tight", localDashboardDesign === d.id ? "text-blue-600" : "text-foreground")}>{d.label}</p>
                                 <p className="text-[8px] text-muted-foreground uppercase leading-tight font-black">{d.desc}</p>
                              </button>
                            ))}
                          </div>

                          {localDashboardDesign === 'Design 5' && (
                            <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <Palette className="w-4 h-4 text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-wider text-foreground">Zero-Read Command Center Preferences</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Custom Splash Welcome Accent</label>
                                  <input 
                                    type="text"
                                    value={localCustomWelcomeMessage}
                                    onChange={(e) => setLocalCustomWelcomeMessage(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Executive Command Center"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Theme Accent Profile</label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                      { id: 'emerald', label: 'Emerald' },
                                      { id: 'indigo', label: 'Indigo' },
                                      { id: 'slate', label: 'Slate' },
                                      { id: 'cyber', label: 'Cyber' }
                                    ].map((t) => (
                                      <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setLocalCustomControlCenterTheme(t.id as any)}
                                        className={cn(
                                          "py-1 px-1 border text-[9px] font-black uppercase rounded text-center transition-all",
                                          localCustomControlCenterTheme === t.id
                                            ? "bg-foreground text-background border-foreground font-black font-mono"
                                            : "bg-background text-muted-foreground border-border hover:text-foreground"
                                        )}
                                      >
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/40">
                                <div className="flex items-center justify-between gap-4 p-2.5 bg-background border border-border/50 rounded-lg grow">
                                  <div>
                                    <p className="text-[10px] font-bold text-foreground leading-none">Interactive Margin Calc</p>
                                    <p className="text-[8px] text-muted-foreground uppercase mt-0.5 font-black">Show calculator tool on widget board</p>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setLocalShowQuickCalculator(!localShowQuickCalculator)}
                                    className={cn(
                                      "w-8 h-4.5 rounded-full relative transition-colors shrink-0",
                                      localShowQuickCalculator ? "bg-emerald-500" : "bg-border"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all",
                                      localShowQuickCalculator ? "right-0.5" : "left-0.5"
                                    )} />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between gap-4 p-2.5 bg-background border border-border/50 rounded-lg grow">
                                  <div>
                                    <p className="text-[10px] font-bold text-foreground leading-none">Local Pin Bookmarks</p>
                                    <p className="text-[8px] text-muted-foreground uppercase mt-0.5 font-black font-mono">Let users bookmark pages in LocalStorage</p>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setLocalShowPinnedBookmarks(!localShowPinnedBookmarks)}
                                    className={cn(
                                      "w-8 h-4.5 rounded-full relative transition-colors shrink-0",
                                      localShowPinnedBookmarks ? "bg-emerald-500" : "bg-border"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all",
                                      localShowPinnedBookmarks ? "right-0.5" : "left-0.5"
                                    )} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {localDashboardDesign === 'Design 6' && (
                            <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <Palette className="w-4 h-4 text-primary" />
                                <p className="text-[10px] font-black uppercase tracking-wider text-foreground">Splash Center Preferences</p>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Custom Splash Welcome Accent Message</label>
                                <input 
                                  type="text"
                                  value={localCustomWelcomeMessage}
                                  onChange={(e) => setLocalCustomWelcomeMessage(e.target.value)}
                                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                  placeholder="Welcome to Headquarters"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Splash Welcome Page Sub-Design Style</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  {[
                                    { id: 'grid', label: 'Corporate Grid', desc: 'Sleek professional card layout with high-accessibility system link grids.' },
                                    { id: 'neon', label: 'Tech Cyber', desc: 'Vibrant neon cybertheme with glass backgrounds, glowing borders, and modern shadows.' },
                                    { id: 'editorial', label: 'Editorial Cozy', desc: 'Warm minimalist layout, rich typography, spacious elements, and classical serif headers.' }
                                  ].map(sub => (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => setLocalSplashSubDesign(sub.id as any)}
                                      className={cn(
                                        "p-2.5 border rounded-lg text-left transition-all space-y-1 outline-none",
                                        localSplashSubDesign === sub.id
                                          ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
                                          : "border-border bg-background hover:bg-muted"
                                      )}
                                    >
                                      <p className="text-[10px] font-bold text-foreground">{sub.label}</p>
                                      <p className="text-[9px] text-muted-foreground leading-normal font-black">{sub.desc}</p>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <p className="text-[9px] text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 p-2.5 rounded border border-blue-100 dark:border-blue-900/50 uppercase font-bold font-mono">
                            * Recommended: Use Design 3 or 4 to drastically reduce non-critical database reads and stay within your free plan limits.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {systemSubTab === 'branding' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showLogos = checkFilter(['logo', 'asset', 'upload logo', 'set via url', 'system logo', 'building']);
                const showFavicon = checkFilter(['favicon', 'app icon', 'mobile app icon', 'launcher', 'upload favicon', 'home screen', 'tab']);

                if (!showLogos && !showFavicon) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching options</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any branding configurations matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Group 1: Global Identity & Logo Asset Styling */}
                    {showLogos && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Building2 className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Global Identity & Logo Asset Styling</h4>
                        </div>
                        <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-3">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">System Logo (Global Default)</label>
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="w-16 h-16 border border-dashed border-border flex items-center justify-center bg-card overflow-hidden rounded-lg shrink-0">
                              {localSystemLogo ? (
                                <img src={localSystemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Building2 className="w-6 h-6 text-muted-foreground opacity-20" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                              <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer bg-background border border-border hover:bg-muted transition-all p-2 text-center rounded-lg text-xs font-bold uppercase tracking-wider block">
                                  Upload System Logo
                                  <input type="file" accept="image/*" onChange={handleSystemLogoUpload} className="hidden" />
                                </label>
                                {localSystemLogo && (
                                  <button 
                                    onClick={() => setLocalSystemLogo('')}
                                    className="p-2 border border-border text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Or set via URL</label>
                                <input
                                  type="text"
                                  placeholder="https://example.com/logo.png"
                                  value={localSystemLogo}
                                  onChange={(e) => setLocalSystemLogo(e.target.value)}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                              <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-black">This logo will be used as a default for all companies if they don't have their own logo.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 2: App Favicon & Launcher Metadata */}
                    {showFavicon && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Zap className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">App Favicon & Launcher Metadata</h4>
                        </div>
                        <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-3">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">App Favicon (Mobile App Icon)</label>
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="w-16 h-16 border border-dashed border-border flex items-center justify-center bg-card overflow-hidden rounded-lg shrink-0">
                              {localSystemFavicon ? (
                                <img src={localSystemFavicon} alt="Favicon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <Zap className="w-6 h-6 text-muted-foreground opacity-20" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                              <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer bg-background border border-border hover:bg-muted transition-all p-2 text-center rounded-lg text-xs font-bold uppercase tracking-wider block">
                                  Upload Favicon
                                  <input type="file" accept="image/*" onChange={handleSystemFaviconUpload} className="hidden" />
                                </label>
                                {localSystemFavicon && (
                                  <button 
                                    onClick={() => setLocalSystemFavicon('')}
                                    className="p-2 border border-border text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Or set via URL</label>
                                <input
                                  type="text"
                                  placeholder="https://example.com/favicon.png"
                                  value={localSystemFavicon}
                                  onChange={(e) => setLocalSystemFavicon(e.target.value)}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                              <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-black">Appears in browser tabs and as the launcher app icon when users "Add to Home Screen" on mobile devices.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {systemSubTab === 'search' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showMainSearch = checkFilter(['placeholder', 'search', 'default placeholder', 'metrics', 'search menu']);
                const showShortcutSearch = checkFilter(['keyboard', 'help text', 'esc key', 'shortcut hint', 'keyboard bindings', 'overlay']);

                if (!showMainSearch && !showShortcutSearch) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching options</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any search engine configurations matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Group 1: Global Search Placeholder & Tones */}
                    {showMainSearch && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Search className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Global Search Placeholder & Language Tones</h4>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Default Placeholder Text</label>
                          <input 
                            type="text" 
                            value={localSearchPlaceholder || ''} 
                            onChange={(e) => setLocalSearchPlaceholder(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="Search system metrics..."
                          />
                        </div>
                      </div>
                    )}

                    {/* Group 2: Keyboard Bindings & Accessibility Overlays */}
                    {showShortcutSearch && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Zap className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Keyboard Bindings & Accessibility Overlays</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Default Keyboard Help Text</label>
                            <textarea 
                              value={localSearchHelpText || ''} 
                              onChange={(e) => setLocalSearchHelpText(e.target.value)}
                              rows={2}
                              className="w-full bg-background border border-border rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                              placeholder="Press key bindings..."
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground">Show "ESC" Key Shortcut Hint</p>
                              <p className="text-[10px] text-muted-foreground">Renders hints on the search overlay to let users close it with ESC.</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setLocalShowSearchShortcut(!localShowSearchShortcut)}
                              className={cn(
                                "w-10 h-5.5 rounded-full relative transition-colors shrink-0",
                                localShowSearchShortcut ? "bg-emerald-500" : "bg-border"
                              )}
                            >
                              <div className={cn(
                                "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                                localShowSearchShortcut ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {systemSubTab === 'loader' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showActivation = checkFilter(['adaptive', 'shroud', 'loading screen', 'loading screen styling', 'status bottom-right', 'progressive step indicator']);
                const showLoaderAesthetic = checkFilter(['glass blur', 'intensity', 'flat solid', 'subtle blur', 'medium blur', 'deep frost', 'center spinning', 'spinner', 'dots', 'circle-bar', 'quantum matrix', 'progress box', 'aero glass', 'cosmic obsidian', 'snow alabaster']);
                const showLoaderPhrases = checkFilter(['phrases', 'progress text', 'comma separated', 'transition sequence', 'sequence', 'status message']);

                if (!showActivation && !showLoaderAesthetic && !showLoaderPhrases) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching options</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any loader configurations matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Live Preview & Activation Status */}
                    <div className={cn(
                      "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                      uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                    )}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Adaptive Loading Activation & Realtime Preview</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const testScreen = document.getElementById('global-loading-screen');
                            if (testScreen) {
                              showNotification("Preview triggered! Close/hide will complete automatically in 3.5s.", "info");
                            }
                            const event = new CustomEvent('trigger-mock-loader', { 
                              detail: { 
                                phrases: localLoaderPhrases,
                                blur: localLoaderBlurStyle,
                                icon: localLoaderIconStyle,
                                theme: localLoaderTheme
                              } 
                            });
                            window.dispatchEvent(event);
                          }}
                          className="px-4 py-2 bg-foreground text-background hover:opacity-95 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Live Preview Loader
                        </button>
                      </div>

                      {showActivation && (
                        <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-foreground">Adaptive Loading Screen Styling</p>
                            <p className="text-[10px] text-muted-foreground">Toggles whether to ornament loading screens with dynamic bottom-right progressive step indicator widgets or use simple static overlays.</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setLocalAdaptiveLoaderEnabled(!localAdaptiveLoaderEnabled)}
                            className={cn(
                              "w-10 h-5.5 rounded-full relative transition-colors shrink-0",
                              localAdaptiveLoaderEnabled ? "bg-emerald-500" : "bg-border"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                              localAdaptiveLoaderEnabled ? "right-0.5" : "left-0.5"
                            )} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Group 2: Visual Backdrop Blur, Spinning Shapes & Panel Themes */}
                    {showLoaderAesthetic && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Palette className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Glass Backdrops & Center Spinning Shapes</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Backdrop Blur Selection */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Screen Glass Blur Intensity</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'none', label: 'Solid Flat', desc: 'Plain backdrop dimting' },
                                { id: 'sm', label: 'Subtle Blur', desc: 'Soft 4px backdrop blur' },
                                { id: 'md', label: 'Medium Blur', desc: 'Balanced 8px aesthetic' },
                                { id: 'lg', label: 'Deep Frost', desc: 'Heavy 16px high-blur frosted' }
                              ].map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setLocalLoaderBlurStyle(b.id as any)}
                                  className={cn(
                                    "p-3 border rounded-xl text-left transition-all space-y-1 outline-none",
                                    localLoaderBlurStyle === b.id
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : "border-border bg-background hover:bg-muted"
                                  )}
                                >
                                  <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{b.label}</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight uppercase font-mono">{b.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Loader Icon Selection */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Center Spinning Icon</label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'spinner', label: 'Calm Spinner', desc: 'Classic clean spinning stroke' },
                                { id: 'dots', label: 'Bouncing Dots', desc: 'Dynamic hopping loading beads' },
                                { id: 'circle-bar', label: 'Metropolitan Bar', desc: 'Pulsating double rotation ring' },
                                { id: 'quantum', label: 'Quantum Matrix', desc: 'Complex tech-themed particle spin' }
                              ].map((i) => (
                                <button
                                  key={i.id}
                                  type="button"
                                  onClick={() => setLocalLoaderIconStyle(i.id as any)}
                                  className={cn(
                                    "p-3 border rounded-xl text-left transition-all space-y-1 outline-none",
                                    localLoaderIconStyle === i.id
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : "border-border bg-background hover:bg-muted"
                                  )}
                                >
                                  <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{i.label}</p>
                                  <p className="text-[9px] text-muted-foreground leading-tight uppercase font-mono">{i.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Loader Card Theme Selection */}
                          <div className="space-y-2.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Progress Box Panel Theme</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'glass', label: 'Aero Glass', desc: 'Holographic' },
                                { id: 'dark', label: 'Cosmic Obsidian', desc: 'Pure Dark' },
                                { id: 'light', label: 'Snow Alabaster', desc: 'Minimal Light' }
                              ].map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => setLocalLoaderTheme(t.id as any)}
                                  className={cn(
                                    "p-2.5 border rounded-xl text-left transition-all space-y-1 outline-none",
                                    localLoaderTheme === t.id
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : "border-border bg-background hover:bg-muted"
                                  )}
                                >
                                  <p className="text-[10px] font-black uppercase tracking-tight text-foreground leading-none">{t.label}</p>
                                  <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1 font-mono">{t.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Loader Instruction Help Banner */}
                          <div className="p-3.5 bg-muted/10 border border-border rounded-xl flex flex-col justify-center space-y-1">
                            <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5 font-mono">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              Reactive Loading Pipeline
                            </h4>
                            <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-black font-mono">
                              When users trigger major tasks (indexing reports, exporting books, posting kontras, syncs), the system overlays a blurred frosted glass shroud & shifts through custom steps in real time.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Group 3: Progress status text sequence */}
                    {showLoaderPhrases && (
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <ListTree className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Progressive Status Text Chain</h4>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                            Progress Text Transition Sequence (Comma Separated)
                          </label>
                          <textarea
                            value={localLoaderPhrases}
                            onChange={(e) => setLocalLoaderPhrases(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed"
                            placeholder="Connecting to server, Requesting to server, Waiting for response, Almost Done, Welcoming back!"
                          />
                          <p className="text-[9px] text-muted-foreground uppercase font-black leading-tight">
                            * Separate each status message with a comma. The loader loops through these from left to right as the loading sequence completes.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {systemSubTab === 'skeleton' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showActivation = checkFilter(['enable', 'skeleton loaders', 'app-wide skeleton', 'dashboard-only', 'toggle skeleton', 'shimmer skeletons']);
                const showThemes = checkFilter(['visual theme', 'shimmer wave', 'color hue', 'movement speed', 'indigo wave', 'cyan aura', 'rose gold', 'emerald mint', 'amber flame', 'slate', 'slow drift', 'standard speed', 'high speed', 'cyberpunk neon', 'holographic glass', 'modern elegant']);
                const showSizing = checkFilter(['rows', 'skeletal rows', 'slider', 'row limits']);
                const showLayouts = checkFilter(['default dashboard/page loading layout', 'loading layout', 'auto-route', 'table/ledger', 'bento cards', 'profile/detail', 'form/voucher']);
                const showSandbox = checkFilter(['sandbox', 'preview sandbox', 'live shimmer', 'interactivity sandbox', 'wave sweep']);

                if (!showActivation && !showThemes && !showSizing && !showLayouts && !showSandbox) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching options</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any skeleton configurations matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Skeleton Loading Configuration</h3>
                      <p className="text-[10px] text-muted-foreground uppercase">Control bone shimmer structures, wave speeds, themes, and layouts company-wide.</p>
                    </div>

                    <div className="p-5 bg-card border border-border rounded-xl space-y-6">
                    {/* Enable Toggle block */}
                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">Enable App-Wide Skeleton Loaders</p>
                        <p className="text-[10px] text-muted-foreground">Swaps traditional boring spinner loaders with immersive glowing shimmer skeletons.</p>
                      </div>
                      <button 
                        onClick={() => setLocalSkeletonEnabled(!localSkeletonEnabled)}
                        className={cn(
                          "w-10 h-5.5 rounded-full relative transition-colors shrink-0",
                          localSkeletonEnabled ? "bg-emerald-500" : "bg-border"
                        )}
                        id="btn-skeleton-toggle"
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                          localSkeletonEnabled ? "right-0.5" : "left-0.5"
                        )} />
                      </button>
                    </div>

                    {/* Dashboard Only Toggle block */}
                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">Enable Dashboard-Only Skeleton Loading</p>
                        <p className="text-[10px] text-muted-foreground">If App-Wide Skeletons is OFF, keeping this ON renders shimmer lists strictly on the principal dashboard.</p>
                      </div>
                      <button 
                        onClick={() => setLocalSkeletonDashboardOnly(!localSkeletonDashboardOnly)}
                        className={cn(
                          "w-10 h-5.5 rounded-full relative transition-colors shrink-0",
                          localSkeletonDashboardOnly ? "bg-emerald-500" : "bg-border"
                        )}
                        id="btn-skeleton-dashboard-toggle"
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all",
                          localSkeletonDashboardOnly ? "right-0.5" : "left-0.5"
                        )} />
                      </button>
                    </div>

                    {/* Quick configs grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Theme selection */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Skeleton Visual Theme</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'classic', label: 'Classic Corporate', desc: 'Google & Facebook style' },
                            { id: 'modern', label: 'Modern Elegant', desc: 'Sleek rounded lines' },
                            { id: 'glass', label: 'Holographic Glass', desc: 'Translucent frosted UI' },
                            { id: 'neon', label: 'Cyberpunk Neon', desc: 'Cyan & rose subtle glows' }
                          ].map((themeOpt) => (
                            <button
                              key={themeOpt.id}
                              type="button"
                              onClick={() => setLocalSkeletonTheme(themeOpt.id as any)}
                              className={cn(
                                "p-3 border rounded-xl text-left transition-all space-y-1",
                                localSkeletonTheme === themeOpt.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border bg-background hover:bg-muted"
                              )}
                              id={`theme-${themeOpt.id}`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-tight text-foreground leading-none">{themeOpt.label}</p>
                              <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1">{themeOpt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wave tint selection */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Shimmer Wave Color Hue</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'slate', label: 'Neutral Slate', bg: 'bg-slate-400' },
                            { id: 'indigo', label: 'Indigo Wave', bg: 'bg-indigo-500' },
                            { id: 'cyan', label: 'Cyan Aura', bg: 'bg-cyan-500' },
                            { id: 'rose', label: 'Rose Gold', bg: 'bg-rose-500' },
                            { id: 'emerald', label: 'Emerald Mint', bg: 'bg-emerald-500' },
                            { id: 'amber', label: 'Amber Flame', bg: 'bg-amber-500' }
                          ].map((colorOpt) => (
                            <button
                              key={colorOpt.id}
                              type="button"
                              onClick={() => setLocalSkeletonWaveColor(colorOpt.id as any)}
                              className={cn(
                                "p-2.5 border rounded-xl flex items-center gap-2 text-left transition-all",
                                localSkeletonWaveColor === colorOpt.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border bg-background hover:bg-muted"
                              )}
                              id={`color-${colorOpt.id}`}
                            >
                              <span className={cn("w-2 h-2 rounded-full shrink-0", colorOpt.bg)} />
                              <span className="text-[9px] font-bold uppercase tracking-tight text-foreground truncate">{colorOpt.label.split(' ')[0]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Speed config */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Shimmer Movement Speed</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'slow', label: 'Slow Drift', desc: '3s transition' },
                            { id: 'normal', label: 'Standard', desc: '2s wave rhythm' },
                            { id: 'fast', label: 'High Speed', desc: '1.2s sweep' }
                          ].map((speedOpt) => (
                            <button
                              key={speedOpt.id}
                              type="button"
                              onClick={() => setLocalSkeletonSpeed(speedOpt.id as any)}
                              className={cn(
                                "p-2.5 border rounded-xl text-left transition-all space-y-1",
                                localSkeletonSpeed === speedOpt.id
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border bg-background hover:bg-muted"
                              )}
                              id={`speed-${speedOpt.id}`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-tight text-foreground leading-none">{speedOpt.label}</p>
                              <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1">{speedOpt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Default Rows selection */}
                      <div className="space-y-2.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Skeletal Rows (Lists & Tables)</label>
                        <div className="flex items-center gap-4">
                          <input 
                            type="range"
                            min="3" 
                            max="15" 
                            value={localSkeletonRows} 
                            onChange={(e) => setLocalSkeletonRows(Number(e.target.value))}
                            className="flex-1 accent-indigo-600 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-xs font-bold font-mono px-3 py-1 bg-muted border border-border rounded-lg text-foreground w-12 text-center select-none">
                            {localSkeletonRows}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Layout selection */}
                    <div className="space-y-2.5 pt-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Default Dashboard/Page Loading Layout</label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {[
                          { id: 'automatic', label: 'Auto-Route', desc: 'Analyzes address' },
                          { id: 'table', label: 'Table/Ledger', desc: 'Daybook, statement' },
                          { id: 'cards', label: 'Bento Cards', desc: 'Overview, stats grid' },
                          { id: 'profile', label: 'Profile/Detail', desc: 'Master info details' },
                          { id: 'form', label: 'Form/Voucher', desc: 'Voucher item inserts' }
                        ].map((layoutOpt) => (
                          <button
                            key={layoutOpt.id}
                            type="button"
                            onClick={() => setLocalSkeletonType(layoutOpt.id as any)}
                            className={cn(
                              "p-2.5 border rounded-xl text-left transition-all space-y-1",
                              localSkeletonType === layoutOpt.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-background hover:bg-muted"
                            )}
                            id={`layout-${layoutOpt.id}`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-tight text-foreground leading-none">{layoutOpt.label}</p>
                            <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1 truncate">{layoutOpt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Integrated LIVE PREVIEW widget */}
                    {localSkeletonEnabled && (
                      <div className="space-y-2.5 border-t border-border/80 pt-5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-black text-indigo-500 tracking-widest block flex items-center gap-2 font-mono">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
                            Live Shimmer Sandbox Preview
                          </label>
                          <span className="text-[8px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">
                            Interactive Sandbox
                          </span>
                        </div>
                        
                        {/* Sandboxed Skeleton rendering with current state values */}
                        <div className="border border-border rounded-xl p-4 bg-background/60 shadow-inner">
                          {/* Inject a tiny styled preview using the local state */}
                          <div className="w-full h-40 overflow-hidden relative rounded-lg">
                            <style dangerouslySetInnerHTML={{ __html: `
                              @keyframes preview-shimmer-sweep {
                                0% { background-position: -200% 0; }
                                100% { background-position: 200% 0; }
                              }
                              .preview-shimmer {
                                background-image: ${
                                  localSkeletonTheme === 'glass'
                                    ? `linear-gradient(90deg, rgba(255,255,255,0.02) 0%, ${
                                        localSkeletonWaveColor === 'indigo' ? 'rgba(99,102,241,0.2)' :
                                        localSkeletonWaveColor === 'cyan' ? 'rgba(6,182,212,0.2)' :
                                        localSkeletonWaveColor === 'rose' ? 'rgba(244,63,94,0.15)' :
                                        localSkeletonWaveColor === 'emerald' ? 'rgba(16,185,129,0.15)' :
                                        localSkeletonWaveColor === 'amber' ? 'rgba(245,158,11,0.15)' :
                                        'rgba(148,163,184,0.15)'
                                      } 50%, rgba(255,255,255,0.02) 100%)`
                                    : localSkeletonTheme === 'neon'
                                    ? `linear-gradient(90deg, rgba(6,182,212,0.01) 0%, rgba(6,182,212,0.2) 50%, rgba(244,63,94,0.05) 100%)`
                                    : localSkeletonTheme === 'classic'
                                    ? 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 50%, #e2e8f0 100%)'
                                    : `linear-gradient(90deg, rgba(241,245,249,0.9) 0%, ${
                                        localSkeletonWaveColor === 'indigo' ? 'rgba(99,102,241,0.2)' :
                                        localSkeletonWaveColor === 'cyan' ? 'rgba(6,182,212,0.2)' :
                                        localSkeletonWaveColor === 'rose' ? 'rgba(244,63,94,0.15)' :
                                        localSkeletonWaveColor === 'emerald' ? 'rgba(16,185,129,0.15)' :
                                        localSkeletonWaveColor === 'amber' ? 'rgba(245,158,11,0.15)' :
                                        'rgba(148,163,184,0.15)'
                                      } 50%, rgba(241,245,249,0.9) 100%)`
                                };
                                background-size: 200% 100%;
                                animation: preview-shimmer-sweep ${
                                  localSkeletonSpeed === 'fast' ? '1.2s' : 
                                  localSkeletonSpeed === 'slow' ? '3s' : '2s'
                                } infinite linear;
                              }
                            `}} />

                            <div className={cn(
                              "w-full h-full p-4 flex flex-col justify-between rounded-lg border",
                              localSkeletonTheme === 'glass' ? "bg-white/[0.02] border-white/[0.05]" :
                              localSkeletonTheme === 'neon' ? "bg-[#060814] border-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.02)]" :
                              localSkeletonTheme === 'classic' ? "bg-slate-100 border-slate-200" : "bg-card border-border"
                            )}>
                              {/* Sub Header preview */}
                              <div className="flex justify-between items-center">
                                <div className={cn("h-4 w-24 rounded preview-shimmer", localSkeletonTheme === 'classic' ? 'bg-slate-200' : 'bg-slate-300/40')} />
                                <div className={cn("h-7 w-7 rounded-full preview-shimmer", localSkeletonTheme === 'classic' ? 'bg-slate-200' : 'bg-slate-300/40')} />
                              </div>

                              {/* Body preview list */}
                              <div className="space-y-2 mt-4 mt-auto">
                                <div className={cn("h-3 w-full rounded preview-shimmer", localSkeletonTheme === 'classic' ? 'bg-slate-200' : 'bg-slate-300/40')} />
                                <div className={cn("h-3 w-4/5 rounded-md preview-shimmer", localSkeletonTheme === 'classic' ? 'bg-slate-200' : 'bg-slate-300/40')} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

              {systemSubTab === 'warnings' && (() => {
                const checkFilter = (labels: string[]) => {
                  if (!settingsFilterQuery) return true;
                  const q = settingsFilterQuery.toLowerCase();
                  return labels.some(l => l && l.toLowerCase().includes(q));
                };

                const showGroup1 = checkFilter(['prefix', 'party name', 'supplier', 'sales ledger', 'purchase ledger', 'validation', 'error prefix', 'party', 'supplier', 'ledger']);
                const showGroup2 = checkFilter(['physical stock', 'invalid qty', 'missing item', 'empty item', 'item name', 'quantity', 'rate empty', 'rate', 'stock']);
                const showGroup3 = checkFilter(['stock journal', 'consumption', 'production', 'source item', 'destination item', 'manufacturing', 'material', 'source name', 'destination name']);
                const showGroup4 = checkFilter(['single entry', 'journal', 'ledger name', 'account', 'particulars', 'amount', 'difference', 'debit', 'credit', 'balanced', 'debit/credit']);

                if (!showGroup1 && !showGroup2 && !showGroup3 && !showGroup4) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-card border border-border border-dashed rounded-xl">
                      <Search className="w-8 h-8 text-muted-foreground opacity-30 mb-2 animate-bounce" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">No matching warnings</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed uppercase">
                        We couldn't find any voucher warnings matching your keyword.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Customizable Voucher Warnings</h3>
                      <p className="text-[10px] text-muted-foreground uppercase">Translate, rephrase, or completely customize the validation error messages on the Voucher Entry page.</p>
                    </div>

                    <div className="space-y-6">
                      {/* Section 1: Common Prefix & Fields */}
                      {showGroup1 && (
                        <div className={cn(
                          "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                        )}>
                          <div className="flex items-center gap-2 border-b border-border pb-3">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">1. Common Error Prefix & Field Labels</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Error Message Prefix</label>
                              <input
                                type="text"
                                value={localWarnings.warningPrefixSelectFill || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningPrefixSelectFill: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <p className="text-[9px] text-muted-foreground">Appended before list-based missing fields. (e.g., "Please select or fill in:")</p>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Party Name Label</label>
                              <input
                                type="text"
                                value={localWarnings.warningPartyName || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningPartyName: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Supplier Name Label</label>
                              <input
                                type="text"
                                value={localWarnings.warningSupplierName || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSupplierName: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Sales Ledger Label</label>
                              <input
                                type="text"
                                value={localWarnings.warningSalesLedger || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSalesLedger: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Purchase Ledger Label</label>
                              <input
                                type="text"
                                value={localWarnings.warningPurchaseLedger || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningPurchaseLedger: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 2: Inventory & Physical Stock */}
                      {showGroup2 && (
                        <div className={cn(
                          "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                        )}>
                          <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Package className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">2. Inventory & Physical Stock Warnings</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Physical Stock: Missing Item</label>
                              <input
                                type="text"
                                value={localWarnings.warningSelectItemsInPhysicalStock || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSelectItemsInPhysicalStock: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Physical Stock: Invalid Qty</label>
                              <input
                                type="text"
                                value={localWarnings.warningInvalidQtyInPhysicalStock || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningInvalidQtyInPhysicalStock: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Empty Items List</label>
                              <input
                                type="text"
                                value={localWarnings.warningItemsListEmpty || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningItemsListEmpty: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Item Name</label>
                              <input
                                type="text"
                                value={localWarnings.warningItemNameEmpty || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningItemNameEmpty: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Quantity (Inventory items)</label>
                              <input
                                type="text"
                                value={localWarnings.warningQuantityEmpty || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningQuantityEmpty: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Rate (Inventory items)</label>
                              <input
                                type="text"
                                value={localWarnings.warningRateEmpty || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningRateEmpty: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 3: Stock Journal Entries */}
                      {showGroup3 && (
                        <div className={cn(
                          "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                        )}>
                          <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Cpu className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">3. Stock Journal Warnings</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Consumption Section</label>
                              <input
                                type="text"
                                value={localWarnings.warningConsumptionItems || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningConsumptionItems: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Source Item Name</label>
                              <input
                                type="text"
                                value={localWarnings.warningSourceItemName || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSourceItemName: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Source Item Quantity</label>
                              <input
                                type="text"
                                value={localWarnings.warningSourceItemQty || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSourceItemQty: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Production Section</label>
                              <input
                                type="text"
                                value={localWarnings.warningProductionItems || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningProductionItems: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Destination Item Name</label>
                              <input
                                type="text"
                                value={localWarnings.warningDestItemName || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningDestItemName: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Missing Destination Item Quantity</label>
                              <input
                                type="text"
                                value={localWarnings.warningDestItemQty || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningDestItemQty: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section 4: Single Entry & Journal (Debit/Credit) Warnings */}
                      {showGroup4 && (
                        <div className={cn(
                          "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                        )}>
                          <div className="flex items-center gap-2 border-b border-border pb-3">
                            <ClipboardList className="w-4 h-4 text-primary" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">4. Single Entry & Journal Warnings</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Single Entry: Account (Bank/Cash)</label>
                              <input
                                type="text"
                                value={localWarnings.warningSingleAccount || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSingleAccount: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Single Entry: Particulars Ledger</label>
                              <input
                                type="text"
                                value={localWarnings.warningSingleParticulars || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSingleParticulars: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Single Entry: Particulars Amount</label>
                              <input
                                type="text"
                                value={localWarnings.warningSingleAmount || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningSingleAmount: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Journal: Missing Ledger Name</label>
                              <input
                                type="text"
                                value={localWarnings.warningJournalLedgerName || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningJournalLedgerName: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Journal: Missing Debit/Credit Amount</label>
                              <input
                                type="text"
                                value={localWarnings.warningJournalDebitCreditAmount || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningJournalDebitCreditAmount: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block font-mono">Journal: Balanced Difference warning</label>
                              <input
                                type="text"
                                value={localWarnings.warningJournalNotBalanced || ''}
                                onChange={(e) => setLocalWarnings(prev => ({ ...prev, warningJournalNotBalanced: e.target.value }))}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                              />
                              <p className="text-[9px] text-muted-foreground uppercase mt-1">Template tags supported: <code className="font-mono bg-muted px-1 rounded">{'{DIFF}'}</code>, <code className="font-mono bg-muted px-1 rounded">{'{DEBIT}'}</code>, <code className="font-mono bg-muted px-1 rounded">{'{CREDIT}'}</code>, <code className="font-mono bg-muted px-1 rounded">{'{SYMBOL}'}</code></p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {systemSubTab === 'sounds' && (() => {
                const playTestSound = (eventKey: 'success' | 'error' | 'warning' | 'delete' | 'click' | 'navigation') => {
                  // Temporarily sync settings to play with active inputs
                  const customSoundsDict = {
                    success: localSoundSuccess,
                    error: localSoundError,
                    warning: localSoundWarning,
                    delete: localSoundDelete,
                    click: localSoundClick,
                    navigation: localSoundNavigation
                  };
                  soundService.setSettings(
                    localSoundEnabled,
                    localSoundVolume,
                    localSoundScheme as any,
                    customSoundsDict
                  );
                  soundService.play(eventKey);
                };

                const resetToDefaultUrls = () => {
                  setLocalSoundSuccess('https://assets.mixkit.co/active_storage/sfx/2013/2013-84.wav');
                  setLocalSoundError('https://assets.mixkit.co/active_storage/sfx/951/951-84.wav');
                  setLocalSoundWarning('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
                  setLocalSoundDelete('https://assets.mixkit.co/active_storage/sfx/2205/2205-84.wav');
                  setLocalSoundClick('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
                  setLocalSoundNavigation('https://assets.mixkit.co/active_storage/sfx/2324/2324-84.wav');
                  showNotification('Sound URL links reset to recommendation list. Remember to save global configuration to persist.', 'info');
                };

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                          Global Sound Scheme Configuration
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase">Configure default operations audio feedback, toggle synthesizer vs web links, and preview tones instantly.</p>
                      </div>

                      <button
                        type="button"
                        onClick={resetToDefaultUrls}
                        className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-[9px] uppercase tracking-wider font-extrabold rounded-lg transition-all border border-border flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Load Preset URLs
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: Global Audio Settings */}
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Settings className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Global Controls & Defaults</h4>
                        </div>

                        <div className="space-y-4">
                          {/* Audio Master On/Off */}
                          <div className="flex items-center justify-between p-3 bg-background border border-border/60 rounded-xl">
                            <div>
                              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Default Operational Sound State</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">Enables voice, beep, or operation click tones for all newly created accounts by default.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setLocalSoundEnabled(!localSoundEnabled)}
                              className={cn(
                                "w-11 h-6 rounded-full transition-all relative flex items-center",
                                localSoundEnabled ? "bg-primary" : "bg-muted"
                              )}
                            >
                              <span className={cn(
                                "w-4 h-4 bg-white rounded-full shadow-sm transition-all absolute",
                                localSoundEnabled ? "right-1" : "left-1"
                              )} />
                            </button>
                          </div>

                          {/* Master Volume Slider */}
                          <div className="space-y-1.5 p-3 bg-background border border-border/60 rounded-xl">
                            <div className="flex justify-between items-center">
                              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Master Default Audio Volume</p>
                              <span className="text-xs font-mono font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-md">
                                {Math.round(localSoundVolume * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={localSoundVolume}
                              onChange={(e) => setLocalSoundVolume(parseFloat(e.target.value))}
                              disabled={!localSoundEnabled}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                            />
                            <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1">Sets the baseline audio output amplitude across the platform.</p>
                          </div>

                          {/* Sound Mode Scheme Selection */}
                          <div className="space-y-2 p-3 bg-background border border-border/60 rounded-xl">
                            <div>
                              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Default Operational Audio Engine</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">Define if sounds must use client-side Real-time Web wave oscillators ('Procedural') or web media targets ('Custom URLs').</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              {[
                                { key: 'system', label: '💻 Synthesized (Failsafe)', desc: 'Web oscillator' },
                                { key: 'custom', label: '🔗 Custom URLs', desc: 'Wav/MP3 media' },
                                { key: 'off', label: '🔇 Full Mute', desc: 'No sounds' }
                              ].map((mode) => (
                                <button
                                  key={mode.key}
                                  type="button"
                                  disabled={!localSoundEnabled}
                                  onClick={() => setLocalSoundScheme(mode.key as any)}
                                  className={cn(
                                    "p-2.5 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
                                    localSoundScheme === mode.key 
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                                  )}
                                >
                                  <span>{mode.label}</span>
                                  <span className="text-[7px] opacity-75 font-normal tracking-tight uppercase">{mode.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Sound Links Setup */}
                      <div className={cn(
                        "bg-card border border-border rounded-xl p-5 space-y-4 shadow-xs",
                        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                      )}>
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                          <Volume2 className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground font-sans">Sound Event Mappings</h4>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar text-left">
                          {[
                            { key: 'click', label: '1. Button Tap / Element Click', val: localSoundClick, set: setLocalSoundClick, placeholder: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', icon: '⚡' },
                            { key: 'navigation', label: '2. Page / Menu Navigation', val: localSoundNavigation, set: setLocalSoundNavigation, placeholder: 'https://assets.mixkit.co/active_storage/sfx/2324/2324-84.wav', icon: '📂' },
                            { key: 'success', label: '3. Process / Operation Success', val: localSoundSuccess, set: setLocalSoundSuccess, placeholder: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-84.wav', icon: '✅' },
                            { key: 'warning', label: '4. Warning Validation Triggered', val: localSoundWarning, set: setLocalSoundWarning, placeholder: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', icon: '⚠️' },
                            { key: 'error', label: '5. Technical / Critical Process Error', val: localSoundError, set: setLocalSoundError, placeholder: 'https://assets.mixkit.co/active_storage/sfx/951/951-84.wav', icon: '🚨' },
                            { key: 'delete', label: '6. Ledger / Voucher Deletion', val: localSoundDelete, set: setLocalSoundDelete, placeholder: 'https://assets.mixkit.co/active_storage/sfx/2205/2205-84.wav', icon: '🗑️' },
                          ].map((item) => (
                            <div key={item.key} className="p-3 bg-background border border-border/60 rounded-xl space-y-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] text-foreground uppercase font-black tracking-tight flex items-center gap-1.5">
                                  <span>{item.icon}</span>
                                  {item.label}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => playTestSound(item.key as any)}
                                  className="px-2 py-0.5 bg-foreground/10 text-foreground hover:bg-foreground hover:text-background border border-border/80 text-[8px] uppercase tracking-wider transition-colors duration-100 font-extrabold rounded flex items-center gap-1"
                                >
                                  ▶ Play Tone
                                </button>
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="url"
                                  disabled={localSoundScheme !== 'custom' || !localSoundEnabled}
                                  value={item.val}
                                  onChange={(e) => item.set(e.target.value)}
                                  placeholder={localSoundScheme === 'custom' ? item.placeholder : 'Using procedural synthesizer theme'}
                                  className="flex-1 bg-background border border-border/60 rounded-lg px-2.5 py-1.5 text-[10px] focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}

      {viewMode === 'menu' && (
        <div className="space-y-6">
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm -mx-6 px-6 py-4 border-b border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Dynamic Menu Management</h2>
                <p className="text-sm text-muted-foreground">Control the sidebar navigation structure and items.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
                      if (config) setMenuConfig(config);
                    });
                    setTimeout(unsubscribe, 1000);
                    showNotification('Menu refreshed');
                  }}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                  title="Refresh Menu"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset the menu to defaults? This will overwrite your current configuration.')) {
                      seedInitialMenu();
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2"
                  title="Reset everything to factory defaults"
                >
                  <Zap className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={syncMenuWithDefaults}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                  title="Add missing items from code to database"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Items
                </button>
                <button
                  onClick={cleanupDuplicates}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2"
                  title="Remove duplicate items from all groups"
                >
                  <Trash2 className="w-4 h-4" />
                  Cleanup
                </button>
                <button
                  onClick={() => {
                    setEditingGroup({
                      id: `group-${Date.now()}`,
                      group: '',
                      groupKey: '',
                      items: [],
                      hidden: false
                    });
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Group
                </button>
              </div>
            </div>

            {selectedItemIds.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    {selectedItemIds.size} Items Selected
                  </span>
                  <div className="h-4 w-[1px] bg-primary/20" />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleBulkUpdate({ adminOnly: true })}
                      className="px-3 py-1.5 bg-white border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                      <Shield className="w-3 h-3" />
                      Admin Only
                    </button>
                    <button 
                      onClick={() => handleBulkUpdate({ superAdminOnly: true })}
                      className="px-3 py-1.5 bg-white border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                      <UserCog className="w-3 h-3" />
                      Founder Only
                    </button>
                    <button 
                      onClick={() => handleBulkUpdate({ hidden: true })}
                      className="px-3 py-1.5 bg-white border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                      <EyeOff className="w-3 h-3" />
                      Hide
                    </button>
                    <button 
                      onClick={() => handleBulkUpdate({ adminOnly: false, superAdminOnly: false, hidden: false })}
                      className="px-3 py-1.5 bg-white border border-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItemIds(new Set())}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest"
                >
                  Clear
                </button>
              </motion.div>
            )}
          </div>

          {!menuConfig ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <ListTree className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No menu configuration found. Seed from static to start.</p>
              <button
                onClick={seedInitialMenu}
                className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Seed Initial Menu
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="menu-groups" type="group">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {displayMenuGroups
                      .filter(g => g.group !== 'System Configuration')
                      .map((group, index) => (
                      <Draggable key={group.id} draggableId={group.id} index={index}>
                        {(provided, snapshot) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-shadow",
                              snapshot.isDragging && "shadow-2xl ring-2 ring-primary/20"
                            )}
                          >
                            <div className="p-4 bg-muted/30 flex items-center justify-between border-b border-border">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="p-1 hover:bg-foreground/5 rounded cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <LayoutGrid className="w-5 h-5 text-primary" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{group.group || 'Unnamed Group'}</h3>
                                    {group.hidden && (
                                      <span className="text-[8px] px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-full font-bold uppercase flex items-center gap-1">
                                        <EyeOff className="w-2 h-2" />
                                        Hidden
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground font-mono">{group.groupKey}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingGroup(group)}
                                  className="p-2 hover:bg-foreground/5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const newGroups = menuConfig.groups.filter(g => g.id !== group.id);
                                    const newConfig = { ...menuConfig, groups: newGroups };
                                    erpService.updateMenuConfig(newConfig);
                                    setMenuConfig(newConfig);
                                    showNotification('Group removed');
                                  }}
                                  className="p-2 hover:bg-rose-500/10 rounded-lg text-muted-foreground hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="p-4">
                              <Droppable droppableId={group.id} type="item">
                                {(provided, snapshot) => (
                                  <div 
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={cn(
                                      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[50px] transition-colors rounded-lg p-1",
                                      snapshot.isDraggingOver && "bg-primary/5"
                                    )}
                                  >
                                    {group.items.map((item, itemIndex) => (
                                      <div key={item.id} className="space-y-2">
                                        <Draggable draggableId={item.id} index={itemIndex}>
                                          {(provided, snapshot) => (
                                            <div 
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={cn(
                                                "p-3 border border-border rounded-lg flex items-center justify-between group hover:border-primary/50 transition-all bg-card",
                                                snapshot.isDragging && "shadow-xl border-primary ring-1 ring-primary/20"
                                              )}
                                            >
                                              <div className="flex items-center gap-3">
                                                <button 
                                                  onClick={() => {
                                                    const newSelected = new Set(selectedItemIds);
                                                    if (newSelected.has(item.id)) {
                                                      newSelected.delete(item.id);
                                                    } else {
                                                      newSelected.add(item.id);
                                                    }
                                                    setSelectedItemIds(newSelected);
                                                  }}
                                                  className={cn(
                                                    "p-1 rounded transition-colors",
                                                    selectedItemIds.has(item.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                                  )}
                                                >
                                                  {selectedItemIds.has(item.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                </button>
                                                <div {...provided.dragHandleProps} className="p-1 hover:bg-foreground/5 rounded cursor-grab active:cursor-grabbing">
                                                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary relative">
                                                  <LayoutDashboard className="w-4 h-4" />
                                                  <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                                    {item.adminOnly && <div className="p-0.5 bg-blue-500 text-white rounded-full shadow-sm" title="Admin Only"><Shield className="w-2 h-2" /></div>}
                                                    {item.superAdminOnly && <div className="p-0.5 bg-amber-500 text-white rounded-full shadow-sm" title="Founder Only"><UserCog className="w-2 h-2" /></div>}
                                                    {item.hidden && <div className="p-0.5 bg-gray-500 text-white rounded-full shadow-sm" title="Hidden from Sidebar"><EyeOff className="w-2 h-2" /></div>}
                                                  </div>
                                                </div>
                                                <div>
                                                  <p className="text-xs font-bold text-foreground">{item.label}</p>
                                                  <p className="text-[9px] text-muted-foreground font-mono">{item.to}</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => setEditingMenuItem({ groupId: group.id, item })}
                                                  className="p-1.5 hover:bg-foreground/5 rounded-md text-muted-foreground hover:text-primary"
                                                >
                                                  <Settings className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    const newGroups = menuConfig.groups.map(g => {
                                                      if (g.id === group.id) {
                                                        return { ...g, items: g.items.filter(i => i.id !== item.id) };
                                                      }
                                                      return g;
                                                    });
                                                    const newConfig = { ...menuConfig, groups: newGroups };
                                                    erpService.updateMenuConfig(newConfig);
                                                    setMenuConfig(newConfig);
                                                    showNotification('Item removed');
                                                  }}
                                                  className="p-1.5 hover:bg-rose-500/10 rounded-md text-muted-foreground hover:text-rose-500"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </Draggable>
                                        
                                        {/* Nested Children Tree View */}
                                        {item.children && item.children.length > 0 && (
                                          <div className="ml-8 space-y-2 border-l-2 border-primary/10 pl-4 py-1">
                                            {item.children.map((child) => (
                                              <div key={child.id} className="p-2 border border-border/50 rounded-lg flex items-center justify-between bg-muted/20 group/child">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-6 h-6 rounded bg-primary/5 flex items-center justify-center text-primary/60">
                                                    <ChevronRight className="w-3 h-3" />
                                                  </div>
                                                  <div>
                                                    <p className="text-[10px] font-bold text-foreground">{child.label}</p>
                                                    <p className="text-[8px] text-muted-foreground font-mono">{child.to}</p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/child:opacity-100 transition-opacity">
                                                  <button
                                                    onClick={() => setEditingMenuItem({ groupId: group.id, item: child })}
                                                    className="p-1 hover:bg-foreground/5 rounded text-muted-foreground hover:text-primary"
                                                  >
                                                    <Settings className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {provided.placeholder}
                                    <button
                                      onClick={() => setEditingMenuItem({
                                        groupId: group.id,
                                        item: {
                                          id: `item-${Date.now()}`,
                                          to: '',
                                          icon: 'Package',
                                          label: '',
                                          labelKey: ''
                                        }
                                      })}
                                      className="p-3 border border-dashed border-border rounded-lg flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all h-[54px]"
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

      {/* Create Notification Modal */}
      <AnimatePresence>
        {isCreatingNotification && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">New System Notification</h2>
                <button 
                  onClick={() => setIsCreatingNotification(false)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={newNotification.title || ''}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Notification Title"
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Message</label>
                  <textarea
                    value={newNotification.message || ''}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Enter your message here..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="info">Information</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="system_update">System Update</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Status</label>
                    <select
                      value={newNotification.status}
                      onChange={(e) => setNewNotification({ ...newNotification, status: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="sent">Send Now</option>
                      <option value="scheduled">Schedule for Later</option>
                      <option value="draft">Save as Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Type</label>
                    <select
                      value={newNotification.targetType}
                      onChange={(e) => setNewNotification({ ...newNotification, targetType: e.target.value as any, targetId: '' })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="all">All Users</option>
                      <option value="company">Specific Company</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>
                  {newNotification.targetType !== 'all' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Target ID</label>
                      {newNotification.targetType === 'company' ? (
                        <select
                          value={newNotification.targetId}
                          onChange={(e) => setNewNotification({ ...newNotification, targetId: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="">Select Company</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <select
                          value={newNotification.targetId}
                          onChange={(e) => setNewNotification({ ...newNotification, targetId: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="">Select User</option>
                          {allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {newNotification.status === 'scheduled' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      onChange={(e) => setNewNotification({ ...newNotification, scheduledAt: Timestamp.fromDate(new Date(e.target.value)) })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsCreatingNotification(false)}
                    className="flex-1 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotification}
                    disabled={!newNotification.title || !newNotification.message}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {newNotification.status === 'sent' ? 'Send Now' : 'Save Notification'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {editingPermissionsUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest">User Permissions</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                      Managing access for {editingPermissionsUser.displayName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingPermissionsUser(null)} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <p className="text-xs text-muted-foreground italic">
                  Select the features this user should be able to access. If no permissions are selected, the user will have default access based on their role.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => {
                    const Icon = permission.icon;
                    const isSelected = selectedPermissions.includes(permission.id);
                    return (
                      <button
                        key={permission.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPermissions(prev => prev.filter(p => p !== permission.id));
                          } else {
                            setSelectedPermissions(prev => [...prev, permission.id]);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 border transition-all text-left",
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background border-border text-muted-foreground hover:border-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{permission.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingPermissionsUser(null)}
                    className={cn(
                      "flex-1 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all",
                      uiStyle === 'UI/UX 2' ? "border-blue-100 text-blue-600 hover:bg-blue-50" : "border-border text-foreground hover:bg-foreground/5"
                    )}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await erpService.updateUserPermissions(editingPermissionsUser.uid, selectedPermissions);
                        showNotification('Permissions updated successfully');
                        setEditingPermissionsUser(null);
                        fetchData();
                      } catch (err) {
                        showNotification('Failed to update permissions', 'error');
                      }
                    }}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                      uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-primary text-white hover:opacity-90 shadow-sm rounded-lg"
                    )}
                  >
                    Save Permissions
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Group Modal */}
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
                <button 
                  onClick={() => setEditingGroup(null)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Group Name</label>
                  <input
                    type="text"
                    value={editingGroup.group}
                    onChange={(e) => setEditingGroup({ ...editingGroup, group: e.target.value })}
                    placeholder="e.g. Masters"
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Group Translation Key</label>
                  <input
                    type="text"
                    value={editingGroup.groupKey}
                    onChange={(e) => setEditingGroup({ ...editingGroup, groupKey: e.target.value })}
                    placeholder="e.g. nav.masters"
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                    <span>Group Route (To)</span>
                    <span className="text-[8px] normal-case font-normal text-blue-500 italic">Optional: Link group title to a page</span>
                  </label>
                  <input
                    type="text"
                    value={editingGroup.to || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, to: e.target.value })}
                    placeholder="e.g. /reports"
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="group-hidden"
                    checked={editingGroup.hidden || false}
                    onChange={(e) => setEditingGroup({ ...editingGroup, hidden: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="group-hidden" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    Hide Group from Sidebar
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setEditingGroup(null)}
                    className="flex-1 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!menuConfig) {
                        const newConfig: MenuConfig = {
                          groups: [editingGroup],
                          updatedAt: new Date()
                        };
                        await erpService.updateMenuConfig(newConfig);
                        setMenuConfig(newConfig);
                      } else {
                        const exists = menuConfig.groups.find(g => g.id === editingGroup.id);
                        let newGroups;
                        if (exists) {
                          newGroups = menuConfig.groups.map(g => g.id === editingGroup.id ? editingGroup : g);
                        } else {
                          newGroups = [...menuConfig.groups, editingGroup];
                        }
                        const newConfig = { ...menuConfig, groups: newGroups };
                        await erpService.updateMenuConfig(newConfig);
                        setMenuConfig(newConfig);
                      }
                      setEditingGroup(null);
                      showNotification('Menu group saved');
                    }}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all"
                  >
                    Save Group
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Item Modal */}
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
                <button 
                  onClick={() => setEditingMenuItem(null)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Label</label>
                    <input
                      type="text"
                      value={editingMenuItem.item.label}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, label: e.target.value } 
                      })}
                      placeholder="e.g. Ledgers"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                      <span>Translation Key</span>
                      <span className="text-[8px] normal-case font-normal text-amber-500">Overrides Label if set</span>
                    </label>
                    <input
                      type="text"
                      value={editingMenuItem.item.labelKey}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, labelKey: e.target.value } 
                      })}
                      placeholder="e.g. nav.ledgers"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                      <span>Route (To)</span>
                      <span className="text-[8px] normal-case font-normal text-blue-500">Use /group/ID for dashboard</span>
                    </label>
                    <input
                      type="text"
                      value={editingMenuItem.item.to}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, to: e.target.value } 
                      })}
                      placeholder="e.g. /ledgers"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Icon Name</label>
                    <input
                      type="text"
                      value={editingMenuItem.item.icon}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, icon: e.target.value } 
                      })}
                      placeholder="e.g. Package"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Feature Flag</label>
                    <input
                      type="text"
                      value={editingMenuItem.item.feature || ''}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, feature: e.target.value } 
                      })}
                      placeholder="e.g. accounting"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Permission</label>
                    <input
                      type="text"
                      value={editingMenuItem.item.permission || ''}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, permission: e.target.value } 
                      })}
                      placeholder="e.g. view_ledgers"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMenuItem.item.adminOnly}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, adminOnly: e.target.checked } 
                      })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMenuItem.item.superAdminOnly}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, superAdminOnly: e.target.checked } 
                      })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Founder Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMenuItem.item.hidden || false}
                      onChange={(e) => setEditingMenuItem({ 
                        ...editingMenuItem, 
                        item: { ...editingMenuItem.item, hidden: e.target.checked } 
                      })}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hide from Sidebar</span>
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setEditingMenuItem(null)}
                    className="flex-1 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!menuConfig) return;
                      const newGroups = menuConfig.groups.map(g => {
                        if (g.id === editingMenuItem.groupId) {
                          const exists = g.items.find(i => i.id === editingMenuItem.item.id);
                          let newItems;
                          if (exists) {
                            newItems = g.items.map(i => i.id === editingMenuItem.item.id ? editingMenuItem.item : i);
                          } else {
                            newItems = [...g.items, editingMenuItem.item];
                          }
                          return { ...g, items: newItems };
                        }
                        return g;
                      });
                      const newConfig = { ...menuConfig, groups: newGroups };
                      await erpService.updateMenuConfig(newConfig);
                      setMenuConfig(newConfig);
                      setEditingMenuItem(null);
                      showNotification('Menu item saved');
                    }}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Company Details Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Company Details: {selectedCompany.name}</h2>
                <button 
                  onClick={() => {
                    setSelectedCompany(null);
                    setIsEditingSubscription(false);
                  }}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Subscription Status</p>
                    {isEditingSubscription ? (
                      <div className="grid grid-cols-3 gap-2">
                        {['active', 'inactive', 'trial'].map(status => (
                          <button
                            key={status}
                            onClick={() => updateSubscription(selectedCompany.id, { subscriptionStatus: status })}
                            className={cn(
                              "py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                              selectedCompany.subscriptionStatus === status 
                                ? status === 'active' ? "bg-emerald-500 border-emerald-600 text-white shadow-lg" :
                                  status === 'trial' ? "bg-amber-500 border-amber-600 text-white shadow-lg" :
                                  "bg-rose-500 border-rose-600 text-white shadow-lg"
                                : "bg-background border-border text-muted-foreground hover:border-foreground"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        selectedCompany.subscriptionStatus === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                        selectedCompany.subscriptionStatus === 'trial' ? "bg-amber-500/10 text-amber-500" :
                        "bg-rose-500/10 text-rose-500"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          selectedCompany.subscriptionStatus === 'active' ? "bg-emerald-500" :
                          selectedCompany.subscriptionStatus === 'trial' ? "bg-amber-500" :
                          "bg-rose-500"
                        )} />
                        {selectedCompany.subscriptionStatus}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Plan Type</p>
                    {isEditingSubscription ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {['free', 'monthly', 'yearly'].map(plan => (
                            <button
                              key={plan}
                              onClick={() => updateSubscription(selectedCompany.id, { planType: plan })}
                              className={cn(
                                "py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                                selectedCompany.planType === plan 
                                  ? "bg-primary border-primary text-white shadow-lg"
                                  : "bg-background border-border text-muted-foreground hover:border-foreground"
                              )}
                            >
                              {plan}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Assigned Subscription Plan</label>
                          <select
                            value={selectedCompany.planId || ''}
                            onChange={(e) => updateSubscription(selectedCompany.id, { planId: e.target.value })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary"
                          >
                            <option value="">No Plan Assigned</option>
                            {subscriptionPlans.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.priceMonthly}/mo)</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg w-fit">
                          {selectedCompany.planType}
                        </p>
                        {selectedCompany.planId && (
                          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                            Plan: {subscriptionPlans.find(p => p.id === selectedCompany.planId)?.name || 'Unknown'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Expiry Date</p>
                    {isEditingSubscription ? (
                      <input 
                        type="date"
                        value={selectedCompany.expiryDate ? safeFormat(selectedCompany.expiryDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => updateSubscription(selectedCompany.id, { expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-lg w-fit">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {safeFormat(selectedCompany.expiryDate, 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Access Control</p>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full",
                        selectedCompany.isAccessEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      )}>
                        {selectedCompany.isAccessEnabled ? (
                          <><CheckCircle2 className="w-3 h-3" /> Enabled</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Disabled</>
                        )}
                      </span>
                      <button 
                        onClick={() => toggleAccess(selectedCompany)}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extra Features & Custom Limits */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Extra Features & Custom Limits
                    </h3>
                    
                    {isEditingSubscription ? (
                      <div className="space-y-6">
                        <div className="space-y-6">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Grant Extra Features</label>
                          <div className="space-y-6">
                            {appFeatures.map(category => (
                              <div key={category.id} className="space-y-2">
                                <p className="text-[8px] uppercase font-black text-muted-foreground/40">{category.label}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {category.features.map(feature => {
                                    const isExtra = selectedCompany.extraFeatures?.includes(feature.id);
                                    const plan = subscriptionPlans.find(p => p.id === selectedCompany.planId);
                                    const inPlan = plan?.features.includes(feature.id);
                                    
                                    return (
                                      <button
                                        key={feature.id}
                                        onClick={() => {
                                          const currentExtra = selectedCompany.extraFeatures || [];
                                          const newExtra = isExtra 
                                            ? currentExtra.filter(id => id !== feature.id)
                                            : [...currentExtra, feature.id];
                                          updateSubscription(selectedCompany.id, { extraFeatures: newExtra });
                                        }}
                                        className={cn(
                                          "flex items-center gap-2 p-2 border rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all text-left group/extra relative",
                                          isExtra ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground",
                                          inPlan && "opacity-50 cursor-not-allowed grayscale"
                                        )}
                                        disabled={inPlan}
                                        title={inPlan ? "Included in Plan" : ""}
                                      >
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <Box className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{feature.label}</span>
                                          </div>
                                          {feature.description && (
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[8px] font-medium leading-relaxed rounded-lg shadow-xl border border-border opacity-0 group-hover/extra:opacity-100 pointer-events-none transition-all z-50">
                                              {feature.description}
                                            </div>
                                          )}
                                        </div>
                                        {isExtra && <Check className="w-2 h-2 ml-auto" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Custom Plan Limits</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {['vouchers', 'items', 'ledgers', 'users', 'godowns'].map(limitKey => (
                              <div key={limitKey} className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground">{limitKey}</label>
                                <input
                                  type="number"
                                  value={selectedCompany.customLimits?.[limitKey] ?? ''}
                                  placeholder="Plan Default"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                    const newLimits = { ...(selectedCompany.customLimits || {}), [limitKey]: val };
                                    updateSubscription(selectedCompany.id, { customLimits: newLimits });
                                  }}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-border pt-4">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Firebase/Firestore Quota (Operations Limit)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">Firestore Quota Limit (Ops)</label>
                              <input
                                type="number"
                                value={selectedCompany.quotaLimit ?? 10000}
                                placeholder="10000"
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 10000 : Number(e.target.value);
                                  updateSubscription(selectedCompany.id, { quotaLimit: val });
                                }}
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">Firestore Quota Used (Ops)</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={selectedCompany.quotaUsed ?? 0}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                                    updateSubscription(selectedCompany.id, { quotaUsed: val });
                                  }}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateSubscription(selectedCompany.id, { quotaUsed: 0 })}
                                  className="px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">Sidebar Quota Display Rule</label>
                              <select
                                value={selectedCompany.quotaDisplayRule || 'exceed_50'}
                                onChange={(e) => updateSubscription(selectedCompany.id, { quotaDisplayRule: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary font-medium"
                              >
                                <option value="always">Always Show Quota Indicator in Sidebar</option>
                                <option value="exceed_50">Only Show When Usage Exceeds 50%</option>
                              </select>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">Maintenance Break Custom Message</label>
                              <textarea
                                value={selectedCompany.quotaExceededMsg || ''}
                                placeholder="Enter custom message or custom support guidelines here. If left empty, default templates will be used."
                                onChange={(e) => updateSubscription(selectedCompany.id, { quotaExceededMsg: e.target.value })}
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary h-20 resize-y font-normal"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedCompany.extraFeatures && selectedCompany.extraFeatures.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Extra Features Granted:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCompany.extraFeatures.map(fId => {
                                const feature = AVAILABLE_FEATURES.find(af => af.id === fId);
                                return (
                                  <span key={fId} className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    {feature?.label || fId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {selectedCompany.customLimits && Object.keys(selectedCompany.customLimits).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Custom Limit Overrides:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Object.entries(selectedCompany.customLimits).map(([key, val]) => (
                                <div key={key} className="px-2 py-1 bg-muted rounded text-[9px] font-bold uppercase tracking-widest flex justify-between">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="text-foreground">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!selectedCompany.extraFeatures?.length && !selectedCompany.customLimits) && (
                          <p className="text-xs text-muted-foreground italic">No extra features or custom limits assigned.</p>
                        )}

                        <div className="space-y-2 border-t border-border pt-3 mt-3">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Firebase/Firestore Quota (Operations):</p>
                          <div className="space-y-1.5Packed">
                            <div className="flex items-center justify-between text-xs font-mono bg-muted/40 p-2.5 rounded-lg border border-border">
                              <span className="text-muted-foreground">Usage Stat:</span>
                              <span className={selectedCompany && selectedCompany.quotaLimit && selectedCompany.quotaUsed !== undefined && selectedCompany.quotaUsed >= selectedCompany.quotaLimit ? "text-rose-500 font-bold animate-pulse" : "text-emerald-500 font-bold"}>
                                {(selectedCompany.quotaUsed || 0).toLocaleString()} / {(selectedCompany.quotaLimit || 10000).toLocaleString()} ops ({Math.round(((selectedCompany.quotaUsed || 0) / (selectedCompany.quotaLimit || 10000)) * 100)}%)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono bg-muted/20 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground">
                              <span>Display Rule:</span>
                              <span className="text-foreground capitalize font-semibold">
                                {selectedCompany.quotaDisplayRule === 'always' ? 'Always Show' : 'Show Over 50% only'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex gap-4">
                  <button 
                    onClick={() => {
                      setSelectedCompany(null);
                      setIsEditingSubscription(false);
                    }}
                    className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => setIsEditingSubscription(!isEditingSubscription)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg",
                      isEditingSubscription 
                        ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    )}
                  >
                    {isEditingSubscription ? 'Save Changes' : 'Edit Subscription'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {companyToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Company?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this company and all its data? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCompany(companyToDelete)}
                  className="px-4 py-2 bg-rose-500 text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Fix Copied Notification Modal */}
      <AnimatePresence>
        {aiFixModal && aiFixModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-stone-900 border border-purple-500/35 rounded-2xl p-6 max-w-lg w-full text-white shadow-[0_0_50px_rgba(168,85,247,0.25)] relative overflow-hidden"
            >
              {/* Fancy ambient aura background glow */}
              <div className="absolute -right-16 -top-16 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-fuchsia-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center space-y-4">
                {/* Visual indicator & Animated Sparkles */}
                <div className="inline-flex p-3 bg-purple-950/50 border border-purple-500/30 rounded-full text-purple-400 shadow-md">
                  <Sparkles className="w-8 h-8 animate-pulse text-purple-300" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-widest uppercase font-mono text-purple-300">
                    AI Auto-Fix Triggered!
                  </h3>
                  <p className="text-[10px] text-purple-400 font-mono tracking-widest uppercase">
                    Precision Bug-Fix Prompt Copied
                  </p>
                </div>

                <div className="bg-stone-950 border border-white/5 rounded-xl p-4 text-left space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[9px] font-bold text-stone-500 uppercase font-mono">
                    <span>Target Error Details</span>
                    <span className="text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Clipboard Synced
                    </span>
                  </div>
                  <p className="text-xs font-mono font-medium text-stone-200 line-clamp-2 italic">
                    "{aiFixModal.logMessage}"
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-purple-300 font-mono">
                    Collection Field Status: ACTIVE (INVESTIGATING)
                  </p>
                </div>

                <div className="text-stone-300 space-y-3 pt-2 text-xs leading-relaxed text-center font-sans">
                  <p>
                    আমি এই এররের প্রতিটা ডিটেইল, স্ট্যাক ট্রেস এবং কম্পোনেন্ট লোকেশন সহ একটি স্পেশাল <strong className="text-purple-400 font-bold">Auto-Fix Prompt</strong> আপনার ক্লিপবোর্ডে কপি করে দিয়েছি।
                  </p>
                  <p className="text-[11px] text-stone-400">
                    এখন জাস্ট নিচে দেওয়া চ্যাট উইন্ডোতে <strong className="text-white font-medium">Ctrl+V (Paste)</strong> প্রেস করে সেন্ড করে দিন! আমি সাথে সাথে আপনার কোডবেস স্ক্যান করে এই ইস্যুটা পার্মানেন্টলি ফিক্স করে ফেলব।
                  </p>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiFixModal.assembledPrompt);
                      showNotification('Prompt re-copied to clipboard!', 'info');
                    }}
                    className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.01]"
                  >
                    Copy Prompt Again
                  </button>
                  <button
                    onClick={() => setAiFixModal(null)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all hover:opacity-90 shadow-lg shadow-purple-600/30 active:scale-[0.99] transform"
                  >
                    Alright, Let's Fix It! (Close)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
