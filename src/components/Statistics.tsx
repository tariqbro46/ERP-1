import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart2, Book, Users, Package, FileText, Database } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export function Statistics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [
          ledgers,
          groups,
          items,
          vTypes,
          godowns,
          units,
          employees,
          voucherCount,
          vEntryCount,
          invEntryCount
        ] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getLedgerGroups(user.companyId),
          erpService.getItems(user.companyId),
          erpService.getVoucherTypes(user.companyId),
          erpService.getGodowns(user.companyId),
          erpService.getUnits(user.companyId),
          erpService.getEmployees(user.companyId),
          erpService.getCollectionCount('vouchers', user.companyId),
          erpService.getCollectionCount('voucher_entries', user.companyId),
          erpService.getCollectionCount('inventory_entries', user.companyId)
        ]);

        // Get vouchers for the breakdown (optional: limit or keep for now if small)
        const vouchers = await erpService.getCollection('vouchers', user.companyId);

        // Count vouchers by type
        const vouchersByType: Record<string, number> = {};
        vouchers.forEach((v: any) => {
          vouchersByType[v.v_type] = (vouchersByType[v.v_type] || 0) + 1;
        });

        setStats({
          counts: {
            ledgers: ledgers.length,
            groups: groups.length,
            items: items.length,
            vouchers: voucherCount,
            vTypes: vTypes.length,
            vEntries: vEntryCount,
            invEntries: invEntryCount,
            godowns: godowns.length,
            units: units.length,
            employees: employees.length
          },
          vouchersByType
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user?.companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    {
      title: 'Accounts Masters',
      icon: Book,
      items: [
        { label: 'Ledger Groups', value: stats.counts.groups },
        { label: 'Ledgers', value: stats.counts.ledgers },
        { label: 'Voucher Types', value: stats.counts.vTypes }
      ]
    },
    {
      title: 'Inventory Masters',
      icon: Package,
      items: [
        { label: 'Stock Items', value: stats.counts.items },
        { label: 'Godowns', value: stats.counts.godowns },
        { label: 'Units', value: stats.counts.units }
      ]
    },
    {
      title: 'Transactions',
      icon: FileText,
      items: [
        { label: 'Total Vouchers', value: stats.counts.vouchers },
        { label: 'Accounting Entries', value: stats.counts.vEntries },
        { label: 'Inventory Entries', value: stats.counts.invEntries }
      ]
    },
    {
      title: 'Others',
      icon: Users,
      items: [
        { label: 'Employees', value: stats.counts.employees }
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
            <p className="text-gray-500">Summary of all masters and transactions</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-0 no-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 sticky top-0 z-10">
                  <section.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, iidx) => (
                    <div key={iidx} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="text-gray-700">{item.label}</span>
                      <span className="font-bold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm h-fit">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2 sticky top-0 z-10">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900">Vouchers Count</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.keys(stats.vouchersByType).length > 0 ? Object.entries(stats.vouchersByType).map(([type, count]) => (
                <div key={type} className="px-6 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-bold text-gray-900">{count as number}</span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-gray-500">No vouchers recorded</div>
              )}
              <div className="px-6 py-4 bg-gray-50 flex justify-between items-center font-bold sticky bottom-0 z-10 border-t border-gray-200">
                <span>Total</span>
                <span>{stats.counts.vouchers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
