import {
  Activity,
  BookOpen,
  Building2,
  CreditCard,
  FileText,
  History,
  Layers,
  Lock,
  Mail,
  RotateCcw,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export type PublicNavGroupId = 'product' | 'resources' | 'company';

export interface PublicNavGroupMeta {
  id: PublicNavGroupId;
  titleKey: string;
  defaultTitleEn: string;
  defaultTitleBn: string;
}

export interface PublicNavItem {
  id: string;
  path: string;
  groupId?: PublicNavGroupId;
  labelKey: string;
  descKey: string;
  defaultLabelEn: string;
  defaultLabelBn: string;
  defaultDescEn: string;
  defaultDescBn: string;
  icon: LucideIcon;
}

export const DEFAULT_PUBLIC_NAV_GROUP: PublicNavGroupId = 'resources';

export const PUBLIC_NAV_GROUPS: PublicNavGroupMeta[] = [
  {
    id: 'product',
    titleKey: 'nav.group.product',
    defaultTitleEn: 'Product',
    defaultTitleBn: 'প্রোডাক্ট',
  },
  {
    id: 'resources',
    titleKey: 'nav.group.resources',
    defaultTitleEn: 'Resources',
    defaultTitleBn: 'রিসোর্স',
  },
  {
    id: 'company',
    titleKey: 'nav.group.company',
    defaultTitleEn: 'Company & Legal',
    defaultTitleBn: 'প্রতিষ্ঠান ও আইনি',
  },
];

export const PUBLIC_NAV_ITEMS: PublicNavItem[] = [
  {
    id: 'features',
    path: '/features',
    groupId: 'product',
    labelKey: 'nav.item.features',
    descKey: 'nav.item.featuresDesc',
    defaultLabelEn: 'Features',
    defaultLabelBn: 'ফিচারসমূহ',
    defaultDescEn: 'Double-entry vouchers, FIFO stock & 10 core reports',
    defaultDescBn: 'ডাবল-এন্ট্রি ভাউচার, FIFO স্টক ও ১০টি মূল রিপোর্ট',
    icon: Layers,
  },
  {
    id: 'pricing',
    path: '/pricing',
    groupId: 'product',
    labelKey: 'nav.item.pricing',
    descKey: 'nav.item.pricingDesc',
    defaultLabelEn: 'Pricing',
    defaultLabelBn: 'প্রাইসিং',
    defaultDescEn: 'Transparent tier limits from Bronze Free to Platinum',
    defaultDescBn: 'ব্রোঞ্জ ফ্রি থেকে প্ল্যাটিনাম পর্যন্ত স্বচ্ছ টিয়ার প্ল্যান',
    icon: CreditCard,
  },
  {
    id: 'docs',
    path: '/docs',
    groupId: 'resources',
    labelKey: 'nav.item.docs',
    descKey: 'nav.item.docsDesc',
    defaultLabelEn: 'Docs',
    defaultLabelBn: 'ডকুমেন্টস',
    defaultDescEn: 'Keyboard shortcuts, workflows & reference docs',
    defaultDescBn: 'কিবোর্ড শর্টকাট, কার্যপ্রণালী ও পূর্ণ ডকুমেন্টেশন',
    icon: FileText,
  },
  {
    id: 'guide',
    path: '/guide',
    groupId: 'resources',
    labelKey: 'nav.item.guide',
    descKey: 'nav.item.guideDesc',
    defaultLabelEn: 'User Guide & FAQ',
    defaultLabelBn: 'ইউজার গাইড ও FAQ',
    defaultDescEn: 'Onboarding steps, .xlsx export guide & answers',
    defaultDescBn: 'শুরু করার ধাপ, .xlsx এক্সপোর্ট ও সাধারণ প্রশ্নোত্তর',
    icon: BookOpen,
  },
  {
    id: 'release-notes',
    path: '/release-notes',
    groupId: 'resources',
    labelKey: 'nav.item.releaseNotes',
    descKey: 'nav.item.releaseNotesDesc',
    defaultLabelEn: 'Release Notes',
    defaultLabelBn: 'রিলিজ নোটস',
    defaultDescEn: 'Version archive, new modules & verified fixes',
    defaultDescBn: 'ভার্সন ইতিহাস, নতুন ফিচার ও বাগ সমাধানের রেকর্ড',
    icon: History,
  },
  {
    id: 'security',
    path: '/security',
    groupId: 'resources',
    labelKey: 'nav.item.security',
    descKey: 'nav.item.securityDesc',
    defaultLabelEn: 'Data Security',
    defaultLabelBn: 'ডেটা নিরাপত্তা',
    defaultDescEn: 'Company isolation, RBAC & audit trail safeguards',
    defaultDescBn: 'কোম্পানি আইসোলেশন, RBAC ও অডিট ট্রেইল সুরক্ষা',
    icon: ShieldCheck,
  },
  {
    id: 'status',
    path: '/status',
    groupId: 'resources',
    labelKey: 'nav.item.status',
    descKey: 'nav.item.statusDesc',
    defaultLabelEn: 'System Status',
    defaultLabelBn: 'সিস্টেম স্ট্যাটাস',
    defaultDescEn: 'Workspace service health & maintenance notices',
    defaultDescBn: 'সাবসিস্টেম সচলতা ও রক্ষণাবেক্ষণ সংক্রান্ত তথ্য',
    icon: Activity,
  },
  {
    id: 'about',
    path: '/about',
    groupId: 'company',
    labelKey: 'nav.item.about',
    descKey: 'nav.item.aboutDesc',
    defaultLabelEn: 'About',
    defaultLabelBn: 'আমাদের সম্পর্কে',
    defaultDescEn: 'Engineering principles & accounting architecture',
    defaultDescBn: 'প্রকৌশল নীতিমালা ও হিসাবরক্ষণ স্থাপত্য',
    icon: Building2,
  },
  {
    id: 'contact',
    path: '/contact',
    groupId: 'company',
    labelKey: 'nav.item.contact',
    descKey: 'nav.item.contactDesc',
    defaultLabelEn: 'Contact & Support',
    defaultLabelBn: 'যোগাযোগ ও সাপোর্ট',
    defaultDescEn: 'Direct support desk, hours & onboarding help',
    defaultDescBn: 'সরাসরি সাপোর্ট ডেস্ক, সময়সূচী ও অনবোর্ডিং সহায়তা',
    icon: Mail,
  },
  {
    id: 'privacy',
    path: '/privacy',
    groupId: 'company',
    labelKey: 'nav.item.privacy',
    descKey: 'nav.item.privacyDesc',
    defaultLabelEn: 'Privacy Policy',
    defaultLabelBn: 'গোপনীয়তা নীতি',
    defaultDescEn: 'Authentication profile & workspace data handling',
    defaultDescBn: 'অ্যাকাউন্ট প্রোফাইল ও প্রতিষ্ঠানের তথ্য সুরক্ষা নীতি',
    icon: Lock,
  },
  {
    id: 'terms',
    path: '/terms',
    groupId: 'company',
    labelKey: 'nav.item.terms',
    descKey: 'nav.item.termsDesc',
    defaultLabelEn: 'Terms of Service',
    defaultLabelBn: 'পরিষেবার শর্তাবলী',
    defaultDescEn: 'Platform license terms, roles & acceptable use',
    defaultDescBn: 'প্ল্যাটফর্ম ব্যবহারের শর্তাবলী, রোল ও লাইসেন্স নিয়ম',
    icon: Scale,
  },
  {
    id: 'refund',
    path: '/refund-policy',
    groupId: 'company',
    labelKey: 'nav.item.refund',
    descKey: 'nav.item.refundDesc',
    defaultLabelEn: 'Refund & Cancellation',
    defaultLabelBn: 'রিফান্ড ও বাতিলকরণ',
    defaultDescEn: 'Plan cancellation, refund windows & export rights',
    defaultDescBn: 'প্ল্যান বাতিল, রিফান্ড নীতি ও .xlsx এক্সপোর্ট অধিকার',
    icon: RotateCcw,
  },
];

export interface GroupedPublicNavSection extends PublicNavGroupMeta {
  items: PublicNavItem[];
}

export function getGroupedPublicNavigation(
  items: PublicNavItem[] = PUBLIC_NAV_ITEMS
): GroupedPublicNavSection[] {
  const validGroupIds = new Set<PublicNavGroupId>(PUBLIC_NAV_GROUPS.map((g) => g.id));

  return PUBLIC_NAV_GROUPS.map((group) => ({
    ...group,
    items: items.filter((item) => {
      const targetGroup =
        item.groupId && validGroupIds.has(item.groupId)
          ? item.groupId
          : DEFAULT_PUBLIC_NAV_GROUP;
      return targetGroup === group.id;
    }),
  })).filter((group) => group.items.length > 0);
}
