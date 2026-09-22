'use client';

import React from 'react';
import { MemberRecord, VillageStats } from '@/lib/types';
import { ArrowLeft, Printer } from 'lucide-react';

interface OfficialPrintViewProps {
  records: MemberRecord[];
  stats: VillageStats;
  onBack: () => void;
}

export default function OfficialPrintView({ records, stats, onBack }: OfficialPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-2 sm:px-6">
      {/* Top Floating Action Bar (Hidden during Print) */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between bg-white px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅតារាង Google Sheets</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">| ទម្រង់បោះពុម្ពជាឯកសារផ្លូវការ (A4 Landscape)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>បោះពុម្ពឥឡូវនេះ (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* Official A4 Sheet Canvas */}
      <div className="max-w-7xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-200 print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="flex items-start justify-between text-xs font-semibold text-slate-900 border-b pb-4 mb-4">
          {/* Left Party Structure */}
          <div className="space-y-0.5 font-kantumruy">
            <p className="font-moul text-sm text-slate-900">គណបក្សប្រជាជនកម្ពុជា</p>
            <p>ក្រុមការងារគណបក្សចុះមូលដ្ឋានខេត្តកំពង់ធំ</p>
            <p>ក្រុមការងារគណបក្សចុះមូលដ្ឋានស្រុកស្ទោង</p>
            <p>ក្រុមការងារគណបក្សចុះមូលដ្ឋានជួយឃុំបន្ទាយស្ទោង</p>
            <p className="font-bold text-slate-950">ក្រុមការងារគណបក្សចុះមូលដ្ឋានជួយភូមិរលួស</p>
          </div>

          {/* Center Party Emblem */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="w-14 h-14 rounded-full border-2 border-amber-600 bg-amber-50 flex items-center justify-center text-center p-1 shadow-xs">
              <span className="text-[10px] font-bold text-amber-900 leading-tight">គ.ប.ក<br />CPP</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-medium">ភូមិរលួស</span>
          </div>

          {/* Right Kingdom Motto */}
          <div className="text-right space-y-0.5 font-kantumruy">
            <p className="font-moul text-xs text-slate-900">ឯករាជ្យ សន្តិភាព សេរីភាព ប្រជាធិបតេយ្យ</p>
            <p className="text-slate-800">អព្យាក្រឹត និងវឌ្ឍនភាពសង្គម</p>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center my-5 space-y-1">
          <h1 className="font-moul text-base sm:text-lg text-slate-950 tracking-wide">
            បញ្ជីរាយនាម សមាជិកសមាជិកាសម្ព័ន្ធគ្រួសារ គណបក្សប្រជាជនកម្ពុជា
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-800">
            ក្នុងភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ........... ឆ្នាំ២០២៦
          </p>
        </div>

        {/* The Exact PDF Table Structure */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-900 text-[11px] leading-tight">
            <thead>
              <tr className="bg-slate-50 font-bold text-slate-900 text-center">
                <th rowSpan={2} className="border border-slate-900 p-1 w-8">ល.រ</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-32">
                  នាមត្រកូល-នាមខ្លួន<br /><span className="font-normal text-[10px]">(មេគ្រួសារ)</span>
                </th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-8">ភេទ</th>
                <th colSpan={2} className="border border-slate-900 p-0.5">អាយុ</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-20">ថ្ងៃខែឆ្នាំ<br />កំណើត</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-24">លេខអត្ត<br />សញ្ញាណប័ណ្ណ</th>
                <th colSpan={4} className="border border-slate-900 p-0.5">បញ្ជី គជប</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-10">លេខ<br />ផ្ទះ</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-10">ក្រុម<br />បក្ស</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-20">តួនាទី<br />ក្នុងបក្ស</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-14">មុខរបរ</th>
                <th rowSpan={2} className="border border-slate-900 p-1 w-28">ផ្សេងៗ</th>
              </tr>
              <tr className="bg-slate-50 font-bold text-slate-900 text-center text-[10px]">
                <th className="border border-slate-900 p-0.5 w-12">លំអៀង</th>
                <th className="border border-slate-900 p-0.5 w-8">អាយុ</th>
                <th className="border border-slate-900 p-0.5 w-24">ឈ្មោះការិ</th>
                <th className="border border-slate-900 p-0.5 w-10">កូដឃុំ</th>
                <th className="border border-slate-900 p-0.5 w-12">លេខការិ</th>
                <th className="border border-slate-900 p-0.5 w-12">ល.រ គជប</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="text-center hover:bg-slate-50/50">
                  <td className="border border-slate-900 p-1 font-medium">{r.id}</td>
                  <td className="border border-slate-900 p-1 text-left font-semibold">{r.fullName}</td>
                  <td className="border border-slate-900 p-1">{r.gender}</td>
                  <td className="border border-slate-900 p-1 text-slate-700">{r.decimalAge.toFixed(1)}</td>
                  <td className="border border-slate-900 p-1 font-medium">{r.age}</td>
                  <td className="border border-slate-900 p-1 text-slate-700">{r.dob}</td>
                  <td className="border border-slate-900 p-1 text-slate-800 font-mono text-[10px]">{r.idCardNo}</td>
                  <td className="border border-slate-900 p-1 text-left text-[10px] truncate max-w-[120px]">{r.necOffice}</td>
                  <td className="border border-slate-900 p-1 text-slate-700">{r.communeCode}</td>
                  <td className="border border-slate-900 p-1 text-slate-700">{r.officeNo}</td>
                  <td className="border border-slate-900 p-1 text-slate-800 font-medium">{r.necOrderNo}</td>
                  <td className="border border-slate-900 p-1 text-slate-700">{r.houseNo}</td>
                  <td className="border border-slate-900 p-1 font-bold text-slate-900">{r.partyGroup}</td>
                  <td className="border border-slate-900 p-1 font-medium">{r.partyRole}</td>
                  <td className="border border-slate-900 p-1">{r.occupation}</td>
                  <td className="border border-slate-900 p-1 text-left text-[10px]">{r.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Page 13 Exact Official Summary Section */}
        <div className="mt-8 pt-6 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          {/* Summary Data Box */}
          <div className="space-y-1.5 font-semibold text-slate-900">
            <h3 className="font-moul text-xs text-slate-950 pb-1">បញ្ជាក់ ៖</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <p>ចំនួនគ្រួសារ ៖ <span className="font-bold">{stats.totalFamilies} គ្រួសារ</span></p>
              <p>បញ្ជីឈ្មោះបោះឆ្នោត2025 ៖ <span className="font-bold">{stats.votersList2025} នាក់</span></p>

              <p>ចំនួនខ្នងផ្ទះ ៖ <span className="font-bold">{stats.totalRoofs} ខ្នង</span></p>
              <p className="pl-6">ស្រី ៖ <span className="font-bold">{stats.votersFemale} នាក់</span></p>

              <p>មេគ្រួសារបក្ស ៖ <span className="font-bold">{stats.partyFamilyHeads} មេគ្រួសារ</span></p>
              <p>សមាជិកបក្ស ៖ <span className="font-bold">{records.length} នាក់</span></p>

              <p>យុវជន18-35 ៖ <span className="font-bold">{stats.youthCount} នាក់</span></p>
              <p className="pl-6">ស្រី ៖ <span className="font-bold">{records.filter(r => r.gender === 'ស').length} នាក់</span></p>

              <p>រៀបការមូលដ្ឋាន ៖ <span className="font-bold">{stats.marriedLocal} នាក់</span></p>
              <p>ភាគរយ ៖ <span className="font-bold">{stats.percentage}%</span></p>

              <p>រៀបការសំណាក់ស្រុក ៖ <span className="font-bold">{stats.marriedMigrantDistrict} នាក់</span></p>
              <p>នៅលីវក្នុងមូលដ្ឋាន ៖ <span className="font-bold">{stats.singleLocal} នាក់</span></p>

              <p>នៅលីវសំណាក់ស្រុក ៖ <span className="font-bold">{stats.singleMigrantDistrict} នាក់</span></p>
              <p>រៀបការផ្លាស់ទីលំនៅ ៖ <span className="font-bold">{stats.marriedRelocated} នាក់</span></p>

              <p>ចាស់ជរា65ឆ្នាំឡើង ៖ <span className="font-bold">{stats.elderlyOver65} នាក់</span></p>
              <p>សំណាក់ស្រុកថៃ ៖ <span className="font-bold">{stats.migrantThailand} នាក់</span></p>

              <p>គ្មានឈ្មោះក្នុង គជប ៖ <span className="font-bold">{stats.notInNec} នាក់</span></p>
            </div>
          </div>

          {/* Signatures Block */}
          <div className="flex flex-col justify-between pt-2">
            <div className="flex items-start justify-between text-center pt-2">
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">បានឃើញ និងពិនិត្យត្រឹមត្រូវ</p>
                <p className="text-[11px] text-slate-600">ថ្ងៃទី........... ខែ........... ឆ្នាំ២០២៦</p>
                <p className="font-moul text-xs pt-12 text-slate-950">មេភូមិ {stats.villageHead}</p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-800">ប្រធានក្រុមការងារចុះជួយភូមិរលួស</p>
                <p className="text-[11px] text-slate-600">ថ្ងៃទី........... ខែ........... ឆ្នាំ២០២៦</p>
                <p className="font-moul text-xs pt-12 text-slate-950">លោក {stats.teamLeader}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
