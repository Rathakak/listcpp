'use client';

import React from 'react';
import Image from 'next/image';
import { MemberRecord, VillageStats } from '@/lib/types';
import { calculateAgeGenderStats } from '@/lib/ageCalculations';
import { 
  Users, Home, UserCheck, Percent, 
  MapPin, Heart, ShieldAlert, Award, Calendar, Edit2, Check, X
} from 'lucide-react';

interface StatsPanelProps {
  records: MemberRecord[];
  stats: VillageStats;
  onUpdateStats?: (newStats: VillageStats) => void;
}

export default function StatsPanel({ records, stats, onUpdateStats }: StatsPanelProps) {
  const [isEditingSignatures, setIsEditingSignatures] = React.useState(false);
  const [villageHead, setVillageHead] = React.useState(stats.villageHead);
  const [teamLeader, setTeamLeader] = React.useState(
    stats.teamLeader === 'ផូ វុជ' ? 'ផូ វុធ' : stats.teamLeader || 'ផូ វុធ'
  );

  const handleSaveSignatures = () => {
    if (onUpdateStats) {
      onUpdateStats({
        ...stats,
        villageHead: villageHead.trim() || stats.villageHead,
        teamLeader: teamLeader.trim() || stats.teamLeader,
      });
    }
    setIsEditingSignatures(false);
  };
  // Live computed metrics from current records
  const totalPartyMembers = records.length;
  const femalePartyMembers = records.filter(r => r.gender === 'ស').length;
  const malePartyMembers = records.filter(r => r.gender === 'ប').length;
  
  const marriedLocal = records.filter(r => r.remarks.includes('រៀបការ(មូលដ្ឋាន)')).length;
  const marriedMigrantDistrict = records.filter(r => r.remarks.includes('រៀបការ(សំណាក់ស្រុក)')).length;
  const singleLocal = records.filter(r => r.remarks.includes('នៅលីវ(មូលដ្ឋាន)')).length;
  const singleMigrant = records.filter(r => r.remarks.includes('នៅលីវ(សំណាក់ស្រុក)')).length;
  const relocated = records.filter(r => r.remarks.includes('ផ្លាស់ទីលំនៅ')).length;
  const elderly = records.filter(r => r.age >= 65 || r.remarks.includes('ចាស់ជរា')).length;
  const migrantThai = records.filter(r => r.remarks.includes('ថៃ')).length;
  const familyHeads = records.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;
  const youthCount = records.filter(r => r.age >= 18 && r.age <= 35).length;
  
  const calculatedPercentage = stats.votersList2025 > 0 
    ? ((totalPartyMembers / stats.votersList2025) * 100).toFixed(2)
    : '62.21';

  const ageStats = calculateAgeGenderStats(records);
  const youthGroup = ageStats.groupStats.find(g => g.id === '18-35');
  const midGroup = ageStats.groupStats.find(g => g.id === '36-50');
  const olderGroup = ageStats.groupStats.find(g => g.id === '51-64');
  const elderlyGroup = ageStats.groupStats.find(g => g.id === '65plus');

  return (
    <div id="statistics-summary-panel" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-3">
          <Image 
            src="/cpp-logo.png" 
            alt="CPP Logo" 
            width={48}
            height={48}
            className="w-12 h-12 object-contain shrink-0 filter drop-shadow-2xs" 
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>សង្ខេបស្ថិតិទិន្នន័យ (យោងទំព័រទី១៣ នៃឯកសារផ្លូវការ)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold">
          <span>បច្ចុប្បន្នភាពទិន្នន័យ ៖ {totalPartyMembers} នាក់</span>
        </div>
      </div>

      {/* Main KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">ចំនួនគ្រួសារ</span>
            <Home className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalFamilies}</div>
          <div className="text-[11px] text-slate-500">គ្រួសារក្នុងភូមិ</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">ខ្នងផ្ទះ</span>
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalRoofs}</div>
          <div className="text-[11px] text-slate-500">ខ្នងផ្ទះសរុប</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">មេគ្រួសារបក្ស</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{familyHeads || stats.partyFamilyHeads}</div>
          <div className="text-[11px] text-slate-500">មេគ្រួសារ</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">សមាជិកបក្ស</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{totalPartyMembers}</div>
          <div className="text-[11px] text-emerald-700">ស្រី ៖ {femalePartyMembers} (ប្រុស {malePartyMembers})</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold">បញ្ជីបោះឆ្នោត</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.votersList2025}</div>
          <div className="text-[11px] text-blue-700">ស្រី ៖ {stats.votersFemale} នាក់</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">ភាគរយបក្ស</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{calculatedPercentage}%</div>
          <div className="text-[11px] text-amber-700">ប្រៀបធៀបអ្នកបោះឆ្នោត</div>
        </div>
      </div>

      {/* Two Column Detailed Breakdown Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left: Demographics & Social Status */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              ស្ថានភាពអាពាហ៍ពិពាហ៍ និងការរស់នៅ
            </span>
            <span>ចំនួន (នាក់)</span>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">រៀបការក្នុងមូលដ្ឋាន</span>
              <span className="font-semibold text-slate-900">{marriedLocal || stats.marriedLocal} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">រៀបការសំណាក់ស្រុក</span>
              <span className="font-semibold text-slate-900">{marriedMigrantDistrict || stats.marriedMigrantDistrict} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">នៅលីវក្នុងមូលដ្ឋាន</span>
              <span className="font-semibold text-slate-900">{singleLocal || stats.singleLocal} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">នៅលីវសំណាក់ស្រុក</span>
              <span className="font-semibold text-slate-900">{singleMigrant || stats.singleMigrantDistrict} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">រៀបការផ្លាស់ទីលំនៅ</span>
              <span className="font-semibold text-slate-900">{relocated || stats.marriedRelocated} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">សំណាក់ស្រុកប្រទេសថៃ</span>
              <span className="font-semibold text-amber-700">{migrantThai || stats.migrantThailand} នាក់</span>
            </div>
          </div>
        </div>

        {/* Right: Age Groups & NEC details */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              ក្រុមអាយុ និងព័ត៌មាន គ.ជ.ប
            </span>
            <span>ចំនួន (នាក់)</span>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">យុវជន (អាយុ ១៨ - ៣៥ ឆ្នាំ)</span>
              <div className="text-right">
                <span className="font-semibold text-slate-900">{youthGroup?.totalCount || stats.youthCount} នាក់</span>
                <span className="text-[11px] text-slate-500 block">
                  (ស្រី <strong className="text-rose-700">{youthGroup?.femaleCount || 0}</strong> | ប្រុស <strong className="text-blue-700">{youthGroup?.maleCount || 0}</strong>)
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">វ័យកណ្តាល (អាយុ ៣៦ - ៥០ ឆ្នាំ)</span>
              <div className="text-right">
                <span className="font-semibold text-slate-900">{midGroup?.totalCount || 0} នាក់</span>
                <span className="text-[11px] text-slate-500 block">
                  (ស្រី <strong className="text-rose-700">{midGroup?.femaleCount || 0}</strong> | ប្រុស <strong className="text-blue-700">{midGroup?.maleCount || 0}</strong>)
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">វ័យចំណាស់ (អាយុ ៥១ - ៦៤ ឆ្នាំ)</span>
              <div className="text-right">
                <span className="font-semibold text-slate-900">{olderGroup?.totalCount || 0} នាក់</span>
                <span className="text-[11px] text-slate-500 block">
                  (ស្រី <strong className="text-rose-700">{olderGroup?.femaleCount || 0}</strong> | ប្រុស <strong className="text-blue-700">{olderGroup?.maleCount || 0}</strong>)
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">ចាស់ជរា (អាយុ ៦៥ ឆ្នាំឡើង)</span>
              <div className="text-right">
                <span className="font-semibold text-slate-900">{elderlyGroup?.totalCount || stats.elderlyOver65} នាក់</span>
                <span className="text-[11px] text-slate-500 block">
                  (ស្រី <strong className="text-rose-700">{elderlyGroup?.femaleCount || 0}</strong> | ប្រុស <strong className="text-blue-700">{elderlyGroup?.maleCount || 0}</strong>)
                </span>
              </div>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">បញ្ជីឈ្មោះបោះឆ្នោតឆ្នាំ២០២៥ (គ.ជ.ប)</span>
              <span className="font-semibold text-slate-900">{stats.votersList2025} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">ក្នុងនោះ ស្ត្រី (គ.ជ.ប)</span>
              <span className="font-semibold text-slate-900">{stats.votersFemale} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between hover:bg-slate-50">
              <span className="text-slate-700">គ្មានឈ្មោះក្នុង គ.ជ.ប</span>
              <span className="font-semibold text-rose-600">{stats.notInNec} នាក់</span>
            </div>
            <div className="px-4 py-2 flex items-center justify-between bg-emerald-50/50">
              <span className="text-emerald-900 font-medium">សមាមាត្រសមាជិកបក្ស / អ្នកបោះឆ្នោត</span>
              <span className="font-bold text-emerald-800">{calculatedPercentage} %</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. New Age & Gender Summary Table (សរុបស្រី-ប្រុសតាមអាយុ) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-slate-800 text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">
              តារាងសរុបសមាជិក ស្រី និង ប្រុស តាមក្រុមអាយុ (Age & Gender Breakdown)
            </span>
          </div>
          <div className="text-xs text-slate-300">
            អាយុមធ្យម ៖ <strong className="text-white">{ageStats.avgTotal} ឆ្នាំ</strong> (ប្រុស {ageStats.avgMale} | ស្រី {ageStats.avgFemale})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-800">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200 text-center">
                <th className="py-2.5 px-3 text-left w-48">ក្រុមអាយុ</th>
                <th className="py-2.5 px-2 w-20">ចន្លោះអាយុ</th>
                <th className="py-2.5 px-3 bg-blue-50/70 text-blue-900 w-32 border-x border-slate-200">
                  ប្រុស (នាក់ / %)
                </th>
                <th className="py-2.5 px-3 bg-rose-50/70 text-rose-900 w-32 border-r border-slate-200">
                  ស្រី (នាក់ / %)
                </th>
                <th className="py-2.5 px-3 bg-emerald-50/70 text-emerald-950 w-24 border-r border-slate-200">
                  សរុប (នាក់)
                </th>
                <th className="py-2.5 px-3 w-28 border-r border-slate-200">
                  សមាមាត្រសរុប (%)
                </th>
                <th className="py-2.5 px-3 w-32 border-r border-slate-200">
                  មេគ្រួសារ (ប្រុស/ស្រី)
                </th>
                <th className="py-2.5 px-3 text-left">
                  សមាមាត្រប្រៀបធៀប (ប្រុស vs ស្រី)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-kantumruy">
              {ageStats.groupStats.map((group, idx) => (
                <tr
                  key={group.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    group.id === '18-35'
                      ? 'bg-amber-50/30 font-semibold'
                      : group.id === '65plus'
                      ? 'bg-purple-50/20 font-semibold'
                      : idx % 2 === 0
                      ? 'bg-white'
                      : 'bg-slate-50/50'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900">{group.label}</span>
                    {group.id === '18-35' && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                        យុវជន
                      </span>
                    )}
                    {group.id === '65plus' && (
                      <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-300">
                        ចាស់ជរា
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                    {group.minAge}-{group.maxAge > 100 ? 'ឡើង' : group.maxAge}
                  </td>
                  <td className="py-2.5 px-3 text-center border-x border-slate-200 bg-blue-50/20">
                    <strong className="text-blue-900">{group.maleCount}</strong>
                    <span className="text-[11px] text-blue-700 ml-1">({group.maleRatio}%)</span>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-rose-50/20">
                    <strong className="text-rose-900">{group.femaleCount}</strong>
                    <span className="text-[11px] text-rose-700 ml-1">({group.femaleRatio}%)</span>
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-emerald-50/30 font-bold text-emerald-950">
                    {group.totalCount} នាក់
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-semibold text-slate-800">
                    {group.totalRatio}%
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 text-[11px]">
                    <span className="text-blue-700 font-medium">{group.maleFamilyHeads}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-rose-700 font-medium">{group.femaleFamilyHeads}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${group.maleRatio}%` }}
                        className="bg-blue-600 h-full"
                        title={`ប្រុស: ${group.maleCount} (${group.maleRatio}%)`}
                      />
                      <div
                        style={{ width: `${group.femaleRatio}%` }}
                        className="bg-rose-500 h-full"
                        title={`ស្រី: ${group.femaleCount} (${group.femaleRatio}%)`}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-slate-200/90 font-bold text-slate-950 border-t-2 border-slate-400 text-center">
                <td className="py-3 px-3 text-left">សរុបរួម</td>
                <td className="py-3 px-2 text-slate-600 font-mono text-[11px]">គ្រប់អាយុ</td>
                <td className="py-3 px-3 border-x border-slate-300 text-blue-950">
                  {ageStats.maleTotal} នាក់ ({ageStats.malePercentage}%)
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-rose-950">
                  {ageStats.femaleTotal} នាក់ ({ageStats.femalePercentage}%)
                </td>
                <td className="py-3 px-3 border-r border-slate-300 text-emerald-950">
                  {ageStats.total} នាក់
                </td>
                <td className="py-3 px-3 border-r border-slate-300">100%</td>
                <td className="py-3 px-3 border-r border-slate-300 text-xs">
                  {records.filter(r => r.partyRole.includes('មេគ្រួសារ')).length} មេគ្រួសារ
                </td>
                <td className="py-3 px-3">
                  <div className="w-full bg-slate-300 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${ageStats.malePercentage}%` }}
                      className="bg-blue-600 h-full"
                    />
                    <div
                      style={{ width: `${ageStats.femalePercentage}%` }}
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures Reference Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600">
        {isEditingSignatures ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900">កែប្រែឈ្មោះថ្នាក់ដឹកនាំ និងអ្នកចុះហត្ថលេខា ៖</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSignatures}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>រក្សាទុក</span>
                </button>
                <button
                  onClick={() => {
                    setVillageHead(stats.villageHead);
                    setTeamLeader(stats.teamLeader);
                    setIsEditingSignatures(false);
                  }}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>បោះបង់</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ប្រធានសាខាគណបក្សភូមិ ៖</label>
                <input
                  type="text"
                  value={villageHead}
                  onChange={(e) => setVillageHead(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  placeholder="ជា ជី"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ប្រធានក្រុមការងារចុះជួយភូមិរលួស ៖</label>
                <input
                  type="text"
                  value={teamLeader}
                  onChange={(e) => setTeamLeader(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  placeholder="ផូ វុធ"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="font-semibold text-slate-700">បានឃើញ និងពិនិត្យត្រឹមត្រូវ ៖</span>
              <p className="mt-1 font-bold text-slate-900 text-sm">ប្រធានសាខាគណបក្សភូមិ {stats.villageHead}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-500 text-center">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>ទិន្នន័យត្រូវបានផ្ទៀងផ្ទាត់ស្របតាមរបាយការណ៍បក្សឆ្នាំ២០២៦</span>
              </div>
              {onUpdateStats && (
                <button
                  onClick={() => setIsEditingSignatures(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold underline flex items-center gap-1 cursor-pointer text-[11px] mt-0.5"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>កែប្រែឈ្មោះអ្នកចុះហត្ថលេខា</span>
                </button>
              )}
            </div>
            <div className="text-center sm:text-right">
              <span className="font-semibold text-slate-700">ប្រធានក្រុមការងារចុះជួយភូមិរលួស ៖</span>
              <p className="mt-1 font-bold text-slate-900 text-sm">
                លោក {stats.teamLeader === 'ផូ វុជ' ? 'ផូ វុធ' : stats.teamLeader || 'ផូ វុធ'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
