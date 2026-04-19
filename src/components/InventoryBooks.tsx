import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Layers, 
  Tag, 
  ArrowLeftRight, 
  ClipboardCheck,
  FileText,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function InventoryBooks() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'location',
      title: t('nav.location'),
      description: t('invBooks.locationDesc'),
      icon: Layers,
      path: '/reports/location'
    },
    { 
      id: 'stock-summary',
      title: t('nav.stock'),
      description: t('invBooks.stockSummaryDesc'),
      icon: Package,
      path: '/reports/stock'
    },
    {
      id: 'stock-item',
      title: t('nav.stockItem'),
      description: t('invBooks.stockItemDesc'),
      icon: FileText,
      path: '/reports/stock-item'
    },
    {
      id: 'stock-group',
      title: t('nav.stockGroupSummary'),
      description: t('invBooks.stockGroupDesc'),
      icon: Layers,
      path: '/reports/stock-group-summary'
    },
    {
      id: 'stock-category',
      title: t('nav.stockCategorySummary'),
      description: t('invBooks.stockCategoryDesc'),
      icon: Tag,
      path: '/reports/stock-category-summary'
    },
    {
      id: 'stock-transfer',
      title: t('nav.stockTransferRegister'),
      description: t('invBooks.stockTransferDesc'),
      icon: ArrowLeftRight,
      path: '/reports/stock-transfer-register'
    },
    {
      id: 'physical-stock',
      title: t('nav.physicalStockRegister'),
      description: t('invBooks.physicalStockDesc'),
      icon: ClipboardCheck,
      path: '/reports/physical-stock-register'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('invBooks.title')}</h1>
          <p className="text-gray-500">{t('invBooks.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left group overflow-hidden relative"
          >
            <div className="p-3 bg-primary/5 rounded-xl w-fit mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-500 text-sm">{item.description}</p>
            <div className="mt-6 flex items-center text-sm font-semibold text-primary group-hover:gap-2 transition-all">
              {t('invBooks.viewReport')}
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
