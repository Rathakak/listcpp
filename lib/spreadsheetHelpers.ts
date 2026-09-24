import * as XLSX from 'xlsx';
import { MemberRecord, VillageStats, OrgLeaderRecord } from './types';

// Column mappings between Khmer headers and MemberRecord keys
export const COLUMN_DEFINITIONS = [
  { key: 'id', label: 'ល.រ', width: 8, colLetter: 'A' },
  { key: 'photoUrl', label: 'រូបថត', width: 10, colLetter: 'B' },
  { key: 'fullName', label: 'នាមត្រកូល-នាមខ្លួន', width: 22, colLetter: 'C' },
  { key: 'gender', label: 'ភេទ', width: 8, colLetter: 'D' },
  { key: 'age', label: 'អាយុ', width: 8, colLetter: 'E' },
  { key: 'dob', label: 'ថ្ងៃខែឆ្នាំកំណើត', width: 16, colLetter: 'F' },
  { key: 'idCardNo', label: 'លេខអត្តសញ្ញាណប័ណ្ណ', width: 20, colLetter: 'G' },
  { key: 'partyCardNo', label: 'លេខអត្តបក្ស', width: 18, colLetter: 'H' },
  { key: 'joinDate', label: 'ថ្ងៃខែឆ្នាំចូលបក្ស', width: 16, colLetter: 'I' },
  { key: 'necOffice', label: 'ឈ្មោះការិ', width: 20, colLetter: 'J' },
  { key: 'communeCode', label: 'កូដឃុំ', width: 10, colLetter: 'K' },
  { key: 'officeNo', label: 'លេខការិ', width: 12, colLetter: 'L' },
  { key: 'necOrderNo', label: 'ល.រ គជប', width: 12, colLetter: 'M' },
  { key: 'partyGroup', label: 'ក្រុមបក្ស', width: 12, colLetter: 'N' },
  { key: 'partyRole', label: 'តួនាទីក្នុងបក្ស', width: 18, colLetter: 'O' },
  { key: 'occupation', label: 'មុខរបរ', width: 14, colLetter: 'P' },
  { key: 'remarks', label: 'ស្ថានគ្រួសារ', width: 22, colLetter: 'Q' },
  { key: 'notes', label: 'កត់សម្គាល់', width: 20, colLetter: 'R' },
] as const;

/**
 * Export data to Microsoft Excel (.xlsx) file that can be directly uploaded to Google Drive / opened in Google Sheets
 */
export function exportToExcel(records: MemberRecord[], stats: VillageStats, filename = 'ប្រព័ន្ធគ្រប់សមាជិកគណបក្សឃុំបន្ទាយស្ទោង.xlsx') {
  const wb = XLSX.utils.book_new();

  // 1. Members Sheet
  const headerRow = COLUMN_DEFINITIONS.map(c => c.label);
  const dataRows = records.map(r => [
    r.id,
    r.photoUrl ? 'មានរូបថត' : 'គ្មាន',
    r.fullName,
    r.gender,
    r.age,
    r.dob,
    r.idCardNo,
    r.partyCardNo || '',
    r.joinDate || '',
    r.necOffice,
    r.communeCode,
    r.officeNo,
    r.necOrderNo,
    r.partyGroup,
    r.partyRole,
    r.occupation,
    r.remarks,
    r.notes || '',
  ]);

  const now = new Date();
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  const khmerYear = now.getFullYear().toString().split('').map(d => khmerDigits[parseInt(d, 10)] ?? d).join('');
  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const khmerMonth = khmerMonths[now.getMonth()] ?? 'កញ្ញា';

  const wsData = [
    ['គណបក្សប្រជាជនកម្ពុជា'],
    [`បញ្ជីរាយនាម សមាជិកសមាជិកាសម្ព័ន្ធគ្រួសារ ក្នុងភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ ខែ${khmerMonth} ឆ្នាំ${khmerYear}`],
    [],
    headerRow,
    ...dataRows
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },
    { wch: 10 },
    { wch: 22 },
    { wch: 8 },
    { wch: 8 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'បញ្ជីឈ្មោះសមាជិក');

  // 2. Statistics Summary Sheet
  const femaleCount = records.filter(r => r.gender === 'ស').length;
  const statsRows = [
    ['សង្ខេបស្ថិតិទិន្នន័យ', 'ចំនួន', 'ឯកតា'],
    ['ចំនួនគ្រួសារសរុប', stats.totalFamilies, 'គ្រួសារ'],
    ['ចំនួនខ្នងផ្ទះ', stats.totalRoofs, 'ខ្នង'],
    ['មេគ្រួសារបក្ស', stats.partyFamilyHeads, 'មេគ្រួសារ'],
    ['សមាជិកបក្សសរុប', records.length, 'នាក់'],
    ['សមាជិកបក្សជាស្ត្រី', femaleCount, 'នាក់'],
    ['ភាគរយសមាជិកបក្ស', `${((records.length / (stats.votersList2025 || 1)) * 100).toFixed(2)}%`, 'ភាគរយ'],
    ['បញ្ជីឈ្មោះបោះឆ្នោត 2025', stats.votersList2025, 'នាក់'],
    ['ស្រីក្នុងបញ្ជីបោះឆ្នោត', stats.votersFemale, 'នាក់'],
    ['យុវជន (អាយុ 18-35)', records.filter(r => r.age >= 18 && r.age <= 35).length, 'នាក់'],
    ['ចាស់ជរា (អាយុ 65 ឆ្នាំឡើង)', records.filter(r => r.age >= 65).length, 'នាក់'],
    ['រៀបការក្នុងមូលដ្ឋាន', records.filter(r => r.remarks.includes('រៀបការ(មូលដ្ឋាន)')).length, 'នាក់'],
    ['រៀបការសំណាក់ស្រុក', records.filter(r => r.remarks.includes('រៀបការ(សំណាក់ស្រុក)')).length, 'នាក់'],
    ['នៅលីវសំណាក់ស្រុក', records.filter(r => r.remarks.includes('នៅលីវ(សំណាក់ស្រុក)')).length, 'នាក់'],
    ['នៅលីវក្នុងមូលដ្ឋាន', records.filter(r => r.remarks.includes('នៅលីវ(មូលដ្ឋាន)')).length, 'នាក់'],
    ['សំណាក់ស្រុកប្រទេសថៃ', records.filter(r => r.remarks.includes('ថៃ')).length, 'នាក់'],
    ['រៀបការផ្លាស់ទីលំនៅ', records.filter(r => r.remarks.includes('ផ្លាស់ទីលំនៅ')).length, 'នាក់'],
    ['', '', ''],
    ['បានឃើញ និងពិនិត្យត្រឹមត្រូវ (ប្រធានសាខាគណបក្សភូមិ)', stats.villageHead, ''],
    ['ប្រធានក្រុមការងារចុះជួយភូមិរលួស', `លោក ${stats.teamLeader}`, ''],
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(statsRows);
  wsStats['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'សង្ខេបស្ថិតិ');

  // 3. Age by Gender Breakdown Sheet (សរុបស្រី-ប្រុសតាមអាយុ)
  const maleRecords = records.filter(r => r.gender === 'ប');
  const femaleRecords = records.filter(r => r.gender === 'ស');

  const ageGroups = [
    { label: 'ក្រោម ១៨ ឆ្នាំ', min: 0, max: 17 },
    { label: '១៨ - ៣៥ ឆ្នាំ (យុវជនបក្ស)', min: 18, max: 35 },
    { label: '៣៦ - ៥០ ឆ្នាំ (វ័យកណ្តាល)', min: 36, max: 50 },
    { label: '៥១ - ៦៤ ឆ្នាំ (វ័យចំណាស់)', min: 51, max: 64 },
    { label: '៦៥ ឆ្នាំឡើង (ចាស់ជរា)', min: 65, max: 150 },
  ];

  const ageSheetData = [
    ['តារាងសរុបសមាជិក ស្រី និង ប្រុស តាមក្រុមអាយុ'],
    ['ភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ'],
    [],
    ['ក្រុមអាយុ', 'ចំនួនប្រុស (នាក់)', 'ភាគរយប្រុស (%)', 'ចំនួនស្រី (នាក់)', 'ភាគរយស្រី (%)', 'សរុប (នាក់)', 'សមាមាត្រសរុប (%)', 'មេគ្រួសារសរុប'],
  ];

  for (const g of ageGroups) {
    const inBracket = records.filter(r => r.age >= g.min && r.age <= g.max);
    const m = inBracket.filter(r => r.gender === 'ប').length;
    const f = inBracket.filter(r => r.gender === 'ស').length;
    const tot = inBracket.length;
    const heads = inBracket.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;

    ageSheetData.push([
      g.label,
      String(m),
      tot > 0 ? `${((m / tot) * 100).toFixed(1)}%` : '0%',
      String(f),
      tot > 0 ? `${((f / tot) * 100).toFixed(1)}%` : '0%',
      String(tot),
      records.length > 0 ? `${((tot / records.length) * 100).toFixed(1)}%` : '0%',
      String(heads),
    ]);
  }

  // Grand total row
  ageSheetData.push([
    'សរុបរួម',
    String(maleRecords.length),
    records.length > 0 ? `${((maleRecords.length / records.length) * 100).toFixed(1)}%` : '0%',
    String(femaleRecords.length),
    records.length > 0 ? `${((femaleRecords.length / records.length) * 100).toFixed(1)}%` : '0%',
    String(records.length),
    '100%',
    String(records.filter(r => r.partyRole.includes('មេគ្រួសារ')).length),
  ]);

  const wsAge = XLSX.utils.aoa_to_sheet(ageSheetData);
  wsAge['!cols'] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAge, 'សរុបអាយុតាមភេទ');

  XLSX.writeFile(wb, filename);
}

/**
 * Export data to UTF-8 CSV with BOM for standard Google Sheets / Excel import
 */
export function exportToCSV(records: MemberRecord[], filename = 'បញ្ជីឈ្មោះសមាជិក_google_sheets.csv') {
  const header = COLUMN_DEFINITIONS.map(c => `"${c.label}"`).join(',');
  const rows = records.map(r => [
    r.id,
    `"${r.photoUrl ? 'មានរូបថត' : ''}"`,
    `"${r.fullName.replace(/"/g, '""')}"`,
    `"${r.gender}"`,
    r.age,
    `"${r.dob}"`,
    `"${r.idCardNo}"`,
    `"${(r.partyCardNo || '').replace(/"/g, '""')}"`,
    `"${(r.joinDate || '').replace(/"/g, '""')}"`,
    `"${r.necOffice}"`,
    `"${r.communeCode}"`,
    `"${r.officeNo}"`,
    `"${r.necOrderNo}"`,
    r.partyGroup,
    `"${r.partyRole}"`,
    `"${r.occupation}"`,
    `"${r.remarks.replace(/"/g, '""')}"`,
  ].join(','));

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy entire table as TSV directly to clipboard, allowing direct paste into Google Sheets (Ctrl + V)
 */
export async function copyForGoogleSheets(records: MemberRecord[]): Promise<boolean> {
  const header = COLUMN_DEFINITIONS.map(c => c.label).join('\t');
  const rows = records.map(r => [
    r.id,
    r.photoUrl ? 'មានរូបថត' : '',
    r.fullName,
    r.gender,
    r.age,
    r.dob,
    r.idCardNo,
    r.partyCardNo || '',
    r.joinDate || '',
    r.necOffice,
    r.communeCode,
    r.officeNo,
    r.necOrderNo,
    r.partyGroup,
    r.partyRole,
    r.occupation,
    r.remarks,
  ].join('\t'));

  const tsv = [header, ...rows].join('\n');

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * Export Organizational Structure Leaders to Microsoft Excel (.xlsx) file
 */
export function exportOrgLeadersToExcel(leaders: OrgLeaderRecord[], filename = 'រចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សឃុំបន្ទាយស្ទោង.xlsx') {
  const wb = XLSX.utils.book_new();

  const now = new Date();
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  const khmerYear = now.getFullYear().toString().split('').map(d => khmerDigits[parseInt(d, 10)] ?? d).join('');
  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const khmerMonth = khmerMonths[now.getMonth()] ?? 'កញ្ញា';

  const rows = [
    ['គណបក្សប្រជាជនកម្ពុជា'],
    ['គណៈកម្មាធិការគណបក្សមូលដ្ឋានឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ'],
    [`បញ្ជីរាយនាម រចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សមូលដ្ឋានឃុំ និងភូមិ (ខែ${khmerMonth} ឆ្នាំ${khmerYear})`],
    [],
    [
      'ល.រ',
      'នាម និងគោត្តនាម',
      'ភេទ',
      'អាយុ',
      'កម្រិតរចនាសម្ព័ន្ធ',
      'អង្គភាព / ភូមិ',
      'តួនាទីក្នុងបក្ស',
      'លេខទូរស័ព្ទ',
      'លេខប័ណ្ណបក្ស',
      'ភារកិច្ចទទួលបន្ទុក',
      'ស្ថានភាព',
      'សម្គាល់'
    ],
    ...leaders.map((l, index) => [
      index + 1,
      l.name,
      l.gender === 'ស' ? 'ស្រី' : 'ប្រុស',
      l.age || '',
      l.level === 'commune' ? 'គណៈកម្មាធិការបក្សឃុំ' : l.level === 'working_group' ? 'ក្រុមការងារចុះជួយ' : 'សាខាបក្សភូមិ',
      l.villageName || 'ឃុំបន្ទាយស្ទោង',
      l.role,
      l.phoneNumber || '',
      l.partyCardNo || '',
      l.responsibilities || '',
      l.status === 'active' ? 'កំពុងបំពេញការងារ' : 'សម្រាក',
      l.remarks || ''
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 8 },
    { wch: 8 },
    { wch: 24 },
    { wch: 18 },
    { wch: 32 },
    { wch: 16 },
    { wch: 20 },
    { wch: 35 },
    { wch: 18 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'រចនាសម្ព័ន្ធបក្សឃុំ-ភូមិ');
  XLSX.writeFile(wb, filename);
}

