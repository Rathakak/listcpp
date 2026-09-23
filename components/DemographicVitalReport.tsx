'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { MemberRecord, VillageStats, VitalEventRecord, GeneralPopulationStats } from '@/lib/types';
import { KHMER_MONTHS } from './OfficialPrintView';
import { 
  ArrowLeft, 
  Printer, 
  FileDown, 
  Plus, 
  Baby, 
  HeartCrack, 
  Users, 
  BarChart3, 
  FileSpreadsheet, 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building2,
  Home
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DemographicVitalReportProps {
  records: MemberRecord[];
  stats: VillageStats;
  vitalEvents: VitalEventRecord[];
  genPopStats: GeneralPopulationStats;
  onUpdateVitalEvents: (events: VitalEventRecord[]) => void;
  onUpdateGenPopStats: (genStats: GeneralPopulationStats) => void;
  onBack: () => void;
}

const toKhmerNum = (num: number | string): string => {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().split('').map(d => khmerDigits[parseInt(d, 10)] ?? d).join('');
};

export default function DemographicVitalReport({
  records,
  stats,
  vitalEvents,
  genPopStats,
  onUpdateVitalEvents,
  onUpdateGenPopStats,
  onBack,
}: DemographicVitalReportProps) {
  // Month & Year Auto tracking
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const [monthMode, setMonthMode] = useState<'auto' | number>('auto');
  const [selectedYear, setSelectedYear] = useState<number>(() => now.getFullYear());
  const [fillSignatureDay, setFillSignatureDay] = useState(false);

  // Active view tab inside the report: 'all' | 'summary' | 'births' | 'deaths'
  const [activeSection, setActiveSection] = useState<'all' | 'summary' | 'births' | 'deaths'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'birth' | 'death'>('birth');
  const [editingRecord, setEditingRecord] = useState<VitalEventRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<VitalEventRecord>>({
    type: 'birth',
    personName: '',
    gender: 'ប',
    eventDate: '',
    age: 0,
    category: 'party',
    fatherName: '',
    motherName: '',
    causeOfDeath: '',
    groupNo: 1,
    houseNo: '',
    remarks: '',
  });

  // Calculate Dates
  const activeMonthIdx = monthMode === 'auto' ? currentMonthIdx : monthMode;
  const activeMonthName = KHMER_MONTHS[activeMonthIdx] ?? 'កញ្ញា';
  const activeYearKhmer = toKhmerNum(selectedYear);
  const activeDayKhmer = toKhmerNum(now.getDate());

  // Calculations for Births (សម្រាល)
  const birthRecords = useMemo(() => vitalEvents.filter(e => e.type === 'birth'), [vitalEvents]);
  const birthsTotal = birthRecords.length;
  const birthsFemale = birthRecords.filter(e => e.gender === 'ស').length;
  const birthsMale = birthRecords.filter(e => e.gender === 'ប').length;
  const birthsParty = birthRecords.filter(e => e.category === 'party').length;
  const birthsPartyFemale = birthRecords.filter(e => e.category === 'party' && e.gender === 'ស').length;
  const birthsPartyMale = birthRecords.filter(e => e.category === 'party' && e.gender === 'ប').length;
  const birthsGeneral = birthRecords.filter(e => e.category === 'general').length;
  const birthsGeneralFemale = birthRecords.filter(e => e.category === 'general' && e.gender === 'ស').length;
  const birthsGeneralMale = birthRecords.filter(e => e.category === 'general' && e.gender === 'ប').length;

  // Calculations for Deaths (មរណៈ)
  const deathRecords = useMemo(() => vitalEvents.filter(e => e.type === 'death'), [vitalEvents]);
  const deathsTotal = deathRecords.length;
  const deathsFemale = deathRecords.filter(e => e.gender === 'ស').length;
  const deathsMale = deathRecords.filter(e => e.gender === 'ប').length;
  const deathsParty = deathRecords.filter(e => e.category === 'party').length;
  const deathsPartyFemale = deathRecords.filter(e => e.category === 'party' && e.gender === 'ស').length;
  const deathsPartyMale = deathRecords.filter(e => e.category === 'party' && e.gender === 'ប').length;
  const deathsGeneral = deathRecords.filter(e => e.category === 'general').length;
  const deathsGeneralFemale = deathRecords.filter(e => e.category === 'general' && e.gender === 'ស').length;
  const deathsGeneralMale = deathRecords.filter(e => e.category === 'general' && e.gender === 'ប').length;

  // Net Natural Growth
  const netGenPopGrowth = birthsTotal - deathsTotal;
  const netPartyGrowth = birthsParty - deathsParty;

  // Party member stats
  const totalPartyMembers = records.length;
  const femalePartyMembers = records.filter(r => r.gender === 'ស').length;
  const malePartyMembers = records.filter(r => r.gender === 'ប').length;

  // Party ratio vs General Population & Voters
  const partyRatioGenPop = ((totalPartyMembers / (genPopStats.villageTotalPopulation || 586)) * 100).toFixed(2);
  const partyRatioVoters = ((totalPartyMembers / (stats.votersList2025 || 426)) * 100).toFixed(2);

  // Open Modal for Add
  const handleOpenAdd = (type: 'birth' | 'death') => {
    setModalType(type);
    setEditingRecord(null);
    setFormData({
      type,
      personName: '',
      gender: type === 'birth' ? 'ប' : 'ប',
      eventDate: `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`,
      age: type === 'death' ? 70 : 0,
      category: 'party',
      fatherName: '',
      motherName: '',
      causeOfDeath: type === 'death' ? 'ជរាពាធ' : '',
      groupNo: 1,
      houseNo: '',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (rec: VitalEventRecord) => {
    setModalType(rec.type);
    setEditingRecord(rec);
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  // Save Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName || !formData.eventDate) return;

    if (editingRecord) {
      onUpdateVitalEvents(vitalEvents.map(v => v.id === editingRecord.id ? { ...editingRecord, ...formData } as VitalEventRecord : v));
    } else {
      const newId = vitalEvents.length > 0 ? Math.max(...vitalEvents.map(v => v.id)) + 1 : 1;
      const newRecord: VitalEventRecord = {
        id: newId,
        type: modalType,
        personName: formData.personName || '',
        gender: formData.gender || 'ប',
        eventDate: formData.eventDate || '',
        age: modalType === 'death' ? Number(formData.age) || 0 : undefined,
        category: formData.category || 'party',
        fatherName: formData.fatherName || '',
        motherName: formData.motherName || '',
        causeOfDeath: formData.causeOfDeath || '',
        groupNo: Number(formData.groupNo) || 1,
        houseNo: formData.houseNo || '',
        remarks: formData.remarks || '',
      };
      onUpdateVitalEvents([newRecord, ...vitalEvents]);
    }
    setIsModalOpen(false);
  };

  // Delete Record
  const handleDeleteRecord = (id: number) => {
    onUpdateVitalEvents(vitalEvents.filter(v => v.id !== id));
  };

  // Print Handler
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `របាយការណ៍សមាជិកបក្ស_និងប្រជាជនទូទៅ_សម្រាល_មរណៈ_ភូមិរលួស_${activeMonthName}_${activeYearKhmer}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ['គណបក្សប្រជាជនកម្ពុជា'],
      ['គណៈកម្មាធិការគណបក្សឃុំបន្ទាយស្ទោង - សាខាបក្សភូមិរលួស'],
      [`របាយការណ៍ស្ថិតិសមាជិកគណបក្ស និងប្រជាជនទូទៅ (សម្រាល - មរណៈ) ខែ${activeMonthName} ឆ្នាំ${activeYearKhmer}`],
      [],
      ['ល.រ', 'សូចនាករស្ថិតិ', 'ប្រជាជនទូទៅសរុប', 'ស្រី', 'ប្រុស', 'សមាជិកបក្ស', 'ស្រី', 'ប្រុស', 'ភាគរយបក្ស (%)', 'សម្គាល់'],
      [1, 'ចំនួនប្រជាជន / សមាជិកសរុប', genPopStats.villageTotalPopulation, genPopStats.villageFemalePopulation, genPopStats.villageMalePopulation, totalPartyMembers, femalePartyMembers, malePartyMembers, `${partyRatioGenPop}%`, 'ភូមិរលួស'],
      [2, 'ចំនួនគ្រួសារ', genPopStats.villageTotalFamilies, '-', '-', stats.partyFamilyHeads, '-', '-', `${((stats.partyFamilyHeads / genPopStats.villageTotalFamilies) * 100).toFixed(1)}%`, 'មេគ្រួសារបក្ស'],
      [3, 'ចំនួនខ្នងផ្ទះ', genPopStats.villageTotalRoofs, '-', '-', '-', '-', '-', '-', 'ខ្នងផ្ទះ'],
      [4, 'ប្រជាពលរដ្ឋអាយុ ១៨ ឆ្នាំឡើង (ក្នុងបញ្ជីបោះឆ្នោត)', genPopStats.votingAgePopulation, genPopStats.votingAgeFemale, genPopStats.votingAgePopulation - genPopStats.votingAgeFemale, totalPartyMembers, femalePartyMembers, malePartyMembers, `${partyRatioVoters}%`, 'គ.ជ.ប ២០២៥'],
      [5, 'ចំនួនកុមារសម្រាល / កើតថ្មី', birthsTotal, birthsFemale, birthsMale, birthsParty, birthsPartyFemale, birthsPartyMale, `${birthsTotal > 0 ? ((birthsParty / birthsTotal) * 100).toFixed(1) : 0}%`, 'កើតក្នុងខែ'],
      [6, 'ចំនួនអ្នកទទួលមរណភាព', deathsTotal, deathsFemale, deathsMale, deathsParty, deathsPartyFemale, deathsPartyMale, `${deathsTotal > 0 ? ((deathsParty / deathsTotal) * 100).toFixed(1) : 0}%`, 'មរណៈក្នុងខែ'],
      [7, 'កំណើនប្រជាសាស្ត្រសុទ្ធ (សម្រាល - មរណៈ)', netGenPopGrowth, birthsFemale - deathsFemale, birthsMale - deathsMale, netPartyGrowth, birthsPartyFemale - deathsPartyFemale, birthsPartyMale - deathsPartyMale, '-', 'បម្រែបម្រួល'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'ស្ថិតិសង្ខេប');

    // 2. Births Sheet
    const birthsData = [
      [`បញ្ជីរាយនាមកុមារសម្រាល / កើតថ្មី ភូមិរលួស ខែ${activeMonthName} ឆ្នាំ${activeYearKhmer}`],
      [],
      ['ល.រ', 'ឈ្មោះកុមារ', 'ភេទ', 'ថ្ងៃខែឆ្នាំសម្រាល', 'ឈ្មោះឪពុក', 'ឈ្មោះម្តាយ', 'ស្ថានភាពគ្រួសារ', 'ក្រុមទី', 'លេខផ្ទះ', 'សម្គាល់'],
      ...birthRecords.map((r, i) => [
        i + 1,
        r.personName,
        r.gender,
        r.eventDate,
        r.fatherName || '-',
        r.motherName || '-',
        r.category === 'party' ? 'គ្រួសារបក្ស' : 'ប្រជាជនទូទៅ',
        r.groupNo,
        r.houseNo || '-',
        r.remarks || '-',
      ]),
    ];
    const wsBirths = XLSX.utils.aoa_to_sheet(birthsData);
    XLSX.utils.book_append_sheet(wb, wsBirths, 'បញ្ជីសម្រាល');

    // 3. Deaths Sheet
    const deathsData = [
      [`បញ្ជីរាយនាមអ្នកទទួលមរណភាព ភូមិរលួស ខែ${activeMonthName} ឆ្នាំ${activeYearKhmer}`],
      [],
      ['ល.រ', 'ឈ្មោះសព', 'ភេទ', 'អាយុ', 'ថ្ងៃខែឆ្នាំមរណៈ', 'មូលហេតុនៃការស្លាប់', 'ស្ថានភាព', 'ក្រុមទី', 'លេខផ្ទះ', 'សម្គាល់'],
      ...deathRecords.map((r, i) => [
        i + 1,
        r.personName,
        r.gender,
        r.age || '-',
        r.eventDate,
        r.causeOfDeath || '-',
        r.category === 'party' ? 'សមាជិកបក្ស' : 'ប្រជាជនទូទៅ',
        r.groupNo,
        r.houseNo || '-',
        r.remarks || '-',
      ]),
    ];
    const wsDeaths = XLSX.utils.aoa_to_sheet(deathsData);
    XLSX.utils.book_append_sheet(wb, wsDeaths, 'បញ្ជីមរណភាព');

    XLSX.writeFile(wb, `របាយការណ៍បក្ស_និងប្រជាជន_សម្រាល_មរណៈ_ភូមិរលួស_${activeMonthName}_${activeYearKhmer}.xlsx`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 font-kantumruy">
      {/* 1. Top Action & Navigation Toolbar (Hidden during print) */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
              title="ត្រឡប់ទៅតារាង Google Sheets"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-amber-400/30 to-blue-600/30 blur-xs"></div>
              <Image 
                src="/cpp-logo.png" 
                alt="គណបក្សប្រជាជនកម្ពុជា" 
                width={40}
                height={40}
                className="w-10 h-10 object-contain shrink-0 relative"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-kantumruy">
                  ទម្រង់របាយការណ៍សមាជិកបក្ស និងប្រជាជនទូទៅ (សម្រាល - មរណៈ)
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  ទម្រង់រដ្ឋបាលផ្លូវការ
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenAdd('birth')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Baby className="w-4 h-4 text-rose-600" />
              <span>កត់ត្រាការសម្រាលថ្មី</span>
            </button>

            <button
              onClick={() => handleOpenAdd('death')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <HeartCrack className="w-4 h-4 text-slate-600" />
              <span>កត់ត្រាមរណភាពថ្មី</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileDown className="w-4 h-4" />
              <span>ទាញយក Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព A4 (Print)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Month Selector & Tab Navigation Bar (Hidden during print) */}
      <div className="max-w-7xl w-full mx-auto px-4 mt-4 no-print space-y-3">
        {/* Month Selector Card */}
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 shrink-0">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>កាលបរិច្ឆេទរបាយការណ៍ ៖</span>
            </div>

            {/* Month Select */}
            <select
              value={monthMode === 'auto' ? 'auto' : monthMode.toString()}
              onChange={(e) => setMonthMode(e.target.value === 'auto' ? 'auto' : parseInt(e.target.value, 10))}
              className="bg-slate-50 hover:bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              <option value="auto">⚡ ស្វ័យប្រវត្តិ Auto (ខែបច្ចុប្បន្ន ៖ ខែ{KHMER_MONTHS[currentMonthIdx]})</option>
              <optgroup label="ជ្រើសរើសខែជាក់លាក់ (ទាំង ១២ ខែ)">
                {KHMER_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx.toString()}>
                    ខែ{m} (ខែទី {toKhmerNum(idx + 1)})
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Year Select */}
            <select
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

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-950 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>របាយការណ៍ ៖ <strong className="text-emerald-900 underline decoration-emerald-400 font-bold">ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}</strong></span>
              {monthMode === 'auto' && (
                <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                  Auto
                </span>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={fillSignatureDay}
              onChange={(e) => setFillSignatureDay(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-[11.5px] font-medium">
              បំពេញថ្ងៃទីស្វ័យប្រវត្តក្នុងហត្ថលេខា (ថ្ងៃទី {activeDayKhmer})
            </span>
          </label>
        </div>

        {/* Section View Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeSection === 'all' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ទម្រង់របាយការណ៍ទាំងមូល (Full Report A4)</span>
          </button>
          <button
            onClick={() => setActiveSection('summary')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeSection === 'summary' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>តារាងស្ថិតិប្រៀបធៀបរួម</span>
          </button>
          <button
            onClick={() => setActiveSection('births')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeSection === 'births' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>បញ្ជីសម្រាល/កើត ({toKhmerNum(birthsTotal)})</span>
          </button>
          <button
            onClick={() => setActiveSection('deaths')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              activeSection === 'deaths' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <HeartCrack className="w-4 h-4" />
            <span>បញ្ជីមរណភាព ({toKhmerNum(deathsTotal)})</span>
          </button>
        </div>
      </div>

      {/* 3. Executive Summary KPI Badges (Hidden during print) */}
      <div className="max-w-7xl w-full mx-auto px-4 mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        {/* Total Population */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">ប្រជាជនទូទៅសរុប</span>
            <span className="text-xl font-bold text-slate-900">{toKhmerNum(genPopStats.villageTotalPopulation)} នាក់</span>
            <span className="text-[11px] text-slate-500 block">ស្រី {toKhmerNum(genPopStats.villageFemalePopulation)} / {toKhmerNum(genPopStats.villageTotalFamilies)} គ្រួសារ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Party Members */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">សមាជិកបក្សសរុប</span>
            <span className="text-xl font-bold text-emerald-800">{toKhmerNum(totalPartyMembers)} នាក់</span>
            <span className="text-[11px] text-emerald-700 font-medium block">ស្រី {toKhmerNum(femalePartyMembers)} ({partyRatioVoters}% បោះឆ្នោត)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Births Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-600 font-semibold block">កុមារសម្រាល/កើតថ្មី</span>
            <span className="text-xl font-bold text-rose-800">{toKhmerNum(birthsTotal)} នាក់</span>
            <span className="text-[11px] text-slate-600 block">គ្រួសារបក្ស {toKhmerNum(birthsParty)} / ប្រជាជន {toKhmerNum(birthsGeneral)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Baby className="w-5 h-5" />
          </div>
        </div>

        {/* Deaths Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-600 font-semibold block">ចំនួនមរណភាព</span>
            <span className="text-xl font-bold text-slate-900">{toKhmerNum(deathsTotal)} នាក់</span>
            <span className="text-[11px] text-slate-500 block">សមាជិកបក្ស {toKhmerNum(deathsParty)} / ប្រជាជន {toKhmerNum(deathsGeneral)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <HeartCrack className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. MAIN OFFICIAL A4 REPORT DOCUMENT */}
      <div className="max-w-7xl w-full mx-auto px-4 my-6 print:m-0 print:p-0 print:max-w-none print:w-full">
        <div 
          id="vital-official-document" 
          className="bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-300 print:p-0 print:border-none print:shadow-none print:rounded-none space-y-8 print:space-y-6"
        >
          {/* Official Administrative Header */}
          <div className="border-b-2 border-slate-900 pb-4 print:pb-3">
            <div className="flex items-start justify-between">
              {/* Left Header */}
              <div className="text-center w-64 space-y-0.5">
                <p className="font-moul text-xs sm:text-[13px] text-slate-950">គណបក្សប្រជាជនកម្ពុជា</p>
                <p className="text-[11.5px] font-semibold text-slate-800">គណៈកម្មាធិការគណបក្សឃុំបន្ទាយស្ទោង</p>
                <p className="text-[11px] text-slate-700">សាខាគណបក្សភូមិរលួស</p>
                <p className="text-[10px] text-slate-600">លេខ ៖ ............ / គ.ប.ខ</p>
              </div>

              {/* Center: Official Logo */}
              <div className="flex flex-col items-center">
                <Image 
                  src="/cpp-logo.png" 
                  alt="គណបក្សប្រជាជនកម្ពុជា" 
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain"
                  referrerPolicy="no-referrer"
                  priority
                />
              </div>

              {/* Right Header: Kingdom Motto */}
              <div className="text-center w-64 space-y-0.5">
                <p className="font-moul text-xs sm:text-[13px] text-slate-950">ព្រះរាជាណាចក្រកម្ពុជា</p>
                <p className="font-moul text-xs text-slate-950">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                <p className="text-xs tracking-widest text-slate-700 font-bold">--- 𖧹 ---</p>
              </div>
            </div>

            {/* Document Main Title */}
            <div className="text-center mt-4 space-y-1">
              <h1 className="font-moul text-base sm:text-lg print:text-[16px] text-slate-950">
                របាយការណ៍ស្ថិតិប្រជាសាស្ត្រ សមាជិកគណបក្ស និងប្រជាជនទូទៅ
              </h1>
              <h2 className="text-xs sm:text-sm font-bold text-rose-900 font-kantumruy">
                (ទិន្នន័យប្រជាជនរួម • កុមារសម្រាល/កើតថ្មី • អ្នកទទួលមរណភាព)
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 font-kantumruy">
                ក្នុងភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
              </p>
            </div>
          </div>

          {/* SECTION 1: Standard Demographic Comparison Table */}
          {(activeSection === 'all' || activeSection === 'summary') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <h3 className="font-moul text-xs sm:text-sm text-slate-950 flex items-center gap-2">
                  <span>I. តារាងស្ថិតិប្រៀបធៀបរួម រវាងសមាជិកបក្ស និងប្រជាជនទូទៅ</span>
                </h3>
                <span className="text-[11px] text-slate-600 font-medium">ឯកតា ៖ នាក់ / គ្រួសារ</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-slate-900 text-[11px] print:text-[10px] text-slate-950">
                  <thead className="bg-slate-100 font-kantumruy">
                    <tr className="border-b-2 border-slate-900 text-center font-bold">
                      <th rowSpan={2} className="border border-slate-900 py-2 px-1 w-10">ល.រ</th>
                      <th rowSpan={2} className="border border-slate-900 py-2 px-3 text-left">សូចនាករស្ថិតិ / ខ្លឹមសារ</th>
                      <th colSpan={3} className="border border-slate-900 py-1.5 px-2 bg-blue-50 text-blue-950">
                        ប្រជាជនទូទៅក្នុងភូមិ
                      </th>
                      <th colSpan={3} className="border border-slate-900 py-1.5 px-2 bg-emerald-50 text-emerald-950">
                        សមាជិកគណបក្សប្រជាជន
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-2 px-2 w-24 bg-amber-50 text-amber-950">
                        ភាគរយបក្ស (%)
                      </th>
                      <th rowSpan={2} className="border border-slate-900 py-2 px-2 w-28 text-left">
                        សម្គាល់
                      </th>
                    </tr>
                    <tr className="border-b-2 border-slate-900 text-center font-bold text-[10.5px]">
                      <th className="border border-slate-900 py-1 px-1.5 w-14 bg-blue-50">សរុប</th>
                      <th className="border border-slate-900 py-1 px-1.5 w-14 bg-blue-50 text-rose-900">ស្រី</th>
                      <th className="border border-slate-900 py-1 px-1.5 w-14 bg-blue-50 text-blue-900">ប្រុស</th>
                      <th className="border border-slate-900 py-1 px-1.5 w-14 bg-emerald-50 font-bold">សរុប</th>
                      <th className="border border-slate-900 py-1 px-1.5 w-14 bg-emerald-50 text-rose-900">ស្រី</th>
                      <th className="border border-slate-900 py-1 px-1.5 w-14 bg-emerald-50 text-blue-900">ប្រុស</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 1. Total Population */}
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-900 p-2 text-center font-bold">១</td>
                      <td className="border border-slate-900 p-2 font-bold">
                        ចំនួនប្រជាជនទូទៅ និង សមាជិកបក្សសរុប
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold">{toKhmerNum(genPopStats.villageTotalPopulation)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900 font-semibold">{toKhmerNum(genPopStats.villageFemalePopulation)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900 font-semibold">{toKhmerNum(genPopStats.villageMalePopulation)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-950">{toKhmerNum(totalPartyMembers)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900 font-semibold">{toKhmerNum(femalePartyMembers)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900 font-semibold">{toKhmerNum(malePartyMembers)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-900 bg-amber-50/50">{partyRatioGenPop}%</td>
                      <td className="border border-slate-900 p-2 text-slate-700 text-[10px]">ធៀបប្រជាជនរួម</td>
                    </tr>

                    {/* 2. Families & Roofs */}
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-900 p-2 text-center font-bold">២</td>
                      <td className="border border-slate-900 p-2 font-medium">
                        ចំនួនគ្រួសារ និងខ្នងផ្ទះក្នុងភូមិ
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold">{toKhmerNum(genPopStats.villageTotalFamilies)} គ្រួសារ</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-500">-</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-500">-</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-950">{toKhmerNum(stats.partyFamilyHeads)} គ្រួសារ</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-500">-</td>
                      <td className="border border-slate-900 p-2 text-center text-slate-500">-</td>
                      <td className="border border-slate-900 p-2 text-center font-bold bg-amber-50/50">
                        {((stats.partyFamilyHeads / genPopStats.villageTotalFamilies) * 100).toFixed(1)}%
                      </td>
                      <td className="border border-slate-900 p-2 text-slate-700 text-[10px]">{toKhmerNum(genPopStats.villageTotalRoofs)} ខ្នងផ្ទះ</td>
                    </tr>

                    {/* 3. Voters list 18+ */}
                    <tr className="hover:bg-slate-50">
                      <td className="border border-slate-900 p-2 text-center font-bold">៣</td>
                      <td className="border border-slate-900 p-2 font-medium">
                        ប្រជាពលរដ្ឋអាយុ ១៨ ឆ្នាំឡើង (ក្នុងបញ្ជី គ.ជ.ប)
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold">{toKhmerNum(genPopStats.votingAgePopulation)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900">{toKhmerNum(genPopStats.votingAgeFemale)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900">{toKhmerNum(genPopStats.votingAgePopulation - genPopStats.votingAgeFemale)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-950">{toKhmerNum(totalPartyMembers)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900">{toKhmerNum(femalePartyMembers)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900">{toKhmerNum(malePartyMembers)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-900 bg-amber-50/50">{partyRatioVoters}%</td>
                      <td className="border border-slate-900 p-2 text-slate-700 text-[10px]">បញ្ជីបោះឆ្នោត ២០២៥</td>
                    </tr>

                    {/* 4. Births (សម្រាល) */}
                    <tr className="bg-rose-50/40 hover:bg-rose-50/70">
                      <td className="border border-slate-900 p-2 text-center font-bold text-rose-950">៤</td>
                      <td className="border border-slate-900 p-2 font-bold text-rose-950">
                        កុមារសម្រាល / កើតថ្មី (ក្នុងខែ{activeMonthName})
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-rose-950">{toKhmerNum(birthsTotal)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900 font-bold">{toKhmerNum(birthsFemale)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900 font-bold">{toKhmerNum(birthsMale)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-950">{toKhmerNum(birthsParty)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900 font-bold">{toKhmerNum(birthsPartyFemale)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900 font-bold">{toKhmerNum(birthsPartyMale)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-rose-900 bg-amber-50/50">
                        {birthsTotal > 0 ? ((birthsParty / birthsTotal) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="border border-slate-900 p-2 text-slate-700 text-[10px]">
                        ប្រជាជនទូទៅ {toKhmerNum(birthsGeneral)} នាក់
                      </td>
                    </tr>

                    {/* 5. Deaths (មរណៈ) */}
                    <tr className="bg-slate-100/60 hover:bg-slate-100">
                      <td className="border border-slate-900 p-2 text-center font-bold text-slate-950">៥</td>
                      <td className="border border-slate-900 p-2 font-bold text-slate-950">
                        ចំនួនអ្នកទទួលមរណភាព (ក្នុងខែ{activeMonthName})
                      </td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-slate-950">{toKhmerNum(deathsTotal)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900 font-semibold">{toKhmerNum(deathsFemale)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900 font-semibold">{toKhmerNum(deathsMale)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-950">{toKhmerNum(deathsParty)}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900 font-semibold">{toKhmerNum(deathsPartyFemale)}</td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900 font-semibold">{toKhmerNum(deathsPartyMale)}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold bg-amber-50/50">
                        {deathsTotal > 0 ? ((deathsParty / deathsTotal) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="border border-slate-900 p-2 text-slate-700 text-[10px]">
                        ប្រជាជនទូទៅ {toKhmerNum(deathsGeneral)} នាក់
                      </td>
                    </tr>

                    {/* 6. Net Natural Growth */}
                    <tr className="bg-emerald-50/50 font-bold">
                      <td className="border border-slate-900 p-2 text-center">៦</td>
                      <td className="border border-slate-900 p-2 text-emerald-950">
                        កំណើនប្រជាសាស្ត្រសុទ្ធ (សម្រាល ដក មរណភាព)
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-emerald-900 font-bold">
                        {netGenPopGrowth >= 0 ? `+${toKhmerNum(netGenPopGrowth)}` : toKhmerNum(netGenPopGrowth)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900">
                        {birthsFemale - deathsFemale >= 0 ? `+${toKhmerNum(birthsFemale - deathsFemale)}` : toKhmerNum(birthsFemale - deathsFemale)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900">
                        {birthsMale - deathsMale >= 0 ? `+${toKhmerNum(birthsMale - deathsMale)}` : toKhmerNum(birthsMale - deathsMale)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-emerald-950 font-bold">
                        {netPartyGrowth >= 0 ? `+${toKhmerNum(netPartyGrowth)}` : toKhmerNum(netPartyGrowth)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-rose-900">
                        {birthsPartyFemale - deathsPartyFemale >= 0 ? `+${toKhmerNum(birthsPartyFemale - deathsPartyFemale)}` : toKhmerNum(birthsPartyFemale - deathsPartyFemale)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-blue-900">
                        {birthsPartyMale - deathsPartyMale >= 0 ? `+${toKhmerNum(birthsPartyMale - deathsPartyMale)}` : toKhmerNum(birthsPartyMale - deathsPartyMale)}
                      </td>
                      <td className="border border-slate-900 p-2 text-center bg-amber-50/50">-</td>
                      <td className="border border-slate-900 p-2 text-emerald-900 text-[10px]">
                        {netPartyGrowth >= 0 ? 'កើនឡើងសុទ្ធ' : 'ថយចុះសុទ្ធ'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 2: Detailed Registry of Births (បញ្ជីរាយនាមកុមារសម្រាល / កើតថ្មី) */}
          {(activeSection === 'all' || activeSection === 'births') && (
            <div className="space-y-3 pt-4 border-t border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    <Baby className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-moul text-xs sm:text-sm text-slate-950">
                    II. បញ្ជីរាយនាមកុមារសម្រាល / កើតថ្មី ក្នុងមូលដ្ឋាន (សរុប {toKhmerNum(birthsTotal)} នាក់ • ស្រី {toKhmerNum(birthsFemale)} នាក់)
                  </h3>
                </div>
                <button
                  onClick={() => handleOpenAdd('birth')}
                  className="no-print flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>បន្ថែមសម្រាល</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-slate-900 text-[10.5px] print:text-[9.5px] text-slate-950">
                  <thead className="bg-rose-50/70 font-kantumruy font-bold border-b-2 border-slate-900 text-center">
                    <tr>
                      <th className="border border-slate-900 py-1.5 px-1 w-9">ល.រ</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left w-36">ឈ្មោះកុមារ</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-12">ភេទ</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-24">ថ្ងៃសម្រាល</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left w-32">ឈ្មោះឪពុក</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left w-32">ឈ្មោះម្តាយ</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-28">ស្ថានភាពគ្រួសារ</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-14">ក្រុមទី</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-16">ផ្ទះលេខ</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left">សម្គាល់ / ស្ថានភាពសុខភាព</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-16 no-print">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {birthRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="border border-slate-900 py-4 text-center text-slate-500 italic">
                          គ្មានទិន្នន័យសម្រាលកូនក្នុងខែនេះឡើយ
                        </td>
                      </tr>
                    ) : (
                      birthRecords.map((b, idx) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="border border-slate-900 p-1.5 text-center font-bold">{toKhmerNum(idx + 1)}</td>
                          <td className="border border-slate-900 p-1.5 font-bold text-slate-950">{b.personName}</td>
                          <td className={`border border-slate-900 p-1.5 text-center font-bold ${b.gender === 'ស' ? 'text-rose-900' : 'text-blue-900'}`}>
                            {b.gender === 'ស' ? 'ស្រី' : 'ប្រុស'}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center font-medium">{b.eventDate}</td>
                          <td className="border border-slate-900 p-1.5">{b.fatherName || '-'}</td>
                          <td className="border border-slate-900 p-1.5">{b.motherName || '-'}</td>
                          <td className="border border-slate-900 p-1.5 text-center">
                            {b.category === 'party' ? (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold text-[9.5px]">
                                គ្រួសារបក្ស
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold text-[9.5px]">
                                ប្រជាជនទូទៅ
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center font-medium">{toKhmerNum(b.groupNo)}</td>
                          <td className="border border-slate-900 p-1.5 text-center">{b.houseNo ? toKhmerNum(b.houseNo) : '-'}</td>
                          <td className="border border-slate-900 p-1.5 text-[10px] text-slate-700">{b.remarks || '-'}</td>
                          <td className="border border-slate-900 p-1 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(b)}
                                className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="កែសម្រួល"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(b.id)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="លុប"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: Detailed Registry of Deceased (បញ្ជីរាយនាមអ្នកទទួលមរណភាព) */}
          {(activeSection === 'all' || activeSection === 'deaths') && (
            <div className="space-y-3 pt-4 border-t border-slate-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs">
                    <HeartCrack className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-moul text-xs sm:text-sm text-slate-950">
                    III. បញ្ជីរាយនាមអ្នកទទួលមរណភាព ក្នុងមូលដ្ឋាន (សរុប {toKhmerNum(deathsTotal)} នាក់ • ស្រី {toKhmerNum(deathsFemale)} នាក់)
                  </h3>
                </div>
                <button
                  onClick={() => handleOpenAdd('death')}
                  className="no-print flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>បន្ថែមមរណភាព</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border-2 border-slate-900 text-[10.5px] print:text-[9.5px] text-slate-950">
                  <thead className="bg-slate-100 font-kantumruy font-bold border-b-2 border-slate-900 text-center">
                    <tr>
                      <th className="border border-slate-900 py-1.5 px-1 w-9">ល.រ</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left w-36">ឈ្មោះសព</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-12">ភេទ</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-14">អាយុ</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-24">ថ្ងៃមរណភាព</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left w-44">មូលហេតុនៃការស្លាប់</th>
                      <th className="border border-slate-900 py-1.5 px-2 w-28">ស្ថានភាព</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-14">ក្រុមទី</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-16">ផ្ទះលេខ</th>
                      <th className="border border-slate-900 py-1.5 px-2 text-left">ផ្សេងៗ / សម្គាល់</th>
                      <th className="border border-slate-900 py-1.5 px-1 w-16 no-print">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deathRecords.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="border border-slate-900 py-4 text-center text-slate-500 italic">
                          គ្មានទិន្នន័យមរណភាពក្នុងខែនេះឡើយ
                        </td>
                      </tr>
                    ) : (
                      deathRecords.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="border border-slate-900 p-1.5 text-center font-bold">{toKhmerNum(idx + 1)}</td>
                          <td className="border border-slate-900 p-1.5 font-bold text-slate-950">{d.personName}</td>
                          <td className={`border border-slate-900 p-1.5 text-center font-bold ${d.gender === 'ស' ? 'text-rose-900' : 'text-blue-900'}`}>
                            {d.gender === 'ស' ? 'ស្រី' : 'ប្រុស'}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center font-bold">{d.age ? `${toKhmerNum(d.age)} ឆ្នាំ` : '-'}</td>
                          <td className="border border-slate-900 p-1.5 text-center font-medium">{d.eventDate}</td>
                          <td className="border border-slate-900 p-1.5 font-medium text-rose-950">{d.causeOfDeath || 'ជរាពាធ'}</td>
                          <td className="border border-slate-900 p-1.5 text-center">
                            {d.category === 'party' ? (
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold text-[9.5px]">
                                សមាជិកបក្ស
                              </span>
                            ) : (
                              <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-semibold text-[9.5px]">
                                ប្រជាជនទូទៅ
                              </span>
                            )}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center font-medium">{toKhmerNum(d.groupNo)}</td>
                          <td className="border border-slate-900 p-1.5 text-center">{d.houseNo ? toKhmerNum(d.houseNo) : '-'}</td>
                          <td className="border border-slate-900 p-1.5 text-[10px] text-slate-700">{d.remarks || '-'}</td>
                          <td className="border border-slate-900 p-1 text-center no-print">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(d)}
                                className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                                title="កែសម្រួល"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(d.id)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="លុប"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: Official Signatures Block */}
          <div className="pt-6 border-t-2 border-slate-900 break-inside-avoid">
            <div className="flex items-start justify-between text-center pt-2">
              <div className="space-y-1 w-64">
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</p>
                <p className="text-xs text-slate-600">
                  {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី........... '}
                  ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
                </p>
                <p className="text-xs font-bold text-slate-700 pt-1">មេភូមិរលួស</p>
                <p className="font-moul text-xs sm:text-sm pt-14 text-slate-950">លោក {stats.villageHead || 'ជា ជី'}</p>
              </div>

              <div className="space-y-1 w-72">
                <p className="font-semibold text-slate-800 text-xs sm:text-sm">ប្រធានក្រុមការងារចុះជួយភូមិរលួស</p>
                <p className="text-xs text-slate-600">
                  {fillSignatureDay ? `ថ្ងៃទី ${activeDayKhmer} ` : 'ថ្ងៃទី........... '}
                  ខែ{activeMonthName} ឆ្នាំ{activeYearKhmer}
                </p>
                <p className="text-xs font-bold text-slate-700 pt-1">ហត្ថលេខា និងឈ្មោះ</p>
                <p className="font-moul text-xs sm:text-sm pt-14 text-slate-950">លោក {stats.teamLeader || 'ផូ វុធ'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT VITAL RECORD (សម្រាល ឬ មរណៈ) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`px-6 py-4 flex items-center justify-between text-white ${
              modalType === 'birth' ? 'bg-rose-700' : 'bg-slate-900'
            }`}>
              <div className="flex items-center gap-2">
                {modalType === 'birth' ? (
                  <Baby className="w-5 h-5 text-rose-200" />
                ) : (
                  <HeartCrack className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="font-bold text-base">
                  {editingRecord 
                    ? `កែប្រែទិន្នន័យ${modalType === 'birth' ? 'សម្រាលកូន' : 'មរណភាព'}` 
                    : `កត់ត្រា${modalType === 'birth' ? 'កុមារសម្រាលថ្មី' : 'មរណភាពថ្មី'}`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                {/* Type toggle */}
                <div className="col-span-2 flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setModalType('birth'); setFormData(prev => ({ ...prev, type: 'birth' })); }}
                    className={`flex-1 py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      modalType === 'birth' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>សម្រាល / កើត</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModalType('death'); setFormData(prev => ({ ...prev, type: 'death' })); }}
                    className={`flex-1 py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      modalType === 'death' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <HeartCrack className="w-3.5 h-3.5" />
                    <span>មរណៈ / មរណភាព</span>
                  </button>
                </div>

                {/* Name */}
                <div className="col-span-2">
                  <label className="block mb-1 font-bold text-slate-900">
                    {modalType === 'birth' ? 'ឈ្មោះកុមារ (នាមត្រកូល-នាមខ្លួន) *' : 'ឈ្មោះសព (នាមត្រកូល-នាមខ្លួន) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.personName || ''}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    placeholder="ឧ. ជី សុខា"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block mb-1 font-bold text-slate-900">ភេទ *</label>
                  <select
                    value={formData.gender || 'ប'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'ប' | 'ស' })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="ប">ប្រុស (ប)</option>
                    <option value="ស">ស្រី (ស)</option>
                  </select>
                </div>

                {/* Event Date */}
                <div>
                  <label className="block mb-1 font-bold text-slate-900">
                    {modalType === 'birth' ? 'ថ្ងៃខែឆ្នាំសម្រាល *' : 'ថ្ងៃខែឆ្នាំមរណៈ *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eventDate || ''}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    placeholder="DD/MM/YYYY (ឧ. 15/09/2026)"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Category (Party vs General) */}
                <div>
                  <label className="block mb-1 font-bold text-slate-900">ស្ថានភាព *</label>
                  <select
                    value={formData.category || 'party'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'party' | 'general' })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="party">គ្រួសារគណបក្សប្រជាជន</option>
                    <option value="general">គ្រួសារប្រជាជនទូទៅ</option>
                  </select>
                </div>

                {/* Group No */}
                <div>
                  <label className="block mb-1 font-bold text-slate-900">ក្រុមទី (1 - 21) *</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={formData.groupNo || 1}
                    onChange={(e) => setFormData({ ...formData, groupNo: parseInt(e.target.value, 10) || 1 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* If Birth: Father & Mother Names */}
                {modalType === 'birth' ? (
                  <>
                    <div>
                      <label className="block mb-1 font-bold text-slate-900">ឈ្មោះឪពុក</label>
                      <input
                        type="text"
                        value={formData.fatherName || ''}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="ឧ. ជី ភា"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-900">ឈ្មោះម្តាយ</label>
                      <input
                        type="text"
                        value={formData.motherName || ''}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        placeholder="ឧ. សាន ឡៃហ៊ុន"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  /* If Death: Age & Cause of death */
                  <>
                    <div>
                      <label className="block mb-1 font-bold text-slate-900">អាយុពេលមរណភាព</label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={formData.age || 0}
                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                        placeholder="ឧ. 72"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold text-slate-900">មូលហេតុនៃការស្លាប់</label>
                      <input
                        type="text"
                        value={formData.causeOfDeath || ''}
                        onChange={(e) => setFormData({ ...formData, causeOfDeath: e.target.value })}
                        placeholder="ឧ. ជរាពាធ, ជំងឺ..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* House No */}
                <div className="col-span-2">
                  <label className="block mb-1 font-bold text-slate-900">លេខផ្ទះ / ខ្នងផ្ទះ</label>
                  <input
                    type="text"
                    value={formData.houseNo || ''}
                    onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                    placeholder="ឧ. 12"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Remarks */}
                <div className="col-span-2">
                  <label className="block mb-1 font-bold text-slate-900">ផ្សេងៗ / សម្គាល់</label>
                  <textarea
                    rows={2}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="ព័ត៌មានបន្ថែម ឧ. សុខភាពមាំមួនល្អ ឬ បានធ្វើបុណ្យតាមប្រពៃណី..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {editingRecord ? 'ធ្វើបច្ចុប្បន្នភាព' : 'រក្សាទុកទិន្នន័យ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
