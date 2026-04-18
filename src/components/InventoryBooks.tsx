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
      id: 'stock-summary',
      title: 'Stock Summary',
      description: 'Overview of all stock items with current quantity and value',
      icon: Package,
      path: '/reports/stock'
    },
    {
      id: 'stock-item',
      title: 'Stock Item',
      description: 'Monthly summary of transactions for a specific item',
      icon: FileText,
      path: '/reports/stock-item'
    },
    {
      id: 'stock-group',
      title: 'Stock Group Summary',
      description: 'Stock status grouped by categories',
      icon: Layers,
      path: '/reports/stock-group-summary'
    },
    {
      id: 'stock-category',
      title: 'Stock Category Summary',
      description: 'Analysis of stock by defined categories',
      icon: Tag,
      path: '/reports/stock-category-summary'
    },
    {
      id: 'stock-transfer',
      title: 'Stock Transfer Register',
      description: 'Record of internal stock transfers between godowns',
      icon: ArrowLeftRight,
      path: '/reports/stock-transfer-register'
    },
    {
      id: 'physical-stock',
      title: 'Physical Stock Register',
      description: 'History of physical stock adjustments and audits',
      icon: ClipboardCheck,
      path: '/reports/physical-stock-register'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Books</h1>
          <p className="text-gray-500">Dive deep into your stock records and movements</p>
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
              View Report
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
