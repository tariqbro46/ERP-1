import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const pdfService = {
  generateVoucherPDF: (voucher: any, settings: any) => {
    const doc = new jsPDF();
    
    // Header
    if (settings.showPrintHeader) {
      doc.setFontSize(20);
      doc.text(settings.companyName, 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(settings.companyAddress, 105, 30, { align: 'center' });
      if (settings.showPrintPhone) doc.text(`Phone: ${settings.printPhone}`, 105, 35, { align: 'center' });
      if (settings.showPrintEmail) doc.text(`Email: ${settings.printEmail}`, 105, 40, { align: 'center' });
    }

    doc.setFontSize(14);
    doc.text(`${voucher.v_type} Voucher`, 105, 55, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Voucher No: ${voucher.v_no}`, 20, 70);
    doc.text(`Date: ${voucher.v_date}`, 190, 70, { align: 'right' });

    // Table
    const tableData = voucher.entries.map((e: any) => [
      e.ledger_name || 'N/A',
      e.debit ? `${settings.baseCurrencySymbol} ${e.debit}` : '',
      e.credit ? `${settings.baseCurrencySymbol} ${e.credit}` : ''
    ]);

    (doc as any).autoTable({
      startY: 80,
      head: [['Particulars', 'Debit', 'Credit']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.text(`Total Amount: ${settings.baseCurrencySymbol} ${voucher.total_amount}`, 190, finalY + 10, { align: 'right' });
    
    if (voucher.narration) {
      doc.text(`Narration: ${voucher.narration}`, 20, finalY + 20);
    }

    // Signatures
    const sigY = finalY + 50;
    if (settings.showSignature1) doc.text(settings.printSignature1, 20, sigY, { align: 'left' });
    if (settings.showSignature2) doc.text(settings.printSignature2, 105, sigY, { align: 'center' });
    if (settings.showSignature3) doc.text(settings.printSignature3, 190, sigY, { align: 'right' });

    return doc;
  },

  shareViaWhatsApp: (voucher: any, settings: any) => {
    const message = `*${settings.companyName}*\n${voucher.v_type} Voucher\nNo: ${voucher.v_no}\nDate: ${voucher.v_date}\nAmount: ${settings.baseCurrencySymbol} ${voucher.total_amount}\n\nShared via TallyFlow ERP`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  shareViaEmail: (voucher: any, settings: any) => {
    const subject = `${voucher.v_type} Voucher - ${voucher.v_no}`;
    const body = `${settings.companyName}\n\n${voucher.v_type} Voucher Details:\nNo: ${voucher.v_no}\nDate: ${voucher.v_date}\nAmount: ${settings.baseCurrencySymbol} ${voucher.total_amount}\n\nRegards,\n${settings.companyName}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  }
};
