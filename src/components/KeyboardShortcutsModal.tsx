import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Keyboard, X, Search, Sparkles, ArrowRight, CornerDownLeft, 
  ExternalLink, Layers, FileText, ShoppingCart, DollarSign, 
  Settings, CheckCircle2, Bookmark, Lightbulb, Compass,
  Sliders, Printer, Download, RefreshCw, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export interface ShortcutItem {
  id: string;
  keys: string[];
  action: string;
  bnAction: string;
  category: 'navigation' | 'vouchers' | 'search' | 'reports' | 'system';
  scope: string;
  bnScope: string;
  description: string;
  bnDescription: string;
  path?: string;
  popular?: boolean;
}

export const SHORTCUTS_DATA: ShortcutItem[] = [
  // 1. Navigation & Go-To Shortcuts
  {
    id: 'nav-dashboard',
    keys: ['Alt', 'D'],
    action: 'Open Dashboard',
    bnAction: 'ড্যাশবোর্ডে দ্রুত প্রবেশ',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Instantly navigates back to the main Executive Dashboard from any section of the ERP.',
    bnDescription: 'সিস্টেমের যেকোনো পেজ থেকে এক ক্লিকে প্রধান এক্সিকিউটিভ ড্যাশবোর্ডে ফিরে যান।',
    path: '/dashboard',
    popular: true
  },
  {
    id: 'nav-voucher-new',
    keys: ['Alt', 'V'],
    action: 'Create New Voucher',
    bnAction: 'নতুন ভাউচার এন্ট্রি স্ক্রিন',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Launches the primary financial transaction voucher creator to record Sales, Purchase, Payment, etc.',
    bnDescription: 'সেলস, পারচেজ, পেমেন্ট বা রিসিট যেকোনো নতুন হিসাব এন্ট্রি করতে সরাসরি ভাউচার স্ক্রিন খুলুন।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'nav-ledger-new',
    keys: ['Alt', 'L'],
    action: 'Create New Ledger',
    bnAction: 'নতুন লেজার অ্যাকাউন্ট তৈরি',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Opens the Chart of Accounts ledger creation form to add customers, vendors, banks, or expenses.',
    bnDescription: 'নতুন কাস্টমার, সাপ্লায়ার, ব্যাংক বা খরচের হিসাব খুলতে সরাসরি লেজার ফর্মে চলে যান।',
    path: '/accounts/ledgers/new',
    popular: true
  },
  {
    id: 'nav-inventory-items',
    keys: ['Alt', 'I'],
    action: 'Inventory Items & Stock',
    bnAction: 'স্টক আইটেমস ও ইনভেন্টরি তালিকা',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Takes you to the product inventory master catalog and current stock levels.',
    bnDescription: 'সমস্ত পণ্যের তালিকা, রেট এবং গোডাউনের বর্তমান স্টক দেখতে ইনভেন্টরি পেজে যান।',
    path: '/inventory/items',
    popular: true
  },
  {
    id: 'nav-bi-hub',
    keys: ['Alt', 'B'],
    action: 'Business Intelligence Hub',
    bnAction: 'বিজনেস ইন্টেলিজেন্স ও রেশিও হাব',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Jump straight to enterprise analytics, 6-month trends, financial ratios, and trading metrics.',
    bnDescription: 'ট্রেডিং একাউন্ট, আর্থিক রেশিও ও ৬ মাসের গ্রাফ দেখতে সরাসরি বিআই অ্যানালিটিক্স হাবে যান।',
    path: '/business-intelligence',
    popular: true
  },
  {
    id: 'nav-daybook',
    keys: ['Alt', 'R'],
    action: 'Daybook Reports',
    bnAction: 'ডেবুক ও দৈনিক লেনদেন বিবরণী',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Open real-time chronological daily transaction journal of all postings.',
    bnDescription: 'আজকের বা নির্বাচিত তারিখের সমস্ত জমা-খরচের দৈনিক ডেবুক রিপোর্ট ওপেন করুন।',
    path: '/reports/daybook'
  },
  {
    id: 'nav-settings',
    keys: ['Alt', 'S'],
    action: 'Company & System Settings',
    bnAction: 'কোম্পানি প্রোফাইল ও সেটিংস',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Access company profile, logo, invoice print headers, themes, and sound settings.',
    bnDescription: 'কোম্পানির নাম, ঠিকানা, চালান প্রিন্ট হেডার এবং সিস্টেম সেটিংস কনফিগার করতে যান।',
    path: '/settings'
  },
  {
    id: 'nav-notes',
    keys: ['Alt', 'N'],
    action: 'Notes & Fast Memos',
    bnAction: 'নোটস ও দ্রুত মেমো প্যাড',
    category: 'navigation',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Open quick internal office scratchpad for reminders and audit memos.',
    bnDescription: 'গুরুত্বপূর্ণ কাজের তালিকা ও অভ্যন্তরীণ স্মারকলিপি লেখার দ্রুত নোটস পেজে যান।',
    path: '/notes'
  },

  // 2. Search & Command Palettes
  {
    id: 'search-goto',
    keys: ['Alt', 'G'],
    action: 'Launch "Go To" Search Palette',
    bnAction: 'গ্লোবাল "Go To" নেভিগেশন প্যালেট',
    category: 'search',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Tally-style quick navigation popup to jump to any ledger, report, or voucher without mouse.',
    bnDescription: 'ট্যালি সফটওয়্যারের মতো দ্রুত যেকোনো মেনু বা রিপোর্টে জাম্প করার জন্য পপআপ প্যালেট খুলুন।',
    popular: true
  },
  {
    id: 'search-global',
    keys: ['Ctrl / ⌘', 'K'],
    action: 'Universal Search & Filter',
    bnAction: 'ইউনিভার্সাল গ্লোবাল সার্চ',
    category: 'search',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Search across all customer accounts, supplier balances, voucher numbers, and stock items.',
    bnDescription: 'সিস্টেমের যেকোনো কাস্টমার, ভেন্ডর, ভাউচার নম্বর বা পণ্য তাৎক্ষণিকভাবে অনুসন্ধান করুন।',
    popular: true
  },
  {
    id: 'search-slash',
    keys: ['/'],
    action: 'Focus Search Box',
    bnAction: 'দ্রুত সার্চবারে কার্সর ফোকাস',
    category: 'search',
    scope: 'Global (When not typing)',
    bnScope: 'ইনপুট ছাড়া যেকোনো জায়গায়',
    description: 'Instantly moves keyboard focus to the search input bar without lifting hands to the mouse.',
    bnDescription: 'মাউস না ছুঁয়ে কীবোর্ডের স্ল্যাশ (/) প্রেস করলেই সার্চবারে টাইপ করার জন্য কার্সর চলে যাবে।'
  },
  {
    id: 'search-navigate',
    keys: ['↑', '↓'],
    action: 'Navigate Suggestions & Rows',
    bnAction: 'তালিকায় উপরে ও নিচে নির্বাচন',
    category: 'search',
    scope: 'Search & Grids',
    bnScope: 'সার্চ ও ড্রপডাউন তালিকায়',
    description: 'Use Up and Down arrow keys to scroll through auto-complete suggestions and search results.',
    bnDescription: 'অ্যারো কী ব্যবহার করে ড্রপডাউন বা সার্চ ফলাফলের যেকোনো আইটেম নির্বাচন করুন।'
  },
  {
    id: 'search-select',
    keys: ['Enter'],
    action: 'Confirm / Open Selection',
    bnAction: 'নির্বাচিত আইটেম নিশ্চিত ও ওপেন',
    category: 'search',
    scope: 'Search & Table Rows',
    bnScope: 'সার্চ ও টেবিল সারিতে',
    description: 'Confirms selected search suggestion or opens the detail of the highlighted table record.',
    bnDescription: 'সিলেক্ট করা রেকর্ডটি সাথে সাথে ওপেন করতে এন্টার চাপুন।'
  },

  // 3. Voucher Entry & Function Keys (F4-F10)
  {
    id: 'vouch-f4',
    keys: ['F4'],
    action: 'Contra Voucher (Bank/Cash)',
    bnAction: 'কন্ট্রা ভাউচার (ব্যাংক ↔ ক্যাশ)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Contra Voucher for bank-to-bank deposits, withdrawals, or cash drawer transfers.',
    bnDescription: 'ব্যাংক থেকে নগদ উত্তোলন, ব্যাংকে জমা অথবা পেটি ক্যাশ ট্রান্সফারের জন্য কন্ট্রা ভাউচার মোডে যান।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'vouch-f5',
    keys: ['F5'],
    action: 'Payment Voucher (Expenses/Vendor)',
    bnAction: 'পেমেন্ট ভাউচার (নগদ বা ব্যাংক পরিশোধ)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Payment Voucher to record supplier payouts, office expenses, or salaries.',
    bnDescription: 'সাপ্লায়ারের বকেয়া পরিশোধ, অফিস খরচ বা বেতন দেওয়ার জন্য পেমেন্ট ভাউচার মোডে রূপান্তর করুন।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'vouch-f6',
    keys: ['F6'],
    action: 'Receipt Voucher (Customer/Income)',
    bnAction: 'রিসিট ভাউচার (টাকা গ্রহণ বা জমা)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Receipt Voucher to collect customer payments or log direct incomes.',
    bnDescription: 'কাস্টমারদের থেকে বকেয়া টাকা আদায় বা যেকোনো ক্যাশ/ব্যাংক জমার জন্য রিসিট ভাউচারে যান।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'vouch-f7',
    keys: ['F7'],
    action: 'Journal Voucher (Adjustments)',
    bnAction: 'জার্নাল ভাউচার (সমন্বয় ও ট্রান্সফার)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Journal Voucher for non-cash double-entry adjustments, depreciation, or year-end closures.',
    bnDescription: 'নন-ক্যাশ হিসাব সমন্বয়, অবচয় বা ডেবিট-ক্রেডিট হিসাব মেলানোর জন্য জার্নাল ভাউচার নির্বাচন করুন।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'vouch-f8',
    keys: ['F8'],
    action: 'Sales Voucher / Invoice',
    bnAction: 'সেলস ভাউচার (বিক্রয় চালান ও বিল)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Sales Invoice mode to bill items, apply taxes/discounts, and deduct stock automatically.',
    bnDescription: 'কাস্টমারকে পণ্য বিক্রয়, চালান তৈরি এবং স্টক থেকে স্বয়ংক্রিয়ভাবে পণ্য কমাতে সেলস ভাউচার খুলুন।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'vouch-f9',
    keys: ['F9'],
    action: 'Purchase Voucher / Bill',
    bnAction: 'পারচেজ ভাউচার (পণ্য ও কাঁচামাল ক্রয়)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Purchase Bill mode to record vendor bills, update cost averages, and increment stock.',
    bnDescription: 'ভেন্ডর বা মহাজনের কাছ থেকে মালামাল ক্রয় এবং গোডাউনে স্টক বাড়ানোর জন্য পারচেজ ভাউচার নির্বাচন করুন।',
    path: '/vouchers/new',
    popular: true
  },
  {
    id: 'vouch-f10',
    keys: ['F10'],
    action: 'Physical Stock Reconciliation',
    bnAction: 'ফিজিক্যাল স্টক (গোডাউন গণনা ও অডিট)',
    category: 'vouchers',
    scope: 'Voucher Entry Screen',
    bnScope: 'ভাউচার এন্ট্রি স্ক্রিনে',
    description: 'Switches to Physical Stock mode to adjust actual counted inventory quantities during godown audits.',
    bnDescription: 'গোডাউনের বাস্তব গণনাকৃত পণ্যের সাথে সফটওয়্যারের ব্যালেন্স মেলানোর জন্য ফিজিক্যাল স্টক মোডে যান।',
    path: '/vouchers/new'
  },
  {
    id: 'vouch-field-nav',
    keys: ['Tab', 'Enter'],
    action: 'Move to Next Input Field',
    bnAction: 'পরবর্তী ইনপুট ফিল্ডে গমন',
    category: 'vouchers',
    scope: 'Forms & Grids',
    bnScope: 'সকল ফর্ম ও ইনপুট টেবিলে',
    description: 'Seamlessly jumps cursor to the next input box, item dropdown, or amount line for lightning-speed entry.',
    bnDescription: 'মাউস ছাড়া বিদ্যুৎ গতিতে টাইপ করতে ট্যাব বা এন্টার চেপে পরবর্তী ফিল্ডে কার্সর নিয়ে যান।'
  },
  {
    id: 'vouch-field-back',
    keys: ['Shift', 'Tab'],
    action: 'Move to Previous Field',
    bnAction: 'পূর্ববর্তী ইনপুট ফিল্ডে ফিরে আসা',
    category: 'vouchers',
    scope: 'Forms & Grids',
    bnScope: 'সকল ফর্ম ও ইনপুট টেবিলে',
    description: 'Moves cursor back one field if you made a typo or need to adjust an earlier rate/amount.',
    bnDescription: 'ভুল সংশোধন করতে বা আগের কোনো ফিল্ডে ফিরে যেতে শিফট + ট্যাব চাপুন।'
  },

  // 4. Reports & Table Operations
  {
    id: 'rep-print',
    keys: ['Alt', 'P'],
    action: 'Print Current Report / Voucher',
    bnAction: 'বর্তমান পেজ বা রিপোর্ট প্রিন্ট',
    category: 'reports',
    scope: 'Reports & Vouchers',
    bnScope: 'রিপোর্ট ও ভাউচার স্ক্রিনে',
    description: 'Immediately triggers the clean print engine with single top-right page numbering and company header.',
    bnDescription: 'কোম্পানি হেডার ও নিখুঁত লেআউটে বর্তমান চালান, লেজার স্টেটমেন্ট বা ডেবুক প্রিন্ট করুন।'
  },
  {
    id: 'rep-pdf',
    keys: ['Alt', 'E'],
    action: 'Quick PDF / Export',
    bnAction: 'পিডিএফ ডাউনলোড ও এক্সপোর্ট',
    category: 'reports',
    scope: 'Reports & Modals',
    bnScope: 'রিপোর্ট ও বিস্তারিত পপআপে',
    description: 'Generates high-definition vector PDF documents ready for sharing via email or WhatsApp.',
    bnDescription: 'শেয়ার বা আর্কাইভ করার জন্য এক ক্লিকে স্পষ্ট ভেক্টর পিডিএফ ফাইল তৈরি করুন।'
  },
  {
    id: 'rep-date-filter',
    keys: ['Alt', 'F2'],
    action: 'Change Financial Date Period',
    bnAction: 'হিসাবকাল ও তারিখ পরিবর্তন',
    category: 'reports',
    scope: 'Reports & Analytics',
    bnScope: 'রিপোর্ট ও অ্যানালিটিক্স পেজে',
    description: 'Sets keyboard focus to From/To date filter inputs to analyze custom monthly or yearly periods.',
    bnDescription: 'নির্দিষ্ট তারিখ বা মাসের হিসাব দেখতে ডেট রেঞ্জ ফিল্টারে কার্সর ফোকাস করুন।'
  },

  // 5. System, Help & Windows
  {
    id: 'sys-shortcuts-help',
    keys: ['?'],
    action: 'Open Keyboard Shortcuts Cheatsheet',
    bnAction: 'কিবোর্ড শর্টকাট চিটশিট ওপেন',
    category: 'system',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Press Shift + / (or ?) anywhere outside text inputs to bring up this complete shortcut manual.',
    bnDescription: 'যেকোনো স্ক্রিনে প্রশ্নবোধক চিহ্ন (?) চাপলেই এই পূর্ণাঙ্গ শর্টকাট গাইড ও বিশ্লেষণ স্ক্রিনে চলে আসবে।',
    popular: true
  },
  {
    id: 'sys-shortcuts-alt',
    keys: ['Alt', 'H'],
    action: 'Alternative Shortcut Help Hotkey',
    bnAction: 'বিকল্প শর্টকাট গাইড কি',
    category: 'system',
    scope: 'Global (Anywhere)',
    bnScope: 'যেকোনো পেজ থেকে',
    description: 'Secondary keyboard shortcut combo to launch the interactive shortcuts assistant.',
    bnDescription: 'অল্ট + এইচ (Alt+H) প্রেস করলেও সরাসরি এই কিবোর্ড শর্টকাট মডালটি চালু হবে।'
  },
  {
    id: 'sys-escape',
    keys: ['Esc'],
    action: 'Close Active Popup / Dialog / Drawer',
    bnAction: 'সক্রিয় পপআপ বা মডাল বন্ধ',
    category: 'system',
    scope: 'Global (Any Modal/Menu)',
    bnScope: 'সকল পপআপ ও মেনুর জন্য',
    description: 'Instantly dismisses any open modal dialog, search box, or context menu without clicking.',
    bnDescription: 'যেকোনো খোলা পপআপ, সার্চ প্যালেট বা ড্রপডাউন সাথে সাথে বন্ধ করতে এস্কেপ (Esc) চাপুন।',
    popular: true
  },
  {
    id: 'sys-sidebar-toggle',
    keys: ['Alt', 'M'],
    action: 'Toggle Sidebar Collapse / Expand',
    bnAction: 'সাইডবার ছোট বা বড় টগল',
    category: 'system',
    scope: 'Global (Desktop)',
    bnScope: 'ডেস্কটপ স্ক্রিনে',
    description: 'Expands or collapses the left navigation panel to give more screen width to dense financial tables.',
    bnDescription: 'বড় টেবিল বা রিপোর্ট দেখার জন্য বামপাশের সাইডবারকে ছোট বা বড় করতে টগল করুন।'
  }
];

interface KeyboardShortcutsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function KeyboardShortcutsModal({ isOpen: controlledIsOpen, onClose }: KeyboardShortcutsModalProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'navigation' | 'vouchers' | 'search' | 'reports' | 'system'>('all');

  // Support controlled open state
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    }
  }, [controlledIsOpen]);

  // Support custom event listener across the app
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setSearchQuery('');
    };
    window.addEventListener('open_keyboard_shortcuts', handleOpen);
    return () => {
      window.removeEventListener('open_keyboard_shortcuts', handleOpen);
    };
  }, []);

  // Support physical ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleNavigate = (path?: string) => {
    if (!path) return;
    handleClose();
    navigate(path);
  };

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    let list = SHORTCUTS_DATA;
    if (activeCategory !== 'all') {
      list = list.filter(item => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.action.toLowerCase().includes(q) ||
        item.bnAction.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.bnDescription.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.bnScope.toLowerCase().includes(q) ||
        item.keys.some(k => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: isBn ? 'সকল শর্টকাট' : 'All Shortcuts', count: SHORTCUTS_DATA.length },
    { id: 'navigation', label: isBn ? 'নেভিগেশন (Alt+..)' : 'Navigation', count: SHORTCUTS_DATA.filter(s => s.category === 'navigation').length },
    { id: 'vouchers', label: isBn ? 'ভাউচার ও ফাংশন কি (F4-F10)' : 'Vouchers (F4-F10)', count: SHORTCUTS_DATA.filter(s => s.category === 'vouchers').length },
    { id: 'search', label: isBn ? 'সার্চ ও গো-টু' : 'Search & Go-To', count: SHORTCUTS_DATA.filter(s => s.category === 'search').length },
    { id: 'reports', label: isBn ? 'রিপোর্ট ও প্রিন্ট' : 'Reports & Print', count: SHORTCUTS_DATA.filter(s => s.category === 'reports').length },
    { id: 'system', label: isBn ? 'সিস্টেম ও উইন্ডো' : 'System & Window', count: SHORTCUTS_DATA.filter(s => s.category === 'system').length }
  ] as const;

  return createPortal(
    <AnimatePresence>
      <div 
        id="keyboard-shortcuts-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh] text-card-foreground"
        >
          {/* Top Banner Header */}
          <div className="relative p-5 sm:p-6 pb-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -top-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                    <Keyboard className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    {isBn ? "কিবোর্ড শর্টকাট ও পাওয়ার ইউজার চিটশিট" : "Keyboard Shortcuts & Power User Cheatsheet"}
                  </span>
                  
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-white text-indigo-950 shadow-xs">
                    TallyFlow ERP Hotkeys
                  </span>

                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/80 font-medium">
                    <Lightbulb className="w-3 h-3 text-amber-300" />
                    {isBn ? "মাউস ছাড়া ৫০% দ্রুত কাজ করুন" : "Work 50% faster without mouse"}
                  </span>
                </div>

                <h2 className="text-base sm:text-xl font-black tracking-tight text-white pt-1 leading-snug">
                  {isBn ? "ট্যালিফ্লো ইআরপি-র সকল কিবোর্ড শর্টকাট ও কার্যপদ্ধতি" : "All Available Keyboard Shortcuts & Functional Analysis"}
                </h2>
                <p className="text-xs text-white/90 leading-relaxed max-w-2xl">
                  {isBn 
                    ? "ভাউচার তৈরি, দ্রুত মেনু নেভিগেশন, সার্চ এবং রিপোর্ট দেখার জন্য কোন কিবোর্ড বাটন কোথায় কিভাবে কাজ করে তার বিস্তারিত নির্দেশিকা।" 
                    : "Comprehensive guide to navigating vouchers, rapid menu jumping, contextual searching, and instant print commands using keystrokes."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors border border-white/20 shrink-0 cursor-pointer"
                title={isBn ? 'বন্ধ করুন (Esc)' : 'Dismiss (Esc)'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Interactive Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? "শর্টকাট খুঁজুন (যেমন: Alt+V, F8, সেলস, প্রিন্ট, ড্যাশবোর্ড, লেজার)..." : "Filter shortcuts (e.g. Alt+V, F8, sales, print, dashboard, ledger)..."}
                className="w-full bg-black/30 hover:bg-black/40 focus:bg-black/50 border border-white/25 focus:border-white/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/60 outline-hidden backdrop-blur-md transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
                      isActive
                        ? "bg-white text-indigo-950 shadow-md font-extrabold"
                        : "bg-white/10 hover:bg-white/20 text-white/90 border border-white/10"
                    )}
                  >
                    <span>{cat.label}</span>
                    <span className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded-full",
                      isActive ? "bg-indigo-950/15 text-indigo-950 font-bold" : "bg-white/15 text-white"
                    )}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shortcuts Grid / List Body */}
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-3 custom-scrollbar bg-background">
            {filteredShortcuts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Keyboard className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  {isBn ? `"${searchQuery}" এর জন্য কোনো শর্টকাট পাওয়া যায়নি` : `No shortcuts found matching "${searchQuery}"`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isBn ? 'অন্য কোনো কী বা শব্দ লিখে অনুসন্ধান করুন।' : 'Try searching with another key name or category.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-2 text-xs font-bold text-primary hover:underline"
                >
                  {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset all filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredShortcuts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-border/75 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all flex flex-col justify-between space-y-2 group shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      {/* Top Badges & Keys */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Key badges */}
                        <div className="flex items-center gap-1.5">
                          {item.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              <kbd className="px-2.5 py-1 bg-muted/80 group-hover:bg-muted text-foreground border border-border/80 shadow-xs rounded-lg text-xs font-mono font-black tracking-wide">
                                {k}
                              </kbd>
                              {kIdx < item.keys.length - 1 && (
                                <span className="text-[11px] font-bold text-muted-foreground">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        {/* Scope / Location Badge */}
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/50">
                          {isBn ? item.bnScope : item.scope}
                        </span>
                      </div>

                      {/* Title & Action */}
                      <div className="pt-0.5">
                        <h4 className="text-xs sm:text-sm font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <span>{isBn ? item.bnAction : item.action}</span>
                          {item.popular && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded font-black uppercase">
                              Popular
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                          {isBn ? item.bnDescription : item.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action Footer if navigable */}
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {item.id}
                      </span>

                      {item.path ? (
                        <button
                          type="button"
                          onClick={() => handleNavigate(item.path)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors group-hover:translate-x-0.5 duration-200 cursor-pointer"
                        >
                          <span>{isBn ? 'সরাসরি যান' : 'Jump Now'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          {isBn ? 'কী চাপুন' : 'Press key to trigger'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pro Tip Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/30 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 text-xs text-foreground">
                <h5 className="font-extrabold text-amber-800 dark:text-amber-300">
                  {isBn ? "প্রো-টিপ (Pro Tip for Fast Accounting):" : "Pro-Tip for Maximum Speed:"}
                </h5>
                <p className="text-muted-foreground leading-relaxed">
                  {isBn 
                    ? "ভাউচার এন্ট্রি করার সময় যেকোনো মোড পরিবর্তন করতে (যেমন: ক্যাশ রিসিট হলে F6, সেলস চালান হলে F8, ভেন্ডর পেমেন্ট হলে F5) সরাসরি ফাংশন কি চাপুন। আর যেকোনো ফিল্ডে দ্রুত যেতে মাউসের বদলে শুধু Tab বা Enter ব্যবহার করুন।"
                    : "While on the Voucher Entry screen, toggle between invoice types instantly by hitting function keys (F4 for Contra, F5 for Payment, F6 for Receipt, F8 for Sales, F9 for Purchase). Use Tab / Enter to glide through amount and rate inputs without touching the mouse."}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 sm:p-4 bg-muted/60 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="w-4 h-4 text-primary shrink-0" />
              <span>
                {isBn 
                  ? "যে কোনো সময় '?' অথবা 'Alt + H' চেপে এই শর্টকাট চিটশিট খুলতে পারেন।" 
                  : "Tip: Press '?' or 'Alt + H' anywhere across TallyFlow to reopen this cheatsheet."}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate('/instructions');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors border border-border/70 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'সম্পূর্ণ নির্দেশিকা' : 'Full Manual'}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>{isBn ? 'ঠিক আছে, বুঝেছি' : 'Got it, Close'}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
