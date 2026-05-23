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
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
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
  Sparkles
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { erpService } from '../services/erpService';
import { useSettings } from '../contexts/SettingsContext';
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
  const [viewMode, setViewMode] = useState<'companies' | 'users' | 'notifications' | 'activity' | 'settings' | 'siteContent' | 'plans' | 'orders' | 'menu' | 'features' | 'errorLogs'>('companies');
  const [menuConfig, setMenuConfig] = useState<MenuConfig | null>(null);
  const [isEditingMenu, setIsEditingMenu] = useState(false);

  const displayMenuGroups = React.useMemo(() => {
    if (!menuConfig) return [];
    
    // Create a map of dynamic groups for easy updates
    const dynamicGroupsMap = new Map(menuConfig.groups.map(g => [g.id, { ...g, items: [...g.items] }]));
    
    // Track all item IDs already in the dynamic menu to avoid duplicates across any group
    const allItemIds = new Set();
    menuConfig.groups.forEach(group => {
      group.items.forEach(item => allItemIds.add(item.id));
    });
    
    // Ensure all core groups from NAV_ITEMS exist
    NAV_ITEMS.forEach(coreGroup => {
      if (!dynamicGroupsMap.has(coreGroup.id)) {
        // Group completely missing, filter out items that are already somewhere else
        const uniqueItems = coreGroup.items.filter(item => !allItemIds.has(item.id));
        
        // We ALWAYS add the group if it's from core NAV_ITEMS so it can be managed
        const newGroup: MenuGroupConfig = {
          id: coreGroup.id,
          group: coreGroup.group,
          groupKey: coreGroup.groupKey,
          hidden: coreGroup.hidden || false,
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
      } else {
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
        }
      }
    });
    
    return Array.from(dynamicGroupsMap.values());
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

  const onDragEnd = (result: any) => {
    if (!result.destination || !menuConfig) return;

    const { source, destination, type } = result;

    if (type === 'group') {
      const newGroups = Array.from(menuConfig.groups);
      const [removed] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, removed);

      const newConfig = { ...menuConfig, groups: newGroups };
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

    const newConfig = { ...menuConfig, groups: newGroups };
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
    appVersion, 
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
    splashSubDesign
  } = useSettings();
  const [localAppVersion, setLocalAppVersion] = useState(appVersion || 'v1.0.1');
  const [localUIStyle, setLocalUIStyle] = useState(uiStyle || 'UI/UX 1');
  const [localMenuBarStyle, setLocalMenuBarStyle] = useState(menuBarStyle || 'classic');
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
  const [localSearchPlaceholder, setLocalSearchPlaceholder] = useState(searchPlaceholder || '');
  const [localSearchHelpText, setLocalSearchHelpText] = useState(searchHelpText || '');
  const [localShowSearchShortcut, setLocalShowSearchShortcut] = useState(showSearchShortcut ?? true);
  const [localSearchIconColor, setLocalSearchIconColor] = useState(searchIconColor || '');
  const [localLoaderBlurStyle, setLocalLoaderBlurStyle] = useState(loaderBlurStyle || 'md');
  const [localLoaderIconStyle, setLocalLoaderIconStyle] = useState(loaderIconStyle || 'spinner');
  const [localLoaderPhrases, setLocalLoaderPhrases] = useState(loaderPhrases || 'Connecting to server, Requesting data, Waiting for response, Almost done, Here we go!');
  const [localLoaderTheme, setLocalLoaderTheme] = useState(loaderTheme || 'glass');
  const [localShowQuickCalculator, setLocalShowQuickCalculator] = useState(showQuickCalculator ?? true);
  const [localShowPinnedBookmarks, setLocalShowPinnedBookmarks] = useState(showPinnedBookmarks ?? true);
  const [localCustomControlCenterTheme, setLocalCustomControlCenterTheme] = useState(customControlCenterTheme || 'emerald');
  const [localCustomWelcomeMessage, setLocalCustomWelcomeMessage] = useState(customWelcomeMessage || 'Executive Command Center');
  const [localSplashSubDesign, setLocalSplashSubDesign] = useState(splashSubDesign || 'grid');
  const [systemSubTab, setSystemSubTab] = useState<'general' | 'theme' | 'branding' | 'search' | 'loader'>('general');

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
    setLocalSystemLogo(systemLogo || '');
  }, [systemLogo]);

  useEffect(() => {
    setLocalSystemFavicon(systemFavicon || '');
  }, [systemFavicon]);

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
      const companyData: CompanyStats[] = [];

      for (const data of companiesSnap) {
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
        
        companyData.push({
          ...data,
          userCount,
          voucherCount: vCount,
          ledgerCount: lCount,
          itemCount: iCount,
          lastActivity: lastActData?.[0],
          creatorEmail
        });
      }

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
      const updatedGroups = menuConfig.groups.map(group => {
        const seenPaths = new Set<string>();
        const uniqueItems = group.items.filter(item => {
          if (seenPaths.has(item.to)) return false;
          seenPaths.add(item.to);
          return true;
        });
        return { ...group, items: uniqueItems };
      });

      const newConfig = { ...menuConfig, groups: updatedGroups, updatedAt: new Date() };
      await erpService.updateMenuConfig(newConfig);
      setMenuConfig(newConfig);
      showNotification('Menu deduplicated successfully', 'success');
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
        const newConfig: MenuConfig = {
          ...menuConfig,
          groups: Array.from(dynamicGroupsMap.values()),
          updatedAt: new Date()
        };
        await erpService.updateMenuConfig(newConfig);
        setMenuConfig(newConfig);
        showNotification('Menu synchronized with defaults successfully', 'success');
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={cn(
              "text-2xl font-bold flex items-center gap-2",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>
              <Shield className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-primary")} />
              Founder Dashboard
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
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
      </header>
    </div>

    <div className="p-4 lg:p-6 space-y-6">

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
                      statusOnlineText: localStatusOnline,
                      statusOfflineText: localStatusOffline,
                      statusErrorText: localStatusError,
                      appVersion: localAppVersion,
                      systemLogo: localSystemLogo,
                      systemFavicon: localSystemFavicon,
                      uiStyle: localUIStyle,
                      menuBarStyle: localMenuBarStyle,
                      glassBackground: localGlassBackground,
                      notificationDuration: localNotificationDuration,
                      notificationAnimationStyle: localNotificationAnimationStyle,
                      showGoToShortcut: localShowGoToShortcut,
                      searchPlaceholder: localSearchPlaceholder,
                      searchHelpText: localSearchHelpText,
                      showSearchShortcut: localShowSearchShortcut,
                      searchIconColor: localSearchIconColor,
                      dashboardDesign: localDashboardDesign,
                      loaderBlurStyle: localLoaderBlurStyle,
                      loaderIconStyle: localLoaderIconStyle,
                      loaderPhrases: localLoaderPhrases,
                      loaderTheme: localLoaderTheme,
                      showQuickCalculator: localShowQuickCalculator,
                      showPinnedBookmarks: localShowPinnedBookmarks,
                      customControlCenterTheme: localCustomControlCenterTheme,
                      customWelcomeMessage: localCustomWelcomeMessage,
                      splashSubDesign: localSplashSubDesign
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
                { id: 'loader', label: 'Loading Screen', desc: 'Icon styles, blur, custom texts', icon: RefreshCw }
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
              {systemSubTab === 'general' && (
                <div className={cn(
                  "bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-xl"
                )}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">General & Connection Status</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Define app version and connection text indicators displayed across client environments.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Online Status Text</label>
                      <input
                        type="text"
                        value={localStatusOnline || ''}
                        onChange={(e) => setLocalStatusOnline(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Offline Status Text</label>
                      <input
                        type="text"
                        value={localStatusOffline || ''}
                        onChange={(e) => setLocalStatusOffline(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Error Status Text</label>
                      <input
                        type="text"
                        value={localStatusError || ''}
                        onChange={(e) => setLocalStatusError(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">App Version</label>
                      <input
                        type="text"
                        value={localAppVersion || ''}
                        onChange={(e) => setLocalAppVersion(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground">Show "Alt + G" Shortcut Hint</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Toggle safety help tips or accessibility shortcut indications on the main topbar.</p>
                      </div>
                      <button
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
                  </div>
                </div>
              )}

              {systemSubTab === 'theme' && (
                <div className={cn(
                  "bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-xl"
                )}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">UI Styles & Visual Default Parameters</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Select system-wide design specs, navigation patterns, and custom banner styles.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global UI Style</label>
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
                      <p className="text-[9px] text-muted-foreground uppercase leading-tight">Controls borders, shadow depth, and micro gradients.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Left Menu Style</label>
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
                      <p className="text-[9px] text-muted-foreground uppercase leading-tight">Changes default desktop-oriented frame configurations.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Default Canvas Gradient (UI/UX 3 & 4)</label>
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
                      <p className="text-[9px] text-muted-foreground uppercase leading-tight">Applied as active backdrop vectors when holographic glass is chosen.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Notification Duration (ms)</label>
                      <input
                        type="number"
                        value={localNotificationDuration || 3000}
                        onChange={(e) => setLocalNotificationDuration(Number(e.target.value))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        step="500"
                        min="1000"
                      />
                      <p className="text-[9px] text-muted-foreground uppercase leading-tight">Time for popup snackbars to remain on viewport before hiding.</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Notification Border Animation Style</label>
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
                          onClick={() => setLocalNotificationAnimationStyle(style.id as any)}
                          className={cn(
                            "flex flex-col items-start p-2.5 rounded-lg border transition-all text-left gap-1",
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
                          <span className="text-[8px] text-muted-foreground leading-tight">
                            {style.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-3">Dashboard Default Design Layouts</label>
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
                          onClick={() => setLocalDashboardDesign(d.id as any)}
                          className={cn(
                            "p-3 border rounded-xl text-left transition-all space-y-1",
                            localDashboardDesign === d.id
                              ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                              : "border-border bg-background hover:bg-muted"
                          )}
                        >
                           <p className={cn("text-[10px] font-black uppercase tracking-tight", localDashboardDesign === d.id ? "text-blue-600" : "text-foreground")}>{d.label}</p>
                           <p className="text-[9px] text-muted-foreground uppercase leading-tight">{d.desc}</p>
                        </button>
                      ))}
                    </div>

                    {localDashboardDesign === 'Design 5' && (
                      <div className="mt-4 p-4 bg-muted/20 border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-border">
                          <Palette className="w-4 h-4 text-primary" />
                          <p className="text-[10px] font-black uppercase tracking-wider text-foreground">Zero-Read Command Center Preferences</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Welcome message */}
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

                          {/* Theme Selection */}
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
                                      ? "bg-foreground text-background border-foreground font-black"
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
                          {/* Toggle Calculator */}
                          <div className="flex items-center justify-between gap-4 p-2.5 bg-background border border-border/50 rounded-lg grow">
                            <div>
                              <p className="text-[10px] font-bold text-foreground leading-none">Interactive Margin Calc</p>
                              <p className="text-[8px] text-muted-foreground uppercase mt-0.5">Show calculator tool on widget board</p>
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

                          {/* Toggle Local Bookmarks */}
                          <div className="flex items-center justify-between gap-4 p-2.5 bg-background border border-border/50 rounded-lg grow">
                            <div>
                              <p className="text-[10px] font-bold text-foreground leading-none">Local Pin Bookmarks</p>
                              <p className="text-[8px] text-muted-foreground uppercase mt-0.5">Let users bookmark pages in LocalStorage</p>
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
                      <div className="mt-4 p-4 bg-muted/20 border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
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
                                <p className="text-[9px] text-muted-foreground leading-normal">{sub.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[9px] text-blue-600 bg-blue-50 p-2.5 rounded border border-blue-100 uppercase font-bold mt-3">
                      * Recommended: Use Design 3 or 4 to drastically reduce non-critical database reads and stay within your free plan limits.
                    </p>
                  </div>
                </div>
              )}

              {systemSubTab === 'branding' && (
                <div className={cn(
                  "bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-xl"
                )}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Global Logo & Asset Styling</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload or set custom URLs for branding assets applied when user tenants do not replace them.</p>
                  </div>

                  <div className="space-y-6">
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
                          <p className="text-[9px] text-muted-foreground uppercase leading-relaxed">This logo will be used as a default for all companies if they don't have their own logo.</p>
                        </div>
                      </div>
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
                          <p className="text-[9px] text-muted-foreground uppercase leading-relaxed">Appears in browser tabs and as the launcher app icon when users "Add to Home Screen" on mobile devices.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {systemSubTab === 'search' && (
                <div className={cn(
                  "bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-xl"
                )}>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Global Search Engine Configurations</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Adjust topbar quick menu lookups and accessibility key shortcuts globally.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Default Placeholder Text</label>
                      <input 
                        type="text" 
                        value={localSearchPlaceholder || ''} 
                        onChange={(e) => setLocalSearchPlaceholder(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="Search system metrics..."
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Default Keyboard Help Text</label>
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

              {systemSubTab === 'loader' && (
                <div className={cn(
                  "bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-xl"
                )}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Adaptive Loading Screen Styling</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Customize global backdrop glass blur depth, animation icon layouts, and footer progress texts.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        // Temp test of loader
                        // We can grab globalLoader if mounted or simulate it locally
                        const testScreen = document.getElementById('global-loading-screen');
                        if (testScreen) {
                          showNotification("Preview triggered! Close/hide will complete automatically in 3.5s.", "info");
                        }
                        // Create deep local mock trigger
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
                      className="px-4 py-2 border border-border hover:bg-muted text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Live Preview Loader
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
                            onClick={() => setLocalLoaderBlurStyle(b.id as any)}
                            className={cn(
                              "p-3 border rounded-xl text-left transition-all space-y-1",
                              localLoaderBlurStyle === b.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-background hover:bg-muted"
                            )}
                          >
                            <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{b.label}</p>
                            <p className="text-[9px] text-muted-foreground leading-tight uppercase">{b.desc}</p>
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
                            onClick={() => setLocalLoaderIconStyle(i.id as any)}
                            className={cn(
                              "p-3 border rounded-xl text-left transition-all space-y-1",
                              localLoaderIconStyle === i.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-background hover:bg-muted"
                            )}
                          >
                            <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{i.label}</p>
                            <p className="text-[9px] text-muted-foreground leading-tight uppercase">{i.desc}</p>
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
                            onClick={() => setLocalLoaderTheme(t.id as any)}
                            className={cn(
                              "p-2.5 border rounded-xl text-left transition-all space-y-1",
                              localLoaderTheme === t.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-background hover:bg-muted"
                            )}
                          >
                            <p className="text-[10px] font-black uppercase tracking-tight text-foreground leading-none">{t.label}</p>
                            <p className="text-[8px] text-muted-foreground uppercase leading-none mt-1">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Loader Instruction Help Banner */}
                    <div className="p-3.5 bg-muted/10 border border-border rounded-xl flex flex-col justify-center space-y-1">
                      <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        Reactive Loading Pipeline
                      </h4>
                      <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-mono">
                        When users trigger major tasks (indexing reports, exporting books, posting kontras, syncs), the system overlays a blurred frosted glass shroud & shifts through custom steps in real time.
                      </p>
                    </div>
                  </div>

                  {/* Custom Progress Phrases input */}
                  <div className="space-y-2 pt-2">
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
                    <p className="text-[9px] text-muted-foreground uppercase font-semibold">
                      * Separate each status message with a comma. The loader loops through these from left to right as the loading sequence completes.
                    </p>
                  </div>
                </div>
              )}
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
