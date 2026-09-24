'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MemberRecord, VillageStats } from '@/lib/types';
import { COLUMN_DEFINITIONS, exportToExcel, exportToCSV, copyForGoogleSheets } from '@/lib/spreadsheetHelpers';
import AgeGenderSummary from './AgeGenderSummary';
import { 
  FileSpreadsheet, Download, Copy, Printer, FileDown, Plus, Trash2, 
  Search, Filter, Check, Edit2, RotateCcw,
  BarChart3, ChevronDown, CheckSquare, Square, Users, Calendar, X,
  AlertTriangle, Baby, ShieldCheck, Building2, Eye
} from 'lucide-react';

interface SpreadsheetViewProps {
  records: MemberRecord[];
  stats: VillageStats;
  onUpdateRecord: (updated: MemberRecord) => void;
  onAddRecord: () => void;
  onEditRecord?: (record: MemberRecord) => void;
  onDeleteRecord: (id: number) => void;
  onDeleteMultiple: (ids: number[]) => void;
  onResetData: () => void;
  onOpenStats: () => void;
  onOpenPrint: (group?: number | 'all', autoPrint?: boolean) => void;
  onOpenAgeSummary?: () => void;
  onOpenVitalReport?: () => void;
  onOpenOrgStructure?: () => void;
}

export default function SpreadsheetView({
  records,
  stats,
  onUpdateRecord,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
  onDeleteMultiple,
  onResetData,
  onOpenStats,
  onOpenPrint,
  onOpenAgeSummary,
  onOpenVitalReport,
  onOpenOrgStructure,
}: SpreadsheetViewProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedRemark, setSelectedRemark] = useState<string>('all');
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<string>('all');
  const [exactAgeFilter, setExactAgeFilter] = useState<number | null>(null);

  // Active cell state (Google Sheets style)
  const [activeCell, setActiveCell] = useState<{ rowId: number; colKey: keyof MemberRecord } | null>({
    rowId: records[0]?.id || 1,
    colKey: 'fullName',
  });
  const [editingCell, setEditingCell] = useState<{ rowId: number; colKey: keyof MemberRecord } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');
  
  // Row selection state
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Active Sheet tab: 'members' | 'ageSummary'
  const [activeTab, setActiveTab] = useState<'members' | 'ageSummary'>('members');

  const cellInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered records
  const filteredRecords = useMemo(() => {
    // Normalization helper for Khmer and Arabic numerals
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    const normalizeDigits = (str: string) => {
      let res = str;
      khmerDigits.forEach((kd, idx) => {
        res = res.replaceAll(kd, String(idx));
      });
      return res;
    };

    return records.filter((r) => {
      // Search matches (Real-time by Name, ID Card No, Row ID, NEC No, etc.)
      if (searchTerm) {
        const rawQuery = searchTerm.toLowerCase().trim();
        const normQuery = normalizeDigits(rawQuery);

        const matchesName = r.fullName.toLowerCase().includes(rawQuery);
        const matchesIdCard = r.idCardNo.toLowerCase().includes(rawQuery) || r.idCardNo.toLowerCase().includes(normQuery);
        const matchesRowId = String(r.id) === normQuery || String(r.id).includes(normQuery);
        const matchesNec = r.necOrderNo.toLowerCase().includes(rawQuery) || r.necOrderNo.toLowerCase().includes(normQuery);
        const matchesCommune = r.communeCode.toLowerCase().includes(rawQuery) || r.communeCode.toLowerCase().includes(normQuery);
        const matchesOffice = r.officeNo.toLowerCase().includes(rawQuery) || r.officeNo.toLowerCase().includes(normQuery);
        const matchesRole = r.partyRole.toLowerCase().includes(rawQuery);
        const matchesRemark = r.remarks.toLowerCase().includes(rawQuery);
        const matchesOcc = r.occupation.toLowerCase().includes(rawQuery);
        const matchesPartyCard = Boolean(r.partyCardNo && (r.partyCardNo.toLowerCase().includes(rawQuery) || r.partyCardNo.toLowerCase().includes(normQuery)));
        const matchesJoinDate = Boolean(r.joinDate && (r.joinDate.toLowerCase().includes(rawQuery) || r.joinDate.toLowerCase().includes(normQuery)));

        if (!matchesName && !matchesIdCard && !matchesRowId && !matchesNec && !matchesCommune && !matchesOffice && !matchesRole && !matchesRemark && !matchesOcc && !matchesPartyCard && !matchesJoinDate) {
          return false;
        }
      }

      // Group filter
      if (selectedGroup !== 'all' && r.partyGroup !== parseInt(selectedGroup, 10)) {
        return false;
      }

      // Gender filter
      if (selectedGender !== 'all' && r.gender !== selectedGender) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'all' && !r.partyRole.includes(selectedRole)) {
        return false;
      }

      // Remark filter
      if (selectedRemark !== 'all' && !r.remarks.includes(selectedRemark)) {
        return false;
      }

      // Age Bracket filter
      if (selectedAgeBracket !== 'all') {
        if (selectedAgeBracket === 'under18' && r.age >= 18) return false;
        if (selectedAgeBracket === '18-35' && (r.age < 18 || r.age > 35)) return false;
        if (selectedAgeBracket === '36-50' && (r.age < 36 || r.age > 50)) return false;
        if (selectedAgeBracket === '51-64' && (r.age < 51 || r.age > 64)) return false;
        if (selectedAgeBracket === '65plus' && r.age < 65) return false;
      }

      // Exact age filter
      if (exactAgeFilter !== null && r.age !== exactAgeFilter) {
        return false;
      }

      return true;
    });
  }, [records, searchTerm, selectedGroup, selectedGender, selectedRole, selectedRemark, selectedAgeBracket, exactAgeFilter]);

  // Find active record & value for Formula Bar
  const activeRecord = useMemo(() => {
    if (!activeCell) return null;
    return records.find(r => r.id === activeCell.rowId) || null;
  }, [records, activeCell]);

  const activeCellValue = useMemo(() => {
    if (!activeRecord || !activeCell) return '';
    return String(activeRecord[activeCell.colKey] ?? '');
  }, [activeRecord, activeCell]);

  // Focus inline input when editing
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
    }
  }, [editingCell]);

  // Start editing a cell
  const handleCellClick = (rowId: number, colKey: keyof MemberRecord) => {
    setActiveCell({ rowId, colKey });
  };

  const handleCellDoubleClick = (rowId: number, colKey: keyof MemberRecord, initialVal: any) => {
    setActiveCell({ rowId, colKey });
    setEditingCell({ rowId, colKey });
    setCellEditValue(String(initialVal ?? ''));
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    const target = records.find(r => r.id === editingCell.rowId);
    if (!target) return;

    let parsedVal: any = cellEditValue;
    if (editingCell.colKey === 'age' || editingCell.colKey === 'partyGroup') {
      parsedVal = parseInt(cellEditValue, 10) || 0;
    }

    onUpdateRecord({
      ...target,
      [editingCell.colKey]: parsedVal,
    });
    setEditingCell(null);
  };

  const handleFormulaBarChange = (val: string) => {
    if (!activeCell || !activeRecord) return;
    let parsedVal: any = val;
    if (activeCell.colKey === 'age' || activeCell.colKey === 'partyGroup') {
      parsedVal = parseInt(val, 10) || 0;
    }
    onUpdateRecord({
      ...activeRecord,
      [activeCell.colKey]: parsedVal,
    });
  };

  // Row selection
  const handleToggleSelectRow = (id: number) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedRowIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredRecords.map(r => r.id));
    }
  };

  // In-app Custom Confirmation Dialog State (avoids iframe blocking of native window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'multiple' | 'reset';
    recordId?: number;
    recordName?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'single',
  });

  const requestDeleteRecord = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'single',
      recordId: id,
      recordName: name,
    });
  };

  const requestDeleteSelected = () => {
    if (selectedRowIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      type: 'multiple',
      count: selectedRowIds.length,
    });
  };

  const requestResetData = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'reset',
      count: records.length,
    });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'single' && confirmDialog.recordId !== undefined) {
      onDeleteRecord(confirmDialog.recordId);
      setSelectedRowIds(prev => prev.filter(id => id !== confirmDialog.recordId));
    } else if (confirmDialog.type === 'multiple') {
      onDeleteMultiple(selectedRowIds);
      setSelectedRowIds([]);
    } else if (confirmDialog.type === 'reset') {
      onResetData();
      setSelectedRowIds([]);
    }
    setConfirmDialog({ isOpen: false, type: 'single' });
  };

  const handleCancelAction = () => {
    setConfirmDialog({ isOpen: false, type: 'single' });
  };

  useEffect(() => {
    if (!confirmDialog.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmDialog({ isOpen: false, type: 'single' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog.isOpen]);

  // Copy for Google Sheets
  const handleCopyForSheets = async () => {
    const success = await copyForGoogleSheets(filteredRecords);
    if (success) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    }
  };

  // Calculate cell position label (e.g., A1, B4)
  const cellAddress = useMemo(() => {
    if (!activeCell) return 'A1';
    const colDef = COLUMN_DEFINITIONS.find(c => c.key === activeCell.colKey);
    const letter = colDef?.colLetter || 'A';
    const rowIndex = records.findIndex(r => r.id === activeCell.rowId) + 1;
    return `${letter}${rowIndex > 0 ? rowIndex : 1}`;
  }, [activeCell, records]);

  // Unique lists for filters
  const rolesList = useMemo(() => {
    return Array.from(new Set(records.map(r => r.partyRole))).filter(Boolean);
  }, [records]);

  const remarksList = useMemo(() => {
    return Array.from(new Set(records.map(r => r.remarks))).filter(Boolean);
  }, [records]);

  return (
    <div id="google-sheets-workspace" className="flex flex-col h-full bg-slate-100 select-none">
      {/* 1. Google Sheets Style Header Banner */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
          {/* Official CPP Logo with Elegant Animation & Halo */}
          <div className="relative group shrink-0 flex items-center justify-center">
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-amber-400/35 via-rose-500/20 to-blue-600/30 blur-md animate-logo-glow pointer-events-none"></div>
            <div className="relative transition-transform duration-300 group-hover:scale-105">
              <Image 
                src="/cpp-logo.png" 
                alt="គណបក្សប្រជាជនកម្ពុជា" 
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 filter drop-shadow-md select-none animate-logo-float transition-all duration-300 group-hover:drop-shadow-lg cursor-pointer"
                referrerPolicy="no-referrer"
                priority
              />
            </div>
          </div>

          {/* Google Sheets Icon */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0 hover:bg-emerald-700 transition-transform duration-200 hover:scale-105">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-bold text-slate-950 text-base sm:text-lg md:text-xl tracking-tight font-kantumruy">
                ប្រព័ន្ធគ្រប់សមាជិកគណបក្សឃុំបន្ទាយស្ទោង
              </h1>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                .xlsx / Google Sheets
              </span>
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-800 font-medium px-2.5 py-0.5 rounded-full border border-blue-200">
                <span className="font-bold">ប្រធានក្រុមការងារ ៖</span> លោក {stats.teamLeader}
              </span>
            </div>

            {/* Menu Bar (Google Sheets) */}
            <div className="flex items-center space-x-4 text-xs sm:text-[13px] text-slate-600 pt-1 relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className="hover:text-slate-900 cursor-pointer font-medium px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                ឯកសារ
              </button>
              <button 
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                className="hover:text-slate-900 cursor-pointer font-medium px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                កែសម្រួល
              </button>
              <button 
                onClick={() => setActiveMenu(activeMenu === 'data' ? null : 'data')}
                className="hover:text-slate-900 cursor-pointer font-medium px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                ទិន្នន័យ
              </button>
              <button 
                onClick={() => {
                  if (onOpenAgeSummary) onOpenAgeSummary();
                  else setActiveTab('ageSummary');
                }}
                className={`cursor-pointer font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  activeTab === 'ageSummary'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-blue-700 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>សរុបស្រី-ប្រុសតាមអាយុ</span>
              </button>
              <button 
                onClick={onOpenStats}
                className="hover:text-emerald-700 cursor-pointer font-semibold text-emerald-700 px-1 rounded hover:bg-emerald-50 flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>ផ្ទាំងស្ថិតិបក្ស (ទំព័រ១៣)</span>
              </button>
              <button 
                onClick={onOpenVitalReport}
                className="hover:text-rose-800 cursor-pointer font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors shadow-2xs"
                title="ទម្រង់របាយការណ៍សមាជិកបក្ស និងប្រជាជនទូទៅ (សម្រាល - មរណៈ)"
              >
                <Baby className="w-3.5 h-3.5 text-rose-600" />
                <span>របាយការណ៍បក្ស & ប្រជាជន (សម្រាល-មរណៈ)</span>
              </button>
              <button 
                onClick={onOpenOrgStructure}
                className="hover:text-blue-950 cursor-pointer font-bold text-blue-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded flex items-center gap-1.5 transition-colors shadow-2xs"
                title="រចនាសម្ព័ន្ធប្រធានគណបក្សឃុំបន្ទាយស្ទោង មេភូមិ អនុប្រធាន សមាជិក មានរូបថត"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                <span>រចនាសម្ព័ន្ធបក្ស (មានរូបថត)</span>
              </button>

              {/* Dropdown Menu: File */}
              {activeMenu === 'file' && (
                <div 
                  className="absolute top-6 left-0 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs divide-y divide-slate-100"
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all');
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-sky-50 flex items-center gap-2 text-sky-950 font-bold"
                    >
                      <Eye className="w-4 h-4 text-sky-600" />
                      មើលគំរូតារាងបោះពុម្ព (Print Preview A4)
                    </button>
                    <button
                      onClick={() => { if (onOpenOrgStructure) onOpenOrgStructure(); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-amber-50 flex items-center gap-2 text-blue-950 font-bold"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      តារាងរចនាសម្ព័ន្ធបក្សឃុំ-ភូមិ (មានរូបថត)
                    </button>
                    <button
                      onClick={() => { if (onOpenVitalReport) onOpenVitalReport(); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-800 font-bold"
                    >
                      <Baby className="w-4 h-4 text-rose-600" />
                      ទម្រង់របាយការណ៍បក្ស & ប្រជាជន (សម្រាល-មរណៈ)
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { exportToExcel(records, stats); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-emerald-50 flex items-center justify-between text-slate-800 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-600" />
                        ទាញយក Microsoft Excel (.xlsx)
                      </span>
                    </button>
                    <button
                      onClick={() => { exportToCSV(records); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                    >
                      <span className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-blue-600" />
                        ទាញយកឯកសារ CSV (UTF-8)
                      </span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { 
                        onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all'); 
                        setActiveMenu(null); 
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-700 font-medium"
                    >
                      <FileDown className="w-4 h-4 text-rose-600" />
                      {selectedGroup !== 'all' ? `រក្សាទុកជា PDF (ក្រុមទី ${selectedGroup})` : 'រក្សាទុកជា PDF (Save as PDF)'}
                    </button>
                    <button
                      onClick={() => { 
                        onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all', true); 
                        setActiveMenu(null); 
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      {selectedGroup !== 'all' ? `បោះពុម្ពរបាយការណ៍ (ក្រុមទី ${selectedGroup})` : 'បោះពុម្ពរបាយការណ៍ផ្លូវការ (Print A4)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Dropdown Menu: Edit */}
              {activeMenu === 'edit' && (
                <div 
                  className="absolute top-6 left-12 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs divide-y divide-slate-100"
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <div className="py-1">
                    <button
                      onClick={() => { onAddRecord(); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      បន្ថែមសមាជិកថ្មី
                    </button>
                    <button
                      onClick={() => { handleCopyForSheets(); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Copy className="w-4 h-4 text-indigo-600" />
                      ចម្លងសម្រាប់បិទភ្ជាប់លើ Google Sheets
                    </button>
                  </div>
                  {selectedRowIds.length > 0 && (
                    <div className="py-1">
                      <button
                        onClick={() => { requestDeleteSelected(); setActiveMenu(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        លុបជួរដែលបានជ្រើស ({selectedRowIds.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Dropdown Menu: Data */}
              {activeMenu === 'data' && (
                <div 
                  className="absolute top-6 left-28 w-60 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs"
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button
                    onClick={() => { requestResetData(); setActiveMenu(null); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    កំណត់ទិន្នន័យដើមឡើងវិញ (265 នាក់)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Search Input Field in Header */}
        <div className="flex-1 max-w-sm xl:max-w-md w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="header-member-search-input"
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (activeTab === 'ageSummary' && e.target.value.trim()) {
                  setActiveTab('members');
                }
              }}
              placeholder="ស្វែងរកតាមឈ្មោះ ឬ លេខកូដ/ID (Ctrl+K)..."
              className="w-full pl-9 pr-24 py-1.5 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 text-xs font-medium rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchTerm ? (
              <div className="absolute right-2 flex items-center gap-1.5">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  {filteredRecords.length} នាក់
                </span>
                <button
                  id="clear-header-search-btn"
                  onClick={() => setSearchTerm('')}
                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 cursor-pointer transition-colors"
                  title="សម្អាតការស្វែងរក"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="absolute right-2.5 pointer-events-none hidden sm:flex items-center">
                <kbd className="text-[10px] text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs font-mono">
                  Ctrl+K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Copy directly to Google Sheets */}
          <button
            onClick={handleCopyForSheets}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              copiedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
            }`}
            title="ចម្លងទិន្នន័យដើម្បីចុច Ctrl+V បិទភ្ជាប់លើ Google Sheets"
          >
            {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedSuccess ? 'បានចម្លងជោគជ័យ!' : 'ចម្លងដាក់ Google Sheets'}</span>
          </button>

          {/* Export Excel (.xlsx) */}
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
            <span>{selectedGroup !== 'all' ? `ទាញយក Excel (ក្រុមទី ${selectedGroup})` : 'ទាញយក Excel (.xlsx)'}</span>
          </button>

          {/* Age & Gender Summary */}
          <button
            onClick={() => setActiveTab(activeTab === 'ageSummary' ? 'members' : 'ageSummary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
              activeTab === 'ageSummary'
                ? 'bg-blue-800 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
            }`}
            title="សរុបស្រី-ប្រុសតាមអាយុ"
          >
            <Users className="w-4 h-4" />
            <span>សរុបស្រី-ប្រុសតាមអាយុ</span>
          </button>

          {/* Org Structure with Photos */}
          <button
            onClick={onOpenOrgStructure}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-amber-300 hover:text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer border border-amber-400"
            title="តារាងរចនាសម្ព័ន្ធប្រធានគណបក្សឃុំបន្ទាយស្ទោង មេភូមិ អនុប្រធាន សមាជិក មានរូបថត"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>រចនាសម្ព័ន្ធបក្ស (មានរូបថត)</span>
          </button>

          {/* Preview Official A4 View Button */}
          <button
            id="header-preview-btn"
            onClick={() => onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer border border-sky-600"
            title={selectedGroup !== 'all' ? `មើលគំរូទម្រង់បោះពុម្ព A4 ក្រុមទី ${selectedGroup} (Preview)` : 'មើលគំរូទម្រង់បោះពុម្ព A4 ជាផ្លូវការ (Preview A4)'}
          >
            <Eye className="w-4 h-4 text-sky-200" />
            <span>មើលគំរូ (Preview)</span>
          </button>

          {/* Save as PDF */}
          <button
            id="header-save-pdf-btn"
            onClick={() => onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title={selectedGroup !== 'all' ? `ទម្រង់បោះពុម្ព និង រក្សាទុកជា PDF ក្រុមទី ${selectedGroup}` : 'ទម្រង់បោះពុម្ព និង រក្សាទុកជា PDF'}
          >
            <FileDown className="w-4 h-4" />
            <span>{selectedGroup !== 'all' ? `រក្សាទុកជា PDF (ក្រុមទី ${selectedGroup})` : 'រក្សាទុកជា PDF'}</span>
          </button>

          {/* Official Print View */}
          <button
            id="header-print-btn"
            onClick={() => onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all', true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title={selectedGroup !== 'all' ? `បោះពុម្ពរបាយការណ៍ផ្លូវការក្រុមទី ${selectedGroup}` : 'បោះពុម្ពរបាយការណ៍ផ្លូវការ (A4)'}
          >
            <Printer className="w-4 h-4" />
            <span>{selectedGroup !== 'all' ? `បោះពុម្ព (ក្រុមទី ${selectedGroup})` : 'បោះពុម្ព (Print A4)'}</span>
          </button>

          {/* Add Member Button */}
          <button
            onClick={onAddRecord}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>បន្ថែមសមាជិក</span>
          </button>
        </div>
      </div>

      {/* 2. Google Sheets Formula Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 text-xs">
        {/* Cell Identifier Box (e.g. B4) */}
        <div className="w-16 h-7 bg-white border border-slate-300 rounded font-mono font-bold text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
          {cellAddress}
        </div>

        {/* Function symbol */}
        <div className="font-serif italic font-bold text-slate-400 px-1 shrink-0 select-none">
          fx
        </div>

        {/* Live Formula / Value Input */}
        <input
          type="text"
          value={activeCellValue}
          onChange={(e) => handleFormulaBarChange(e.target.value)}
          placeholder="ជ្រើសរើសប្រអប់ ឬបញ្ចូលតម្លៃ..."
          className="flex-1 h-7 bg-white border border-slate-300 rounded px-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
        />

        {/* Selection count indicator */}
        {selectedRowIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 font-semibold">
              បានជ្រើស {selectedRowIds.length} ជួរ
            </span>
            <button
              onClick={requestDeleteSelected}
              className="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>លុប</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Search & Interactive Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-emerald-600 absolute left-2.5 top-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ, លេខអត្តសញ្ញាណប័ណ្ណ... (Ctrl+K)"
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-rose-600 text-xs font-bold p-0.5 rounded cursor-pointer"
              title="សម្អាតពាក្យស្វែងរក"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Group Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">ក្រុមបក្ស:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">ទាំងអស់ (១-២១)</option>
              {Array.from({ length: 21 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g.toString()}>
                  ក្រុមទី {g}
                </option>
              ))}
            </select>
            <button
              onClick={() => onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all')}
              className="flex items-center gap-1 px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded text-[11px] font-bold transition-colors cursor-pointer shadow-2xs ml-0.5"
              title={selectedGroup !== 'all' ? `មើលគំរូទម្រង់បោះពុម្ព A4 ក្រុមទី ${selectedGroup} (Preview)` : 'មើលគំរូទម្រង់បោះពុម្ព A4 ទាំងអស់ (Preview A4)'}
            >
              <Eye className="w-3 h-3 text-sky-700" />
              <span>Preview</span>
            </button>
            {selectedGroup !== 'all' && (
              <div className="flex items-center gap-1 ml-0.5">
                <button
                  onClick={() => onOpenPrint(parseInt(selectedGroup, 10), true)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                  title={`ទម្រង់បោះពុម្ព និង រក្សាទុកជា PDF ក្រុមទី ${selectedGroup}`}
                >
                  <FileDown className="w-3 h-3" />
                  <span>PDF/Print</span>
                </button>
                <button
                  onClick={() => exportToExcel(filteredRecords, stats, `បញ្ជីរាយនាមសមាជិកបក្ស_ក្រុមទី${selectedGroup}_ភូមិរលួស.xlsx`)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                  title={`ទាញយក Excel ក្រុមទី ${selectedGroup}`}
                >
                  <Download className="w-3 h-3" />
                  <span>Excel</span>
                </button>
              </div>
            )}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">ភេទ:</span>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-hidden"
            >
              <option value="all">ទាំងអស់</option>
              <option value="ប">ប្រុស (ប)</option>
              <option value="ស">ស្រី (ស)</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">តួនាទី:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden max-w-[120px]"
            >
              <option value="all">ទាំងអស់</option>
              {rolesList.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">ស្ថានភាព:</span>
            <select
              value={selectedRemark}
              onChange={(e) => setSelectedRemark(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-hidden max-w-[140px]"
            >
              <option value="all">ទាំងអស់</option>
              {remarksList.map((rem) => (
                <option key={rem} value={rem}>
                  {rem}
                </option>
              ))}
            </select>
          </div>

          {/* Age Bracket Filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">ក្រុមអាយុ:</span>
            <select
              value={selectedAgeBracket}
              onChange={(e) => {
                setSelectedAgeBracket(e.target.value);
                setExactAgeFilter(null);
              }}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-semibold focus:outline-hidden text-slate-800"
            >
              <option value="all">គ្រប់អាយុ</option>
              <option value="18-35">យុវជន (១៨-៣៥)</option>
              <option value="36-50">វ័យកណ្តាល (៣៦-៥០)</option>
              <option value="51-64">វ័យចំណាស់ (៥១-៦៤)</option>
              <option value="65plus">ចាស់ជរា (៦៥ឡើង)</option>
              <option value="under18">ក្រោម ១៨ ឆ្នាំ</option>
            </select>
          </div>

          {/* Exact Age Chip if filtered from single age analysis */}
          {exactAgeFilter !== null && (
            <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 rounded px-2 py-0.5 text-xs font-semibold">
              <span>អាយុ {exactAgeFilter} ឆ្នាំ</span>
              <button
                onClick={() => setExactAgeFilter(null)}
                className="hover:text-red-700 ml-1 font-bold cursor-pointer"
                title="ដោះតម្រងអាយុនេះ"
              >
                ✕
              </button>
            </div>
          )}

          {/* Active Search Term Chip */}
          {searchTerm && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded px-2 py-0.5 text-xs font-semibold">
              <Search className="w-3 h-3 text-emerald-600" />
              <span>ស្វែងរក ៖ &quot;{searchTerm}&quot; ({filteredRecords.length} នាក់)</span>
              <button
                onClick={() => setSearchTerm('')}
                className="hover:text-red-700 ml-0.5 font-bold cursor-pointer"
                title="សម្អាតពាក្យស្វែងរក"
              >
                ✕
              </button>
            </div>
          )}

          {/* Reset Filters */}
          {(selectedGroup !== 'all' || selectedGender !== 'all' || selectedRole !== 'all' || selectedRemark !== 'all' || selectedAgeBracket !== 'all' || exactAgeFilter !== null || searchTerm) && (
            <button
              onClick={() => {
                setSelectedGroup('all');
                setSelectedGender('all');
                setSelectedRole('all');
                setSelectedRemark('all');
                setSelectedAgeBracket('all');
                setExactAgeFilter(null);
                setSearchTerm('');
              }}
              className="text-emerald-700 hover:text-emerald-800 font-bold px-2 py-1 underline cursor-pointer"
            >
              សម្អាតតម្រង
            </button>
          )}
        </div>
      </div>

      {/* Team Leader Recognition Banner if user searches for ផូ វុធ */}
      {(searchTerm.toLowerCase().includes('ផូ') || searchTerm.toLowerCase().includes('វុធ') || searchTerm.toLowerCase().includes('វុជ')) && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>
              <strong>លោក {stats.teamLeader || 'ផូ វុធ'}</strong> ជា <strong>ប្រធានក្រុមការងារចុះជួយភូមិរលួស</strong> (ចុះហត្ថលេខាលើរបាយការណ៍បក្ស ជាមួយ ប្រធានសាខាគណបក្សភូមិ {stats.villageHead})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStats}
              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium cursor-pointer shadow-2xs"
            >
              មើលទំព័រស្ថិតិ & ហត្ថលេខា
            </button>
            <button
              onClick={() => onOpenPrint(selectedGroup !== 'all' ? parseInt(selectedGroup, 10) : 'all')}
              className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-medium cursor-pointer shadow-2xs"
            >
              មើលទម្រង់បោះពុម្ពផ្លូវការ
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Spreadsheet Grid or Age-Gender Summary */}
      {activeTab === 'ageSummary' ? (
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          <AgeGenderSummary
            records={records}
            onFilterByAgeBracket={(minAge, maxAge) => {
              let bId = 'all';
              if (maxAge <= 17) bId = 'under18';
              else if (minAge === 18 && maxAge === 35) bId = '18-35';
              else if (minAge === 36 && maxAge === 50) bId = '36-50';
              else if (minAge === 51 && maxAge === 64) bId = '51-64';
              else if (minAge >= 65) bId = '65plus';
              setSelectedAgeBracket(bId);
              setExactAgeFilter(null);
              setActiveTab('members');
            }}
            onFilterByExactAge={(age) => {
              setExactAgeFilter(age);
              setSelectedAgeBracket('all');
              setActiveTab('members');
            }}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white relative">
          <table className="w-full border-collapse border border-slate-300 text-xs">
          {/* Column Letters Row (Google Sheets: A, B, C, D...) */}
          <thead className="sticky top-0 z-20 bg-slate-100 shadow-2xs">
            <tr className="text-center font-bold text-slate-600 divide-x divide-slate-300 border-b border-slate-300">
              {/* Row Select All Cell */}
              <th className="w-12 bg-slate-200 p-1 text-center">
                <button
                  onClick={handleSelectAllFiltered}
                  className="p-1 hover:text-emerald-700 cursor-pointer"
                  title="ជ្រើសទាំងអស់"
                >
                  {selectedRowIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </th>
              {COLUMN_DEFINITIONS.map((col) => (
                <th 
                  key={col.key} 
                  className="py-1 px-2 font-mono text-[11px] text-slate-500 bg-slate-100 border-r border-slate-300"
                >
                  {col.colLetter}
                </th>
              ))}
              <th className="w-16 bg-slate-100 px-2 py-1 text-[11px] text-slate-500">សកម្មភាព</th>
            </tr>

            {/* Field Titles Header Row: Official Hierarchical Layout */}
            <tr className="bg-slate-200 text-slate-900 font-bold divide-x divide-slate-300 border-b border-slate-300 text-center font-kantumruy">
              <th rowSpan={2} className="p-1.5 w-12 text-slate-600 font-mono text-[10px] align-middle bg-slate-200">
                #
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200">
                ល.រ
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200">
                រូបថត
              </th>
              <th rowSpan={2} className="px-3 py-1.5 text-left text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 min-w-[150px]">
                នាមត្រកូល-នាមខ្លួន
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200">
                ភេទ
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200">
                អាយុ
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 leading-tight">
                ថ្ងៃខែឆ្នាំ<br />កំណើត
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 leading-tight">
                លេខអត្ត<br />សញ្ញាណប័ណ្ណ
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 leading-tight">
                លេខអត្ត<br />បក្ស
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 leading-tight">
                ថ្ងៃខែឆ្នាំ<br />ចូលបក្ស
              </th>
              <th colSpan={4} className="px-2 py-1 text-center text-xs whitespace-nowrap text-slate-900 font-bold bg-slate-300/80 border-b border-slate-300">
                បញ្ជី គ.ជ.ប
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 leading-tight">
                ក្រុម<br />បក្ស
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 leading-tight min-w-[120px]">
                តួនាទី<br />ក្នុងបក្ស
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200">
                មុខរបរ
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 min-w-[120px]">
                ស្ថានគ្រួសារ
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-900 font-bold align-middle bg-slate-200 min-w-[120px]">
                កត់សម្គាល់
              </th>
              <th rowSpan={2} className="px-2 py-1.5 text-center text-xs text-slate-800 align-middle bg-slate-200 w-16">
                សកម្មភាព
              </th>
            </tr>

            {/* Sub-Header Row for បញ្ជី គ.ជ.ប */}
            <tr className="bg-slate-200 text-slate-800 font-bold divide-x divide-slate-300 border-b-2 border-slate-400 text-center font-kantumruy text-[11px]">
              <th className="px-2 py-1 text-center whitespace-nowrap">ឈ្មោះការិ</th>
              <th className="px-2 py-1 text-center whitespace-nowrap">កូដឃុំ</th>
              <th className="px-2 py-1 text-center whitespace-nowrap">លេខការិ</th>
              <th className="px-2 py-1 text-center whitespace-nowrap">ល.រ គជប</th>
            </tr>
          </thead>

          {/* Grid Rows */}
          <tbody className="divide-y divide-slate-200 font-kantumruy">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_DEFINITIONS.length + 2} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">រកមិនឃើញទិន្នន័យដែលផ្គូផ្គងនឹងការស្វែងរកឡើយ</p>
                    <p className="text-xs text-slate-400">សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬសម្អាតតម្រង</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const isRowSelected = selectedRowIds.includes(record.id);

                return (
                  <tr
                    key={record.id}
                    className={`divide-x divide-slate-200 transition-colors ${
                      isRowSelected
                        ? 'bg-emerald-50/70'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Row Index & Checkbox */}
                    <td className="w-12 text-center p-1 font-mono text-[11px] text-slate-500 bg-slate-100/60 select-none">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleToggleSelectRow(record.id)}
                          className="hover:text-emerald-700 cursor-pointer"
                        >
                          {isRowSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                        <span>{index + 1}</span>
                      </div>
                    </td>

                    {/* Data Cells */}
                    {COLUMN_DEFINITIONS.map((col) => {
                      const isFocused = activeCell?.rowId === record.id && activeCell?.colKey === col.key;
                      const isEditing = editingCell?.rowId === record.id && editingCell?.colKey === col.key;
                      const val = record[col.key as keyof MemberRecord];

                      return (
                        <td
                          key={col.key}
                          onClick={() => handleCellClick(record.id, col.key as keyof MemberRecord)}
                          onDoubleClick={() => handleCellDoubleClick(record.id, col.key as keyof MemberRecord, val)}
                          className={`px-2 py-1 relative text-xs whitespace-nowrap cursor-cell transition-all ${
                            isFocused
                              ? 'ring-2 ring-emerald-600 ring-inset bg-emerald-50/40 z-10'
                              : ''
                          } ${
                            col.key === 'id' || col.key === 'gender' || col.key === 'age' || col.key === 'partyGroup' || col.key === 'photoUrl' || col.key === 'partyCardNo' || col.key === 'joinDate'
                              ? 'text-center'
                              : col.key === 'dob' || col.key === 'officeNo'
                              ? 'text-center'
                              : 'text-left'
                          }`}
                        >
                          {isEditing ? (
                            <input
                              ref={cellInputRef}
                              type="text"
                              value={cellEditValue}
                              onChange={(e) => setCellEditValue(e.target.value)}
                              onBlur={handleCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave();
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="w-full h-full p-0 border-none outline-hidden bg-white text-xs font-semibold text-slate-900"
                            />
                          ) : col.key === 'photoUrl' ? (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEditRecord) onEditRecord(record);
                              }}
                              className="flex items-center justify-center py-0.5 cursor-pointer group"
                              title="ចុចដើម្បីកែប្រែរូបថត 3x4 របស់សមាជិកនេះ"
                            >
                              {val ? (
                                <img
                                  src={String(val)}
                                  alt="3x4"
                                  className="w-7 h-9 object-cover rounded border border-slate-300 shadow-2xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                                />
                              ) : (
                                <div className="w-7 h-9 rounded border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-[9px] text-slate-400 font-medium group-hover:border-emerald-500 group-hover:text-emerald-600 transition-colors">
                                  + 3x4
                                </div>
                              )}
                            </div>
                          ) : (
                            <span
                              className={`${
                                col.key === 'fullName'
                                  ? 'font-bold text-slate-900'
                                  : col.key === 'partyRole' && record.partyRole.includes('មេ')
                                  ? 'font-bold text-emerald-800'
                                  : col.key === 'remarks' && record.remarks.includes('ថៃ')
                                  ? 'font-semibold text-amber-800'
                                  : 'text-slate-700'
                              }`}
                            >
                              {String(val ?? '')}
                            </span>
                          )}

                          {/* Google Sheets Bottom Right Fill Handle for active cell */}
                          {isFocused && !isEditing && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-700 border border-white cursor-crosshair z-20" />
                          )}
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    <td className="w-28 text-center px-1.5 py-1">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPrint(record.partyGroup);
                          }}
                          className="px-1.5 py-0.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded flex items-center gap-0.5 cursor-pointer transition-colors shadow-2xs"
                          title={`មើលគំរូក្រុមទី ${record.partyGroup} ក្នុងទម្រង់បោះពុម្ព A4 (Preview)`}
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-700" />
                          <span className="hidden sm:inline text-[11px]">គំរូ</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditRecord) {
                              onEditRecord(record);
                            } else {
                              handleCellDoubleClick(record.id, 'fullName', record.fullName);
                            }
                          }}
                          className="px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="កែសម្រួលទិន្នន័យ និងរូបថត 3x4"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>កែ</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDeleteRecord(record.id, record.fullName);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          title="លុបទិន្នន័យ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* 5. Google Sheets Bottom Sheet Tabs & Status Bar */}
      <div className="bg-slate-200 border-t border-slate-300 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sheet Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-x ${
              activeTab === 'members'
                ? 'bg-white text-emerald-800 border-slate-300 shadow-xs'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300/80 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>សន្លឹក១: បញ្ជីសមាជិក ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ageSummary')}
            className={`px-4 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-x ${
              activeTab === 'ageSummary'
                ? 'bg-white text-blue-800 border-slate-300 shadow-xs'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300/80 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>សន្លឹក២: សរុបស្រី-ប្រុសតាមអាយុ</span>
          </button>

          <button
            onClick={onOpenStats}
            className="px-4 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-x bg-slate-200 text-slate-600 hover:bg-slate-300/80 border-transparent"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>សន្លឹក៣: ស្ថិតិបក្ស (ទំព័រ១៣)</span>
          </button>

          <button
            onClick={onOpenVitalReport}
            className="px-4 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-x bg-rose-50 text-rose-800 hover:bg-rose-100/90 border-rose-200"
          >
            <Baby className="w-4 h-4 text-rose-600" />
            <span>សន្លឹក៤: របាយការណ៍បក្ស & ប្រជាជន (សម្រាល-មរណៈ)</span>
          </button>

          <button
            onClick={onOpenOrgStructure}
            className="px-4 py-1.5 rounded-t-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-x bg-amber-100 text-blue-950 hover:bg-amber-200/90 border-amber-300 shadow-2xs"
            title="រចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សឃុំ-ភូមិ មានរូបថត"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>សន្លឹក៥: រចនាសម្ព័ន្ធបក្ស (មានរូបថត)</span>
          </button>
        </div>

        {/* Live Calculation Metrics in Status Bar */}
        <div className="flex items-center space-x-4 text-slate-700 text-xs font-medium">
          <span className="bg-white px-2.5 py-0.5 rounded border border-slate-300">
            បង្ហាញ ៖ <strong className="text-slate-900">{filteredRecords.length}</strong> / {records.length} នាក់
          </span>
          <span className="hidden sm:inline-block bg-white px-2.5 py-0.5 rounded border border-slate-300">
            ស្រី ៖ <strong className="text-slate-900">{records.filter(r => r.gender === 'ស').length}</strong> នាក់
          </span>
          <span className="hidden md:inline-block bg-white px-2.5 py-0.5 rounded border border-slate-300">
            មេគ្រួសារ ៖ <strong className="text-slate-900">{records.filter(r => r.partyRole.includes('មេគ្រួសារ')).length}</strong>
          </span>
          <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded border border-emerald-300 font-bold">
            ភាគរយ ៖ {stats.percentage}%
          </span>
        </div>
      </div>

      {/* Custom Confirmation Modal (No iframe-blocking window.confirm) */}
      {confirmDialog.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-kantumruy animate-in fade-in duration-150"
          onClick={handleCancelAction}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-5 pt-5 pb-4 flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-6">
                  {confirmDialog.type === 'single' && 'បញ្ជាក់ការលុបទិន្នន័យសមាជិក'}
                  {confirmDialog.type === 'multiple' && 'បញ្ជាក់ការលុបទិន្នន័យជាក្រុម'}
                  {confirmDialog.type === 'reset' && 'បញ្ជាក់ការកំណត់ទិន្នន័យឡើងវិញ'}
                </h3>
                <div className="mt-2 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  {confirmDialog.type === 'single' && (
                    <p>
                      តើអ្នកពិតជាចង់លុបទិន្នន័យសមាជិកឈ្មោះ{' '}
                      <span className="font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {confirmDialog.recordName}
                      </span>{' '}
                      នេះចេញពីបញ្ជីមែនទេ?
                    </p>
                  )}
                  {confirmDialog.type === 'multiple' && (
                    <p>
                      តើអ្នកពិតជាចង់លុបទិន្នន័យសមាជិកដែលបានជ្រើសរើសចំនួន{' '}
                      <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {confirmDialog.count} នាក់
                      </span>{' '}
                      នេះមែនទេ?
                    </p>
                  )}
                  {confirmDialog.type === 'reset' && (
                    <p>
                      តើអ្នកពិតជាចង់កំណត់ទិន្នន័យទាំងអស់ឡើងវិញដូចក្នុងឯកសារដើម (២៦៥ នាក់) មែនទេ?
                    </p>
                  )}
                  <p className="text-[11px] text-rose-600 font-medium">
                    ⚠️ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ!
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelAction}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-hidden transition-colors cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm flex items-center gap-1.5 focus:outline-hidden transition-colors cursor-pointer"
                autoFocus
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {confirmDialog.type === 'reset' ? 'កំណត់ឡើងវិញ' : 'យល់ព្រមលុប'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
