import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertNumberToWords } from './printUtils';

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

export function exportVoucherToPDF(voucher: any, settings: any = {}) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width; // A4 width: 210mm
  const pageHeight = doc.internal.pageSize.height; // A4 height: 297mm
  
  // Font courier matches accounting style
  doc.setFont('courier');
  
  let currentY = 15;
  
  // 1. Draw Company Logo on left independently (doesn't affect center alignment of text)
  if (settings.companyLogo) {
    try {
      doc.addImage(settings.companyLogo, 'PNG', 15, 12, 18, 18, undefined, 'FAST');
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }
  
  // 2. Draw Center Aligned Company Header Text
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  const compName = (settings.companyName || 'SAPIENT ERP').toUpperCase();
  // Center is (pageWidth / 2)
  doc.text(compName, pageWidth / 2, currentY + 4, { align: 'center' });
  currentY += 9;
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  
  if (settings.companyAddress) {
    const addressLines = doc.splitTextToSize(settings.companyAddress, 140);
    addressLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, currentY, { align: 'center' });
      currentY += 4;
    });
  }
  
  const contactParts = [];
  if (settings.printPhone) contactParts.push(`Phone: ${settings.printPhone}`);
  if (settings.printEmail) contactParts.push(`Email: ${settings.printEmail}`);
  if (settings.printWebsite) contactParts.push(`Web: ${settings.printWebsite}`);
  
  if (contactParts.length > 0) {
    const contactStr = contactParts.join(' | ');
    doc.text(contactStr, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
  }
  
  if (settings.printHeader) {
    doc.setFont('courier', 'italic');
    doc.text(settings.printHeader, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
  }
  
  // Draw header bottom solid separator
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(15, currentY + 1, pageWidth - 15, currentY + 1);
  currentY += 10;
  
  // 3. Draw Bold Voucher Title (Centred & positioned below header)
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  const titleText = `${voucher.v_type.toUpperCase()} VOUCHER`;
  const titleWidth = doc.getTextWidth(titleText);
  // Draw small outline box around the bold title
  doc.rect((pageWidth - titleWidth) / 2 - 4, currentY - 4, titleWidth + 8, 7);
  doc.text(titleText, pageWidth / 2, currentY, { align: 'center' });
  currentY += 12;
  
  // 4. Draw Metadata & Party Info
  doc.setFontSize(9);
  
  const col1X = 15;
  const col2X = pageWidth - 15;
  
  const partyNameStr = voucher.party_ledger_name || voucher.ledger_name || 'N/A';
  const partyAddressStr = voucher.party_address || 'N/A';
  
  // Left meta details: Party & Address left-aligned
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(`Party: ${partyNameStr}`, col1X, currentY);
  
  doc.setFontSize(9);
  doc.text('Address: ', col1X, currentY + 5);
  doc.setFont('courier', 'normal');
  
  const addressLines = doc.splitTextToSize(partyAddressStr, 100);
  let addrOffset = 0;
  addressLines.forEach((line: string) => {
    doc.text(line, col1X + 20, currentY + 5 + addrOffset);
    addrOffset += 4;
  });
  
  // Right meta details: Date, Serial, Voucher No, Ref No - all right-aligned
  doc.setFontSize(9);
  let rightY = currentY;
  
  doc.setFont('courier', 'bold');
  const dateStr = `Date: ${new Date(voucher.v_date).toLocaleDateString()}`;
  doc.text(dateStr, col2X, rightY, { align: 'right' });
  rightY += 5;
  
  if (voucher.serial_no || voucher.auto_serial_no) {
    const serialStr = `Serial No: ${voucher.serial_no || voucher.auto_serial_no}`;
    doc.text(serialStr, col2X, rightY, { align: 'right' });
    rightY += 5;
  }
  
  const vNoStr = `Voucher No: ${voucher.v_no}`;
  doc.text(vNoStr, col2X, rightY, { align: 'right' });
  rightY += 5;
  
  if (voucher.reference_no) {
    const refStr = `Ref No: ${voucher.reference_no}`;
    doc.text(refStr, col2X, rightY, { align: 'right' });
    rightY += 5;
  }
  
  currentY = Math.max(currentY + 5 + addrOffset, rightY) + 6;
  
  // Helper to format quantity
  const formatQty = (q: number, u: string = '') => {
    const norm = u.toLowerCase();
    if (norm === 'pcs' || norm === 'pc' || norm === 'nos') return Math.round(q).toString();
    return Number(q.toFixed(2)).toString();
  };
  
  const formatAmt = (a: number) => a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // 5. Draw Table based on Voucher Type
  const type = voucher.v_type;
  
  if (type === 'Sales' || type === 'Purchase') {
    // Generate Inventory Table without Location details in Item Description
    const headers = [['Item Description', 'Qty', 'Rate', 'Amount']];
    const body = (voucher.inventory || []).map((item: any) => [
      item.item_name,
      `${formatQty(item.qty, item.unit)} ${item.unit || ''}`,
      formatAmt(item.rate),
      formatAmt(item.qty * item.rate)
    ]);
    
    // Add Total row
    body.push([
      'TOTAL',
      '',
      '',
      `৳ ${formatAmt(voucher.total_amount)}`
    ]);
    
    autoTable(doc, {
      head: headers,
      body: body,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [242, 242, 242], textColor: 0, font: 'courier', fontStyle: 'bold' },
      bodyStyles: { font: 'courier', textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 35 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 40 }
      },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
  } else if (type === 'Stock Journal') {
    // Stock Journal Layout is split. In PDF, we render Consumption and Production as two sub-tables without Location
    const consumption = (voucher.inventory || []).filter((i: any) => i.entry_type === 'Consumption');
    const production = (voucher.inventory || []).filter((i: any) => i.entry_type === 'Production');
    const totalConsumption = consumption.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0);
    const totalProduction = production.reduce((acc: number, item: any) => acc + (item.qty * item.rate), 0);
    
    // Title row 1
    doc.setFont('courier', 'bold');
    doc.text('SOURCE (CONSUMPTION)', 15, currentY);
    currentY += 3;
    
    const consBody = consumption.map((item: any) => [
      item.item_name,
      `${formatQty(item.qty, item.unit)} ${item.unit || ''}`,
      formatAmt(item.qty * item.rate)
    ]);
    consBody.push(['TOTAL CONSUMPTION', '', `৳ ${formatAmt(totalConsumption)}`]);
    
    autoTable(doc, {
      head: [['Item Name', 'Qty', 'Amount']],
      body: consBody,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [242, 242, 242], textColor: 0, font: 'courier', fontStyle: 'bold' },
      bodyStyles: { font: 'courier', textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 45 }
      },
      didParseCell: (data) => {
        if (data.row.index === consBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 8;
    
    doc.setFont('courier', 'bold');
    doc.text('DESTINATION (PRODUCTION)', 15, currentY);
    currentY += 3;
    
    const prodBody = production.map((item: any) => [
      item.item_name,
      `${formatQty(item.qty, item.unit)} ${item.unit || ''}`,
      formatAmt(item.qty * item.rate)
    ]);
    prodBody.push(['TOTAL PRODUCTION', '', `৳ ${formatAmt(totalProduction)}`]);
    
    autoTable(doc, {
      head: [['Item Name', 'Qty', 'Amount']],
      body: prodBody,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [242, 242, 242], textColor: 0, font: 'courier', fontStyle: 'bold' },
      bodyStyles: { font: 'courier', textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 45 }
      },
      didParseCell: (data) => {
        if (data.row.index === prodBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
  } else {
    // Payment, Receipt, Journal, Contra Vouchers
    const headers = [['Particulars', 'Debit', 'Credit']];
    const body = (voucher.entries || []).map((entry: any) => [
      entry.ledger_name + (entry.narration ? `\n(${entry.narration})` : ''),
      entry.debit > 0 ? formatAmt(entry.debit) : '',
      entry.credit > 0 ? formatAmt(entry.credit) : ''
    ]);
    
    body.push([
      'TOTAL',
      `৳ ${formatAmt(voucher.total_amount)}`,
      `৳ ${formatAmt(voucher.total_amount)}`
    ]);
    
    autoTable(doc, {
      head: headers,
      body: body,
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [242, 242, 242], textColor: 0, font: 'courier', fontStyle: 'bold' },
      bodyStyles: { font: 'courier', textColor: 0 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'right', cellWidth: 40 }
      },
      didParseCell: (data) => {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
  }
  
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 12;
  
  // 6. Draw Amount in Words (Above narration!)
  doc.setFont('courier', 'bold');
  doc.text('Amount in words:', 15, currentY);
  doc.setFont('courier', 'italic');
  const amountStr = convertNumberToWords(voucher.total_amount);
  const wordsLines = doc.splitTextToSize(amountStr, pageWidth - 30);
  wordsLines.forEach((line: string) => {
    currentY += 4;
    doc.text(line, 15, currentY);
  });
  
  currentY += 8;
  
  // 7. Draw Narration Section (Below Amount in Words)
  doc.setFont('courier', 'bold');
  doc.text('Narration:', 15, currentY);
  doc.setFont('courier', 'italic');
  const narrationStr = voucher.narration || 'N/A';
  const narrLines = doc.splitTextToSize(narrationStr, pageWidth - 30);
  narrLines.forEach((line: string) => {
    currentY += 4;
    doc.text(line, 15, currentY);
  });
  
  // 8. Signatures at bottom of page
  const sigY = pageHeight - 35;
  doc.setLineWidth(0.3);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  
  // Prepared by
  doc.line(15, sigY, 65, sigY);
  doc.text('PREPARED BY', 40, sigY + 4, { align: 'center' });
  
  // Authorized Signatory
  doc.line(85, sigY, 135, sigY);
  doc.text('AUTHORIZED SIGNATORY', 110, sigY + 4, { align: 'center' });
  
  // Receiver's signature
  doc.line(155, sigY, 195, sigY);
  doc.text("RECEIVER'S SIGNATURE", 175, sigY + 4, { align: 'center' });
  
  // 9. Footer Text at absolute bottom
  let footY = pageHeight - 15;
  doc.setLineWidth(0.2);
  doc.setDrawColor(180);
  doc.line(15, footY, pageWidth - 15, footY);
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100);
  
  if (settings.showPrintFooter !== false && settings.printFooter) {
    doc.text(settings.printFooter, 15, footY + 4);
  }
  
  if (settings.showDeveloperContact !== false) {
    const devText = settings.developerContactText || 'TallyFlow ERP | +880 1742 058246';
    doc.text(devText, pageWidth - 15, footY + 4, { align: 'right' });
  }
  
  doc.save(`Voucher_${voucher.v_no}.pdf`);
}

export const exportUtils = {
  exportToCSV,
  exportToPDF,
  exportElementToPDF,
  exportVoucherToPDF
};
