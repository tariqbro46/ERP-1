import React, { useState, useEffect } from 'react';
import { 
  X, Check, MoveUp, MoveDown, Trash2, Plus, Layout, Type, Table, AlignLeft, 
  AlignCenter, AlignRight, Palette, Eye, EyeOff, FileText, Settings, Download, Printer, Save, RefreshCw
} from 'lucide-react';
import { ReportLayoutTemplate, ReportSectionConfig } from '../types';
import { downloadHtmlAsPDF } from '../utils/exportUtils';
import { executePrint } from '../utils/printUtils';

const DEFAULT_SECTIONS: ReportSectionConfig[] = [
  {
    id: 'header',
    type: 'header',
    title: 'Company Header Block',
    visible: true,
    align: 'center',
    fontSize: 'lg',
    fontFamily: 'Courier',
    textColor: '#000000',
    bgColor: '#ffffff',
    paddingY: 4,
    marginBottom: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000'
  },
  {
    id: 'title_period',
    type: 'title_period',
    title: 'Report Title & Period',
    visible: true,
    align: 'center',
    fontSize: 'base',
    fontFamily: 'Courier',
    textColor: '#000000',
    paddingY: 4,
    marginBottom: 8
  },
  {
    id: 'summary_cards',
    type: 'summary_cards',
    title: 'KPI Summary Cards (Opening/Debit/Credit/Closing)',
    visible: true,
    fontSize: 'sm',
    fontFamily: 'Courier',
    textColor: '#000000',
    bgColor: '#f8fafc',
    marginBottom: 12
  },
  {
    id: 'data_table',
    type: 'data_table',
    title: 'Main Data Table',
    visible: true,
    fontSize: 'sm',
    fontFamily: 'Courier',
    textColor: '#000000',
    tableHeaderBg: '#f1f5f9',
    tableHeaderTextColor: '#000000',
    tableBorderColor: '#cbd5e1',
    zebraStriping: true,
    visibleColumns: {
      date: true,
      v_type: true,
      v_no: true,
      particulars: true,
      narration: true,
      debit: true,
      credit: true,
      balance: true
    },
    columnTitles: {
      date: 'Date',
      v_type: 'Vch Type',
      v_no: 'Vch No.',
      particulars: 'Particulars',
      narration: 'Narration / Item Details',
      debit: 'Debit (Dr)',
      credit: 'Credit (Cr)',
      balance: 'Balance'
    },
    marginBottom: 16
  },
  {
    id: 'custom_text',
    type: 'custom_text',
    title: 'Terms / Declaration Notes',
    visible: true,
    align: 'left',
    fontSize: 'xs',
    fontFamily: 'Courier',
    textColor: '#475569',
    customHtml: 'Note: This statement is computer-generated and verified by TallyFlow ERP. Subject to Chapai Nawabgonj jurisdiction.',
    marginBottom: 12
  },
  {
    id: 'signatures',
    type: 'signatures',
    title: 'Signatures & Seal',
    visible: true,
    align: 'right',
    fontSize: 'xs',
    fontFamily: 'Courier',
    textColor: '#000000',
    marginBottom: 12
  },
  {
    id: 'footer',
    type: 'footer',
    title: 'Page Footer Note',
    visible: true,
    align: 'center',
    fontSize: 'xs',
    fontFamily: 'Courier',
    textColor: '#94a3b8',
    marginBottom: 4
  }
];

export const PRESET_TEMPLATES: Record<string, ReportLayoutTemplate> = {
  tally_classic: {
    id: 'tally_classic',
    name: 'Tally Classic',
    description: 'Traditional monospaced font with high contrast borders',
    paperSize: 'a4',
    orientation: 'portrait',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    fontFamily: 'Courier',
    baseFontSize: 12,
    primaryColor: '#000000',
    accentColor: '#1e293b',
    sections: DEFAULT_SECTIONS
  },
  modern_minimal: {
    id: 'modern_minimal',
    name: 'Modern Minimalist',
    description: 'Clean typography, soft borders, generous white space',
    paperSize: 'a4',
    orientation: 'portrait',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
    fontFamily: 'Inter',
    baseFontSize: 13,
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    sections: DEFAULT_SECTIONS.map(s => {
      if (s.id === 'data_table') {
        return {
          ...s,
          fontFamily: 'Inter',
          tableHeaderBg: '#1e293b',
          tableHeaderTextColor: '#ffffff',
          tableBorderColor: '#e2e8f0',
          zebraStriping: true
        };
      }
      return { ...s, fontFamily: 'Inter' };
    })
  },
  corporate_formal: {
    id: 'corporate_formal',
    name: 'Corporate Formal',
    description: 'Double header lines, authoritative structure for official audits',
    paperSize: 'a4',
    orientation: 'portrait',
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    fontFamily: 'Times-Roman',
    baseFontSize: 12,
    primaryColor: '#000000',
    accentColor: '#0f172a',
    sections: DEFAULT_SECTIONS.map(s => ({
      ...s,
      fontFamily: 'Times-Roman',
      borderStyle: s.id === 'header' ? 'double' : 'solid'
    }))
  }
};

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (template: ReportLayoutTemplate) => void;
  sampleData?: any;
}

export function ReportBuilderModal({ isOpen, onClose, onSave, sampleData }: ReportBuilderModalProps) {
  const [template, setTemplate] = useState<ReportLayoutTemplate>(() => {
    const saved = localStorage.getItem('tallyflow_custom_report_template');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return PRESET_TEMPLATES.tally_classic;
  });

  const [selectedSectionId, setSelectedSectionId] = useState<string>('header');
  const [activeTab, setActiveTab] = useState<'widgets' | 'style' | 'presets'>('widgets');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedSection = template.sections.find(s => s.id === selectedSectionId);

  // Helper to update sections
  const updateSection = (id: string, key: keyof ReportSectionConfig, value: any) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(sec => sec.id === id ? { ...sec, [key]: value } : sec)
    }));
  };

  // Move Section Up/Down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= template.sections.length) return;

    const newSections = [...template.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setTemplate(prev => ({ ...prev, sections: newSections }));
  };

  // Toggle Visibility
  const toggleVisibility = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s)
    }));
  };

  // Delete Section
  const deleteSection = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
    if (selectedSectionId === id && template.sections.length > 1) {
      setSelectedSectionId(template.sections[0].id);
    }
  };

  // Add New Custom Section
  const addSection = (type: ReportSectionConfig['type']) => {
    const newId = `custom_${type}_${Date.now()}`;
    const newSec: ReportSectionConfig = {
      id: newId,
      type: type,
      title: type === 'custom_text' ? 'Custom Text Block' : type === 'divider' ? 'Divider Line' : 'Custom Block',
      visible: true,
      align: 'left',
      fontSize: 'sm',
      fontFamily: template.fontFamily as any,
      textColor: '#000000',
      marginBottom: 8,
      customHtml: type === 'custom_text' ? 'Enter your custom notes or terms here...' : ''
    };
    setTemplate(prev => ({ ...prev, sections: [...prev.sections, newSec] }));
    setSelectedSectionId(newId);
    setActiveTab('style');
  };

  // Save Template
  const handleSave = () => {
    localStorage.setItem('tallyflow_custom_report_template', JSON.stringify(template));
    if (onSave) onSave(template);
    alert('✓ Report Layout Template saved successfully!');
    onClose();
  };

  // Generate Sample HTML for live preview / print / PDF download
  const generatePreviewHtml = () => {
    const company = sampleData?.company || { name: 'TALLYFLOW ENTERPRISE', address: '123 Business Avenue, Suite 100', phone: '+880 1700 000000', email: 'info@tallyflow.com' };
    const ledgerName = sampleData?.ledgerName || 'M/S Johura Enterprise';
    const period = sampleData?.period || '01-Apr-2026 to 03-Aug-2026';

    let htmlSections = '';

    template.sections.forEach(sec => {
      if (!sec.visible) return;

      const alignCss = sec.align ? `text-align: ${sec.align};` : '';
      const fontCss = sec.fontFamily ? `font-family: ${sec.fontFamily === 'Courier' ? 'monospace' : sec.fontFamily === 'Times-Roman' ? 'serif' : 'sans-serif'};` : '';
      const textColorCss = sec.textColor ? `color: ${sec.textColor};` : '';
      const bgColorCss = sec.bgColor ? `background-color: ${sec.bgColor};` : '';
      const borderCss = sec.borderStyle && sec.borderStyle !== 'none' ? `border: ${sec.borderWidth || 1}px ${sec.borderStyle} ${sec.borderColor || '#000000'};` : '';
      const mbCss = sec.marginBottom ? `margin-bottom: ${sec.marginBottom}px;` : '';
      const paddingCss = sec.paddingY ? `padding-top: ${sec.paddingY}px; padding-bottom: ${sec.paddingY}px;` : '';

      const styleString = `${alignCss} ${fontCss} ${textColorCss} ${bgColorCss} ${borderCss} ${mbCss} ${paddingCss}`.trim();

      if (sec.type === 'header') {
        htmlSections += `
          <div style="${styleString} padding: 10px; border-bottom: 2px solid #000; text-align: center;">
            <h1 style="font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase;">${company.name}</h1>
            <p style="font-size: 11px; margin: 3px 0; color: #334155;">${company.address}</p>
            <p style="font-size: 10px; margin: 0; color: #475569;">Email: ${company.email} | Phone: ${company.phone}</p>
          </div>
        `;
      } else if (sec.type === 'title_period') {
        htmlSections += `
          <div style="${styleString} margin-top: 10px; text-align: center;">
            <h2 style="font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; text-decoration: underline;">LEDGER STATEMENT: ${ledgerName}</h2>
            <p style="font-size: 11px; margin: 4px 0 0 0; color: #475569;">Period: ${period}</p>
          </div>
        `;
      } else if (sec.type === 'summary_cards') {
        htmlSections += `
          <div style="${styleString} display: flex; justify-content: space-between; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; margin-top: 10px;">
            <div><span style="font-size: 10px; color: #64748b;">Opening Balance:</span> <strong style="font-size: 12px;">৳ 25,000.00 Cr</strong></div>
            <div><span style="font-size: 10px; color: #64748b;">Total Debit:</span> <strong style="font-size: 12px; color: #dc2626;">৳ 15,400.00</strong></div>
            <div><span style="font-size: 10px; color: #64748b;">Total Credit:</span> <strong style="font-size: 12px; color: #16a34a;">৳ 40,400.00</strong></div>
            <div><span style="font-size: 10px; color: #64748b;">Closing Balance:</span> <strong style="font-size: 12px; color: #2563eb;">৳ 50,000.00 Cr</strong></div>
          </div>
        `;
      } else if (sec.type === 'data_table') {
        const cols = sec.visibleColumns || { date: true, v_type: true, v_no: true, particulars: true, debit: true, credit: true, balance: true };
        const titles = sec.columnTitles || {};

        htmlSections += `
          <div style="${styleString} margin-top: 10px; width: 100%;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background-color: ${sec.tableHeaderBg || '#f1f5f9'}; color: ${sec.tableHeaderTextColor || '#000'}; border-top: 1px solid #000; border-bottom: 1px solid #000;">
                  ${cols.date ? `<th style="padding: 6px; text-align: left; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.date || 'Date'}</th>` : ''}
                  ${cols.v_type ? `<th style="padding: 6px; text-align: left; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.v_type || 'Vch Type'}</th>` : ''}
                  ${cols.v_no ? `<th style="padding: 6px; text-align: left; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.v_no || 'Vch No'}</th>` : ''}
                  ${cols.particulars ? `<th style="padding: 6px; text-align: left; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.particulars || 'Particulars'}</th>` : ''}
                  ${cols.debit ? `<th style="padding: 6px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.debit || 'Debit'}</th>` : ''}
                  ${cols.credit ? `<th style="padding: 6px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.credit || 'Credit'}</th>` : ''}
                  ${cols.balance ? `<th style="padding: 6px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#cbd5e1'};">${titles.balance || 'Balance'}</th>` : ''}
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: #ffffff;">
                  ${cols.date ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">01-Apr-2026</td>` : ''}
                  ${cols.v_type ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">Opening</td>` : ''}
                  ${cols.v_no ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">-</td>` : ''}
                  ${cols.particulars ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">Opening Balance</td>` : ''}
                  ${cols.debit ? `<td style="padding: 5px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">-</td>` : ''}
                  ${cols.credit ? `<td style="padding: 5px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">-</td>` : ''}
                  ${cols.balance ? `<td style="padding: 5px; text-align: right; font-weight: bold; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">25,000.00 Cr</td>` : ''}
                </tr>
                <tr style="background-color: ${sec.zebraStriping ? '#f8fafc' : '#ffffff'};">
                  ${cols.date ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">10-Apr-2026</td>` : ''}
                  ${cols.v_type ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">Sales</td>` : ''}
                  ${cols.v_no ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">SAL-1024</td>` : ''}
                  ${cols.particulars ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">To Goods Sales (Inv #1024)<br/><small style="color:#64748b;">5 Pcs Premium Cotton Shirt @ 3,080.00</small></td>` : ''}
                  ${cols.debit ? `<td style="padding: 5px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">15,400.00</td>` : ''}
                  ${cols.credit ? `<td style="padding: 5px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">-</td>` : ''}
                  ${cols.balance ? `<td style="padding: 5px; text-align: right; font-weight: bold; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">9,600.00 Cr</td>` : ''}
                </tr>
                <tr style="background-color: #ffffff;">
                  ${cols.date ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">15-Apr-2026</td>` : ''}
                  ${cols.v_type ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">Receipt</td>` : ''}
                  ${cols.v_no ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">RCT-0588</td>` : ''}
                  ${cols.particulars ? `<td style="padding: 5px; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">By Cash Account</td>` : ''}
                  ${cols.debit ? `<td style="padding: 5px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">-</td>` : ''}
                  ${cols.credit ? `<td style="padding: 5px; text-align: right; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">40,400.00</td>` : ''}
                  ${cols.balance ? `<td style="padding: 5px; text-align: right; font-weight: bold; border: 1px solid ${sec.tableBorderColor || '#e2e8f0'};">50,000.00 Cr</td>` : ''}
                </tr>
              </tbody>
              <tfoot>
                <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000;">
                  <td colspan="${(cols.date?1:0)+(cols.v_type?1:0)+(cols.v_no?1:0)+(cols.particulars?1:0)}" style="padding: 6px; text-align: right;">Total Transactions:</td>
                  ${cols.debit ? `<td style="padding: 6px; text-align: right;">৳ 15,400.00</td>` : ''}
                  ${cols.credit ? `<td style="padding: 6px; text-align: right;">৳ 40,400.00</td>` : ''}
                  ${cols.balance ? `<td style="padding: 6px; text-align: right;">৳ 50,000.00 Cr</td>` : ''}
                </tr>
              </tfoot>
            </table>
          </div>
        `;
      } else if (sec.type === 'custom_text') {
        htmlSections += `
          <div style="${styleString} font-size: 11px; padding: 6px 0; border-top: 1px dashed #cbd5e1; margin-top: 10px;">
            ${sec.customHtml || ''}
          </div>
        `;
      } else if (sec.type === 'signatures') {
        htmlSections += `
          <div style="${styleString} margin-top: 35px; display: flex; justify-content: space-between; font-size: 11px;">
            <div style="text-align: center; width: 180px; border-top: 1px solid #000; padding-top: 4px;">Prepared By</div>
            <div style="text-align: center; width: 180px; border-top: 1px solid #000; padding-top: 4px;">Verified By Accountant</div>
            <div style="text-align: center; width: 180px; border-top: 1px solid #000; padding-top: 4px;">Authorized Signatory & Seal</div>
          </div>
        `;
      } else if (sec.type === 'footer') {
        htmlSections += `
          <div style="${styleString} margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            Generated by TallyFlow ERP | Official Report Statement
          </div>
        `;
      } else if (sec.type === 'divider') {
        htmlSections += `
          <div style="${styleString} margin: 12px 0; border-bottom: 1px solid #000;"></div>
        `;
      }
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report Custom Template Preview</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: ${template.fontFamily === 'Courier' ? 'monospace' : template.fontFamily === 'Times-Roman' ? 'serif' : 'sans-serif'}; background: #ffffff; color: #000000; padding: 15px; margin: 0; }
        </style>
      </head>
      <body>
        <div style="width: 760px; margin: 0 auto; background: #ffffff;">
          ${htmlSections}
        </div>
      </body>
      </html>
    `;
  };

  const handleTestDownloadPDF = () => {
    const html = generatePreviewHtml();
    downloadHtmlAsPDF(html, `Custom_Report_Template_Preview`);
  };

  const handleTestPrint = () => {
    const html = generatePreviewHtml();
    executePrint(html);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase">Elementor Report Designer & Layout Customizer</h1>
            <p className="text-xs text-slate-400">Drag & drop sections, customize table columns, fonts, borders, alignments & styles in real-time</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Preset Selector */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-medium">Preset:</span>
            <select
              value={template.id}
              onChange={(e) => {
                const presetKey = e.target.value;
                if (PRESET_TEMPLATES[presetKey]) {
                  setTemplate(PRESET_TEMPLATES[presetKey]);
                }
              }}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="tally_classic" className="bg-slate-900">Tally Classic (Monospace)</option>
              <option value="modern_minimal" className="bg-slate-900">Modern Minimalist (Clean)</option>
              <option value="corporate_formal" className="bg-slate-900">Corporate Formal (Audit)</option>
            </select>
          </div>

          <button
            onClick={() => setTemplate(PRESET_TEMPLATES.tally_classic)}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all flex items-center gap-1.5"
            title="Reset to default layout"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>

          <button
            onClick={handleTestPrint}
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all flex items-center gap-1.5 font-bold"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" /> Print Test
          </button>

          <button
            onClick={handleTestDownloadPDF}
            className="px-3 py-1.5 text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all flex items-center gap-1.5 font-bold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download PDF
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-1.5 font-bold shadow-lg shadow-emerald-900/30"
          >
            <Save className="w-4 h-4" /> Save & Apply Template
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Builder Body: Left Sidebar + Center Paper Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Inspector */}
        <div className="w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('widgets')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${activeTab === 'widgets' ? 'border-blue-500 text-blue-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Widgets & Structure
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${activeTab === 'style' ? 'border-blue-500 text-blue-400 bg-slate-800/50' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              Style Inspector
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar text-white">
            {activeTab === 'widgets' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Sections ({template.sections.length})
                </div>

                {/* Sections List */}
                <div className="space-y-2">
                  {template.sections.map((sec, index) => {
                    const isSelected = sec.id === selectedSectionId;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setSelectedSectionId(sec.id);
                          setActiveTab('style');
                        }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-blue-950/60 border-blue-500 text-white shadow-md' : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVisibility(sec.id);
                            }}
                            className={`p-1 rounded hover:bg-slate-700 ${sec.visible ? 'text-blue-400' : 'text-slate-500'}`}
                            title={sec.visible ? 'Visible' : 'Hidden'}
                          >
                            {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>

                          <span className={`text-xs font-semibold truncate ${!sec.visible && 'line-through opacity-50'}`}>
                            {sec.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={index === 0}
                            onClick={() => moveSection(index, 'up')}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded disabled:opacity-30"
                            title="Move Up"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={index === template.sections.length - 1}
                            onClick={() => moveSection(index, 'down')}
                            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded disabled:opacity-30"
                            title="Move Down"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteSection(sec.id)}
                            className="p-1 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded transition-colors"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Widget Buttons */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    + Add New Block
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addSection('custom_text')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Type className="w-3.5 h-3.5 text-emerald-400" /> Custom Notes
                    </button>
                    <button
                      onClick={() => addSection('divider')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" /> Divider Line
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'style' && (
              <div className="space-y-5">
                {selectedSection ? (
                  <>
                    <div className="pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Inspector: {selectedSection.title}
                      </span>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                        {selectedSection.type}
                      </span>
                    </div>

                    {/* Font Family */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Font Family</label>
                      <select
                        value={selectedSection.fontFamily || template.fontFamily}
                        onChange={(e) => updateSection(selectedSection.id, 'fontFamily', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="Courier">Courier (Monospace - Tally Look)</option>
                        <option value="Helvetica">Helvetica (Clean Sans-Serif)</option>
                        <option value="Inter">Inter (Modern Clean)</option>
                        <option value="Times-Roman">Times Roman (Serif)</option>
                      </select>
                    </div>

                    {/* Text Alignment */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Text Alignment</label>
                      <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-1 gap-1">
                        <button
                          onClick={() => updateSection(selectedSection.id, 'align', 'left')}
                          className={`flex-1 py-1 rounded flex justify-center ${selectedSection.align === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateSection(selectedSection.id, 'align', 'center')}
                          className={`flex-1 py-1 rounded flex justify-center ${selectedSection.align === 'center' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateSection(selectedSection.id, 'align', 'right')}
                          className={`flex-1 py-1 rounded flex justify-center ${selectedSection.align === 'right' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          <AlignRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Border Style */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">Border Style</label>
                      <select
                        value={selectedSection.borderStyle || 'none'}
                        onChange={(e) => updateSection(selectedSection.id, 'borderStyle', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="solid">Solid Line</option>
                        <option value="double">Double Line</option>
                        <option value="dashed">Dashed Line</option>
                      </select>
                    </div>

                    {/* Custom Text Content */}
                    {selectedSection.type === 'custom_text' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-300">Custom Text / Terms</label>
                        <textarea
                          value={selectedSection.customHtml || ''}
                          onChange={(e) => updateSection(selectedSection.id, 'customHtml', e.target.value)}
                          rows={3}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Table Columns Customizer */}
                    {selectedSection.type === 'data_table' && (
                      <div className="space-y-3 pt-3 border-t border-slate-800">
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                          Table Columns Visibility
                        </div>

                        <div className="space-y-1.5">
                          {Object.entries(selectedSection.visibleColumns || {}).map(([colKey, isVis]) => (
                            <label key={colKey} className="flex items-center justify-between p-2 bg-slate-800/80 rounded border border-slate-700 text-xs cursor-pointer">
                              <span className="capitalize text-slate-200">
                                {selectedSection.columnTitles?.[colKey] || colKey}
                              </span>
                              <input
                                type="checkbox"
                                checked={isVis}
                                onChange={(e) => {
                                  const updated = { ...selectedSection.visibleColumns, [colKey]: e.target.checked };
                                  updateSection(selectedSection.id, 'visibleColumns', updated);
                                }}
                                className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                              />
                            </label>
                          ))}
                        </div>

                        {/* Zebra Striping Toggle */}
                        <label className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700 text-xs cursor-pointer pt-2">
                          <span className="text-slate-200">Enable Row Zebra Striping</span>
                          <input
                            type="checkbox"
                            checked={selectedSection.zebraStriping ?? true}
                            onChange={(e) => updateSection(selectedSection.id, 'zebraStriping', e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                          />
                        </label>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Select a section from the list to edit its properties
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas Preview Paper */}
        <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex justify-center items-start">
          <div className="w-[794px] min-h-[1000px] bg-white text-black shadow-2xl rounded p-8 font-mono text-xs border border-slate-200 relative select-none">
            <div className="absolute top-2 right-3 text-[9px] text-slate-400 uppercase tracking-widest font-sans font-bold">
              A4 Live Preview (Exact Print Parity)
            </div>

            {/* Render Canvas Sections */}
            <div dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }} />
          </div>
        </div>
      </div>
    </div>
  );
}
