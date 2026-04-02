import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportService = {
  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  },

  exportToPDF(headers: string[][], body: any[][], fileName: string, title: string, settings: any = {}) {
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(settings.companyName || 'SAPIENT ERP', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const address = settings.companyAddress || '';
    const addressLines = doc.splitTextToSize(address, 180);
    doc.text(addressLines, 105, 22, { align: 'center' });
    
    let currentY = 22 + (addressLines.length * 5);
    
    const contactInfo = [];
    if (settings.showPrintPhone !== false && settings.printPhone) contactInfo.push(`Phone: ${settings.printPhone}`);
    if (settings.showPrintEmail !== false && settings.printEmail) contactInfo.push(`Email: ${settings.printEmail}`);
    if (settings.showPrintWebsite !== false && settings.printWebsite) contactInfo.push(`Web: ${settings.printWebsite}`);
    
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), 105, currentY, { align: 'center' });
      currentY += 7;
    }
    
    // Report Title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), 105, currentY + 5, { align: 'center' });
    
    autoTable(doc, {
      startY: currentY + 15,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
      didDrawPage: (data) => {
        // Footer
        const str = `Page ${doc.getNumberOfPages()}`;
        doc.setFontSize(8);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
        doc.text(`Printed on: ${new Date().toLocaleString()}`, pageSize.width - data.settings.margin.right, pageHeight - 10, { align: 'right' });
      }
    });
    
    doc.save(`${fileName}.pdf`);
  }
};
