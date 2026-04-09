import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  BarChart3, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Package,
  Printer,
  FileText
} from 'lucide-react';
import { PrintingOrder } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrderReports() {
  const { user } = useAuth();
  const settings = useSettings();
  const [orders, setOrders] = useState<PrintingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchData();
    }
  }, [user?.companyId]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await erpService.getOrders(user!.companyId);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(order => {
    const clientName = order.clientName || '';
    const itemName = order.itemName || '';
    const printDesign = order.printDesign || '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      printDesign.toLowerCase().includes(searchTerm.toLowerCase());
    
    const orderDate = new Date(order.deliveryDate);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Set hours to 0 for accurate date comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const matchesDate = orderDate >= startDate && orderDate <= endDate;

    return matchesSearch && matchesDate;
  });

  // Grouping logic for "Client ordered which item with which design"
  const reportData = filteredOrders.reduce((acc, order) => {
    const key = `${order.clientId}-${order.itemId}-${order.printDesign || 'none'}`;
    if (!acc[key]) {
      acc[key] = {
        clientName: order.clientName,
        itemName: order.itemName,
        printDesign: order.printDesign || 'NO DESIGN',
        totalQuantity: 0,
        orderCount: 0,
        lastOrderDate: order.deliveryDate
      };
    }
    acc[key].totalQuantity += (order.quantity || 0);
    acc[key].orderCount += 1;
    if (new Date(order.deliveryDate) > new Date(acc[key].lastOrderDate)) {
      acc[key].lastOrderDate = order.deliveryDate;
    }
    return acc;
  }, {} as Record<string, any>);

  const sortedReport = Object.values(reportData).sort((a, b) => b.totalQuantity - a.totalQuantity);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('PRODUCTION REPORT', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${format(new Date(dateRange.start), 'dd MMM yyyy')} to ${format(new Date(dateRange.end), 'dd MMM yyyy')}`, 14, 30);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 35);

    const tableData = sortedReport.map(row => [
      row.clientName,
      row.itemName,
      row.printDesign,
      row.totalQuantity.toLocaleString(),
      row.orderCount.toString(),
      format(new Date(row.lastOrderDate), 'dd MMM yyyy')
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Client Name', 'Item/Bag', 'Design', 'Total Qty', 'Orders', 'Last Order']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' }
      }
    });

    doc.save(`Production_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2 border-b border-border pb-2">
        <div className="flex items-center gap-4">
          {(settings.companyLogo || settings.systemLogo) && (
            <div className="w-12 h-12 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
              <img 
                src={settings.companyLogo || settings.systemLogo} 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary mb-1">
              <BarChart3 className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-foreground">Analytics</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Production Reports</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold">{settings.companyName}</p>
          </div>
        </div>
        <div className="flex w-full md:w-auto justify-end">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
          >
            <FileText className="w-3 h-3" />
            Full Page View
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 bg-muted/30 p-4 border border-border">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="FILTER BY CLIENT, ITEM, DESIGN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border py-2 pl-10 pr-4 text-[10px] uppercase tracking-widest outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input 
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="flex-1 bg-background border border-border py-2 px-3 text-[10px] outline-none focus:border-primary"
          />
          <span className="text-muted-foreground text-[10px]">TO</span>
          <input 
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="flex-1 bg-background border border-border py-2 px-3 text-[10px] outline-none focus:border-primary"
          />
        </div>
        <button 
          onClick={exportToPDF}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
        </div>
      ) : (
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="p-4">Client Name (Ledger)</th>
                <th className="p-4">Raw Item/Bag</th>
                <th className="p-4">Print Design Needed</th>
                <th className="p-4 text-center">Total Qty</th>
                <th className="p-4 text-center">Orders</th>
                <th className="p-4 text-right">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedReport.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground uppercase">{row.clientName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase">{row.itemName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Printer className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase italic">{row.printDesign}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-xs">
                    {row.totalQuantity.toLocaleString()}
                  </td>
                  <td className="p-4 text-center text-xs">
                    {row.orderCount}
                  </td>
                  <td className="p-4 text-right text-[10px] text-muted-foreground">
                    {format(new Date(row.lastOrderDate), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
              {sortedReport.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[10px] uppercase tracking-widest text-muted-foreground italic">
                    No data available for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
