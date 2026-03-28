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

  exportToPDF(headers: string[][], body: any[][], fileName: string, title: string) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(title, 105, 15, { align: 'center' });
    
    autoTable(doc, {
      startY: 25,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    });
    
    doc.save(`${fileName}.pdf`);
  }
};
