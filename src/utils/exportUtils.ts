import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(filename: string, title: string, data: any[], headers: string[], settings: any = {}) {
  const csvRows = [];
  
  // Header section
  csvRows.push(`"${(settings.companyName || 'SAPIENT ERP').replace(/"/g, '""')}"`);
  if (settings.companyAddress) {
    const addressLines = settings.companyAddress.split('\n');
    addressLines.forEach((line: string) => {
      csvRows.push(`"${line.replace(/"/g, '""')}"`);
    });
  }
  
  const contactInfo = [];
  if (settings.printPhone) contactInfo.push(`Phone: ${settings.printPhone}`);
  if (settings.printEmail) contactInfo.push(`Email: ${settings.printEmail}`);
  if (settings.printWebsite) contactInfo.push(`Web: ${settings.printWebsite}`);
  if (contactInfo.length > 0) csvRows.push(`"${contactInfo.join(' | ').replace(/"/g, '""')}"`);
  
  if (settings.printHeader) csvRows.push(`"${settings.printHeader.replace(/"/g, '""')}"`);
  
  csvRows.push('');
  csvRows.push(`"${title.toUpperCase()}"`);
  csvRows.push(`"Date: ${new Date().toLocaleDateString()}"`);
  csvRows.push(''); // Spacer
  
  // Table headers
  csvRows.push(headers.join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const key = header.toLowerCase().replace(/ /g, '_');
      const val = row[key] !== undefined ? row[key] : '';
      // Escape commas and wrap in quotes if necessary
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // Footer section
  if (settings.printFooter) {
    csvRows.push('');
    csvRows.push(`"${settings.printFooter.replace(/"/g, '""')}"`);
  }
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(filename: string, title: string, data?: any[], headers?: string[], settings: any = {}) {
  if (!data || !headers) {
    return exportElementToPDF(filename, title);
  }
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Set Courier font for the whole document to match the classic accounting look
  doc.setFont('courier');
  
  // Header
  let y = 26;
  
  // Add Logo if available
  if (settings.companyLogo) {
    try {
      // We assume the logo is either a Base64 string or a valid URL
      // For PDF, Base64 is safer if it's already loaded
      doc.addImage(settings.companyLogo, 'PNG', 14, 10, 20, 20, undefined, 'FAST');
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }

  if (settings.reportLayout === 'Layout 2') {
    doc.setFontSize(18);
    doc.setFont('courier', 'bold');
    const companyName = settings.companyName || 'COMPANY NAME';
    const nameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - nameWidth) / 2, 20);
    
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    let yPos = 26;
    if (settings.companyAddress) {
      const addrWidth = doc.getTextWidth(settings.companyAddress);
      doc.text(settings.companyAddress, (pageWidth - addrWidth) / 2, yPos);
      yPos += 4;
    }
    if (settings.printEmail) {
      const emailText = `E-Mail : ${settings.printEmail}`;
      const emailWidth = doc.getTextWidth(emailText);
      doc.text(emailText, (pageWidth - emailWidth) / 2, yPos);
      doc.line((pageWidth - emailWidth) / 2, yPos + 0.5, (pageWidth + emailWidth) / 2, yPos + 0.5);
      yPos += 8;
    }

    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    const titleParts = title.split(':');
    const ledgerName = titleParts[1]?.split('(')[0]?.trim() || '';
    const ledgerNameWidth = doc.getTextWidth(ledgerName);
    doc.text(ledgerName, (pageWidth - ledgerNameWidth) / 2, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    const label = "Ledger Account";
    const labelWidth = doc.getTextWidth(label);
    doc.text(label, (pageWidth - labelWidth) / 2, yPos);
    yPos += 4;

    const period = titleParts[1]?.split('(')[1]?.replace(')', '') || '';
    const periodWidth = doc.getTextWidth(period);
    doc.text(period, (pageWidth - periodWidth) / 2, yPos);
    yPos += 10;
    
    y = yPos;
  } else {
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.setFont('courier', 'bold');
    const companyName = settings.companyName || 'SAPIENT ERP';
    const nameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - nameWidth) / 2, 20);
    
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    y = 26;
    
    if (settings.companyAddress) {
      const lines = doc.splitTextToSize(settings.companyAddress, 180);
      lines.forEach((line: string) => {
        const lineWidth = doc.getTextWidth(line);
        doc.text(line, (pageWidth - lineWidth) / 2, y);
        y += 4;
      });
    }
    
    const contactInfo = [];
    if (settings.printPhone) contactInfo.push(`Phone: ${settings.printPhone}`);
    if (settings.printEmail) contactInfo.push(`Email: ${settings.printEmail}`);
    if (settings.printWebsite) contactInfo.push(`Web: ${settings.printWebsite}`);
    
    if (contactInfo.length > 0) {
      const infoText = contactInfo.join(' | ');
      const infoWidth = doc.getTextWidth(infoText);
      doc.text(infoText, (pageWidth - infoWidth) / 2, y);
      y += 6;
    }

    if (settings.printHeader) {
      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      const headerWidth = doc.getTextWidth(settings.printHeader);
      doc.text(settings.printHeader, (pageWidth - headerWidth) / 2, y);
      y += 6;
    }
    
    // Divider
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    const titleText = title.toUpperCase();
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, y);
    
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    const dateText = `Date of Print: ${new Date().toLocaleDateString()}`;
    const dateWidth = doc.getTextWidth(dateText);
    // Right align with the table (which has 14mm margin by default)
    doc.text(dateText, pageWidth - 14 - dateWidth, y + 6);
    y += 15;
  }

  const tableData = data.map(row => {
    const rowArray: any = headers.map(header => {
      const key = header.toLowerCase().replace(/ /g, '_');
      const val = row[key];
      if (typeof val === 'number') {
        return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return val !== undefined ? val : '';
    });
    rowArray.isShaded = row.isShaded;
    rowArray.isOpeningBalance = row.particulars === 'Opening Balance';
    rowArray.isClosingBalance = row.particulars === 'Closing Balance';
    return rowArray;
  });

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: y,
    theme: settings.reportLayout === 'Layout 2' ? 'grid' : 'grid',
    headStyles: { 
      fillColor: settings.reportLayout === 'Layout 2' ? [255, 255, 255] : [240, 240, 240], 
      textColor: 0, 
      font: 'courier',
      fontStyle: 'bold', 
      halign: 'left',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      font: 'courier',
      textColor: 0,
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 2,
    },
    columnStyles: headers.reduce((acc: any, header, index) => {
      const h = header.toLowerCase();
      if (h.includes('debit') || h.includes('credit') || h.includes('amount') || h.includes('balance') || h.includes('rate') || h.includes('value') || h.includes('quantity')) {
        acc[index] = { halign: 'right' };
      }
      return acc;
    }, {}),
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowRaw = data.row.raw as any;
        if (rowRaw && rowRaw.isShaded) {
          data.cell.styles.fillColor = [243, 244, 246]; // #F3F4F6
        }
        
        if (rowRaw && (rowRaw.isOpeningBalance || rowRaw.isClosingBalance)) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: (data) => {
      // Footer
      if (settings.printFooter) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        const footerWidth = doc.getTextWidth(settings.printFooter);
        doc.text(settings.printFooter, (pageWidth - footerWidth) / 2, doc.internal.pageSize.height - 10);
      }
      
      // Page number
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageNum = `Page ${data.pageNumber}`;
      doc.text(pageNum, pageWidth - 25, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`${filename}.pdf`);
}

export function exportElementToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const doc = new jsPDF();
  doc.setFont('courier');
  
  doc.setFontSize(14);
  const title = filename.replace(/_/g, ' ').toUpperCase();
  doc.text(title, 14, 20);
  
  let currentY = 30;

  // Find all tables and export them sequentially
  const tables = element.querySelectorAll('table');
  if (tables.length > 0) {
    tables.forEach((table, index) => {
      autoTable(doc, {
        html: table,
        startY: currentY,
        theme: 'grid',
        styles: { font: 'courier', fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [240, 240, 240], textColor: 0 },
        margin: { left: 10, right: 10 }
      });
      // @ts-ignore - finalY is added by autoTable
      currentY = (doc as any).lastAutoTable.finalY + 10;
      
      // If we are getting close to the bottom, start a new page (autoTable does this automatically mostly, 
      // but we need to track if we need to add a spacer)
    });
  } else {
    // If no tables, just export text content as a fallback
    doc.setFontSize(10);
    const textLines = doc.splitTextToSize(element.innerText, 180);
    doc.text(textLines, 14, 30);
  }

  doc.save(`${filename}.pdf`);
}

export const exportUtils = {
  exportToCSV,
  exportToPDF,
  exportElementToPDF
};
