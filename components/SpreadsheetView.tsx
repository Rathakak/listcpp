'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MemberRecord, VillageStats } from '@/lib/types';
import { COLUMN_DEFINITIONS, exportToExcel, exportToCSV, copyForGoogleSheets } from '@/lib/spreadsheetHelpers';
import AgeGenderSummary from './AgeGenderSummary';
import { 
  FileSpreadsheet, Download, Copy, Printer, Plus, Trash2, 
  Search, Filter, Check, Edit2, RotateCcw,
  BarChart3, ChevronDown, CheckSquare, Square, Users, Calendar
} from 'lucide-react';

interface SpreadsheetViewProps {
  records: MemberRecord[];
  stats: VillageStats;
  onUpdateRecord: (updated: MemberRecord) => void;
  onAddRecord: () => void;
  onDeleteRecord: (id: number) => void;
  onDeleteMultiple: (ids: number[]) => void;
  onResetData: () => void;
  onOpenStats: () => void;
  onOpenPrint: () => void;
  onOpenAgeSummary?: () => void;
}

export default function SpreadsheetView({
  records,
  stats,
  onUpdateRecord,
  onAddRecord,
  onDeleteRecord,
  onDeleteMultiple,
  onResetData,
  onOpenStats,
  onOpenPrint,
  onOpenAgeSummary,
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

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search matches
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = r.fullName.toLowerCase().includes(query);
        const matchesId = r.idCardNo.toLowerCase().includes(query);
        const matchesNec = r.necOrderNo.toLowerCase().includes(query);
        const matchesRole = r.partyRole.toLowerCase().includes(query);
        const matchesRemark = r.remarks.toLowerCase().includes(query);
        const matchesOcc = r.occupation.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesNec && !matchesRole && !matchesRemark && !matchesOcc) {
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
    } else if (editingCell.colKey === 'decimalAge') {
      parsedVal = parseFloat(cellEditValue) || 0;
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
    } else if (activeCell.colKey === 'decimalAge') {
      parsedVal = parseFloat(val) || 0;
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

  const handleDeleteSelected = () => {
    if (selectedRowIds.length === 0) return;
    if (confirm(`តើអ្នកពិតជាចង់លុបទិន្នន័យចំនួន ${selectedRowIds.length} ជួរនេះមែនទេ?`)) {
      onDeleteMultiple(selectedRowIds);
      setSelectedRowIds([]);
    }
  };

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
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Google Sheets Green Icon */}
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm md:text-base">
                បញ្ជីឈ្មោះសមាជិកបក្ស_ភូមិរលួស.xlsx
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                Google Sheets Format
              </span>
            </div>

            {/* Menu Bar (Google Sheets) */}
            <div className="flex items-center space-x-4 text-xs text-slate-600 pt-0.5 relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                className="hover:text-slate-900 cursor-pointer font-medium px-1 rounded hover:bg-slate-100"
              >
                ឯកសារ
              </button>
              <button 
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                className="hover:text-slate-900 cursor-pointer font-medium px-1 rounded hover:bg-slate-100"
              >
                កែសម្រួល
              </button>
              <button 
                onClick={() => setActiveMenu(activeMenu === 'data' ? null : 'data')}
                className="hover:text-slate-900 cursor-pointer font-medium px-1 rounded hover:bg-slate-100"
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

              {/* Dropdown Menu: File */}
              {activeMenu === 'file' && (
                <div 
                  className="absolute top-6 left-0 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs divide-y divide-slate-100"
                  onMouseLeave={() => setActiveMenu(null)}
                >
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
                      onClick={() => { onOpenPrint(); setActiveMenu(null); }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <Printer className="w-4 h-4 text-slate-600" />
                      បោះពុម្ពរបាយការណ៍ផ្លូវការ (Print A4)
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
                        onClick={() => { handleDeleteSelected(); setActiveMenu(null); }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2"
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
                    onClick={() => { onResetData(); setActiveMenu(null); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    កំណត់ទិន្នន័យដើមឡើងវិញ (265 នាក់)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center flex-wrap gap-2">
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
            onClick={() => exportToExcel(records, stats)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ទាញយក Excel (.xlsx)</span>
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

          {/* Official Print View */}
          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ពផ្លូវការ (A4)</span>
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
              onClick={handleDeleteSelected}
              className="h-7 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
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
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកឈ្មោះ, អត្តសញ្ញាណប័ណ្ណ, មុខរបរ..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
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

            {/* Field Titles Header Row */}
            <tr className="bg-slate-200 text-slate-900 font-bold divide-x divide-slate-300 border-b-2 border-slate-400 text-center">
              <th className="p-1.5 w-12 text-slate-500 font-mono text-[10px]">#</th>
              {COLUMN_DEFINITIONS.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-1.5 text-center text-xs whitespace-nowrap text-slate-800 font-semibold"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-1.5 text-center text-xs text-slate-800">សកម្មភាព</th>
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
                            col.key === 'id' || col.key === 'gender' || col.key === 'age' || col.key === 'partyGroup'
                              ? 'text-center'
                              : col.key === 'decimalAge' || col.key === 'dob' || col.key === 'officeNo'
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
                    <td className="w-16 text-center px-1 py-1">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleCellDoubleClick(record.id, 'fullName', record.fullName)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-200 rounded cursor-pointer"
                          title="កែសម្រួល"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`តើអ្នកពិតជាចង់លុបឈ្មោះ "${record.fullName}" មែនទេ?`)) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                          title="លុប"
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
    </div>
  );
}
