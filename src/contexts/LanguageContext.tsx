import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.signIn': 'Sign In',
    'nav.getStarted': 'Get Started',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.founderPanel': 'Founder Panel',

    // Home
    'home.heroTitle': 'Manage Your Business With Intelligence',
    'home.heroSubtitle': 'The all-in-one ERP solution for modern enterprises. Streamline operations, gain real-time insights, and scale your business with confidence.',
    'home.startTrial': 'Start Free Trial',
    'home.viewFeatures': 'View Features',
    'home.statsClients': 'Active Clients',
    'home.statsUptime': 'Uptime Rate',
    'home.statsSupport': 'Expert Support',
    'home.statsExperience': 'Years Experience',
    'home.featuresTitle': 'Everything You Need',
    'home.featuresSubtitle': 'Powerful tools to help you manage every aspect of your business from a single, unified platform.',
    'home.ctaTitle': 'Ready to Transform Your Business?',
    'home.ctaSubtitle': 'Join hundreds of successful companies already using our ERP system to power their growth.',
    'home.getStarted': 'Get Started Now',

    // Footer
    'footer.description': 'A comprehensive ERP solution designed to streamline your business operations, from inventory management to financial reporting.',
    'footer.product': 'Product',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',

    // Auth
    'auth.signInTitle': 'Sign in to ERP System',
    'auth.signInSubtitle': 'Enter your details below to access your account.',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.signInButton': 'Sign In',
    'auth.noAccount': "Don't have an account?",
    'auth.createAccount': 'Create one',
    'auth.registerTitle': 'Create your Account',
    'auth.registerSubtitle': 'Join us today and start managing your business smarter.',
    'auth.fullName': 'Full Name',
    'auth.confirmPassword': 'Confirm Password',
    'auth.registerButton': 'Create Account',
    'auth.haveAccount': 'Already have an account?',

    // Dashboard
    'dash.welcome': 'Welcome back',
    'dash.overview': 'Dashboard Overview',
    'dash.financialSummary': 'Financial Summary',
    'dash.kpi': 'Key Performance Indicators',
    'dash.revenue': 'Total Revenue',
    'dash.profit': 'Net Profit',
    'dash.activeLedgers': 'Active Ledgers',
    'dash.stockValue': 'Stock Value',
    'dash.activeUsers': 'Active Users',
    'dash.newOrders': 'New Orders',
    'dash.pendingTasks': 'Pending Tasks',
    'dash.recentActivity': 'Recent Activity',
    'dash.recentTransactions': 'Recent Transactions',
    'dash.viewAll': 'View All',
    'dash.viewDaybook': 'View Daybook',
    'dash.quickActions': 'Quick Actions',
    'dash.voucher': 'Voucher',
    'dash.item': 'Item',
    'dash.ledger': 'Ledger',
    'dash.godown': 'Godown',
    'dash.users': 'Users',

    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile Settings',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select Language',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.save': 'Save Changes',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.save': 'Save',
    'common.refresh': 'Refresh',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.actions': 'Actions',
    'common.date': 'Date',
    'common.amount': 'Amount',
    'common.status': 'Status',
    'common.type': 'Type',
    'common.particulars': 'Particulars',
    'common.voucherNo': 'Voucher No.'
  },
  bn: {
    // Navbar
    'nav.home': 'হোম',
    'nav.features': 'বৈশিষ্ট্য',
    'nav.about': 'আমাদের সম্পর্কে',
    'nav.contact': 'যোগাযোগ',
    'nav.signIn': 'লগইন',
    'nav.getStarted': 'শুরু করুন',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.logout': 'লগআউট',
    'nav.settings': 'সেটিংস',
    'nav.profile': 'প্রোফাইল',
    'nav.founderPanel': 'ফাউন্ডার প্যানেল',

    // Home
    'home.heroTitle': 'বুদ্ধিমত্তার সাথে আপনার ব্যবসা পরিচালনা করুন',
    'home.heroSubtitle': 'আধুনিক এন্টারপ্রাইজের জন্য অল-ইন-ওয়ান ইআরপি সমাধান। অপারেশন সহজ করুন, রিয়েল-টাইম ইনসাইট পান এবং আত্মবিশ্বাসের সাথে আপনার ব্যবসা বৃদ্ধি করুন।',
    'home.startTrial': 'ফ্রি ট্রায়াল শুরু করুন',
    'home.viewFeatures': 'বৈশিষ্ট্য দেখুন',
    'home.statsClients': 'সক্রিয় ক্লায়েন্ট',
    'home.statsUptime': 'আপটাইম রেট',
    'home.statsSupport': 'বিশেষজ্ঞ সাপোর্ট',
    'home.statsExperience': 'বছরের অভিজ্ঞতা',
    'home.featuresTitle': 'আপনার যা কিছু প্রয়োজন',
    'home.featuresSubtitle': 'একটি একক প্ল্যাটফর্ম থেকে আপনার ব্যবসার প্রতিটি দিক পরিচালনা করতে সাহায্য করার জন্য শক্তিশালী টুলস।',
    'home.ctaTitle': 'আপনার ব্যবসা পরিবর্তন করতে প্রস্তুত?',
    'home.ctaSubtitle': 'শত শত সফল কোম্পানির সাথে যোগ দিন যারা ইতিমধ্যে তাদের ব্যবসার প্রবৃদ্ধির জন্য আমাদের ইআরপি সিস্টেম ব্যবহার করছে।',
    'home.getStarted': 'এখনই শুরু করুন',

    // Footer
    'footer.description': 'একটি ব্যাপক ইআরপি সমাধান যা আপনার ব্যবসার কার্যক্রমকে সহজতর করার জন্য ডিজাইন করা হয়েছে, ইনভেন্টরি ম্যানেজমেন্ট থেকে শুরু করে আর্থিক রিপোর্টিং পর্যন্ত।',
    'footer.product': 'পণ্য',
    'footer.legal': 'আইনি',
    'footer.privacy': 'গোপনীয়তা নীতি',
    'footer.terms': 'পরিষেবার শর্তাবলী',

    // Auth
    'auth.signInTitle': 'ইআরপি সিস্টেমে সাইন ইন করুন',
    'auth.signInSubtitle': 'আপনার অ্যাকাউন্টে প্রবেশ করতে নিচে আপনার বিবরণ দিন।',
    'auth.email': 'ইমেইল ঠিকানা',
    'auth.password': 'পাসওয়ার্ড',
    'auth.forgotPassword': 'পাসওয়ার্ড ভুলে গেছেন?',
    'auth.signInButton': 'সাইন ইন',
    'auth.noAccount': "অ্যাকাউন্ট নেই?",
    'auth.createAccount': 'একটি তৈরি করুন',
    'auth.registerTitle': 'আপনার অ্যাকাউন্ট তৈরি করুন',
    'auth.registerSubtitle': 'আজই আমাদের সাথে যোগ দিন এবং স্মার্টলি আপনার ব্যবসা পরিচালনা শুরু করুন।',
    'auth.fullName': 'পুরো নাম',
    'auth.confirmPassword': 'পাসওয়ার্ড নিশ্চিত করুন',
    'auth.registerButton': 'অ্যাকাউন্ট তৈরি করুন',
    'auth.haveAccount': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',

    // Dashboard
    'dash.welcome': 'স্বাগতম',
    'dash.overview': 'ড্যাশবোর্ড ওভারভিউ',
    'dash.financialSummary': 'আর্থিক সারাংশ',
    'dash.kpi': 'মূল কর্মক্ষমতা সূচক',
    'dash.revenue': 'মোট আয়',
    'dash.profit': 'নিট মুনাফা',
    'dash.activeLedgers': 'সক্রিয় লেজার',
    'dash.stockValue': 'স্টক ভ্যালু',
    'dash.activeUsers': 'সক্রিয় ব্যবহারকারী',
    'dash.newOrders': 'নতুন অর্ডার',
    'dash.pendingTasks': 'পেন্ডিং কাজ',
    'dash.recentActivity': 'সাম্প্রতিক কার্যক্রম',
    'dash.recentTransactions': 'সাম্প্রতিক লেনদেন',
    'dash.viewAll': 'সব দেখুন',
    'dash.viewDaybook': 'ডেবুক দেখুন',
    'dash.quickActions': 'দ্রুত অ্যাকশন',
    'dash.voucher': 'ভাউচার',
    'dash.item': 'আইটেম',
    'dash.ledger': 'লেজার',
    'dash.godown': 'গোডাউন',
    'dash.users': 'ব্যবহারকারী',

    // Settings
    'settings.title': 'সেটিংস',
    'settings.profile': 'প্রোফাইল সেটিংস',
    'settings.language': 'ভাষা',
    'settings.selectLanguage': 'ভাষা নির্বাচন করুন',
    'settings.notifications': 'নোটিফিকেশন',
    'settings.security': 'নিরাপত্তা',
    'settings.save': 'পরিবর্তন সংরক্ষণ করুন',

    // Common
    'common.loading': 'লোড হচ্ছে...',
    'common.error': 'একটি ত্রুটি ঘটেছে',
    'common.success': 'সফল হয়েছে',
    'common.cancel': 'বাতিল',
    'common.delete': 'মুছে ফেলুন',
    'common.edit': 'সম্পাদনা',
    'common.save': 'সংরক্ষণ',
    'common.refresh': 'রিফ্রেশ',
    'common.search': 'অনুসন্ধান',
    'common.filter': 'ফিল্টার',
    'common.actions': 'অ্যাকশন',
    'common.date': 'তারিখ',
    'common.amount': 'পরিমাণ',
    'common.status': 'অবস্থা',
    'common.type': 'ধরণ',
    'common.particulars': 'বিবরণ',
    'common.voucherNo': 'ভাউচার নং'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
