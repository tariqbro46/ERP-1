import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Database, Keyboard, Globe, Check, AlertCircle, Save, Printer, Cloud, Share2, MessageSquare, Mail, Download, Upload, History, Loader2, Trash2, Building2, ClipboardList, LayoutDashboard, Palette, CreditCard, Zap, CheckCircle2, Package } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { erpService } from '../services/erpService';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { NAV_ITEMS } from '../constants/navigation';
import { MenuConfig } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export function Settings({ activeTab: initialTab }: { activeTab?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { 
    companyName, 
    companyLogo,
    companyAddress,
    slogan, 
    printHeader,
    printFooter,
    printPhone,
    printEmail,
    printWebsite,
    showPrintHeader,
    showPrintPhone,
    showPrintEmail,
    showPrintWebsite,
    showPrintFooter,
    printSignature1,
    printSignature2,
    printSignature3,
    showSignature1,
    showSignature2,
    showSignature3,
    signatureAlignment,
    showDeveloperContact,
    financialYearStart,
    baseCurrencySymbol,
    timezone,
    refNoFormat,
    showFreeQty,
    showDiscPercent,
    showTaxPercent,
    showCurrency,
    showExRate,
    showRunningBalance,
    showMobileNav,
    mobileBottomNavItems = [],
    dateFormat,
    reportLayout,
    dashboardDesign,
    uiStyle,
    glassBackground,
    notificationAnimationStyle,
    appVersion,
    menuBarStyle,
    layoutWidth,
    sidebarDefaultExpanded,
    showGoToShortcut,
    showScrollingBar,
    showQuickActions,
    dashboardQuickActions = ['voucher', 'item', 'ledger', 'godown', 'users'],
    dashboardCards = ['revenue', 'profit', 'ledgers', 'stock'],
    englishFont,
    banglaFont,
    notifications, 
    whatsappTemplates,
    features = [], 
    activePlan,
    updateSettings,
    updateUserSettings
  } = useSettings();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(initialTab || 'company');

  // Update activeTab if initialTab changes (from route)
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  
  // Local state for form fields
  const [localCompanyName, setLocalCompanyName] = useState(companyName || '');
  const [localCompanyLogo, setLocalCompanyLogo] = useState(companyLogo || '');
  const [localCompanyAddress, setLocalCompanyAddress] = useState(companyAddress || '');
  const [localSlogan, setLocalSlogan] = useState(slogan || '');
  const [localMenuBarStyle, setLocalMenuBarStyle] = useState(menuBarStyle || 'classic');
  const [localLayoutWidth, setLocalLayoutWidth] = useState(layoutWidth || 'constrained');
  const [localPrintHeader, setLocalPrintHeader] = useState(printHeader || '');
  const [localPrintFooter, setLocalPrintFooter] = useState(printFooter || '');
  const [localPrintPhone, setLocalPrintPhone] = useState(printPhone || '');
  const [localPrintEmail, setLocalPrintEmail] = useState(printEmail || '');
  const [localPrintWebsite, setLocalPrintWebsite] = useState(printWebsite || '');
  const [localShowPrintHeader, setLocalShowPrintHeader] = useState(showPrintHeader ?? true);
  const [localShowPrintPhone, setLocalShowPrintPhone] = useState(showPrintPhone ?? true);
  const [localShowPrintEmail, setLocalShowPrintEmail] = useState(showPrintEmail ?? true);
  const [localShowPrintWebsite, setLocalShowPrintWebsite] = useState(showPrintWebsite ?? true);
  const [localShowPrintFooter, setLocalShowPrintFooter] = useState(showPrintFooter ?? true);
  const [localPrintSignature1, setLocalPrintSignature1] = useState(printSignature1 || '');
  const [localPrintSignature2, setLocalPrintSignature2] = useState(printSignature2 || '');
  const [localPrintSignature3, setLocalPrintSignature3] = useState(printSignature3 || '');
  const [localShowSignature1, setLocalShowSignature1] = useState(showSignature1 ?? true);
  const [localShowSignature2, setLocalShowSignature2] = useState(showSignature2 ?? true);
  const [localShowSignature3, setLocalShowSignature3] = useState(showSignature3 ?? true);
  const [localSignatureAlignment, setLocalSignatureAlignment] = useState(signatureAlignment || 'spread');
  const [localShowDeveloperContact, setLocalShowDeveloperContact] = useState(showDeveloperContact ?? true);
  const [localFinancialYearStart, setLocalFinancialYearStart] = useState(financialYearStart || '');
  const [localDateFormat, setLocalDateFormat] = useState(dateFormat || 'DD-MM-YYYY');
  const [localBaseCurrencySymbol, setLocalBaseCurrencySymbol] = useState(baseCurrencySymbol || '৳');
  const [localTimezone, setLocalTimezone] = useState(timezone || 'UTC+06:00 (Dhaka)');
  const [localRefNoFormat, setLocalRefNoFormat] = useState(refNoFormat || 'SAL/{YEAR}/{NO}');
  const [localShowFreeQty, setLocalShowFreeQty] = useState(showFreeQty ?? true);
  const [localShowDiscPercent, setLocalShowDiscPercent] = useState(showDiscPercent ?? true);
  const [localShowTaxPercent, setLocalShowTaxPercent] = useState(showTaxPercent ?? true);
  const [localShowCurrency, setLocalShowCurrency] = useState(showCurrency ?? true);
  const [localShowExRate, setLocalShowExRate] = useState(showExRate ?? true);
  const [localShowRunningBalance, setLocalShowRunningBalance] = useState(showRunningBalance ?? true);
  const [localShowMobileNav, setLocalShowMobileNav] = useState(showMobileNav ?? false);
  const [localMobileBottomNavItems, setLocalMobileBottomNavItems] = useState<string[]>(mobileBottomNavItems || []);
  const [localReportLayout, setLocalReportLayout] = useState(reportLayout || 'Layout 2');
  const [localDashboardDesign, setLocalDashboardDesign] = useState(dashboardDesign || 'Design 1');
  const [localUIStyle, setLocalUIStyle] = useState(uiStyle || 'UI/UX 1');
  const [localGlassBackground, setLocalGlassBackground] = useState(glassBackground || 'default');
  const [localNotificationAnimationStyle, setLocalNotificationAnimationStyle] = useState(notificationAnimationStyle || 'default');
  const [localSidebarDefaultExpanded, setLocalSidebarDefaultExpanded] = useState(sidebarDefaultExpanded ?? true);
  const [localShowScrollingBar, setLocalShowScrollingBar] = useState(showScrollingBar ?? false);
  const [localShowGoToShortcut, setLocalShowGoToShortcut] = useState(showGoToShortcut ?? true);
  const [localShowQuickActions, setLocalShowQuickActions] = useState(showQuickActions ?? true);
  const [localDashboardQuickActions, setLocalDashboardQuickActions] = useState<string[]>(dashboardQuickActions || ['voucher', 'item', 'ledger', 'godown', 'users']);
  const [localDashboardCards, setLocalDashboardCards] = useState<string[]>(dashboardCards || ['revenue', 'profit', 'ledgers', 'stock']);
  const [localEnglishFont, setLocalEnglishFont] = useState(englishFont || 'Inter');
  const [localBanglaFont, setLocalBanglaFont] = useState(banglaFont || 'Hind Siliguri');

  // Apply fonts immediately for preview
  React.useEffect(() => {
    const font = language === 'en' ? localEnglishFont : localBanglaFont;
    document.documentElement.style.setProperty('--app-font', `"${font}", sans-serif`);
  }, [language, localEnglishFont, localBanglaFont]);

  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [localWhatsappTemplates, setLocalWhatsappTemplates] = useState(whatsappTemplates);

  const [dynamicMenu, setDynamicMenu] = React.useState<MenuConfig | null>(null);

  React.useEffect(() => {
    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
      if (config) {
        setDynamicMenu(config);
      }
    });
    return () => unsubscribe();
  }, []);

  const menuGroups = React.useMemo(() => {
    if (!dynamicMenu) {
      return NAV_ITEMS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          icon: item.icon // Static items already have the component
        }))
      }));
    }
    return dynamicMenu.groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        icon: LucideIcons[item.icon as keyof typeof LucideIcons] || LucideIcons.Package
      }))
    }));
  }, [dynamicMenu]);

  // Sync local state when settings change (e.g. after registration or initial load)
  React.useEffect(() => {
    setLocalCompanyName(companyName || '');
    setLocalCompanyLogo(companyLogo || '');
    setLocalCompanyAddress(companyAddress || '');
    setLocalSlogan(slogan || '');
    setLocalPrintHeader(printHeader || '');
    setLocalPrintFooter(printFooter || '');
    setLocalPrintPhone(printPhone || '');
    setLocalPrintEmail(printEmail || '');
    setLocalPrintWebsite(printWebsite || '');
    setLocalShowPrintHeader(showPrintHeader ?? true);
    setLocalShowPrintPhone(showPrintPhone ?? true);
    setLocalShowPrintEmail(showPrintEmail ?? true);
    setLocalShowPrintWebsite(showPrintWebsite ?? true);
    setLocalShowPrintFooter(showPrintFooter ?? true);
    setLocalPrintSignature1(printSignature1 || '');
    setLocalPrintSignature2(printSignature2 || '');
    setLocalPrintSignature3(printSignature3 || '');
    setLocalShowSignature1(showSignature1 ?? true);
    setLocalShowSignature2(showSignature2 ?? true);
    setLocalShowSignature3(showSignature3 ?? true);
    setLocalSignatureAlignment(signatureAlignment || 'spread');
    setLocalShowDeveloperContact(showDeveloperContact ?? true);
    setLocalFinancialYearStart(financialYearStart || '');
    setLocalDateFormat(dateFormat || 'DD-MM-YYYY');
    setLocalBaseCurrencySymbol(baseCurrencySymbol || '৳');
    setLocalTimezone(timezone || 'UTC+06:00 (Dhaka)');
    setLocalRefNoFormat(refNoFormat || 'SAL/{YEAR}/{NO}');
    setLocalShowFreeQty(showFreeQty ?? true);
    setLocalShowDiscPercent(showDiscPercent ?? true);
    setLocalShowTaxPercent(showTaxPercent ?? true);
    setLocalShowCurrency(showCurrency ?? true);
    setLocalShowExRate(showExRate ?? true);
    setLocalShowRunningBalance(showRunningBalance ?? true);
    setLocalShowMobileNav(showMobileNav ?? false);
    setLocalMobileBottomNavItems(mobileBottomNavItems || []);
    setLocalReportLayout(reportLayout || 'Layout 2');
    setLocalDashboardDesign(dashboardDesign || 'Design 1');
    setLocalUIStyle(uiStyle || 'UI/UX 1');
    setLocalGlassBackground(glassBackground || 'default');
    setLocalNotificationAnimationStyle(notificationAnimationStyle || 'default');
    setLocalSidebarDefaultExpanded(sidebarDefaultExpanded ?? true);
    setLocalShowScrollingBar(showScrollingBar ?? false);
    setLocalShowGoToShortcut(showGoToShortcut ?? true);
    setLocalShowQuickActions(showQuickActions ?? true);
    setLocalDashboardQuickActions(dashboardQuickActions || ['voucher', 'item', 'ledger', 'godown', 'users']);
    setLocalDashboardCards(dashboardCards || ['revenue', 'profit', 'ledgers', 'stock']);
    setLocalEnglishFont(englishFont || 'Inter');
    setLocalBanglaFont(banglaFont || 'Hind Siliguri');
    setLocalMenuBarStyle(menuBarStyle || 'classic');
    setLocalLayoutWidth(layoutWidth || 'constrained');
    setLocalNotifications(notifications);
    setLocalWhatsappTemplates(whatsappTemplates);
  }, [
    companyName, companyAddress, slogan, printHeader, printFooter, printPhone, 
    printEmail, printWebsite, showPrintHeader, showPrintPhone, showPrintEmail, 
    showPrintWebsite, showPrintFooter, printSignature1, printSignature2, 
    printSignature3, showSignature1, showSignature2, showSignature3, 
    signatureAlignment, showDeveloperContact, financialYearStart, 
    baseCurrencySymbol, timezone, refNoFormat, showFreeQty, showDiscPercent, 
    showTaxPercent, showRunningBalance, showMobileNav, mobileBottomNavItems, reportLayout, dashboardDesign, uiStyle, menuBarStyle, layoutWidth, sidebarDefaultExpanded, notifications, whatsappTemplates
  ]);

  const handleSaveGeneral = () => {
    updateSettings({ 
      companyName: localCompanyName, 
      companyLogo: localCompanyLogo,
      companyAddress: localCompanyAddress,
      slogan: localSlogan,
      printPhone: localPrintPhone,
      printEmail: localPrintEmail,
      printWebsite: localPrintWebsite,
      showRunningBalance: localShowRunningBalance,
      showMobileNav: localShowMobileNav,
      mobileBottomNavItems: localMobileBottomNavItems,
      reportLayout: localReportLayout,
      financialYearStart: localFinancialYearStart,
      dateFormat: localDateFormat,
      baseCurrencySymbol: localBaseCurrencySymbol,
      timezone: localTimezone
    });
    showNotification(notifications.settingsUpdated);
  };

  const handleSaveUI = () => {
    updateUserSettings({
      showQuickActions: localShowQuickActions,
      dashboardQuickActions: localDashboardQuickActions,
      dashboardCards: localDashboardCards,
      menuBarStyle: localMenuBarStyle,
      uiStyle: localUIStyle,
      glassBackground: localGlassBackground,
      dashboardDesign: localDashboardDesign,
      englishFont: localEnglishFont,
      banglaFont: localBanglaFont,
      layoutWidth: localLayoutWidth,
      sidebarDefaultExpanded: localSidebarDefaultExpanded,
      showScrollingBar: localShowScrollingBar,
      notificationAnimationStyle: localNotificationAnimationStyle
    });
    showNotification('UI Customization saved successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for Base64
        showNotification('Logo size should be less than 1MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePrint = () => {
    updateSettings({ 
      printHeader: localPrintHeader, 
      printFooter: localPrintFooter,
      printPhone: localPrintPhone,
      printEmail: localPrintEmail,
      printWebsite: localPrintWebsite,
      showPrintHeader: localShowPrintHeader,
      showPrintPhone: localShowPrintPhone,
      showPrintEmail: localShowPrintEmail,
      showPrintWebsite: localShowPrintWebsite,
      showPrintFooter: localShowPrintFooter,
      printSignature1: localPrintSignature1,
      printSignature2: localPrintSignature2,
      printSignature3: localPrintSignature3,
      showSignature1: localShowSignature1,
      showSignature2: localShowSignature2,
      showSignature3: localShowSignature3,
      signatureAlignment: localSignatureAlignment as any,
      showDeveloperContact: localShowDeveloperContact
    });
    showNotification(notifications.settingsUpdated);
  };

  const handleSaveVoucher = () => {
    updateSettings({ 
      refNoFormat: localRefNoFormat,
      showFreeQty: localShowFreeQty,
      showDiscPercent: localShowDiscPercent,
      showTaxPercent: localShowTaxPercent,
      showCurrency: localShowCurrency,
      showExRate: localShowExRate
    });
    showNotification(notifications.settingsUpdated);
  };

  const handleSaveNotifications = () => {
    updateSettings({ notifications: localNotifications });
    showNotification(notifications.settingsUpdated);
  };

  const handleSaveWhatsApp = () => {
    updateSettings({ whatsappTemplates: localWhatsappTemplates });
    showNotification(notifications.settingsUpdated);
  };

  const toggleFeature = (id: string) => {
    const updatedFeatures = features.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    updateSettings({ features: updatedFeatures });
    showNotification(notifications.settingsUpdated);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await erpService.adminResetPassword(user.uid, user.email);
      showNotification('Password reset email sent to ' + user.email);
    } catch (error) {
      console.error('Error sending reset email:', error);
      showNotification('Failed to send reset email.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) return;
    setIsDeleting(true);
    try {
      await erpService.deleteUserAccount(user.uid);
      await logout();
      navigate('/login');
      showNotification('Account and all associated data deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorMessage = error.message?.includes('re-authenticate') 
        ? error.message 
        : 'Failed to delete account. You may need to re-login to perform this sensitive action.';
      showNotification(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'company', label: t('settings.companyInfo'), icon: Building2 },
    { id: 'ui', label: t('settings.uiCustomization'), icon: SettingsIcon },
    { id: 'reports', label: t('settings.reportSettings'), icon: ClipboardList },
    { id: 'voucher', label: t('settings.voucherSettings'), icon: Database },
    { id: 'print', label: t('settings.printSettings'), icon: Printer },
    { id: 'features', label: t('settings.f11Features'), icon: Database },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'whatsapp', label: t('settings.whatsappTemplates'), icon: MessageSquare },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'shortcuts', label: t('settings.shortcuts'), icon: Keyboard },
    { id: 'backup', label: t('settings.backupExport'), icon: Download },
    { id: 'integrations', label: t('settings.integrations'), icon: Globe },
  ];

  const shortcuts = [
    { key: 'Alt + G', action: 'Go To Search' },
    { key: 'Alt + C', action: 'Create Master' },
    { key: 'Alt + A', action: 'Alter Master' },
    { key: 'F1', action: 'Help' },
    { key: 'F2', action: 'Change Date' },
    { key: 'F3', action: 'Select Company' },
    { key: 'F4', action: 'Contra Voucher' },
    { key: 'F5', action: 'Payment Voucher' },
    { key: 'F6', action: 'Receipt Voucher' },
    { key: 'F7', action: 'Journal Voucher' },
    { key: 'F8', action: 'Sales Voucher' },
    { key: 'F9', action: 'Purchase Voucher' },
    { key: 'Ctrl + P', action: 'Print' },
    { key: 'Ctrl + E', action: 'Export' },
  ];

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="border-b border-border pb-4 flex items-baseline gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">{t('settings.systemSettings')}</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('settings.configureEnvironment')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Tabs */}
          <div className="w-full lg:w-64 flex lg:flex-col overflow-x-auto no-scrollbar lg:overflow-visible gap-1 pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 text-[11px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-foreground text-background font-bold' 
                    : 'text-gray-500 hover:bg-foreground/10 hover:text-foreground border border-transparent lg:border-none'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 bg-card border border-border p-4 lg:p-8">
            {activeTab === 'voucher' && (
              <div className="space-y-8">
                <div className="space-y-4">
                   <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">{t('settings.voucherConfiguration')}</h3>
                    <button 
                      onClick={handleSaveVoucher}
                      className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                    >
                      <Save className="w-3 h-3" /> {t('settings.save')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('settings.fieldVisibility')}</h4>
                      
                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">{t('settings.showFreeQty')}</h4>
                          <p className="text-[10px] text-gray-500">{t('settings.showFreeQtyDesc')}</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowFreeQty(!localShowFreeQty)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowFreeQty ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowFreeQty ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Show Discount %</h4>
                          <p className="text-[10px] text-gray-500">Enable/Disable Discount % column in vouchers.</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowDiscPercent(!localShowDiscPercent)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowDiscPercent ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowDiscPercent ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Show Tax %</h4>
                          <p className="text-[10px] text-gray-500">Enable/Disable Tax % column in vouchers.</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowTaxPercent(!localShowTaxPercent)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowTaxPercent ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowTaxPercent ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Show Currency</h4>
                          <p className="text-[10px] text-gray-500">Enable/Disable Currency selection in vouchers.</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowCurrency(!localShowCurrency)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowCurrency ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowCurrency ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Show Exchange Rate</h4>
                          <p className="text-[10px] text-gray-500">Enable/Disable Exchange Rate field in vouchers.</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowExRate(!localShowExRate)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowExRate ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowExRate ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">{t('settings.companyInfo')}</h3>
                    <button 
                      onClick={handleSaveGeneral}
                      className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                    >
                      <Save className="w-3 h-3" /> {t('settings.save')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase">{t('settings.companyName')}</label>
                        <input 
                          type="text" 
                          value={localCompanyName || ''} 
                          onChange={(e) => setLocalCompanyName(e.target.value)}
                          className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                        />
                      </div>
                      <div className="space-y-4 p-4 bg-foreground/5 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('settings.companyLogo')}</label>
                          {localCompanyLogo && (
                            <button 
                              onClick={() => setLocalCompanyLogo('')}
                              className="text-[9px] text-rose-500 uppercase font-bold hover:underline"
                            >
                              {t('settings.removeLogo')}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="relative group">
                            <div className="w-24 h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-background overflow-hidden transition-all group-hover:border-primary">
                              {localCompanyLogo ? (
                                <img src={localCompanyLogo} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Building2 className="w-8 h-8 text-muted-foreground opacity-20" />
                                  <span className="text-[8px] text-gray-400 uppercase font-bold">No Logo</span>
                                </div>
                              )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                              <Upload className="w-6 h-6 text-white" />
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                          </div>
                          <div className="flex-1 space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest">Upload Brand Identity</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed">
                              Your logo will be displayed in the sidebar, reports, and mobile navigation. 
                              <br />
                              <span className="text-primary font-bold">Recommended:</span> Square PNG/SVG, max 1MB.
                            </p>
                            <button 
                              onClick={() => document.getElementById('logo-upload')?.click()}
                              className="px-4 py-2 bg-foreground/5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/10 transition-all"
                            >
                              Select File
                            </button>
                            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            
                            <div className="pt-2 space-y-1">
                              <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Or Logo URL</label>
                              <input 
                                type="text"
                                value={localCompanyLogo.startsWith('data:') ? '' : localCompanyLogo}
                                onChange={(e) => setLocalCompanyLogo(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full bg-background border border-border text-foreground p-2 text-[10px] outline-none focus:border-foreground"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase">{t('settings.companySlogan')}</label>
                      <input 
                        type="text" 
                        value={localSlogan || ''} 
                        onChange={(e) => setLocalSlogan(e.target.value)}
                        placeholder="e.g. Enterprise ERP Solution"
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase">{t('settings.companyAddress')}</label>
                      <textarea 
                        value={localCompanyAddress || ''} 
                        onChange={(e) => setLocalCompanyAddress(e.target.value)}
                        rows={2}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground resize-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">{t('common.phone')}</label>
                      <input 
                        type="text" 
                        value={localPrintPhone || ''} 
                        onChange={(e) => setLocalPrintPhone(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">{t('common.email')}</label>
                      <input 
                        type="email" 
                        value={localPrintEmail || ''} 
                        onChange={(e) => setLocalPrintEmail(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">{t('common.website')}</label>
                      <input 
                        type="text" 
                        value={localPrintWebsite || ''} 
                        onChange={(e) => setLocalPrintWebsite(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">{t('settings.financialYearStart')}</label>
                      <input 
                        type="date" 
                        value={localFinancialYearStart} 
                        onChange={(e) => setLocalFinancialYearStart(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">System Date Format</label>
                      <select 
                        value={localDateFormat}
                        onChange={(e) => setLocalDateFormat(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 20-04-2026)</option>
                        <option value="MM-DD-YYYY">MM-DD-YYYY (e.g. 04-20-2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-04-20)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 20/04/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 04/20/2026)</option>
                        <option value="DD.MM.YYYY">DD.MM.YYYY (e.g. 20.04.2026)</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase italic">All date fields in the app will follow this format.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">{t('settings.reportSettings')}</h3>
                    <button 
                      onClick={handleSaveGeneral}
                      className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                    >
                      <Save className="w-3 h-3" /> {t('settings.save')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">{t('settings.reportLayoutStyle')}</label>
                      <select 
                        value={localReportLayout}
                        onChange={(e) => setLocalReportLayout(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="Layout 1">Layout 1 (Standard)</option>
                        <option value="Layout 2">Layout 2 (Tally Style - Default)</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('common.reportLayoutDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'ui' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">{t('settings.uiCustomization')}</h3>
                    <button 
                      onClick={handleSaveUI}
                      className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                    >
                      <Save className="w-3 h-3" /> {t('settings.save')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        {t('settings.language')}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLanguage('en')}
                          className={cn(
                            "flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded border transition-all",
                            language === 'en' ? "bg-foreground text-background border-foreground" : "bg-background text-gray-500 border-border hover:border-gray-400"
                          )}
                        >
                          English
                        </button>
                        <button
                          onClick={() => setLanguage('bn')}
                          className={cn(
                            "flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded border transition-all",
                            language === 'bn' ? "bg-foreground text-background border-foreground" : "bg-background text-gray-500 border-border hover:border-gray-400"
                          )}
                        >
                          বাংলা
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase">{t('settings.selectLanguage')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('common.englishFont')}</label>
                      <select 
                        value={localEnglishFont}
                        onChange={(e) => setLocalEnglishFont(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="Inter">Inter (Modern)</option>
                        <option value="Roboto">Roboto (Clean)</option>
                        <option value="Open Sans">Open Sans (Friendly)</option>
                        <option value="Montserrat">Montserrat (Geometric)</option>
                        <option value="Lato">Lato (Professional)</option>
                        <option value="system-ui">System Default</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('common.selectFont')} (English)</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('common.banglaFont')}</label>
                      <select 
                        value={localBanglaFont}
                        onChange={(e) => setLocalBanglaFont(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="Hind Siliguri">Hind Siliguri (Standard)</option>
                        <option value="Noto Sans Bengali">Noto Sans Bengali (Universal)</option>
                        <option value="Tiro Bangla">Tiro Bangla (Elegant)</option>
                        <option value="Mina">Mina (Modern)</option>
                        <option value="Anek Bangla">Anek Bangla (Stylish)</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('common.selectFont')} (Bangla)</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('settings.menuBarStyle')}</label>
                      <select 
                        value={localMenuBarStyle}
                        onChange={(e) => setLocalMenuBarStyle(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="classic">{t('settings.classicSidebar')}</option>
                        <option value="ribbon">{t('settings.ribbonStyle')}</option>
                        <option value="macos">{t('settings.macosStyle')}</option>
                        <option value="windows11">{t('settings.windows11Style')}</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('settings.menuBarStyleDesc')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('settings.layoutWidth')}</label>
                      <select 
                        value={localLayoutWidth}
                        onChange={(e) => setLocalLayoutWidth(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="responsive">{t('settings.fullResponsive')}</option>
                        <option value="constrained">{t('settings.constrainedWidth')}</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('settings.layoutWidthDesc')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('settings.uiStyle')}</label>
                      <select 
                        value={localUIStyle}
                        onChange={(e) => setLocalUIStyle(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="UI/UX 1">{t('settings.uiStyleClassic')}</option>
                        <option value="UI/UX 2">{t('settings.uiStyleModern')}</option>
                        <option value="UI/UX 3">{t('settings.uiStyleGlass')}</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('settings.uiStyleDesc')}</p>
                    </div>

                    {localUIStyle === 'UI/UX 1' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <label className="text-[10px] text-gray-500 uppercase">Color Theme</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {(['light', 'dark', 'emerald', 'amber', 'rose', 'slate', 'classic'] as Theme[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className={cn(
                                "flex flex-col items-center gap-1 p-2 border transition-all",
                                theme === t ? "border-primary bg-primary/5" : "border-border bg-background hover:border-gray-400"
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-sm",
                                t === 'light' ? "bg-white border border-gray-200" : 
                                t === 'dark' ? "bg-zinc-900" : 
                                t === 'emerald' ? "bg-emerald-500" : 
                                t === 'amber' ? "bg-amber-500" : 
                                t === 'rose' ? "bg-rose-500" : 
                                t === 'slate' ? "bg-slate-500" : 
                                "bg-zinc-800"
                              )} />
                              <span className="text-[8px] font-bold uppercase truncate w-full text-center">{t}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-500 uppercase">Choose a color theme for the Classic UI style.</p>
                      </div>
                    )}

                    {localUIStyle === 'UI/UX 3' && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <label className="text-[10px] text-gray-500 uppercase">Glass Gradient Background</label>
                        <select 
                          value={localGlassBackground}
                          onChange={(e) => setLocalGlassBackground(e.target.value as any)}
                          className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                        >
                          <option value="default">Default (Dynamic Gradient)</option>
                          <option value="sunset">Sunset Glow (Warm)</option>
                          <option value="ocean">Deep Ocean (Cool)</option>
                          <option value="aurora">Aurora Borealis (Green/Purple)</option>
                          <option value="minimal">Minimal Soft Gray</option>
                        </select>
                        <p className="text-[9px] text-gray-500 uppercase">Choose the background gradient for Glassmorphism style.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('settings.dashboardDesign')}</label>
                      <select 
                        value={localDashboardDesign}
                        onChange={(e) => setLocalDashboardDesign(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="Design 1">{t('settings.dashboardDesignClassic')}</option>
                        <option value="Design 2">{t('settings.dashboardDesignModern')}</option>
                      </select>
                      <p className="text-[9px] text-gray-500 uppercase">{t('settings.dashboardDesignDesc')}</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">{t('settings.showRunningBalance')}</h4>
                          <p className="text-[10px] text-gray-500">{t('settings.showRunningBalanceDesc')}</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowRunningBalance(!localShowRunningBalance)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowRunningBalance ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowRunningBalance ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Show Quick Actions Bar</h4>
                          <p className="text-[10px] text-gray-500">Enable/Disable the Quick Actions row on the Dashboard.</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowQuickActions(!localShowQuickActions)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowQuickActions ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowQuickActions ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      {localShowQuickActions && (
                        <div className="p-4 bg-foreground/5 border-x border-b border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            Select Dashboard Quick Actions
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'voucher', label: t('dash.voucher') },
                              { id: 'item', label: t('dash.item') },
                              { id: 'ledger', label: t('dash.ledger') },
                              { id: 'godown', label: t('dash.godown') },
                              { id: 'users', label: t('dash.users') },
                            ].map(action => (
                              <button
                                key={action.id}
                                onClick={() => {
                                  if (localDashboardQuickActions.includes(action.id)) {
                                    setLocalDashboardQuickActions(prev => prev.filter(a => a !== action.id));
                                  } else {
                                    setLocalDashboardQuickActions(prev => [...prev, action.id]);
                                  }
                                }}
                                className={cn(
                                  "px-3 py-2 text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center justify-between",
                                  localDashboardQuickActions.includes(action.id)
                                    ? "bg-foreground text-background border-foreground shadow-sm"
                                    : "bg-background text-gray-500 border-border hover:border-gray-400"
                                )}
                              >
                                <span>{action.label}</span>
                                {localDashboardQuickActions.includes(action.id) && <CheckCircle2 className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="p-4 bg-foreground/5 border border-border space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <LayoutDashboard className="w-3 h-3 text-blue-500" />
                            Dashboard Metric Cards (Max 5)
                          </h4>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                            {localDashboardCards.length}/5 Selected
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 italic mb-2">Select up to 5 metrics to display in a single row on your dashboard.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'sales', label: t('dash.sales') || 'Sales' },
                            { id: 'purchase', label: t('dash.purchase') || 'Purchase' },
                            { id: 'payment', label: t('dash.payment') || 'Payment' },
                            { id: 'receipt', label: t('dash.receipt') || 'Receipt' },
                            { id: 'revenue', label: t('dash.revenue') || 'Total Revenue' },
                            { id: 'profit', label: t('dash.profit') || 'Net Profit' },
                            { id: 'ledgers', label: t('dash.activeLedgers') || 'Active Ledgers' },
                            { id: 'stock', label: t('dash.stockValue') || 'Stock Value' },
                          ].map(card => (
                            <button
                              key={card.id}
                              disabled={!localDashboardCards.includes(card.id) && localDashboardCards.length >= 5}
                              onClick={() => {
                                if (localDashboardCards.includes(card.id)) {
                                  setLocalDashboardCards(prev => prev.filter(c => c !== card.id));
                                } else {
                                  if (localDashboardCards.length < 5) {
                                    setLocalDashboardCards(prev => [...prev, card.id]);
                                  }
                                }
                              }}
                              className={cn(
                                "px-3 py-2 text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center justify-between",
                                localDashboardCards.includes(card.id)
                                  ? "bg-foreground text-background border-foreground shadow-sm"
                                  : "bg-background text-gray-500 border-border hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                              )}
                            >
                              <span>{card.label}</span>
                              {localDashboardCards.includes(card.id) && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">{t('settings.showMobileNav')}</h4>
                          <p className="text-[10px] text-gray-500">{t('settings.showMobileNavDesc')}</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowMobileNav(!localShowMobileNav)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowMobileNav ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowMobileNav ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      {localShowMobileNav && (
                        <div className="p-4 bg-foreground/5 border-x border-b border-border space-y-3">
                          <h5 className="text-[10px] font-bold text-foreground uppercase">Bottom Navigation Items (Mobile)</h5>
                          <p className="text-[9px] text-gray-500 uppercase mb-2">Select up to 4 items to show in the bottom bar.</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                            {/* Permanent Dashboard Item */}
                            <div className="flex items-center gap-2 p-2 border bg-emerald-500/10 border-emerald-500/50 text-emerald-500 opacity-80 cursor-not-allowed">
                              <LayoutDashboard className="w-3 h-3" />
                              <span className="text-[10px] font-bold truncate">Dashboard</span>
                              <span className="text-[8px] uppercase font-bold ml-auto">(Default)</span>
                            </div>

                            {menuGroups.map(group => (
                              <React.Fragment key={group.group}>
                                {group.items.map(item => {
                                  if (item.label === 'Dashboard') return null;
                                  return (
                                    <label 
                                      key={item.id}
                                      className={cn(
                                        "flex items-center gap-2 p-2 border cursor-pointer transition-all",
                                        localMobileBottomNavItems.includes(item.label)
                                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                          : "bg-background border-border text-gray-500 hover:border-gray-400"
                                      )}
                                    >
                                      <input 
                                        type="checkbox"
                                        className="hidden"
                                        checked={localMobileBottomNavItems.includes(item.label)}
                                        onChange={() => {
                                          if (localMobileBottomNavItems.includes(item.label)) {
                                            setLocalMobileBottomNavItems(localMobileBottomNavItems.filter(i => i !== item.label));
                                          } else {
                                            if (localMobileBottomNavItems.length < 4) {
                                              setLocalMobileBottomNavItems([...localMobileBottomNavItems, item.label]);
                                            } else {
                                              showNotification('You can only select up to 4 items.', 'info');
                                            }
                                          }
                                        }}
                                      />
                                      <item.icon className="w-3 h-3" />
                                      <span className="text-[10px] font-medium truncate">{item.label}</span>
                                    </label>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Show Scrolling Bar</h4>
                          <p className="text-[10px] text-gray-500">Enable modern scrollbars on all data tables.</p>
                        </div>
                        <button 
                          onClick={() => setLocalShowScrollingBar(!localShowScrollingBar)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localShowScrollingBar ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localShowScrollingBar ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase">Sidebar Default Expanded</h4>
                          <p className="text-[10px] text-gray-500">Enable to have all sidebar menus expanded by default.</p>
                        </div>
                        <button 
                          onClick={() => setLocalSidebarDefaultExpanded(!localSidebarDefaultExpanded)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            localSidebarDefaultExpanded ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                            localSidebarDefaultExpanded ? "right-1" : "left-1"
                          )} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground uppercase px-1">Notification Border Animation</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                              "flex flex-col items-start p-3 border transition-all text-left gap-1",
                              localNotificationAnimationStyle === style.id
                                ? "border-emerald-500 bg-emerald-500/5"
                                : "border-border bg-background hover:border-gray-400"
                            )}
                          >
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              localNotificationAnimationStyle === style.id ? "text-emerald-500" : "text-foreground"
                            )}>
                              {style.label}
                            </span>
                            <span className="text-[9px] text-gray-500 leading-tight">
                              {style.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Regional Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">Base Currency Symbol</label>
                      <select 
                        value={localBaseCurrencySymbol}
                        onChange={(e) => setLocalBaseCurrencySymbol(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="৳">BDT (৳)</option>
                        <option value="$">Dollar ($)</option>
                        <option value="₹">Indian Rupee (₹)</option>
                        <option value="€">Euro (€)</option>
                        <option value="£">Pound (£)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase">Timezone</label>
                      <select 
                        value={localTimezone}
                        onChange={(e) => setLocalTimezone(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                      >
                        <option value="UTC+06:00 (Dhaka)">UTC+06:00 (Dhaka)</option>
                        <option value="UTC+05:30 (Kolkata)">UTC+05:30 (Kolkata)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'print' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">Print Customization</h3>
                    <button 
                      onClick={handleSavePrint}
                      className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                    >
                      <Save className="w-3 h-3" /> Save Changes
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Default Print Header</label>
                        <button 
                          onClick={() => setLocalShowPrintHeader(!localShowPrintHeader)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowPrintHeader ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowPrintHeader ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowPrintHeader}
                        value={localPrintHeader || ''} 
                        onChange={(e) => setLocalPrintHeader(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowPrintHeader && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Contact Phone</label>
                        <button 
                          onClick={() => setLocalShowPrintPhone(!localShowPrintPhone)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowPrintPhone ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowPrintPhone ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowPrintPhone}
                        value={localPrintPhone || ''} 
                        onChange={(e) => setLocalPrintPhone(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowPrintPhone && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Contact Email</label>
                        <button 
                          onClick={() => setLocalShowPrintEmail(!localShowPrintEmail)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowPrintEmail ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowPrintEmail ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowPrintEmail}
                        value={localPrintEmail || ''} 
                        onChange={(e) => setLocalPrintEmail(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowPrintEmail && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Website URL</label>
                        <button 
                          onClick={() => setLocalShowPrintWebsite(!localShowPrintWebsite)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowPrintWebsite ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowPrintWebsite ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowPrintWebsite}
                        value={localPrintWebsite || ''} 
                        onChange={(e) => setLocalPrintWebsite(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowPrintWebsite && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Default Print Footer</label>
                        <button 
                          onClick={() => setLocalShowPrintFooter(!localShowPrintFooter)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowPrintFooter ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowPrintFooter ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <textarea 
                        disabled={!localShowPrintFooter}
                        value={localPrintFooter || ''} 
                        onChange={(e) => setLocalPrintFooter(e.target.value)}
                        rows={2}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground resize-none",
                          !localShowPrintFooter && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">Signature Labels</h3>
                    <div className="flex items-center gap-4">
                      <label className="text-[10px] text-gray-500 uppercase">Alignment:</label>
                      <select 
                        value={localSignatureAlignment}
                        onChange={(e) => setLocalSignatureAlignment(e.target.value as any)}
                        className="bg-background border border-border text-foreground px-2 py-1 text-[10px] outline-none focus:border-foreground"
                      >
                        <option value="spread">Spread Out</option>
                        <option value="left">All Left</option>
                        <option value="center">All Center</option>
                        <option value="right">All Right</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Signature 1</label>
                        <button 
                          onClick={() => setLocalShowSignature1(!localShowSignature1)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowSignature1 ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowSignature1 ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowSignature1}
                        value={localPrintSignature1 || ''} 
                        onChange={(e) => setLocalPrintSignature1(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowSignature1 && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Signature 2</label>
                        <button 
                          onClick={() => setLocalShowSignature2(!localShowSignature2)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowSignature2 ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowSignature2 ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowSignature2}
                        value={localPrintSignature2 || ''} 
                        onChange={(e) => setLocalPrintSignature2(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowSignature2 && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-gray-500 uppercase">Signature 3</label>
                        <button 
                          onClick={() => setLocalShowSignature3(!localShowSignature3)}
                          className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            localShowSignature3 ? "bg-emerald-500" : "bg-gray-600"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                            localShowSignature3 ? "right-0.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        disabled={!localShowSignature3}
                        value={localPrintSignature3 || ''} 
                        onChange={(e) => setLocalPrintSignature3(e.target.value)}
                        className={cn(
                          "w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground",
                          !localShowSignature3 && "opacity-50 cursor-not-allowed"
                        )} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Additional Options</h3>
                  <div className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase">Show Developer Contact</h4>
                      <p className="text-[10px] text-gray-500">Display software provider contact info at the bottom right of prints.</p>
                    </div>
                    <button 
                      onClick={() => setLocalShowDeveloperContact(!localShowDeveloperContact)}
                      className={cn(
                        "w-10 h-5 rounded-full transition-colors relative",
                        localShowDeveloperContact ? "bg-emerald-500" : "bg-gray-600"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                        localShowDeveloperContact ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-foreground/5 border border-border space-y-4">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Print Preview (Mock)</h4>
                  <div className="bg-white p-8 shadow-sm border border-gray-200 text-gray-800 font-serif max-w-md mx-auto">
                    <div className="text-center border-b border-gray-300 pb-4 mb-4">
                      <h2 className="text-xl font-bold uppercase">{localCompanyName}</h2>
                      <p className="text-[10px] whitespace-pre-line">{localCompanyAddress}</p>
                      <p className="text-[9px] text-gray-600">
                        {localShowPrintPhone && localPrintPhone && `Phone: ${localPrintPhone}`} 
                        {localShowPrintEmail && localPrintEmail && ` • Email: ${localPrintEmail}`}
                        {localShowPrintWebsite && localPrintWebsite && ` • Web: ${localPrintWebsite}`}
                      </p>
                      {localShowPrintHeader && <div className="mt-2 text-[10px] italic text-gray-500 border-t border-gray-100 pt-1">{localPrintHeader}</div>}
                    </div>
                    <div className="h-20 border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-300 uppercase tracking-widest">
                      Voucher Content Area
                    </div>
                    <div className={cn(
                      "mt-8 flex text-[8px] uppercase font-bold",
                      localSignatureAlignment === 'spread' ? 'justify-between' : 
                      localSignatureAlignment === 'left' ? 'justify-start gap-8' :
                      localSignatureAlignment === 'center' ? 'justify-center gap-8' :
                      'justify-end gap-8'
                    )}>
                      {localShowSignature1 && <div className="border-t border-gray-400 pt-1 w-20 text-center">{localPrintSignature1}</div>}
                      {localShowSignature2 && <div className="border-t border-gray-400 pt-1 w-20 text-center">{localPrintSignature2}</div>}
                      {localShowSignature3 && <div className="border-t border-gray-400 pt-1 w-20 text-center">{localPrintSignature3}</div>}
                    </div>
                    <div className="mt-4 pt-2 border-t border-gray-200 text-center text-[8px] text-gray-500 relative">
                      {localShowPrintFooter && localPrintFooter}
                      {localShowDeveloperContact && (
                        <div className="absolute right-0 bottom-0 text-[6px] text-gray-400 text-right opacity-50">
                          Software by TallyFlow<br/>
                          +880 1234 567890
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Accounting & Inventory Features</h3>
                <div className="space-y-4">
                  {features.map((f) => (
                    <div key={f.id} className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-gray-400">{f.label}</span>
                      <div 
                        onClick={() => toggleFeature(f.id)}
                        className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${f.enabled ? 'bg-emerald-500' : 'bg-border'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${f.enabled ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-6">
                <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-foreground/5 border border-border">
                      <span className="text-xs text-gray-400 uppercase tracking-widest">{s.action}</span>
                      <kbd className="px-2 py-1 bg-background border border-border rounded text-[10px] font-bold text-foreground min-w-[60px] text-center">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 flex gap-4">
                  <Keyboard className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <p className="text-[10px] text-blue-500 uppercase tracking-widest leading-relaxed">
                    Shortcuts are global and can be used from any screen to quickly navigate or perform actions.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Data Backup & Recovery</h3>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 flex gap-4">
                    <Cloud className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-500 uppercase">Auto Backup Enabled</h4>
                      <p className="text-[10px] text-emerald-500/80 uppercase tracking-widest mt-1">
                        Your data is automatically backed up to the cloud every 24 hours.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        showNotification('Generating full system backup...');
                        setTimeout(() => showNotification('Backup downloaded successfully.'), 2000);
                      }}
                      className="p-6 border border-border bg-foreground/5 hover:bg-foreground/10 transition-all text-left space-y-2 group"
                    >
                      <Download className="w-6 h-6 text-gray-500 group-hover:text-foreground transition-colors" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">Manual Backup</h4>
                      <p className="text-[10px] text-gray-500 uppercase">Download all company data as a secure JSON/Excel file.</p>
                    </button>
                    <button className="p-6 border border-border bg-foreground/5 hover:bg-foreground/10 transition-all text-left space-y-2 group">
                      <Database className="w-6 h-6 text-gray-500 group-hover:text-foreground transition-colors" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">Restore Data</h4>
                      <p className="text-[10px] text-gray-500 uppercase">Upload a previous backup file to restore your system state.</p>
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Export History</h3>
                  <div className="border border-border overflow-hidden">
                    <table className="w-full text-left text-[10px] uppercase tracking-widest">
                      <thead className="bg-foreground/5 border-b border-border">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Type</th>
                          <th className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="px-4 py-2 text-gray-500">2024-03-14 10:00</td>
                          <td className="px-4 py-2">Full Backup</td>
                          <td className="px-4 py-2 text-emerald-500 font-bold">Success</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 text-gray-500">2024-03-13 10:00</td>
                          <td className="px-4 py-2">Auto Backup</td>
                          <td className="px-4 py-2 text-emerald-500 font-bold">Success</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Communication Channels</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-border bg-foreground/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase">WhatsApp Integration</h4>
                          <p className="text-[10px] text-gray-500 uppercase">Send invoices and reports directly to customers.</p>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
                        Configure
                      </button>
                    </div>
                    <div className="p-4 border border-border bg-foreground/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase">Email (SMTP)</h4>
                          <p className="text-[10px] text-gray-500 uppercase">Automated email reports and transaction alerts.</p>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Third-Party Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border bg-foreground/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase">Google Drive</span>
                        <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">Connected</span>
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase">Cloud storage for backups and documents.</p>
                    </div>
                    <div className="p-4 border border-border bg-foreground/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase">SMS Gateway</span>
                        <span className="text-[8px] bg-gray-600 text-white px-1.5 py-0.5 rounded">Disconnected</span>
                      </div>
                      <p className="text-[9px] text-gray-500 uppercase">Send transaction alerts via SMS.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Subscription Plan</h2>
                  <p className="text-xs text-muted-foreground">Manage your company subscription and limits.</p>
                </div>
                <Link 
                  to="/pricing" 
                  className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-all"
                >
                  Upgrade Plan
                </Link>
              </div>

              {activePlan ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            activePlan.tier === 1 ? "bg-slate-100 text-slate-600" :
                            activePlan.tier === 2 ? "bg-slate-200 text-slate-700" :
                            activePlan.tier === 3 ? "bg-amber-100 text-amber-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{activePlan.name}</h3>
                            <p className="text-xs text-muted-foreground">{activePlan.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Active</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Vouchers</p>
                          <p className="text-lg font-bold text-foreground">{activePlan.limits.vouchers === -1 ? 'Unlimited' : activePlan.limits.vouchers}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Users</p>
                          <p className="text-lg font-bold text-foreground">{activePlan.limits.users === -1 ? 'Unlimited' : activePlan.limits.users}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Items</p>
                          <p className="text-lg font-bold text-foreground">{activePlan.limits.items === -1 ? 'Unlimited' : activePlan.limits.items}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Godowns</p>
                          <p className="text-lg font-bold text-foreground">{activePlan.limits.godowns === -1 ? 'Unlimited' : activePlan.limits.godowns}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Features & Access</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activePlan.features.map(fId => (
                          <div key={fId} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="capitalize">{fId.replace('_', ' ')}</span>
                          </div>
                        ))}
                        {activePlan.limits.multiCurrency && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Multi-Currency Support</span>
                          </div>
                        )}
                        {activePlan.limits.rolePermissions && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Advanced Role Permissions</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Support & Services</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Support Type</span>
                          <span className="font-bold text-foreground">{activePlan.supportType || 'Email'} ({activePlan.supportHours || '24/7'})</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Setup Fee</span>
                          <span className="font-bold text-foreground">{activePlan.setupFee && activePlan.setupFee > 0 ? `৳${activePlan.setupFee}` : 'Free'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Training</span>
                          <span className={cn("font-bold", activePlan.trainingIncluded ? "text-emerald-500" : "text-muted-foreground")}>
                            {activePlan.trainingIncluded ? 'Included' : 'Not Included'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Custom Domain</span>
                          <span className={cn("font-bold", activePlan.customDomain ? "text-emerald-500" : "text-muted-foreground")}>
                            {activePlan.customDomain ? 'Supported' : 'Not Supported'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Custom Reports</span>
                          <span className={cn("font-bold", activePlan.customReports ? "text-emerald-500" : "text-muted-foreground")}>
                            {activePlan.customReports ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">API Access</span>
                          <span className={cn("font-bold", activePlan.apiAccess ? "text-emerald-500" : "text-muted-foreground")}>
                            {activePlan.apiAccess ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-600 rounded-2xl p-6 text-white space-y-4 shadow-lg shadow-blue-600/20">
                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-80">Need more?</h4>
                      <p className="text-sm leading-relaxed">Upgrade to a higher tier to unlock more vouchers, users, and advanced features.</p>
                      <Link 
                        to="/pricing" 
                        className="block w-full py-3 bg-white text-blue-600 text-center rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors"
                      >
                        View All Plans
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">No Active Subscription</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">It seems you don't have an active subscription plan assigned. Please contact support or choose a plan to get started.</p>
                  </div>
                  <Link 
                    to="/pricing" 
                    className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Choose a Plan
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Security Settings</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 flex gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] text-amber-500 uppercase tracking-widest leading-relaxed">
                      Two-factor authentication is highly recommended for administrative accounts.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-gray-400">Enable TallyVault Password</span>
                      <div className="w-10 h-5 rounded-full bg-border relative cursor-pointer">
                        <div className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-xs text-gray-400">Use Security Control</span>
                      <div className="w-10 h-5 rounded-full bg-emerald-500 relative cursor-pointer">
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-border space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Account Actions</h4>
                      <p className="text-[10px] text-gray-500">Manage your account and data.</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleChangePassword}
                        className="px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                      >
                        Change Admin Password
                      </button>
                      
                      {!showDeleteConfirm ? (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-6 py-2 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> Delete Account & All Data
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded w-full max-w-md">
                          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                            CRITICAL: Are you sure? This will permanently delete your profile and ALL companies you created. This action CANNOT be undone.
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleDeleteAccount}
                              disabled={isDeleting}
                              className="px-4 py-1.5 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                            </button>
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              disabled={isDeleting}
                              className="px-4 py-1.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">WhatsApp Message Templates</h3>
                  <button 
                    onClick={handleSaveWhatsApp}
                    className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                  >
                    <Save className="w-3 h-3" /> Save Templates
                  </button>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 flex gap-4 mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Available Shortcodes:</p>
                    <p className="text-[9px] text-amber-500/80 uppercase tracking-widest leading-relaxed">
                      {"{{companyName}}, {{voucherNo}}, {{date}}, {{currency}}, {{totalAmount}}, {{narration}}, {{vType}}"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(localWhatsappTemplates).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase font-bold">{key} Voucher Template</label>
                      <textarea 
                        value={value} 
                        onChange={(e) => setLocalWhatsappTemplates({
                          ...localWhatsappTemplates,
                          [key]: e.target.value
                        })}
                        rows={4}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground font-sans" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest">Popup Notification Messages</h3>
                  <button 
                    onClick={handleSaveNotifications}
                    className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                  >
                    <Save className="w-3 h-3" /> Save Messages
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase">Voucher Saved Message</label>
                    <input 
                      type="text" 
                      value={localNotifications.voucherSaved || ''} 
                      onChange={(e) => setLocalNotifications({...localNotifications, voucherSaved: e.target.value})}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase">Ledger Created Message</label>
                    <input 
                      type="text" 
                      value={localNotifications.ledgerCreated || ''} 
                      onChange={(e) => setLocalNotifications({...localNotifications, ledgerCreated: e.target.value})}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase">Stock Item Created Message</label>
                    <input 
                      type="text" 
                      value={localNotifications.itemCreated || ''} 
                      onChange={(e) => setLocalNotifications({...localNotifications, itemCreated: e.target.value})}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase">Settings Updated Message</label>
                    <input 
                      type="text" 
                      value={localNotifications.settingsUpdated || ''} 
                      onChange={(e) => setLocalNotifications({...localNotifications, settingsUpdated: e.target.value})}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground" 
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-foreground text-sm font-bold uppercase tracking-widest border-b border-border pb-2">System Alerts</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Email Alerts for Large Transactions', enabled: true },
                      { label: 'Daily Summary Report', enabled: false },
                      { label: 'Inventory Reorder Level Alerts', enabled: true },
                      { label: 'System Update Notifications', enabled: true },
                    ].map((n, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-xs text-gray-400">{n.label}</span>
                        <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${n.enabled ? 'bg-emerald-500' : 'bg-border'}`}>
                          <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${n.enabled ? 'right-1' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
