'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { MemberRecord, VillageStats } from '@/lib/types';
import { ArrowLeft, Printer, FileDown, CheckCircle2, Info, Loader2, ExternalLink, Calendar } from 'lucide-react';
import { calculateAgeGenderStats } from '@/lib/ageCalculations';
import TacteingDivider from './TacteingDivider';
import { DEFAULT_AVATARS } from '@/lib/orgInitialData';

interface OfficialPrintViewProps {
  records: MemberRecord[];
  stats: VillageStats;
  onBack: () => void;
}

const ROWS_PER_PAGE = 22;

export const KHMER_MONTHS = [
  'មករា',    // 1. January
  'កុម្ភៈ',    // 2. February
  'មីនា',    // 3. March
  'មេសា',    // 4. April
  'ឧសភា',   // 5. May
  'មិថុនា',  // 6. June
  'កក្កដា',   // 7. July
  'សីហា',    // 8. August
  'កញ្ញា',    // 9. September
  'តុលា',    // 10. October
  'វិច្ឆិកា',  // 11. November
  'ធ្នូ',      // 12. December
];

const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(d => khmerDigits[parseInt(d, 10)] ?? d).join('');
};

export default function OfficialPrintView({ records, stats, onBack }: OfficialPrintViewProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  // Month selection: 'auto' automatically tracks real-time current month (all 12 months)
  // or integer 0..11 for specific manual month override
  const [monthMode, setMonthMode] = useState<'auto' | number>('auto');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [fillSignatureDay, setFillSignatureDay] = useState(false);

  // Real-time Khmer Date calculations
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0 to 11
  const activeMonthIdx = monthMode === 'auto' ? currentMonthIdx : monthMode;
  const activeMonthName = KHMER_MONTHS[activeMonthIdx] ?? 'កញ្ញា';
  const activeYearKhmer = toKhmerNum(selectedYear);
  const activeDayKhmer = toKhmerNum(now.getDate());

  // Divide records into chunks of 22 per page (Official 12 member pages + 1 summary page = 13 pages total)
  const pageChunks = useMemo(() => {
    const chunks: MemberRecord[][] = [];
    for (let i = 0; i < records.length; i += ROWS_PER_PAGE) {
      chunks.push(records.slice(i, i + ROWS_PER_PAGE));
    }
    return chunks;
  }, [records]);

  const totalPages = pageChunks.length + 1;

  // Safe Print Handler with Fallback for iframes
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = 'បញ្ជីរាយនាម_សមាជិកគ្រួសារ_គណបក្សប្រជាជនកម្ពុជា_ភូមិរលួស_A4';
    
    try {
      window.print();
    } catch (err) {
      console.warn('Iframe blocked print, redirecting to dedicated tab...', err);
      window.open('/print', '_blank');
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
      }, 3000);
    }
  };

  // Direct Client-Side PDF Generation and Download for All 13 Pages
  const handleDownloadPDFDirectly = async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    setPdfStatus(`កំពុងរៀបចំឯកសារ និងបម្លែងជា PDF ទាំង ${toKhmerNum(totalPages)} ទំព័រ សូមរង់ចាំបន្តិច...`);

    try {
      const html2canvasModule = await import('html2canvas-pro');
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      const pageElements = document.querySelectorAll<HTMLElement>('.official-page-sheet');
      if (!pageElements || pageElements.length === 0) {
        throw new Error('Print canvas elements not found');
      }

      // A4 Landscape is 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 297;
      const pageHeight = 210;

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        setPdfStatus(`កំពុងបម្លែងទំព័រទី ${toKhmerNum(i + 1)} / ${toKhmerNum(pageElements.length)} ជា PDF...`);

        const canvas = await html2canvas(pageEl, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: Math.max(pageEl.scrollWidth, 1200),
          onclone: (clonedDoc) => {
            try {
              const canvasHelper = document.createElement('canvas');
              const ctx = canvasHelper.getContext('2d');
              if (!ctx) return;

              const allElements = clonedDoc.querySelectorAll('*');
              allElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                if (!htmlEl.style) return;

                const computed = window.getComputedStyle(htmlEl);
                const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];

                props.forEach((p) => {
                  const val = computed.getPropertyValue(p);
                  if (val && typeof val === 'string' && val.includes('oklch')) {
                    ctx.fillStyle = '#000000';
                    ctx.fillStyle = val;
                    htmlEl.style.setProperty(p, ctx.fillStyle, 'important');
                  }
                });
              });
            } catch (e) {
              console.warn('onclone color normalization notice:', e);
            }
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        if (i > 0) {
          pdf.addPage('a4', 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      pdf.save('បញ្ជីរាយនាម_សមាជិកគ្រួសារ_គណបក្សប្រជាជនកម្ពុជា_ភូមិរលួស_A4.pdf');
      setPdfStatus(`បានទាញយកឯកសារ PDF គ្រប់ ${toKhmerNum(totalPages)} ទំព័រ ជោគជ័យ!`);
      setTimeout(() => setPdfStatus(null), 4000);
    } catch (error) {
      console.error('Direct PDF export error:', error);
      setPdfStatus('មិនអាចទាញយក PDF ដោយផ្ទាល់បានទេ កំពុងបើកផ្ទាំង Print...');
      setTimeout(() => {
        try {
          window.print();
        } catch {
          window.open('/print', '_blank');
        }
        setPdfStatus(null);
      }, 1000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`official-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const ageStats = calculateAgeGenderStats(records);
  const totalPartyFamilyHeads = records.filter(r => r.partyRole.includes('មេគ្រួសារ')).length || stats.partyFamilyHeads;

  // Reusable Page Header for every single page
  const renderHeader = () => (
    <div className="keep-together flex items-start justify-between text-xs font-semibold text-slate-900 pb-1 mb-1 print:pb-0.5 print:mb-0.5">
      {/* Left Party Structure */}
      <div className="space-y-0.5 font-kantumruy w-1/3 flex flex-col items-start">
        <div className="inline-flex flex-col items-center">
          <div className="text-left space-y-0.5">
            <p className="font-moul text-sm text-slate-900 leading-tight">គណបក្សប្រជាជនកម្ពុជា</p>
            <p className="text-[11px] print:text-[10px]">ក្រុមការងារគណបក្សចុះមូលដ្ឋានខេត្តកំពង់ធំ</p>
            <p className="text-[11px] print:text-[10px]">ក្រុមការងារគណបក្សចុះមូលដ្ឋានស្រុកស្ទោង</p>
            <p className="text-[11px] print:text-[10px]">ក្រុមការងារគណបក្សចុះមូលដ្ឋានជួយឃុំបន្ទាយស្ទោង</p>
            <p className="font-bold text-slate-950 text-[11px] print:text-[10px]">ក្រុមការងារគណបក្សចុះមូលដ្ឋានជួយភូមិរលួស</p>
          </div>
          <TacteingDivider className="w-24 sm:w-28 h-2 text-slate-900 mt-1" />
        </div>
      </div>

      {/* Center Party Emblem */}
      <div className="flex flex-col items-center justify-center -mt-2 w-1/3 text-center">
        <div className="relative">
          <Image 
            src="/cpp-logo.png" 
            alt="សញ្ញាសម្គាល់ គណបក្សប្រជាជនកម្ពុជា" 
            width={120}
            height={120}
            className="w-20 h-20 sm:w-24 sm:h-24 print:w-20 print:h-20 object-contain filter drop-shadow-md" 
            referrerPolicy="no-referrer"
            priority
          />
        </div>
      </div>

      {/* Right Kingdom Motto */}
      <div className="flex flex-col items-end justify-start font-kantumruy w-1/3">
        <div className="text-center space-y-1">
          <p className="font-moul text-xs text-slate-950 whitespace-nowrap leading-tight">ឯករាជ្យ សន្តិភាព សេរីភាព ប្រជាធិបតេយ្យ</p>
          <p className="font-bold text-slate-900 text-[11px] print:text-[10px]">អព្យាក្រឹត និងវឌ្ឍនភាពសង្គម</p>
          <TacteingDivider className="w-24 sm:w-28 h-2 text-slate-900 mt-0.5 mx-auto" />
        </div>
      </div>
    </div>
  );

  // Reusable Page Footer for every single page
  const renderFooter = (pageIndex: number) => (
    <div className="keep-together mt-2 pt-1 border-t border-slate-400 flex items-center justify-between text-[10px] print:text-[9px] text-slate-700 font-medium">
      <div>
        គណបក្សប្រជាជនកម្ពុជា • ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង
      </div>
      <div className="text-slate-500 hidden sm:block print:block">
        ឯកសារផ្លូវការបក្សប្រជាជនកម្ពុជា • ទម្រង់ A4 Landscape
      </div>
      <div className="font-bold text-slate-950 bg-slate-100 print:bg-transparent px-2.5 py-0.5 rounded border border-slate-300 print:border-none">
        ទំព័រទី {toKhmerNum(pageIndex)} / {toKhmerNum(totalPages)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-200/80 py-6 px-2 sm:px-6">
      {/* Top Floating Action Bar (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm no-print sticky top-2 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅតារាង</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">ឯកសារបោះពុម្ពផ្លូវការ ({toKhmerNum(totalPages)} ទំព័រ)</span>
          </div>
        </div>

        {/* Action Buttons: Save PDF, Print, and Open in New Tab */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="save-pdf-btn-top"
            onClick={handleDownloadPDFDirectly}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="ទាញយក និង រក្សាទុកជាឯកសារ PDF គ្រប់ ១៣ ទំព័រ ដោយផ្ទាល់"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>កំពុងបង្កើត PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>រក្សាទុកជា PDF (គ្រប់ {toKhmerNum(totalPages)} ទំព័រ)</span>
              </>
            )}
          </button>

          <button
            id="print-btn-top"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="បោះពុម្ពឯកសារចេញតាមម៉ាស៊ីនព្រីន (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ព (Ctrl + P)</span>
          </button>

          <a
            id="open-tab-btn-top"
            href="/print"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="បើកទំព័រពេញលេញក្នុង Tab ថ្មីដើម្បី Print ងាយស្រួលបំផុត"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>បើកក្នុង Tab ថ្មី</span>
          </a>
        </div>
      </div>

      {/* Auto 12-Month Selector & Date Settings (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mb-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 text-xs no-print">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Calendar className="w-4 h-4" />
            </div>
            <span>កាលបរិច្ឆេទ / ខែរបាយការណ៍ ៖</span>
          </div>

          {/* Month Selector dropdown with Auto + all 12 Khmer months */}
          <div className="flex items-center gap-1.5">
            <select
              id="month-mode-select"
              value={monthMode === 'auto' ? 'auto' : monthMode.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setMonthMode(val === 'auto' ? 'auto' : parseInt(val, 10));
              }}
              className="bg-slate-50 hover:bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="auto">
                ⚡ ស្វ័យប្រវត្តិ Auto (ខែបច្ចុប្បន្ន ៖ ខែ{KHMER_MONTHS[currentMonthIdx]})
              </option>
              <optgroup label="ជ្រើសរើសខែជាក់លាក់ (ទាំង ១២ ខែ)">
                {KHMER_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx.toString()}>
                    ខែ{m} (ខែទី {toKhmerNum(idx + 1)})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-semibold">ឆ្នាំ ៖</span>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 hover:bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>
                  ឆ្នាំ{toKhmerNum(y)} ({y})
                </option>
              ))}
            </select>
          </div>

          {/* Live Month & Year Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-950 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>បង្ហាញលើឯកសារ ៖ <strong className="text-emerald-900 underline decoration-emerald-400 font-bold">ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}</strong></span>
            {monthMode === 'auto' ? (
              <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Auto គ្រប់ខែ
              </span>
            ) : (
              <button
                onClick={() => setMonthMode('auto')}
                className="text-[10px] text-emerald-700 underline hover:text-emerald-900 font-bold ml-1 cursor-pointer"
                title="ប្តូរទៅជា Auto វិញ"
              >
                (ត្រឡប់ទៅ Auto)
              </button>
            )}
          </div>
        </div>

        {/* Toggle Day on Signatures */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
          <input
            type="checkbox"
            id="toggle-signature-day"
            checked={fillSignatureDay}
            onChange={(e) => setFillSignatureDay(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-[11.5px] font-medium">
            បំពេញថ្ងៃទីស្វ័យប្រវត្តក្នុងហត្ថលេខា (ថ្ងៃទី {activeDayKhmer})
          </span>
        </label>
      </div>

      {/* Quick Page Jump Navigation (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mb-6 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-print text-xs font-medium">
        <span className="text-slate-600 shrink-0 font-semibold">លោតទៅទំព័រ ៖</span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {pageChunks.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToPage(idx + 1)}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950 font-bold transition-colors cursor-pointer shrink-0"
            >
              ទំព័រ {toKhmerNum(idx + 1)}
            </button>
          ))}
          <button
            onClick={() => scrollToPage(totalPages)}
            className="px-3 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold transition-colors cursor-pointer shrink-0"
          >
            ទំព័រ {toKhmerNum(totalPages)} (សង្ខេប)
          </button>
        </div>
      </div>

      {/* Helpful Toast for Save as PDF / Status */}
      {pdfStatus && (
        <div className="max-w-7xl mx-auto mb-4 bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-xl shadow-md flex items-center justify-between gap-3 text-xs no-print animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            {isExportingPDF ? (
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            )}
            <p className="font-semibold">{pdfStatus}</p>
          </div>
          <button
            onClick={() => setPdfStatus(null)}
            className="text-emerald-800 hover:text-emerald-950 font-bold px-2 py-1 rounded hover:bg-emerald-100 cursor-pointer"
          >
            បិទ
          </button>
        </div>
      )}

      {/* RENDER ALL INDIVIDUAL A4 SHEETS */}
      <div id="official-print-document" className="space-y-8 print:space-y-0">
        {/* Pages 1 to 12: Member List Pages */}
        {pageChunks.map((chunk, pageIndex) => {
          const currentPageNum = pageIndex + 1;
          return (
            <div
              key={`page-${currentPageNum}`}
              id={`official-page-${currentPageNum}`}
              className="official-page-sheet max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none flex flex-col justify-between"
            >
              <div>
                {/* Official Page Header */}
                {renderHeader()}

                {/* Page Title */}
                <div className="keep-together text-center my-2.5 print:my-1 space-y-0.5">
                  <h1 className="font-moul text-sm sm:text-base print:text-[13.5px] text-slate-950 tracking-wide">
                    បញ្ជីរាយនាម សមាជិកគ្រួសារ គណបក្សប្រជាជនកម្ពុជា
                  </h1>
                  <p className="text-[11px] sm:text-xs print:text-[10px] font-semibold text-slate-800">
                    ក្នុងភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
                  </p>
                </div>

                {/* Clear, Pristine Table */}
                <div className="overflow-x-visible">
                  <table className="w-full border-collapse border-2 border-slate-900 text-[10.5px] print:text-[9.2px] leading-tight text-slate-950">
                    <thead className="print:table-header-group">
                      {/* Top Header Row with larger font, elegant spacing, and clear hierarchy */}
                      <tr className="bg-slate-100 text-slate-950 text-center font-bold font-kantumruy border-b border-slate-900">
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-8 align-middle text-xs sm:text-[13px] print:text-[11px] font-bold">
                          ល.រ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-12 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          រូបថត<br /><span className="text-[9.5px]">3x4</span>
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1.5 print:py-2 print:px-1 w-36 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          នាមត្រកូល-នាមខ្លួន
                          <span className="block font-medium text-[10.5px] sm:text-[11px] print:text-[9.5px] text-slate-700 mt-0.5">(មេគ្រួសារ)</span>
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-9 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          ភេទ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-10 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          អាយុ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-22 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          ថ្ងៃខែឆ្នាំ<br />កំណើត
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1.5 print:py-2 print:px-1 w-26 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          លេខអត្ត<br />សញ្ញាណប័ណ្ណ
                        </th>
                        <th colSpan={4} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          បញ្ជី គជប
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-11 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          ក្រុម<br />បក្ស
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-22 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          តួនាទី<br />ក្នុងបក្ស
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1 print:py-2 print:px-0.5 w-16 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          មុខរបរ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2.5 px-1.5 print:py-2 print:px-1 w-32 align-middle text-xs sm:text-[13px] print:text-[11.5px] font-bold">
                          ផ្សេងៗ
                        </th>
                      </tr>
                      {/* Sub Header Row */}
                      <tr className="bg-slate-100 text-slate-950 text-center font-bold font-kantumruy border-b-2 border-slate-900">
                        <th className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-28 text-[11px] sm:text-[11.5px] print:text-[10px] font-bold align-middle">
                          ឈ្មោះការិ
                        </th>
                        <th className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-12 text-[11px] sm:text-[11.5px] print:text-[10px] font-bold align-middle">
                          កូដឃុំ
                        </th>
                        <th className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-14 text-[11px] sm:text-[11.5px] print:text-[10px] font-bold align-middle">
                          លេខការិ
                        </th>
                        <th className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-14 text-[11px] sm:text-[11.5px] print:text-[10px] font-bold align-middle">
                          ល.រ គជប
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((r) => (
                        <tr key={r.id} className="text-center hover:bg-slate-50/50 break-inside-avoid print:break-inside-avoid">
                          <td className="border border-slate-900 p-1 print:p-0.5 font-medium">{r.id}</td>
                          <td className="border border-slate-900 p-0.5 text-center align-middle">
                            <div className="w-7 h-9 mx-auto rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-300">
                              <img
                                src={r.photoUrl || (r.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                                alt="3x4"
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                          </td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-left font-semibold">{r.fullName}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5">{r.gender}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 font-medium">{r.age}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-slate-700">{r.dob}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-slate-900 font-mono text-[9.5px] print:text-[8.5px]">{r.idCardNo}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-left text-[9.5px] print:text-[8.5px] truncate max-w-[120px]">{r.necOffice}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-slate-700">{r.communeCode}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-slate-700">{r.officeNo}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-slate-800 font-medium">{r.necOrderNo}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 font-bold text-slate-900">{r.partyGroup}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 font-medium">{r.partyRole}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5">{r.occupation}</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-left text-[9.5px] print:text-[8.5px]">{r.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Page Footer */}
              {renderFooter(currentPageNum)}
            </div>
          );
        })}

        {/* Page 13: Exact Official Summary & Signatures Sheet */}
        <div
          key="page-summary"
          id={`official-page-${totalPages}`}
          className="official-page-sheet max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none flex flex-col justify-between"
        >
          <div>
            {/* Official Header */}
            {renderHeader()}

            {/* Official Age & Gender Breakdown Table */}
            <div className="keep-together space-y-2 mt-4 print:mt-2">
              <div className="text-center py-1">
                <h3 className="font-moul text-xs sm:text-sm text-slate-950">
                  តារាងសរុបសមាជិកបក្ស ស្រី និង ប្រុស តាមក្រុមអាយុ (ភូមិរលួស)
                </h3>
              </div>
              <table className="w-full border-collapse border-2 border-slate-900 text-center text-[11px] print:text-[9.5px] leading-tight text-slate-950">
                <thead className="print:table-header-group">
                  <tr className="bg-slate-100 font-bold font-kantumruy text-slate-950 border-b-2 border-slate-900">
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-10 text-xs sm:text-[12.5px] print:text-[11px] font-bold">ល.រ</th>
                    <th className="border border-slate-900 py-2.5 px-2 print:py-1.5 print:px-1 text-left text-xs sm:text-[12.5px] print:text-[11px] font-bold">ក្រុមអាយុ</th>
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-20 text-xs sm:text-[12.5px] print:text-[11px] font-bold">សរុប (នាក់)</th>
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-20 text-rose-900 text-xs sm:text-[12.5px] print:text-[11px] font-bold">ស្រី (នាក់)</th>
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-20 text-rose-900 text-xs sm:text-[12.5px] print:text-[11px] font-bold">ភាគរយស្រី</th>
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-20 text-blue-900 text-xs sm:text-[12.5px] print:text-[11px] font-bold">ប្រុស (នាក់)</th>
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-20 text-blue-900 text-xs sm:text-[12.5px] print:text-[11px] font-bold">ភាគរយប្រុស</th>
                    <th className="border border-slate-900 py-2.5 px-1.5 print:py-1.5 print:px-1 w-24 text-xs sm:text-[12.5px] print:text-[11px] font-bold">មេគ្រួសារបក្ស</th>
                    <th className="border border-slate-900 py-2.5 px-2 print:py-1.5 print:px-1 w-28 text-xs sm:text-[12.5px] print:text-[11px] font-bold">សម្គាល់</th>
                  </tr>
                </thead>
                <tbody>
                  {ageStats.groupStats.map((group, idx) => (
                    <tr key={group.id} className="hover:bg-slate-50/50 break-inside-avoid print:break-inside-avoid">
                      <td className="border border-slate-900 p-1 font-medium">{idx + 1}</td>
                      <td className="border border-slate-900 p-1 text-left font-semibold">
                        {group.label}
                        <span className="text-[10px] text-slate-600 font-normal ml-1">
                          ({group.id === '18-35' ? 'យុវជន' : group.id === '65plus' ? 'ចាស់ជរា' : group.id === '36-50' ? 'វ័យកណ្តាល' : group.id === '51-64' ? 'វ័យចំណាស់' : 'កុមារ'})
                        </span>
                      </td>
                      <td className="border border-slate-900 p-1 font-bold text-slate-950">{group.totalCount}</td>
                      <td className="border border-slate-900 p-1 font-bold text-rose-900">{group.femaleCount}</td>
                      <td className="border border-slate-900 p-1 text-rose-900 font-medium">{group.femaleRatio}%</td>
                      <td className="border border-slate-900 p-1 font-bold text-blue-900">{group.maleCount}</td>
                      <td className="border border-slate-900 p-1 text-blue-900 font-medium">{group.maleRatio}%</td>
                      <td className="border border-slate-900 p-1 font-medium">{group.totalFamilyHeads} នាក់</td>
                      <td className="border border-slate-900 p-1 text-slate-600 text-[10px]">{group.subLabel || ''}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-100 font-bold text-slate-950 text-center break-inside-avoid print:break-inside-avoid">
                    <td colSpan={2} className="border border-slate-900 p-1.5 print:p-1 text-center">
                      សរុបរួមសមាជិកបក្សទាំងអស់
                    </td>
                    <td className="border border-slate-900 p-1.5 print:p-1 font-bold">{ageStats.total} នាក់</td>
                    <td className="border border-slate-900 p-1.5 print:p-1 font-bold text-rose-950">{ageStats.femaleTotal} នាក់</td>
                    <td className="border border-slate-900 p-1.5 print:p-1 text-rose-950">{ageStats.femalePercentage}%</td>
                    <td className="border border-slate-900 p-1.5 print:p-1 font-bold text-blue-950">{ageStats.maleTotal} នាក់</td>
                    <td className="border border-slate-900 p-1.5 print:p-1 text-blue-950">{ageStats.malePercentage}%</td>
                    <td className="border border-slate-900 p-1.5 print:p-1">{totalPartyFamilyHeads} នាក់</td>
                    <td className="border border-slate-900 p-1.5 print:p-1 text-[10px]">ភាគរយ {stats.percentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures Block with លោក ផូ វុធ */}
            <div className="keep-together pt-6 border-t border-slate-300 print:pt-4 print:mt-4">
              <div className="flex items-start justify-between text-center pt-2">
                <div className="space-y-1 w-64">
                  <p className="font-semibold text-slate-800">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី........... '}
                    ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
                  </p>
                  <p className="font-moul text-xs pt-16 print:pt-12 text-slate-950">មេភូមិ {stats.villageHead}</p>
                </div>

                <div className="space-y-1 w-72">
                  <p className="font-semibold text-slate-800">ប្រធានក្រុមការងារចុះជួយភូមិរលួស</p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី........... '}
                    ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
                  </p>
                  <p className="font-moul text-xs pt-16 print:pt-12 text-slate-950">លោក {stats.teamLeader || 'ផូ វុធ'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Page Footer for Page 13 */}
          {renderFooter(totalPages)}
        </div>
      </div>

      {/* Bottom Action Bar (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            ឯកសារត្រូវបានរៀបចំជាទម្រង់ A4 Landscape គ្រប់ចំនួន {toKhmerNum(totalPages)} ទំព័រ (តារាងសមាជិក {toKhmerNum(pageChunks.length)} ទំព័រ + តារាងសង្ខេប ១ ទំព័រ) ច្បាស់លាស់ មិនដាច់ ឬបាត់ទិន្នន័យឡើយ។
          </span>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅតារាង</span>
          </button>

          <button
            id="save-pdf-btn-bottom"
            onClick={handleDownloadPDFDirectly}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>កំពុងបង្កើត PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>រក្សាទុកជា PDF (គ្រប់ {toKhmerNum(totalPages)} ទំព័រ)</span>
              </>
            )}
          </button>

          <button
            id="print-btn-bottom"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ព (Ctrl + P)</span>
          </button>

          <a
            id="open-tab-btn-bottom"
            href="/print"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>បើកក្នុង Tab ថ្មី</span>
          </a>
        </div>
      </div>
    </div>
  );
}
