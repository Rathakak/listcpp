'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { MemberRecord, VillageStats } from '@/lib/types';
import { ArrowLeft, Printer, FileDown, CheckCircle2, Info, Loader2, ExternalLink, Calendar, Users, Download, Filter, CheckSquare, Layers, X, BookOpen } from 'lucide-react';
import { calculateAgeGenderStats } from '@/lib/ageCalculations';
import TacteingDivider from './TacteingDivider';
import { DEFAULT_AVATARS } from '@/lib/orgInitialData';
import { exportToExcel } from '@/lib/spreadsheetHelpers';

interface OfficialPrintViewProps {
  records: MemberRecord[];
  stats: VillageStats;
  initialGroup?: number | 'all';
  autoPrint?: boolean;
  onBack: () => void;
}

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

export const getGroupLeaderName = (records: MemberRecord[], groupNumber: number): string => {
  const groupMembers = records.filter(r => r.partyGroup === groupNumber);
  const leader = groupMembers.find(r => 
    r.partyRole.includes('ប្រធានក្រុម') || 
    r.partyRole.includes('មេក្រុម') ||
    r.partyRole.startsWith('ប្រធាន')
  );
  if (leader) return leader.fullName;
  const deputy = groupMembers.find(r => r.partyRole.includes('អនុ'));
  if (deputy) return deputy.fullName;
  return groupMembers[0]?.fullName || '';
};

interface PrintablePage {
  id: string;
  pageNumber: number;
  type: 'groupMembers' | 'continuousMembers' | 'summary';
  groupNumber?: number;
  records?: MemberRecord[];
  allGroupRecords?: MemberRecord[];
  isLastPageOfGroup?: boolean;
  groupTitle?: string;
  startIndex?: number;
  groupTotalMembers?: number;
  groupLeaderName?: string;
}

export default function OfficialPrintView({ records, stats, initialGroup = 'all', autoPrint = false, onBack }: OfficialPrintViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<'all' | number>(initialGroup);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Left Paper Margin for Book Binding (user request: "ចង់តម្រឹមក្រដាសខាងឆ្វេង 1,2cm សំរាប់បោះពុម្ភធ្វើជាសៀវភៅ")
  // Default to 1.2 cm (12mm)
  const [leftMarginCm, setLeftMarginCm] = useState<number>(1.2);
  const [showBindingGuide, setShowBindingGuide] = useState<boolean>(true);

  // Month selection: 'auto' automatically tracks real-time current month (all 12 months)
  // or integer 0..11 for specific manual month override
  const [monthMode, setMonthMode] = useState<'auto' | number>('auto');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [fillSignatureDay, setFillSignatureDay] = useState(false);

  // Footer Signatures for each group (user request)
  const [showGroupFooterSignatures, setShowGroupFooterSignatures] = useState(true);
  // Group Leader Signature (user request: "ដាក់អោយប្រធានក្រុមមានចុះហត្ថលេខា")
  const [showGroupLeaderSignature, setShowGroupLeaderSignature] = useState(true);
  // Group Age & Gender Summary (user request: "បូកសរុប ស្រី ប្រុស តាមអាយុតាមក្រុមនីមួយៗ")
  const [showGroupAgeSummary, setShowGroupAgeSummary] = useState(true);

  // Group Layout Mode when printing all groups: 'byGroup' (1 group per page with footer) or 'continuous' (22 rows/page)
  const [groupLayoutMode, setGroupLayoutMode] = useState<'byGroup' | 'continuous'>('byGroup');
  // Include final village/group summary sheet
  const [includeSummarySheet, setIncludeSummarySheet] = useState(true);
  // Renumber 1, 2, 3... per group
  const [renumberByGroup, setRenumberByGroup] = useState(true);
  // Notes column toggle (user request: "កំសម្គាល់នៅមុខ ផ្សេងឬផ្សេងកែទៅ ស្ថានគ្រួសារ")
  const [showNotesColumn, setShowNotesColumn] = useState(true);

  // Real-time Khmer Date calculations
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0 to 11
  const activeMonthIdx = monthMode === 'auto' ? currentMonthIdx : monthMode;
  const activeMonthName = KHMER_MONTHS[activeMonthIdx] ?? 'កញ្ញា';
  const activeYearKhmer = toKhmerNum(selectedYear);
  const activeDayKhmer = toKhmerNum(now.getDate());

  // Extract all existing groups in records
  const availableGroups = useMemo(() => {
    const groups = new Set<number>();
    records.forEach(r => {
      if (r.partyGroup) groups.add(r.partyGroup);
    });
    return Array.from(groups).sort((a, b) => a - b);
  }, [records]);

  // Filter records by selected group
  const filteredRecords = useMemo(() => {
    if (selectedGroup === 'all') return records;
    return records.filter(r => r.partyGroup === selectedGroup);
  }, [records, selectedGroup]);

  // Precompute comprehensive stats for every group
  const groupStatsMap = useMemo(() => {
    const map = new Map<number, {
      total: number;
      femaleTotal: number;
      maleTotal: number;
      femalePercentage: number;
      malePercentage: number;
      totalFamilyHeads: number;
      femaleFamilyHeads: number;
      maleFamilyHeads: number;
      youthTotal: number;
      youthFemale: number;
      youthMale: number;
      midTotal: number;
      midFemale: number;
      midMale: number;
      seniorTotal: number;
      seniorFemale: number;
      seniorMale: number;
      elderlyTotal: number;
      elderlyFemale: number;
      elderlyMale: number;
      under18Total: number;
      under18Female: number;
      under18Male: number;
      leaderName: string;
    }>();

    availableGroups.forEach((grp) => {
      const grpRecords = records.filter(r => r.partyGroup === grp);
      const total = grpRecords.length;
      const femaleRecords = grpRecords.filter(r => r.gender === 'ស');
      const maleRecords = grpRecords.filter(r => r.gender === 'ប');
      const femaleTotal = femaleRecords.length;
      const maleTotal = maleRecords.length;
      const femalePercentage = total > 0 ? Number(((femaleTotal / total) * 100).toFixed(1)) : 0;
      const malePercentage = total > 0 ? Number(((maleTotal / total) * 100).toFixed(1)) : 0;

      const totalFamilyHeads = grpRecords.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;
      const femaleFamilyHeads = femaleRecords.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;
      const maleFamilyHeads = totalFamilyHeads - femaleFamilyHeads;

      const under18 = grpRecords.filter(r => r.age > 0 && r.age < 18);
      const youth = grpRecords.filter(r => r.age >= 18 && r.age <= 35);
      const mid = grpRecords.filter(r => r.age >= 36 && r.age <= 50);
      const senior = grpRecords.filter(r => r.age >= 51 && r.age <= 64);
      const elderly = grpRecords.filter(r => r.age >= 65);

      const leaderName = getGroupLeaderName(records, grp);

      map.set(grp, {
        total,
        femaleTotal,
        maleTotal,
        femalePercentage,
        malePercentage,
        totalFamilyHeads,
        femaleFamilyHeads,
        maleFamilyHeads,
        youthTotal: youth.length,
        youthFemale: youth.filter(r => r.gender === 'ស').length,
        youthMale: youth.filter(r => r.gender === 'ប').length,
        midTotal: mid.length,
        midFemale: mid.filter(r => r.gender === 'ស').length,
        midMale: mid.filter(r => r.gender === 'ប').length,
        seniorTotal: senior.length,
        seniorFemale: senior.filter(r => r.gender === 'ស').length,
        seniorMale: senior.filter(r => r.gender === 'ប').length,
        elderlyTotal: elderly.length,
        elderlyFemale: elderly.filter(r => r.gender === 'ស').length,
        elderlyMale: elderly.filter(r => r.gender === 'ប').length,
        under18Total: under18.length,
        under18Female: under18.filter(r => r.gender === 'ស').length,
        under18Male: under18.filter(r => r.gender === 'ប').length,
        leaderName,
      });
    });

    return map;
  }, [availableGroups, records]);

  // Generate discrete Printable Pages
  const printablePages = useMemo(() => {
    const pages: PrintablePage[] = [];
    let pageNum = 1;

    // Mode A: Single Group Selected
    if (selectedGroup !== 'all') {
      const groupRecords = records.filter(r => r.partyGroup === selectedGroup);
      const CHUNK_SIZE = 16; // 16 rows + summary + signature block fits cleanly on A4 Landscape
      const chunks: MemberRecord[][] = [];
      if (groupRecords.length === 0) {
        chunks.push([]);
      } else {
        for (let i = 0; i < groupRecords.length; i += CHUNK_SIZE) {
          chunks.push(groupRecords.slice(i, i + CHUNK_SIZE));
        }
      }

      chunks.forEach((chunk, idx) => {
        const isLast = idx === chunks.length - 1;
        pages.push({
          id: `group-${selectedGroup}-page-${idx + 1}`,
          pageNumber: pageNum++,
          type: 'groupMembers',
          groupNumber: selectedGroup,
          records: chunk,
          allGroupRecords: groupRecords,
          isLastPageOfGroup: isLast,
          groupTitle: `ក្រុមបក្សទី ${toKhmerNum(selectedGroup)} ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ${activeMonthName} ឆ្នាំ${activeYearKhmer}`,
          startIndex: idx * CHUNK_SIZE,
          groupTotalMembers: groupRecords.length,
          groupLeaderName: getGroupLeaderName(records, selectedGroup),
        });
      });

      if (includeSummarySheet) {
        pages.push({
          id: `summary-page-group-${selectedGroup}`,
          pageNumber: pageNum++,
          type: 'summary',
          groupNumber: selectedGroup,
          groupLeaderName: getGroupLeaderName(records, selectedGroup),
        });
      }
    } else {
      // Mode B: All Groups ('all')
      if (groupLayoutMode === 'byGroup') {
        // Group-by-Group: Each group gets its own page(s) with its own signature footer & age summary!
        availableGroups.forEach((grp) => {
          const groupRecords = records.filter(r => r.partyGroup === grp);
          const CHUNK_SIZE = 16;
          const chunks: MemberRecord[][] = [];
          if (groupRecords.length === 0) {
            chunks.push([]);
          } else {
            for (let i = 0; i < groupRecords.length; i += CHUNK_SIZE) {
              chunks.push(groupRecords.slice(i, i + CHUNK_SIZE));
            }
          }

          chunks.forEach((chunk, idx) => {
            const isLast = idx === chunks.length - 1;
            pages.push({
              id: `group-${grp}-page-${idx + 1}`,
              pageNumber: pageNum++,
              type: 'groupMembers',
              groupNumber: grp,
              records: chunk,
              allGroupRecords: groupRecords,
              isLastPageOfGroup: isLast,
              groupTitle: `ក្រុមបក្សទី ${toKhmerNum(grp)} ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ${activeMonthName} ឆ្នាំ${activeYearKhmer}`,
              startIndex: idx * CHUNK_SIZE,
              groupTotalMembers: groupRecords.length,
              groupLeaderName: getGroupLeaderName(records, grp),
            });
          });
        });

        if (includeSummarySheet) {
          pages.push({
            id: 'summary-page-all',
            pageNumber: pageNum++,
            type: 'summary',
          });
        }
      } else {
        // Continuous mode: 22 rows per page
        const CHUNK_SIZE = 22;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
          const chunk = records.slice(i, i + CHUNK_SIZE);
          const pageIndex = Math.floor(i / CHUNK_SIZE);
          pages.push({
            id: `continuous-page-${pageIndex + 1}`,
            pageNumber: pageNum++,
            type: 'continuousMembers',
            records: chunk,
            isLastPageOfGroup: false,
            groupTitle: `ក្នុងភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ${activeMonthName} ឆ្នាំ${activeYearKhmer}`,
            startIndex: i,
            groupTotalMembers: records.length,
          });
        }

        if (includeSummarySheet) {
          pages.push({
            id: 'summary-page-continuous',
            pageNumber: pageNum++,
            type: 'summary',
          });
        }
      }
    }

    return pages;
  }, [selectedGroup, records, availableGroups, groupLayoutMode, includeSummarySheet, activeMonthName, activeYearKhmer]);

  const totalPages = printablePages.length;

  // Auto Print effect when autoPrint prop is true
  React.useEffect(() => {
    if (autoPrint) {
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
      const timer = setTimeout(() => {
        if (isInIframe) {
          setIsPrintModalOpen(true);
        } else {
          try {
            window.print();
          } catch (e) {
            console.warn('Auto print error:', e);
            setIsPrintModalOpen(true);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  // Safe Print Handler with Fallback for iframes
  const handlePrint = () => {
    const originalTitle = document.title;
    const groupName = selectedGroup === 'all'
      ? (groupLayoutMode === 'byGroup' ? 'គ្រប់ក្រុម_តាមក្រុមនីមួយៗ' : 'គ្រប់ក្រុមទាំងអស់')
      : `ក្រុមទី${toKhmerNum(selectedGroup)}`;
    document.title = `បញ្ជីរាយនាម_សមាជិកគ្រួសារ_គណបក្សប្រជាជនកម្ពុជា_${groupName}_ភូមិរលួស_A4`;
    
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (isInIframe) {
      // In sandboxed iframes (e.g. AI Studio preview), browser security strictly blocks window.print()
      // We open the dedicated Print Options modal with 100% working PDF & new tab direct print
      setIsPrintModalOpen(true);
      try {
        window.print();
      } catch (err) {
        console.warn('Iframe print blocked:', err);
      }
    } else {
      try {
        window.print();
      } catch (err) {
        console.warn('Direct print failed, opening print options modal...', err);
        setIsPrintModalOpen(true);
      }
    }

    setTimeout(() => {
      document.title = originalTitle;
    }, 4000);
  };

  // Direct Client-Side PDF Generation and Download for Filtered Group Pages
  const handleDownloadPDFDirectly = async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    const groupLabel = selectedGroup === 'all' 
      ? `គ្រប់ ${toKhmerNum(totalPages)} ទំព័រ` 
      : `ក្រុមទី ${toKhmerNum(selectedGroup)} (${toKhmerNum(totalPages)} ទំព័រ)`;
    setPdfStatus(`កំពុងរៀបចំឯកសារ និងបម្លែងជា PDF សម្រាប់ ${groupLabel} សូមរង់ចាំបន្តិច...`);

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

      // Exact Left Margin for Book Binding (user request: 1.2cm = 12mm)
      const marginL = leftMarginCm * 10; // e.g. 1.2 * 10 = 12mm
      const marginR = 6; // 6mm
      const marginT = 5; // 5mm
      const marginB = 5; // 5mm
      const contentW = pageWidth - marginL - marginR; // 297 - 12 - 6 = 279mm
      const contentH = pageHeight - marginT - marginB; // 210 - 5 - 5 = 200mm

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        setPdfStatus(`កំពុងបម្លែងទំព័រទី ${toKhmerNum(i + 1)} / ${toKhmerNum(pageElements.length)} ជា PDF (គែមឆ្វេង ${leftMarginCm}cm)...`);

        const canvas = await html2canvas(pageEl, {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: Math.max(pageEl.scrollWidth, 1200),
          onclone: (clonedDoc) => {
            try {
              // Hide on-screen binding guide lines in cloned doc so they are not captured in PDF
              const guides = clonedDoc.querySelectorAll('.binding-guide-line');
              guides.forEach((g) => {
                (g as HTMLElement).style.display = 'none';
              });

              // Clean cloned page sheet of outer padding/border/shadow
              const clonedPage = clonedDoc.getElementById(pageEl.id);
              if (clonedPage) {
                clonedPage.style.boxShadow = 'none';
                clonedPage.style.border = 'none';
                clonedPage.style.borderRadius = '0px';
                clonedPage.style.padding = '0px';
                clonedPage.style.margin = '0px';
              }

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

        // Output image with calibrated left margin for book binding
        pdf.addImage(imgData, 'JPEG', marginL, marginT, contentW, contentH);
      }

      const pdfFileName = selectedGroup === 'all'
        ? `បញ្ជីរាយនាម_សមាជិកគ្រួសារ_គណបក្សប្រជាជនកម្ពុជា_ភូមិរលួស_${groupLayoutMode === 'byGroup' ? 'តាមក្រុមនីមួយៗ' : 'គ្រប់ក្រុម'}_A4.pdf`
        : `បញ្ជីរាយនាម_សមាជិកគ្រួសារ_គណបក្សប្រជាជនកម្ពុជា_ភូមិរលួស_ក្រុមទី${toKhmerNum(selectedGroup)}_A4.pdf`;
      pdf.save(pdfFileName);
      setPdfStatus(`បានទាញយកឯកសារ PDF សម្រាប់ ${groupLabel} ជោគជ័យ!`);
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

  const ageStats = useMemo(() => calculateAgeGenderStats(filteredRecords), [filteredRecords]);
  const totalPartyFamilyHeads = filteredRecords.filter(r => r.partyRole.includes('មេគ្រួសារ')).length || (selectedGroup === 'all' ? stats.partyFamilyHeads : 0);

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

      {/* Right Party Motto (CPP Official Administrative Motto) */}
      <div className="flex flex-col items-end justify-start font-kantumruy flex-1 max-w-[42%]">
        <div className="inline-flex flex-col items-center text-center">
          <div className="text-center space-y-0.5">
            <p className="font-moul text-xs sm:text-[12.5px] print:text-[10.5px] text-slate-900 leading-tight whitespace-nowrap">
              ឯករាជ្យ សន្តិភាព សេរីភាព ប្រជាធិបតេយ្យ
            </p>
            <p className="font-moul text-[11px] sm:text-[11.5px] print:text-[9.5px] text-slate-900 leading-tight whitespace-nowrap">
              អព្យាក្រឹត្យ និងវឌ្ឍនភាពសង្គម
            </p>
          </div>
          <TacteingDivider className="w-24 sm:w-28 h-2 text-slate-900 mt-1" />
        </div>
      </div>
    </div>
  );

  // Official Signature Block matching administrative party format:
  // For Groups: 3-column signature block (Left: Village Head, Center: Team Leader, Right: Group Leader)
  // For Village Summary: 2-column signature block (Left: Village Head, Right: Team Leader)
  const renderSignatureBlock = (
    isGroupFooter: boolean = false,
    groupNumber?: number,
    groupLeaderName?: string
  ) => {
    const leaderDisplayName = groupLeaderName || (groupNumber ? getGroupLeaderName(records, groupNumber) : '');
    const leaderMember = groupNumber ? records.find(r => r.partyGroup === groupNumber && r.fullName === leaderDisplayName) : undefined;
    const leaderPrefix = leaderMember ? (leaderMember.gender === 'ស' ? 'លោកស្រី ' : 'លោក ') : '';

    if (groupNumber && showGroupLeaderSignature) {
      return (
        <div className={`keep-together ${isGroupFooter ? 'pt-2 mt-auto' : 'pt-4 mt-3'} border-t border-slate-400 print:pt-1.5 print:mt-auto`}>
          <div className="grid grid-cols-3 gap-2 text-center px-2 sm:px-6 print:px-3">
            {/* 1. Left: Team Leader (លោក ផូ វុធ) */}
            <div className="space-y-0.5 text-center flex flex-col items-center">
              <p className="font-semibold text-slate-950 text-xs sm:text-[12px] print:text-[10px]">
                ប្រធានក្រុមការងារចុះជួយភូមិរលួស
              </p>
              <p className="text-[10px] print:text-[9px] text-slate-700 font-medium">
                {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី......... '}
                ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
              </p>
              <div className="pt-10 print:pt-8 flex flex-col items-center">
                <p className="font-moul text-xs sm:text-[11.5px] print:text-[10px] text-slate-950">
                  លោក {stats.teamLeader || 'ផូ វុធ'}
                </p>
              </div>
            </div>

            {/* 2. Center: Village Party Branch Chief (ប្រធានសាខាគណបក្សភូមិ ជា ជី) */}
            <div className="space-y-0.5 text-center flex flex-col items-center">
              <p className="font-semibold text-slate-950 text-xs sm:text-[12px] print:text-[10px]">
                បានឃើញ និងពិនិត្យត្រឹមត្រូវ
              </p>
              <p className="text-[10px] print:text-[9px] text-slate-700 font-medium">
                {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី......... '}
                ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
              </p>
              <div className="pt-10 print:pt-8 flex flex-col items-center">
                <p className="font-moul text-xs sm:text-[11.5px] print:text-[10px] text-slate-950">
                  ប្រធានសាខាគណបក្សភូមិ {stats.villageHead || 'ជា ជី'}
                </p>
              </div>
            </div>

            {/* 3. Right: Group Leader */}
            <div className="space-y-0.5 text-center flex flex-col items-center">
              <p className="text-[10px] print:text-[9px] text-slate-700 font-medium">
                {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី......... '}
                ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
              </p>
              <p className="font-semibold text-slate-950 text-xs sm:text-[12px] print:text-[10px]">
                ប្រធានក្រុមបក្សទី {toKhmerNum(groupNumber)}
              </p>
              <div className="pt-10 print:pt-8 flex flex-col items-center">
                <p className="font-moul text-xs sm:text-[11.5px] print:text-[10px] text-slate-950">
                  {leaderDisplayName ? `${leaderPrefix}${leaderDisplayName}` : `ប្រធានក្រុមទី ${toKhmerNum(groupNumber)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default 2-column layout (Summary sheet or when group leader signature is toggled off)
    return (
      <div className={`keep-together ${isGroupFooter ? 'pt-2.5 mt-auto' : 'pt-4 mt-3'} border-t border-slate-400 print:pt-1.5 print:mt-auto`}>
        <div className="flex items-start justify-between text-center px-6 sm:px-14 print:px-10">
          {/* Left: Team Leader (លោក ផូ វុធ ដាក់នៅខាងឆ្វេង) */}
          <div className="space-y-1 w-72 text-center">
            <p className="font-semibold text-slate-950 text-xs sm:text-[13px] print:text-[11.5px]">
              ប្រធានក្រុមការងារចុះជួយភូមិរលួស
            </p>
            <p className="text-[11px] print:text-[10px] text-slate-700 font-medium">
              {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី......... '}
              ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
            </p>
            <p className="font-moul text-xs sm:text-[12.5px] print:text-[11px] pt-12 print:pt-9 text-slate-950">
              លោក {stats.teamLeader || 'ផូ វុធ'}
            </p>
          </div>

          {/* Right: Village Party Branch Chief (ប្រធានសាខាគណបក្សភូមិ ជា ជី) */}
          <div className="space-y-1 w-64 text-center">
            <p className="font-semibold text-slate-950 text-xs sm:text-[13px] print:text-[11.5px]">
              បានឃើញ និងពិនិត្យត្រឹមត្រូវ
            </p>
            <p className="text-[11px] print:text-[10px] text-slate-700 font-medium">
              {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី......... '}
              ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
            </p>
            <p className="font-moul text-xs sm:text-[12.5px] print:text-[11px] pt-12 print:pt-9 text-slate-950">
              ប្រធានសាខាគណបក្សភូមិ {stats.villageHead || 'ជា ជី'}
            </p>
          </div>
        </div>
      </div>
    );
  };

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
    <div className="min-h-screen bg-slate-200/80 py-6 px-2 sm:px-6 font-kantumruy">
      {/* Dynamic @page CSS rule for user-selected left margin (book binding gutter) */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin-top: 6mm !important;
            margin-right: 6mm !important;
            margin-bottom: 6mm !important;
            margin-left: ${leftMarginCm * 10}mm !important;
          }
        }
      `}</style>

      {/* Top Floating Action Bar (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-sm no-print sticky top-2 z-50">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅតារាង</span>
          </button>

          {/* Group Selector Listbox */}
          <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Users className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="text-xs font-bold text-emerald-950 shrink-0">ជ្រើសរើសក្រុមបក្ស ៖</span>
            <select
              id="print-group-select"
              value={selectedGroup === 'all' ? 'all' : selectedGroup.toString()}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGroup(val === 'all' ? 'all' : parseInt(val, 10));
              }}
              className="bg-white border border-emerald-400 rounded-md px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
            >
              <option value="all">
                🌟 គ្រប់ក្រុមបក្សទាំងអស់ (ក្រុម ១ ដល់ ២១ - {records.length} នាក់)
              </option>
              <optgroup label="ជ្រើសរើសតាមក្រុមនីមួយៗ (Print by Group)">
                {availableGroups.map((grp) => {
                  const count = records.filter(r => r.partyGroup === grp).length;
                  return (
                    <option key={grp} value={grp.toString()}>
                      ក្រុមបក្សទី {toKhmerNum(grp)} ({count} នាក់)
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          {/* Group Layout Mode (when 'all' is selected) */}
          {selectedGroup === 'all' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setGroupLayoutMode('byGroup')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  groupLayoutMode === 'byGroup'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="បំបែក ១ ក្រុម = ១ ទំព័រ មានហត្ថលេខានៅ Footer គ្រប់ក្រុម (សរុប ២១ ក្រុម)"
              >
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>បំបែកតាមក្រុមនីមួយៗ (មាន Footer)</span>
                </span>
              </button>
              <button
                onClick={() => setGroupLayoutMode('continuous')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  groupLayoutMode === 'continuous'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="តារាងបន្តបន្ទាប់ ២២ នាក់/ទំព័រ"
              >
                <span>តារាងបន្តបន្ទាប់</span>
              </button>
            </div>
          )}

          {/* Save Excel by Group */}
          <button
            onClick={() => {
              if (selectedGroup !== 'all') {
                exportToExcel(
                  filteredRecords, 
                  stats, 
                  `បញ្ជីរាយនាមសមាជិកបក្ស_ក្រុមទី${selectedGroup}_ភូមិរលួស.xlsx`
                );
              } else {
                exportToExcel(records, stats);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title={selectedGroup !== 'all' ? `ទាញយក Excel តែសមាជិកក្រុមទី ${selectedGroup}` : 'ទាញយក Excel គ្រប់សមាជិកទាំងអស់'}
          >
            <Download className="w-4 h-4" />
            <span>
              {selectedGroup !== 'all' ? `Excel (ក្រុមទី ${toKhmerNum(selectedGroup)})` : 'ទាញយក Excel'}
            </span>
          </button>
        </div>

        {/* Right side: Print & Direct PDF */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="header-save-pdf-direct-btn"
            onClick={handleDownloadPDFDirectly}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="ទាញយកជា PDF ដោយផ្ទាល់តាមកុំព្យូទ័រ/ទូរស័ព្ទ"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>កំពុងបង្កើត PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>
                  រក្សាទុកជា PDF {selectedGroup !== 'all' ? `(ក្រុម ${toKhmerNum(selectedGroup)})` : `(${toKhmerNum(totalPages)} ទំព័រ)`}
                </span>
              </>
            )}
          </button>

          <button
            id="header-print-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="បោះពុម្ពតាមម៉ាស៊ីនព្រីន (Ctrl + P)"
          >
            <Printer className="w-4 h-4" />
            <span>
              បោះពុម្ព {selectedGroup !== 'all' ? `(ក្រុម ${toKhmerNum(selectedGroup)})` : '(Print A4)'}
            </span>
          </button>

          <a
            href={selectedGroup !== 'all' ? `/print?group=${selectedGroup}` : '/print'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="បើកមើលក្នុងផ្ទាំង Browser ថ្មីដាច់ដោយឡែក"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tab ថ្មី</span>
          </a>
        </div>
      </div>

      {/* Date & Signature Settings Bar (Hidden during Print) */}
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
          </div>
        </div>

        {/* Checkbox Controls: Footer Signatures, Group Matrix & Leader Signature */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Toggle 21-Group Matrix (for Village overview page) */}
          {selectedGroup === 'all' && (
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg border border-emerald-300 transition-colors">
              <input
                type="checkbox"
                id="toggle-group-matrix"
                checked={showGroupAgeSummary}
                onChange={(e) => setShowGroupAgeSummary(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-[11.5px] font-bold text-emerald-950">
                តារាងប្រៀបធៀប ២១ ក្រុមបក្ស
              </span>
            </label>
          )}

          {/* Toggle Group Leader Signature (User Request) */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1.5 rounded-lg border border-blue-300 transition-colors">
            <input
              type="checkbox"
              id="toggle-group-leader-signature"
              checked={showGroupLeaderSignature}
              onChange={(e) => setShowGroupLeaderSignature(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-blue-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11.5px] font-bold text-blue-950">
              ហត្ថលេខាប្រធានក្រុមបក្ស
            </span>
          </label>

          {/* Toggle Footer Signatures for each group */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1.5 rounded-lg border border-amber-300 transition-colors">
            <input
              type="checkbox"
              id="toggle-group-footer-signatures"
              checked={showGroupFooterSignatures}
              onChange={(e) => setShowGroupFooterSignatures(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-[11.5px] font-bold text-amber-950">
              ហត្ថលេខានៅ Footer តាមក្រុម
            </span>
          </label>

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
              បំពេញថ្ងៃទី (ថ្ងៃទី {activeDayKhmer})
            </span>
          </label>

          {/* Toggle Notes Column */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1.5 rounded-lg border border-purple-300 transition-colors">
            <input
              type="checkbox"
              id="toggle-notes-column"
              checked={showNotesColumn}
              onChange={(e) => setShowNotesColumn(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-purple-400 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-[11.5px] font-bold text-purple-950">
              ជួរឈរ «កត់សម្គាល់»
            </span>
          </label>

          {/* Toggle Numbering by Group */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="toggle-renumber-group"
              checked={renumberByGroup}
              onChange={(e) => setRenumberByGroup(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-[11.5px] font-medium">
              ល.រ តាមក្រុម (១, ២, ៣...)
            </span>
          </label>

          {/* Toggle Include Summary Sheet */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="toggle-summary-sheet"
              checked={includeSummarySheet}
              onChange={(e) => setIncludeSummarySheet(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-[11.5px] font-medium">
              រួមបញ្ចូលទំព័រសង្ខេប
            </span>
          </label>

          {/* Book Binding Margin Control (User Request: 1.2cm for book binding) */}
          <div className="flex items-center gap-2 bg-indigo-50/90 hover:bg-indigo-100/90 px-2.5 py-1.5 rounded-lg border border-indigo-300 transition-colors shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <BookOpen className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span className="text-[11.5px]">គែមឆ្វេងកិបសៀវភៅ ៖</span>
            </div>
            <select
              id="book-left-margin-select"
              value={leftMarginCm.toString()}
              onChange={(e) => setLeftMarginCm(parseFloat(e.target.value))}
              className="bg-white border border-indigo-300 rounded px-2 py-0.5 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              title="កម្រាស់គែមក្រដាសខាងឆ្វេងសម្រាប់ដេរ ឬកិបជាក្បាលសៀវភៅ"
            >
              <option value="1.2">⭐ ១.២ cm (ស្តង់ដារកិបសៀវភៅ)</option>
              <option value="1.5">១.៥ cm (កិបសៀវភៅក្រាស់)</option>
              <option value="1.0">១.០ cm (កិបស្តើង)</option>
              <option value="0.6">០.៦ cm (ធម្មតា សងខាងស្មើ)</option>
            </select>
            <label className="flex items-center gap-1 cursor-pointer select-none text-indigo-900 text-[11px] font-medium" title="បង្ហាញបន្ទាត់សម្គាល់គែមកិបលើអេក្រង់">
              <input
                type="checkbox"
                checked={showBindingGuide}
                onChange={(e) => setShowBindingGuide(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>បន្ទាត់កិប</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick Page Jump Navigation (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mb-6 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-print text-xs font-medium">
        <span className="text-slate-600 shrink-0 font-semibold">លោតទៅទំព័រ ៖</span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {printablePages.map((pg) => {
            const isSummary = pg.type === 'summary';
            const label = isSummary
              ? `ទំព័រ ${toKhmerNum(pg.pageNumber)} (សង្ខេប)`
              : pg.groupNumber
              ? `ក្រុមទី ${toKhmerNum(pg.groupNumber)}`
              : `ទំព័រ ${toKhmerNum(pg.pageNumber)}`;
            return (
              <button
                key={pg.id}
                onClick={() => scrollToPage(pg.pageNumber)}
                className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer shrink-0 ${
                  isSummary
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-900'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-950'
                }`}
              >
                {label}
              </button>
            );
          })}
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
        {printablePages.map((page) => {
          const isSummary = page.type === 'summary';

          // RENDER SUMMARY SHEET
          if (isSummary) {
            const isSpecificGroup = typeof page.groupNumber === 'number';
            const currentSummaryRecords = isSpecificGroup
              ? records.filter(r => r.partyGroup === page.groupNumber)
              : records;
            const currentAgeStats = calculateAgeGenderStats(currentSummaryRecords);
            const currentFamilyHeads = currentSummaryRecords.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;

            return (
              <div
                key={page.id}
                id={`official-page-${page.pageNumber}`}
                style={{
                  paddingLeft: `${Math.max(24, Math.round(leftMarginCm * 38))}px`,
                  paddingRight: '24px',
                  paddingTop: '24px',
                  paddingBottom: '24px',
                }}
                className="relative official-page-sheet max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-slate-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none flex flex-col justify-between print:min-h-[195mm] transition-all"
              >
                {/* On-screen visual guide for book binding margin (1.2cm) */}
                {showBindingGuide && (
                  <div
                    className="binding-guide-line absolute left-0 top-0 bottom-0 pointer-events-none no-print border-r-2 border-dashed border-indigo-400/50 bg-indigo-50/15 z-10 flex flex-col justify-between select-none"
                    style={{ width: `${Math.max(24, Math.round(leftMarginCm * 38))}px` }}
                    title={`គែមខាងឆ្វេង ${leftMarginCm}cm សម្រាប់កិប/ដេរជាសៀវភៅ`}
                  >
                    <div className="p-1 flex items-center gap-1 text-[9px] font-bold text-indigo-800 bg-indigo-100/90 rounded-br-md w-fit shadow-2xs">
                      <span>📖 គែមកិប {leftMarginCm}cm</span>
                    </div>
                    <div className="flex flex-col items-center gap-8 py-4 text-indigo-400/60 font-semibold">
                      <span className="text-[10px]">✕ កិប/ដេរ</span>
                      <span className="text-[10px]">✕ កិប/ដេរ</span>
                      <span className="text-[10px]">✕ កិប/ដេរ</span>
                    </div>
                    <div className="p-1 text-[8.5px] text-center text-indigo-600 font-semibold bg-indigo-50/80">
                      Book Gutter
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col">
                  {/* Official Header */}
                  {renderHeader()}

                  {/* Official Age & Gender Breakdown Table */}
                  <div className="keep-together space-y-2 mt-3 print:mt-1.5">
                    <div className="text-center py-0.5">
                      <h3 className="font-moul text-xs sm:text-sm text-slate-950">
                        {isSpecificGroup
                          ? `តារាងបូកសរុបសមាជិកបក្ស ស្រី និង ប្រុស តាមក្រុមអាយុ ក្រុមបក្សទី ${toKhmerNum(page.groupNumber!)} (ភូមិរលួស)`
                          : 'តារាងបូកសរុបសមាជិកបក្ស ស្រី និង ប្រុស តាមក្រុមអាយុ (ភូមិរលួស)'
                        }
                      </h3>
                    </div>
                    <table className="w-full border-collapse border-2 border-slate-900 text-center text-[10.5px] print:text-[9px] leading-tight text-slate-950 font-kantumruy">
                      <thead className="print:table-header-group">
                        <tr className="bg-slate-100 font-bold text-slate-950 border-b-2 border-slate-900">
                          <th className="border border-slate-900 py-1.5 px-1 w-10 text-[11px] print:text-[10px] font-bold">ល.រ</th>
                          <th className="border border-slate-900 py-1.5 px-2 text-left text-[11px] print:text-[10px] font-bold">ក្រុមអាយុ</th>
                          <th className="border border-slate-900 py-1.5 px-1 w-20 text-[11px] print:text-[10px] font-bold">សរុប (នាក់)</th>
                          <th className="border border-slate-900 py-1.5 px-1 w-20 text-rose-900 text-[11px] print:text-[10px] font-bold">ស្រី (នាក់)</th>
                          <th className="border border-slate-900 py-1.5 px-1 w-20 text-rose-900 text-[11px] print:text-[10px] font-bold">ភាគរយស្រី</th>
                          <th className="border border-slate-900 py-1.5 px-1 w-20 text-blue-900 text-[11px] print:text-[10px] font-bold">ប្រុស (នាក់)</th>
                          <th className="border border-slate-900 py-1.5 px-1 w-20 text-blue-900 text-[11px] print:text-[10px] font-bold">ភាគរយប្រុស</th>
                          <th className="border border-slate-900 py-1.5 px-1 w-24 text-[11px] print:text-[10px] font-bold">មេគ្រួសារបក្ស</th>
                          <th className="border border-slate-900 py-1.5 px-2 w-28 text-[11px] print:text-[10px] font-bold">សម្គាល់</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAgeStats.groupStats.map((group, idx) => (
                          <tr key={group.id} className="hover:bg-slate-50/50 break-inside-avoid print:break-inside-avoid">
                            <td className="border border-slate-900 p-1 font-medium">{idx + 1}</td>
                            <td className="border border-slate-900 p-1 text-left font-semibold">
                              {group.label}
                              <span className="text-[9.5px] text-slate-600 font-normal ml-1">
                                ({group.id === '18-35' ? 'យុវជន' : group.id === '65plus' ? 'ចាស់ជរា' : group.id === '36-50' ? 'វ័យកណ្តាល' : group.id === '51-64' ? 'វ័យចំណាស់' : 'កុមារ'})
                              </span>
                            </td>
                            <td className="border border-slate-900 p-1 font-bold text-slate-950">{group.totalCount}</td>
                            <td className="border border-slate-900 p-1 font-bold text-rose-900">{group.femaleCount}</td>
                            <td className="border border-slate-900 p-1 text-rose-900 font-medium">{group.femaleRatio}%</td>
                            <td className="border border-slate-900 p-1 font-bold text-blue-900">{group.maleCount}</td>
                            <td className="border border-slate-900 p-1 text-blue-900 font-medium">{group.maleRatio}%</td>
                            <td className="border border-slate-900 p-1 font-medium">{group.totalFamilyHeads} នាក់</td>
                            <td className="border border-slate-900 p-1 text-slate-600 text-[9.5px]">{group.subLabel || ''}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-slate-100 font-bold text-slate-950 text-center break-inside-avoid print:break-inside-avoid">
                          <td colSpan={2} className="border border-slate-900 p-1 print:p-0.5 text-center font-bold">
                            {isSpecificGroup
                              ? `សរុបរួមសមាជិក ក្រុមបក្សទី ${toKhmerNum(page.groupNumber!)}`
                              : 'សរុបរួមសមាជិកបក្សទាំងអស់ (ភូមិរលួស)'
                            }
                          </td>
                          <td className="border border-slate-900 p-1 print:p-0.5 font-bold">{currentAgeStats.total} នាក់</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 font-bold text-rose-950">{currentAgeStats.femaleTotal} នាក់</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-rose-950">{currentAgeStats.femalePercentage}%</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 font-bold text-blue-950">{currentAgeStats.maleTotal} នាក់</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-blue-950">{currentAgeStats.malePercentage}%</td>
                          <td className="border border-slate-900 p-1 print:p-0.5">{currentFamilyHeads} នាក់</td>
                          <td className="border border-slate-900 p-1 print:p-0.5 text-[9.5px]">ភាគរយ {stats.percentage}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* If village-wide summary, also render the 21-group comparison matrix */}
                  {!isSpecificGroup && showGroupAgeSummary && (
                    <div className="keep-together mt-3 print:mt-2 space-y-1">
                      <div className="text-center">
                        <h4 className="font-moul text-[11px] print:text-[9.5px] text-slate-950">
                          តារាងបូកសរុប ស្រី-ប្រុស តាមក្រុមអាយុ ប្រៀបធៀបគ្រប់ ២១ ក្រុមបក្ស (ភូមិរលួស)
                        </h4>
                      </div>
                      <table className="w-full border-collapse border border-slate-900 text-center text-[9px] print:text-[7.5px] leading-tight text-slate-950 font-kantumruy">
                        <thead>
                          <tr className="bg-slate-100 font-bold border-b border-slate-900">
                            <th className="border border-slate-900 py-1 px-1 w-14">ក្រុមបក្ស</th>
                            <th className="border border-slate-900 py-1 px-1.5 text-left w-24">ប្រធានក្រុម</th>
                            <th className="border border-slate-900 py-1 px-1 font-bold">សរុប</th>
                            <th className="border border-slate-900 py-1 px-1 text-rose-950 font-bold">ស្រី</th>
                            <th className="border border-slate-900 py-1 px-1 text-rose-900">% ស្រី</th>
                            <th className="border border-slate-900 py-1 px-1 text-blue-950 font-bold">ប្រុស</th>
                            <th className="border border-slate-900 py-1 px-1 text-blue-900">% ប្រុស</th>
                            <th className="border border-slate-900 py-1 px-1">១៨-៣៥ ឆ្នាំ</th>
                            <th className="border border-slate-900 py-1 px-1">៣៦-៥០ ឆ្នាំ</th>
                            <th className="border border-slate-900 py-1 px-1">៥១-៦៤ ឆ្នាំ</th>
                            <th className="border border-slate-900 py-1 px-1">៦៥ ឆ្នាំឡើង</th>
                            <th className="border border-slate-900 py-1 px-1">មេគ្រួសារ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableGroups.map((grp) => {
                            const g = groupStatsMap.get(grp);
                            if (!g) return null;
                            return (
                              <tr key={grp} className="hover:bg-slate-50 break-inside-avoid print:break-inside-avoid">
                                <td className="border border-slate-900 py-0.5 px-1 font-bold">ក្រុម {toKhmerNum(grp)}</td>
                                <td className="border border-slate-900 py-0.5 px-1.5 text-left font-medium truncate max-w-[100px]">{g.leaderName}</td>
                                <td className="border border-slate-900 py-0.5 px-1 font-bold">{toKhmerNum(g.total)}</td>
                                <td className="border border-slate-900 py-0.5 px-1 font-bold text-rose-950">{toKhmerNum(g.femaleTotal)}</td>
                                <td className="border border-slate-900 py-0.5 px-1 text-rose-900">{toKhmerNum(g.femalePercentage)}%</td>
                                <td className="border border-slate-900 py-0.5 px-1 font-bold text-blue-950">{toKhmerNum(g.maleTotal)}</td>
                                <td className="border border-slate-900 py-0.5 px-1 text-blue-900">{toKhmerNum(g.malePercentage)}%</td>
                                <td className="border border-slate-900 py-0.5 px-1">{toKhmerNum(g.youthTotal)} <span className="text-rose-900 text-[8px]">({toKhmerNum(g.youthFemale)})</span></td>
                                <td className="border border-slate-900 py-0.5 px-1">{toKhmerNum(g.midTotal)} <span className="text-rose-900 text-[8px]">({toKhmerNum(g.midFemale)})</span></td>
                                <td className="border border-slate-900 py-0.5 px-1">{toKhmerNum(g.seniorTotal)} <span className="text-rose-900 text-[8px]">({toKhmerNum(g.seniorFemale)})</span></td>
                                <td className="border border-slate-900 py-0.5 px-1">{toKhmerNum(g.elderlyTotal)} <span className="text-rose-900 text-[8px]">({toKhmerNum(g.elderlyFemale)})</span></td>
                                <td className="border border-slate-900 py-0.5 px-1 font-medium">{toKhmerNum(g.totalFamilyHeads)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Official Signatures Block on Summary Sheet */}
                  {renderSignatureBlock(false, page.groupNumber, page.groupLeaderName)}
                </div>

                {/* Page Footer */}
                {renderFooter(page.pageNumber)}
              </div>
            );
          }

          // RENDER MEMBER ROSTER SHEET (with Footer Signatures for each group)
          const chunk = page.records || [];
          return (
            <div
              key={page.id}
              id={`official-page-${page.pageNumber}`}
              style={{
                paddingLeft: `${Math.max(24, Math.round(leftMarginCm * 38))}px`,
                paddingRight: '24px',
                paddingTop: '24px',
                paddingBottom: '24px',
              }}
              className="relative official-page-sheet max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-slate-300 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none flex flex-col justify-between print:min-h-[195mm] transition-all"
            >
              {/* On-screen visual guide for book binding margin (1.2cm) */}
              {showBindingGuide && (
                <div
                  className="binding-guide-line absolute left-0 top-0 bottom-0 pointer-events-none no-print border-r-2 border-dashed border-indigo-400/50 bg-indigo-50/15 z-10 flex flex-col justify-between select-none"
                  style={{ width: `${Math.max(24, Math.round(leftMarginCm * 38))}px` }}
                  title={`គែមខាងឆ្វេង ${leftMarginCm}cm សម្រាប់កិប/ដេរជាសៀវភៅ`}
                >
                  <div className="p-1 flex items-center gap-1 text-[9px] font-bold text-indigo-800 bg-indigo-100/90 rounded-br-md w-fit shadow-2xs">
                    <span>📖 គែមកិប {leftMarginCm}cm</span>
                  </div>
                  <div className="flex flex-col items-center gap-8 py-4 text-indigo-400/60 font-semibold">
                    <span className="text-[10px]">✕ កិប/ដេរ</span>
                    <span className="text-[10px]">✕ កិប/ដេរ</span>
                    <span className="text-[10px]">✕ កិប/ដេរ</span>
                  </div>
                  <div className="p-1 text-[8.5px] text-center text-indigo-600 font-semibold bg-indigo-50/80">
                    Book Gutter
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                {/* Official Page Header */}
                {renderHeader()}

                {/* Page Title */}
                <div className="keep-together text-center my-2.5 print:my-1 space-y-0.5">
                  <h1 className="font-moul text-sm sm:text-base print:text-[13.5px] text-slate-950 tracking-wide">
                    បញ្ជីរាយនាម សមាជិកគ្រួសារ គណបក្សប្រជាជនកម្ពុជា
                  </h1>
                  <p className="text-[11px] sm:text-xs print:text-[10px] font-semibold text-slate-800">
                    {page.groupTitle}
                  </p>
                </div>

                {/* Clear, Pristine Table */}
                <div className="overflow-x-visible">
                  <table className="w-full border-collapse border-2 border-slate-900 text-[10.5px] print:text-[9.2px] leading-tight text-slate-950">
                    <thead className="print:table-header-group">
                      {/* Top Header Row */}
                      <tr className="bg-slate-100 text-slate-950 text-center font-bold font-kantumruy border-b border-slate-900">
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-7 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          ល.រ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-9 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          រូបថត
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1.5 print:py-1.5 print:px-1 w-32 text-left align-middle text-xs sm:text-[12.5px] print:text-[10.5px] font-bold">
                          នាមត្រកូល-នាមខ្លួន
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-8 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          ភេទ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-8 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          អាយុ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-18 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          ថ្ងៃខែឆ្នាំ<br />កំណើត
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-20 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          លេខអត្ត<br />សញ្ញាណប័ណ្ណ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-18 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold bg-slate-100">
                          លេខអត្ត<br />បក្ស
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-18 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold bg-slate-100">
                          ថ្ងៃខែឆ្នាំ<br />ចូលបក្ស
                        </th>
                        <th colSpan={3} className="border border-slate-900 py-1.5 px-1 text-center text-xs sm:text-[12px] print:text-[10px] font-bold">
                          បញ្ជី គ.ជ.ប
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-10 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          ក្រុម<br />បក្ស
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-18 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          តួនាទី<br />ក្នុងបក្ស
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-12 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          មុខរបរ
                        </th>
                        <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-20 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                          ស្ថានគ្រួសារ
                        </th>
                        {showNotesColumn && (
                          <th rowSpan={2} className="border border-slate-900 py-2 px-1 print:py-1.5 print:px-0.5 w-16 align-middle text-xs sm:text-[12px] print:text-[10px] font-bold">
                            កត់សម្គាល់
                          </th>
                        )}
                      </tr>
                      {/* Sub Header Row */}
                      <tr className="bg-slate-100 text-slate-950 text-center font-bold font-kantumruy border-b-2 border-slate-900">
                        <th className="border border-slate-900 py-1.5 px-1 print:py-1 print:px-0.5 w-24 text-[10.5px] sm:text-[11px] print:text-[9.5px] font-bold align-middle">
                          ឈ្មោះការិ
                        </th>
                        <th className="border border-slate-900 py-1.5 px-1 print:py-1 print:px-0.5 w-11 text-[10.5px] sm:text-[11px] print:text-[9.5px] font-bold align-middle">
                          កូដឃុំ
                        </th>
                        <th className="border border-slate-900 py-1.5 px-1 print:py-1 print:px-0.5 w-12 text-[10.5px] sm:text-[11px] print:text-[9.5px] font-bold align-middle">
                          លេខការិ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((r, rowIdx) => {
                        const displayNo = (renumberByGroup && page.groupNumber)
                          ? (page.startIndex || 0) + rowIdx + 1
                          : r.id;
                        return (
                          <tr key={r.id} className="text-center hover:bg-slate-50/50 break-inside-avoid print:break-inside-avoid">
                            <td className="border border-slate-900 p-1 print:p-0.5 font-medium">{displayNo}</td>
                            <td className="border border-slate-900 p-0.5 text-center align-middle">
                              <div className="w-6 h-8 sm:w-7 sm:h-9 mx-auto rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-300 relative">
                                <Image
                                  src={r.photoUrl || (r.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                                  alt="3x4"
                                  width={28}
                                  height={36}
                                  unoptimized
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                            </td>
                            <td className="border border-slate-900 p-1 print:p-0.5 text-left font-semibold">{r.fullName}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5">{r.gender}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-medium">{r.age}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 whitespace-nowrap">{r.dob || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-mono text-[9.5px] print:text-[8.5px]">{r.idCardNo || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-mono text-[9.5px] print:text-[8.5px] font-medium">{r.partyCardNo || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 whitespace-nowrap text-[9px] print:text-[8px]">{r.joinDate || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 truncate max-w-[100px]" title={r.necOffice}>{r.necOffice || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-mono">{r.communeCode || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-mono">{r.officeNo || '—'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-bold">{r.partyGroup}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 font-medium text-slate-900">{r.partyRole || 'សមាជិក'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5">{r.occupation || 'កសិករ'}</td>
                            <td className="border border-slate-900 p-1 print:p-0.5 text-slate-700 text-[9px] print:text-[8px] leading-tight text-left">
                              {r.remarks || '—'}
                            </td>
                            {showNotesColumn && (
                              <td className="border border-slate-900 p-1 print:p-0.5 text-slate-700 text-[9px] print:text-[8px] leading-tight text-center">
                                {r.notes || '—'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {/* Optional Inline Total Row for Last Page of Group */}
                      {page.isLastPageOfGroup && page.groupNumber && (() => {
                        const g = groupStatsMap.get(page.groupNumber);
                        if (!g) return null;
                        return (
                          <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-950 text-center break-inside-avoid print:break-inside-avoid">
                            <td colSpan={3} className="border border-slate-900 py-1 px-1.5 text-center font-bold">
                              សរុបក្រុមទី {toKhmerNum(page.groupNumber)}
                            </td>
                            <td className="border border-slate-900 py-1 px-0.5 text-center font-bold">
                              ស {toKhmerNum(g.femaleTotal)} / ប {toKhmerNum(g.maleTotal)}
                            </td>
                            <td colSpan={2} className="border border-slate-900 py-1 px-1 text-center font-bold">
                              {toKhmerNum(g.total)} នាក់
                            </td>
                            <td colSpan={showNotesColumn ? 11 : 10} className="border border-slate-900 py-1 px-2 text-left text-[9.5px] print:text-[8.5px] font-medium">
                              ស្រី <strong>{toKhmerNum(g.femaleTotal)} នាក់</strong> ({toKhmerNum(g.femalePercentage)}%) &bull; ប្រុស <strong>{toKhmerNum(g.maleTotal)} នាក់</strong> ({toKhmerNum(g.malePercentage)}%)
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Official Signatures Footer Block for Each Group with Group Leader (User Request: "និង ដាក់អោយប្រធានក្រុមមានចុះហត្ថលេខា") */}
                {page.isLastPageOfGroup && showGroupFooterSignatures && renderSignatureBlock(true, page.groupNumber, page.groupLeaderName)}
              </div>

              {/* Official Page Footer */}
              {renderFooter(page.pageNumber)}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            ឯកសារត្រូវបានរៀបចំជាទម្រង់ A4 Landscape គ្រប់ចំនួន {toKhmerNum(totalPages)} ទំព័រ (មានហត្ថលេខានៅ Footer តាមក្រុមនីមួយៗត្រឹមត្រូវ) ច្បាស់លាស់ មិនដាច់ ឬបាត់ទិន្នន័យឡើយ។
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
                <span>
                  រក្សាទុកជា PDF {selectedGroup !== 'all' ? `(ក្រុម ${toKhmerNum(selectedGroup)})` : `(គ្រប់ ${toKhmerNum(totalPages)} ទំព័រ)`}
                </span>
              </>
            )}
          </button>

          <button
            id="print-btn-bottom"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              បោះពុម្ព {selectedGroup !== 'all' ? `(ក្រុម ${toKhmerNum(selectedGroup)})` : '(Ctrl + P)'}
            </span>
          </button>

          <a
            id="open-tab-btn-bottom"
            href={selectedGroup !== 'all' ? `/print?group=${selectedGroup}&autoprint=1` : '/print?autoprint=1'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>បើកបោះពុម្ពក្នុង Tab ថ្មី</span>
          </a>
        </div>
      </div>

      {/* Print Options Helper Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Printer className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-300 font-moul">
                    ជម្រើសបោះពុម្ពឯកសារផ្លូវការ A4
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedGroup !== 'all' ? `ក្រុមទី ${toKhmerNum(selectedGroup)}` : 'គ្រប់ក្រុមទាំងអស់'} (ចំនួនសរុប {toKhmerNum(totalPages)} ទំព័រ)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5">
              {/* Margin Notice Badge */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs">
                <BookOpen className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>
                  <strong>តម្រឹមគែមឆ្វេង ៖ {leftMarginCm} cm</strong> (បានកំណត់សម្រាប់កិប ឬដេរជាក្បាលសៀវភៅ មិនបាំងទិន្នន័យឡើយ)
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                ដើម្បីបោះពុម្ពបានច្បាស់ល្អឥតខ្ចោះ និងមិនជាប់គាំង សូមជ្រើសរើសជម្រើសសមស្របណាមួយខាងក្រោម៖
              </p>

              {/* Option 1: Direct High-Quality PDF Download */}
              <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 transition-all flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">១</span>
                    <h4 className="font-bold text-sm text-emerald-950">
                      ទាញយកជា PDF (ណែនាំខ្លាំងបំផុត - 100% ជោគជ័យ)
                    </h4>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ណែនាំ
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  បម្លែងតារាង និងរូបថតទាំងអស់ជាឯកសារ PDF A4 Landscape ពិតប្រាកដ។ រួចលោកអ្នកអាចបើកព្រីនចេញពី PDF ដោយរក្សាគុណភាពច្បាស់ 100% គ្មានខូចទ្រង់ទ្រាយ។
                </p>
                <div className="pl-8 pt-1">
                  <button
                    onClick={() => {
                      setIsPrintModalOpen(false);
                      handleDownloadPDFDirectly();
                    }}
                    disabled={isExportingPDF}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    {isExportingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>កំពុងបង្កើត PDF...</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-4 h-4" />
                        <span>ទាញយកឯកសារ PDF ({toKhmerNum(totalPages)} ទំព័រ)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option 2: Print in Dedicated New Tab */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-all flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">២</span>
                  <h4 className="font-bold text-sm text-indigo-950">
                    បើកបោះពុម្ពក្នុង Tab ថ្មី (Direct Print in New Tab)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 pl-8">
                  បើកឯកសារក្នុងផ្ទាំង Browser ថ្មីដាច់ដោយឡែក (មិនជាប់គាំងក្នុងប្រព័ន្ធ Iframe) ហើយប្រព័ន្ធនឹងបើកផ្ទាំងបោះពុម្ព (Ctrl + P) ដោយស្វ័យប្រវត្តិ។
                </p>
                <div className="pl-8 pt-1">
                  <a
                    href={selectedGroup !== 'all' ? `/print?group=${selectedGroup}&autoprint=1` : '/print?autoprint=1'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>បើកផ្ទាំងបោះពុម្ពក្នុង Tab ថ្មី</span>
                  </a>
                </div>
              </div>

              {/* Option 3: Browser Print window.print */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-500 text-white font-bold text-xs flex items-center justify-center">៣</span>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">
                      សាកល្បងបោះពុម្ពផ្ទាល់ (Direct Browser Print)
                    </h4>
                    <p className="text-[11px] text-slate-500">ដំណើរការប្រសិនបើ Browser របស់លោកអ្នកអនុញ្ញាត</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
