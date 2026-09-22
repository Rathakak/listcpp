'use client';

import React, { useState, useMemo } from 'react';
import { MemberRecord } from '@/lib/types';
import { calculateAgeGenderStats, copyAgeSummaryForSheets } from '@/lib/ageCalculations';
import { exportToExcel } from '@/lib/spreadsheetHelpers';
import { initialVillageStats } from '@/lib/initialData';
import { 
  Users, User, Download, Copy, Check, Filter, 
  ArrowUpDown, Search, Award, TrendingUp, Calendar, 
  UserCheck, ShieldCheck
} from 'lucide-react';

interface AgeGenderSummaryProps {
  records: MemberRecord[];
  onFilterByAgeBracket?: (minAge: number, maxAge: number, bracketName: string) => void;
  onFilterByExactAge?: (age: number) => void;
}

export default function AgeGenderSummary({
  records,
  onFilterByAgeBracket,
  onFilterByExactAge,
}: AgeGenderSummaryProps) {
  const [activeTab, setActiveTab] = useState<'brackets' | 'singleAge'>('brackets');
  const [copied, setCopied] = useState(false);
  const [searchSingleAge, setSearchSingleAge] = useState('');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'all' | 'ប' | 'ស'>('all');

  const stats = useMemo(() => calculateAgeGenderStats(records), [records]);

  const handleCopyTSV = async () => {
    const success = await copyAgeSummaryForSheets(records);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Filtered single age items
  const filteredSingleAges = useMemo(() => {
    return stats.singleAgeStats.filter(item => {
      if (searchSingleAge) {
        const query = searchSingleAge.trim();
        const matchesAge = item.age.toString().includes(query);
        const matchesNames = item.members.some(m => m.fullName.toLowerCase().includes(query.toLowerCase()));
        if (!matchesAge && !matchesNames) return false;
      }
      if (selectedGenderFilter === 'ប' && item.maleCount === 0) return false;
      if (selectedGenderFilter === 'ស' && item.femaleCount === 0) return false;
      return true;
    });
  }, [stats.singleAgeStats, searchSingleAge, selectedGenderFilter]);

  return (
    <div id="age-gender-summary-module" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden font-kantumruy">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>តារាងសរុបសមាជិក ស្រី និង ប្រុស តាមក្រុមអាយុ</span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-medium">
                  Google Sheets Pivot
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ (សរុប {stats.total} នាក់)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <button
            onClick={handleCopyTSV}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
            title="ចម្លងតារាងសរុបអាយុនេះ ដើម្បីចុច Ctrl + V បិទភ្ជាប់លើ Google Sheets"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            <span>{copied ? 'បានចម្លងជោគជ័យ!' : 'ចម្លងដាក់ Google Sheets'}</span>
          </button>

          <button
            onClick={() => exportToExcel(records, initialVillageStats)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>ទាញយក Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Metric Cards */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/50">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Members */}
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>សរុបរួម</span>
              <Users className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-[11px] text-slate-500">១០០% នៃសមាជិក</div>
          </div>

          {/* Male Total */}
          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
              <span>ប្រុសសរុប (ប)</span>
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.maleTotal}</div>
            <div className="text-[11px] text-blue-700 font-medium">ស្មើនឹង {stats.malePercentage}%</div>
          </div>

          {/* Female Total */}
          <div className="bg-rose-50/70 border border-rose-200 p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
              <span>ស្រីសរុប (ស)</span>
              <User className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-900">{stats.femaleTotal}</div>
            <div className="text-[11px] text-rose-700 font-medium">ស្មើនឹង {stats.femalePercentage}%</div>
          </div>

          {/* Average Age */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
              <span>អាយុមធ្យម</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">{stats.avgTotal} <span className="text-sm font-normal">ឆ្នាំ</span></div>
            <div className="text-[11px] text-emerald-700">ប្រុស: {stats.avgMale} | ស្រី: {stats.avgFemale}</div>
          </div>

          {/* Youth Count */}
          <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold mb-1">
              <span>យុវជន (១៨-៣៥)</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {stats.groupStats.find(g => g.id === '18-35')?.totalCount || 0}
            </div>
            <div className="text-[11px] text-amber-700">
              ប្រុស: {stats.groupStats.find(g => g.id === '18-35')?.maleCount} | ស្រី: {stats.groupStats.find(g => g.id === '18-35')?.femaleCount}
            </div>
          </div>

          {/* Elderly Count */}
          <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between text-purple-800 text-xs font-semibold mb-1">
              <span>ចាស់ជរា (៦៥ឡើង)</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {stats.groupStats.find(g => g.id === '65plus')?.totalCount || 0}
            </div>
            <div className="text-[11px] text-purple-700">
              ប្រុស: {stats.groupStats.find(g => g.id === '65plus')?.maleCount} | ស្រី: {stats.groupStats.find(g => g.id === '65plus')?.femaleCount}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher: Brackets vs Detailed Single Age */}
      <div className="px-5 pt-3 pb-0 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 bg-white">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('brackets')}
            className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'brackets'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>១. តារាងតាមក្រុមអាយុ (Age Groups)</span>
          </button>

          <button
            onClick={() => setActiveTab('singleAge')}
            className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'singleAge'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>២. តារាងបំបែកតាមអាយុនីមួយៗ ({stats.singleAgeStats.length} កម្រិតអាយុ)</span>
          </button>
        </div>

        {/* Small range indicator */}
        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-3 pb-2">
          {stats.youngest && (
            <span>ក្មេងជាងគេ ៖ <strong className="text-slate-800">{stats.youngest.fullName}</strong> ({stats.youngest.age} ឆ្នាំ, ភេទ{stats.youngest.gender})</span>
          )}
          {stats.oldest && (
            <span>• ចាស់ជាងគេ ៖ <strong className="text-slate-800">{stats.oldest.fullName}</strong> ({stats.oldest.age} ឆ្នាំ, ភេទ{stats.oldest.gender})</span>
          )}
        </div>
      </div>

      {/* Tab 1: Age Brackets Master Table */}
      {activeTab === 'brackets' && (
        <div className="p-5 space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full border-collapse text-xs text-slate-800">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 font-bold text-center">
                  <th className="py-2.5 px-3 text-left w-48">ក្រុមអាយុ</th>
                  <th className="py-2.5 px-2 w-20">ចន្លោះអាយុ</th>
                  <th className="py-2.5 px-3 bg-blue-50/60 text-blue-900 w-28 border-x border-slate-200">
                    ប្រុស (នាក់ / %)
                  </th>
                  <th className="py-2.5 px-3 bg-rose-50/60 text-rose-900 w-28 border-r border-slate-200">
                    ស្រី (នាក់ / %)
                  </th>
                  <th className="py-2.5 px-3 bg-emerald-50/60 text-emerald-900 w-24 border-r border-slate-200">
                    សរុប (នាក់)
                  </th>
                  <th className="py-2.5 px-3 w-28 border-r border-slate-200">
                    សមាមាត្ររួម (%)
                  </th>
                  <th className="py-2.5 px-3 w-32 border-r border-slate-200">
                    មេគ្រួសារ (ប្រុស/ស្រី/សរុប)
                  </th>
                  <th className="py-2.5 px-3 w-48 text-left">
                    សមាមាត្រប្រៀបធៀប (ប្រុស vs ស្រី)
                  </th>
                  <th className="py-2.5 px-2 w-24 text-center">
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-kantumruy">
                {stats.groupStats.map((group, index) => {
                  const isYouth = group.id === '18-35';
                  const isElderly = group.id === '65plus';

                  return (
                    <tr
                      key={group.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isYouth
                          ? 'bg-amber-50/30 font-medium'
                          : isElderly
                          ? 'bg-purple-50/20 font-medium'
                          : index % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Age Bracket Label */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{group.label}</span>
                          {isYouth && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                              យុវជន
                            </span>
                          )}
                          {isElderly && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-300">
                              ចាស់ជរា
                            </span>
                          )}
                        </div>
                        {group.subLabel && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{group.subLabel}</div>
                        )}
                      </td>

                      {/* Age range */}
                      <td className="py-3 px-2 text-center text-slate-600 font-mono text-[11px]">
                        {group.minAge} - {group.maxAge > 100 ? 'ឡើង' : group.maxAge}
                      </td>

                      {/* Male */}
                      <td className="py-3 px-3 text-center border-x border-slate-200 bg-blue-50/20">
                        <div className="font-bold text-blue-900 text-sm">{group.maleCount} នាក់</div>
                        <div className="text-[11px] text-blue-700 font-medium">({group.maleRatio}%)</div>
                      </td>

                      {/* Female */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 bg-rose-50/20">
                        <div className="font-bold text-rose-900 text-sm">{group.femaleCount} នាក់</div>
                        <div className="text-[11px] text-rose-700 font-medium">({group.femaleRatio}%)</div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 bg-emerald-50/30 font-bold text-emerald-950 text-sm">
                        {group.totalCount} នាក់
                      </td>

                      {/* Total Ratio */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 font-semibold text-slate-800">
                        {group.totalRatio}%
                      </td>

                      {/* Family Heads */}
                      <td className="py-3 px-3 text-center border-r border-slate-200 text-[11px]">
                        <span className="text-blue-800 font-medium">{group.maleFamilyHeads}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-800 font-medium">{group.femaleFamilyHeads}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <strong className="text-slate-900 font-bold">{group.totalFamilyHeads}</strong>
                      </td>

                      {/* Visual Ratio Bar */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
                            <div
                              style={{ width: `${group.maleRatio}%` }}
                              className="bg-blue-600 h-full transition-all duration-300"
                              title={`ប្រុស: ${group.maleCount} នាក់ (${group.maleRatio}%)`}
                            />
                            <div
                              style={{ width: `${group.femaleRatio}%` }}
                              className="bg-rose-500 h-full transition-all duration-300"
                              title={`ស្រី: ${group.femaleCount} នាក់ (${group.femaleRatio}%)`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span className="text-blue-700">ប: {group.maleRatio}%</span>
                            <span className="text-rose-700">ស: {group.femaleRatio}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Filter Button */}
                      <td className="py-3 px-2 text-center">
                        {onFilterByAgeBracket && (
                          <button
                            onClick={() => onFilterByAgeBracket(group.minAge, group.maxAge, group.label)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                            title="មើលក្នុងតារាង Google Sheets"
                          >
                            <Filter className="w-3 h-3" />
                            <span>តម្រង</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Grand Total Summary Row */}
                <tr className="bg-slate-200/90 font-bold text-slate-950 border-t-2 border-slate-400 text-center">
                  <td className="py-3.5 px-3 text-left text-sm">
                    សរុបរួម (Grand Total)
                  </td>
                  <td className="py-3.5 px-2 text-slate-700 font-mono text-[11px]">
                    គ្រប់អាយុ
                  </td>
                  <td className="py-3.5 px-3 border-x border-slate-300 text-blue-950 text-sm">
                    {stats.maleTotal} នាក់ ({stats.malePercentage}%)
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 text-rose-950 text-sm">
                    {stats.femaleTotal} នាក់ ({stats.femalePercentage}%)
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 text-emerald-950 text-sm">
                    {stats.total} នាក់
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300">
                    100%
                  </td>
                  <td className="py-3.5 px-3 border-r border-slate-300 text-sm">
                    {records.filter(r => r.partyRole.includes('មេគ្រួសារ')).length} មេគ្រួសារ
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="w-full bg-slate-300 h-3 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${stats.malePercentage}%` }}
                        className="bg-blue-600 h-full"
                      />
                      <div
                        style={{ width: `${stats.femalePercentage}%` }}
                        className="bg-rose-500 h-full"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-center text-xs text-slate-600">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Additional Official Analysis Info */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950">
                  ការវិភាគកម្លាំងយុវជន និងសមាជិកចាស់ជរាក្នុងមូលដ្ឋានភូមិរលួស ៖
                </span>
                <p className="text-slate-700">
                  យុវជន (អាយុ ១៨-៣៥ ឆ្នាំ) មានចំនួនសរុប <strong>{stats.groupStats.find(g => g.id === '18-35')?.totalCount} នាក់</strong> ស្មើនឹង <strong>{stats.groupStats.find(g => g.id === '18-35')?.totalRatio}%</strong> នៃកម្លាំងបក្សសរុប។
                  ចំណែកឯចាស់ជរា (អាយុ ៦៥ ឆ្នាំឡើង) មានចំនួន <strong>{stats.groupStats.find(g => g.id === '65plus')?.totalCount} នាក់</strong> ស្មើនឹង <strong>{stats.groupStats.find(g => g.id === '65plus')?.totalRatio}%</strong>។
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyTSV}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>ចម្លងតារាងវិភាគនេះ</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Single Age Distribution Table (18 to 88) */}
      {activeTab === 'singleAge' && (
        <div className="p-5 space-y-4">
          {/* Search & Gender filter for single age table */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchSingleAge}
                onChange={(e) => setSearchSingleAge(e.target.value)}
                placeholder="ស្វែងរកតាមអាយុ ឬឈ្មោះសមាជិក..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              {searchSingleAge && (
                <button
                  onClick={() => setSearchSingleAge('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">បង្ហាញភេទ ៖</span>
              <button
                onClick={() => setSelectedGenderFilter('all')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  selectedGenderFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                ទាំងអស់
              </button>
              <button
                onClick={() => setSelectedGenderFilter('ប')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  selectedGenderFilter === 'ប'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
              >
                ប្រុស (ប)
              </button>
              <button
                onClick={() => setSelectedGenderFilter('ស')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  selectedGenderFilter === 'ស'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                ស្រី (ស)
              </button>
            </div>
          </div>

          {/* Single Age Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs max-h-[500px] overflow-y-auto">
            <table className="w-full border-collapse text-xs text-slate-800">
              <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-300 text-slate-900 font-bold text-center">
                <tr>
                  <th className="py-2.5 px-3 w-16">អាយុ</th>
                  <th className="py-2.5 px-3 w-28 bg-blue-50/70 text-blue-900 border-x border-slate-200">
                    ប្រុស (នាក់)
                  </th>
                  <th className="py-2.5 px-3 w-28 bg-rose-50/70 text-rose-900 border-r border-slate-200">
                    ស្រី (នាក់)
                  </th>
                  <th className="py-2.5 px-3 w-24 bg-emerald-50/70 text-emerald-900 border-r border-slate-200">
                    សរុប
                  </th>
                  <th className="py-2.5 px-3 text-left">
                    បញ្ជីឈ្មោះសមាជិកដែលមានអាយុនេះ
                  </th>
                  <th className="py-2.5 px-3 w-20 text-center">
                    សកម្មភាព
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-kantumruy">
                {filteredSingleAges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      រកមិនឃើញទិន្នន័យអាយុដែលស្វែងរកឡើយ
                    </td>
                  </tr>
                ) : (
                  filteredSingleAges.map((item, idx) => (
                    <tr
                      key={item.age}
                      className={`hover:bg-slate-50 transition-colors ${
                        item.age >= 18 && item.age <= 35
                          ? 'bg-amber-50/20'
                          : item.age >= 65
                          ? 'bg-purple-50/20'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/50'
                      }`}
                    >
                      {/* Age */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-bold text-slate-900 text-sm">{item.age} ឆ្នាំ</div>
                        {item.age >= 18 && item.age <= 35 && (
                          <span className="text-[9px] text-amber-800 font-semibold bg-amber-100 px-1 rounded">យុវជន</span>
                        )}
                        {item.age >= 65 && (
                          <span className="text-[9px] text-purple-800 font-semibold bg-purple-100 px-1 rounded">ចាស់ជរា</span>
                        )}
                      </td>

                      {/* Male Count */}
                      <td className="py-2.5 px-3 text-center font-bold text-blue-900 border-x border-slate-200 bg-blue-50/10">
                        {item.maleCount > 0 ? (
                          <span className="text-sm">{item.maleCount} នាក់</span>
                        ) : (
                          <span className="text-slate-300 font-normal">0</span>
                        )}
                      </td>

                      {/* Female Count */}
                      <td className="py-2.5 px-3 text-center font-bold text-rose-900 border-r border-slate-200 bg-rose-50/10">
                        {item.femaleCount > 0 ? (
                          <span className="text-sm">{item.femaleCount} នាក់</span>
                        ) : (
                          <span className="text-slate-300 font-normal">0</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-950 border-r border-slate-200 text-sm">
                        {item.totalCount}
                      </td>

                      {/* Names preview */}
                      <td className="py-2.5 px-3 text-left">
                        <div className="flex flex-wrap gap-1">
                          {item.members.map((m) => (
                            <span
                              key={m.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${
                                m.gender === 'ប'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                              title={`លេខផ្ទះ: ${m.houseNo} | ក្រុមបក្ស: ${m.partyGroup} | តួនាទី: ${m.partyRole}`}
                            >
                              <span className="font-semibold">{m.fullName}</span>
                              <span className="text-[9px] text-slate-500">
                                ({m.gender}, ក្រុម{m.partyGroup})
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Filter Button */}
                      <td className="py-2.5 px-3 text-center">
                        {onFilterByExactAge && (
                          <button
                            onClick={() => onFilterByExactAge(item.age)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
                            title={`តម្រងរកអ្នកមានអាយុ ${item.age} ឆ្នាំ`}
                          >
                            <Filter className="w-3 h-3" />
                            <span>តម្រង</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
