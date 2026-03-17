import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const pdfService = {
  async generateInvoice(voucher: any, company: any) {
    const doc = new jsPDF() as any;
    
    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name || 'TallyFlow ERP', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company.address || '', 105, 26, { align: 'center' });
    doc.text(`Phone: ${company.phone || ''} | Email: ${company.email || ''}`, 105, 31, { align: 'center' });
    if (company.vat_no) {
      doc.text(`VAT/TIN: ${company.vat_no}`, 105, 36, { align: 'center' });
    }

    // Invoice Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(voucher.v_type.toUpperCase() + ' INVOICE', 105, 48, { align: 'center' });
    
    // Horizontal Line
    doc.setLineWidth(0.5);
    doc.line(15, 52, 195, 52);

    // Invoice Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice To:', 15, 60);
    doc.setFont('helvetica', 'normal');
    const partyName = voucher.voucher_entries?.[0]?.ledgers?.name || voucher.particulars || 'Cash';
    doc.text(partyName, 15, 65);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No:', 140, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(voucher.v_no, 165, 60);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 140, 65);
    doc.setFont('helvetica', 'normal');
    const safeDate = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return format(d, 'dd-MMM-yyyy');
      } catch (e) {
        return 'N/A';
      }
    };
    doc.text(safeDate(voucher.v_date), 165, 65);

    // Table
    const tableData = (voucher.inventory || []).map((item: any, index: number) => [
      index + 1,
      item.items?.name || item.item_name || 'Item',
      item.qty,
      item.items?.units?.name || '',
      item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    doc.autoTable({
      startY: 75,
      head: [['SL', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 140, finalY);
    doc.text(`BDT ${voucher.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

    if (voucher.tax_amount) {
      doc.text('Tax Amount:', 140, finalY + 7);
      doc.text(`BDT ${voucher.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY + 7, { align: 'right' });
    }

    // Narration
    if (voucher.narration) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Narration: ' + voucher.narration, 15, finalY + 20, { maxWidth: 180 });
    }

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('This is a computer generated invoice.', 105, 285, { align: 'center' });

    doc.save(`Invoice_${voucher.v_no.replace(/\//g, '_')}.pdf`);
  }
};
