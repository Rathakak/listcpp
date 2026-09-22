import { MemberRecord, AgeGroupStat, SingleAgeStat } from './types';

export const AGE_BRACKET_CONFIGS = [
  { id: 'under18', label: 'ក្រោម ១៨ ឆ្នាំ', subLabel: 'កុមារ និងអនីតិជន', minAge: 0, maxAge: 17 },
  { id: '18-35', label: '១៨ - ៣៥ ឆ្នាំ', subLabel: 'យុវជនបក្ស (CPP Youth)', minAge: 18, maxAge: 35 },
  { id: '36-50', label: '៣៦ - ៥០ ឆ្នាំ', subLabel: 'វ័យកណ្ដាល / កម្លាំងពលកម្មចម្បង', minAge: 36, maxAge: 50 },
  { id: '51-64', label: '៥១ - ៦៤ ឆ្នាំ', subLabel: 'វ័យចំណាស់ / មុនចូលនិវត្តន៍', minAge: 51, maxAge: 64 },
  { id: '65plus', label: '៦៥ ឆ្នាំឡើង', subLabel: 'ចាស់ជរា / ចូលនិវត្តន៍', minAge: 65, maxAge: 150 },
] as const;

/**
 * Calculates comprehensive Age by Gender statistics for member records
 */
export function calculateAgeGenderStats(records: MemberRecord[]) {
  const total = records.length;
  const maleRecords = records.filter(r => r.gender === 'ប');
  const femaleRecords = records.filter(r => r.gender === 'ស');

  const maleTotal = maleRecords.length;
  const femaleTotal = femaleRecords.length;

  // Averages
  const totalAges = records.map(r => r.age).filter(a => a > 0);
  const maleAges = maleRecords.map(r => r.age).filter(a => a > 0);
  const femaleAges = femaleRecords.map(r => r.age).filter(a => a > 0);

  const avgTotal = totalAges.length > 0 ? (totalAges.reduce((s, a) => s + a, 0) / totalAges.length).toFixed(1) : '0';
  const avgMale = maleAges.length > 0 ? (maleAges.reduce((s, a) => s + a, 0) / maleAges.length).toFixed(1) : '0';
  const avgFemale = femaleAges.length > 0 ? (femaleAges.reduce((s, a) => s + a, 0) / femaleAges.length).toFixed(1) : '0';

  // Youngest & Oldest
  const sortedByAge = [...records].filter(r => r.age > 0).sort((a, b) => a.age - b.age);
  const youngest = sortedByAge[0] || null;
  const oldest = sortedByAge[sortedByAge.length - 1] || null;

  // Age group breakdown
  const groupStats: AgeGroupStat[] = AGE_BRACKET_CONFIGS.map(bracket => {
    const inBracket = records.filter(r => r.age >= bracket.minAge && r.age <= bracket.maxAge);
    const maleInBracket = inBracket.filter(r => r.gender === 'ប');
    const femaleInBracket = inBracket.filter(r => r.gender === 'ស');

    const maleCount = maleInBracket.length;
    const femaleCount = femaleInBracket.length;
    const totalCount = inBracket.length;

    const maleRatio = totalCount > 0 ? Number(((maleCount / totalCount) * 100).toFixed(1)) : 0;
    const femaleRatio = totalCount > 0 ? Number(((femaleCount / totalCount) * 100).toFixed(1)) : 0;
    const totalRatio = total > 0 ? Number(((totalCount / total) * 100).toFixed(1)) : 0;

    const maleFamilyHeads = maleInBracket.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;
    const femaleFamilyHeads = femaleInBracket.filter(r => r.partyRole.includes('មេគ្រួសារ')).length;
    const totalFamilyHeads = maleFamilyHeads + femaleFamilyHeads;

    return {
      id: bracket.id,
      label: bracket.label,
      subLabel: bracket.subLabel,
      minAge: bracket.minAge,
      maxAge: bracket.maxAge,
      maleCount,
      femaleCount,
      totalCount,
      maleRatio,
      femaleRatio,
      totalRatio,
      maleFamilyHeads,
      femaleFamilyHeads,
      totalFamilyHeads,
    };
  });

  // Single Age Breakdown (from min to max age)
  const ageMap = new Map<number, MemberRecord[]>();
  for (const r of records) {
    if (r.age > 0) {
      const list = ageMap.get(r.age) || [];
      list.push(r);
      ageMap.set(r.age, list);
    }
  }

  const sortedAges = Array.from(ageMap.keys()).sort((a, b) => a - b);
  const singleAgeStats: SingleAgeStat[] = sortedAges.map(age => {
    const list = ageMap.get(age) || [];
    const males = list.filter(r => r.gender === 'ប');
    const females = list.filter(r => r.gender === 'ស');

    return {
      age,
      maleCount: males.length,
      femaleCount: females.length,
      totalCount: list.length,
      maleNames: males.map(r => r.fullName),
      femaleNames: females.map(r => r.fullName),
      members: list,
    };
  });

  return {
    total,
    maleTotal,
    femaleTotal,
    malePercentage: total > 0 ? Number(((maleTotal / total) * 100).toFixed(1)) : 0,
    femalePercentage: total > 0 ? Number(((femaleTotal / total) * 100).toFixed(1)) : 0,
    avgTotal,
    avgMale,
    avgFemale,
    youngest,
    oldest,
    groupStats,
    singleAgeStats,
  };
}

/**
 * Generate TSV data string for Age Gender Summary to paste directly into Google Sheets
 */
export function generateAgeSummaryTSV(records: MemberRecord[]): string {
  const stats = calculateAgeGenderStats(records);

  const lines: string[] = [
    `តារាងសរុបសមាជិក ស្រី-ប្រុស តាមក្រុមអាយុ (Google Sheets Summary)`,
    `កាលបរិច្ឆេទគិតត្រឹមឆ្នាំ ២០២៦\tសរុបទាំងអស់: ${stats.total} នាក់\tប្រុស: ${stats.maleTotal} នាក់ (${stats.malePercentage}%)\tស្រី: ${stats.femaleTotal} នាក់ (${stats.femalePercentage}%)`,
    ``,
    `ក្រុមអាយុ\tអាយុចាប់ពី-ដល់\tចំនួនប្រុស (នាក់)\tភាគរយប្រុស (%)\tចំនួនស្រី (នាក់)\tភាគរយស្រី (%)\tសរុប (នាក់)\tសមាមាត្រសរុប (%)\tមេគ្រួសារប្រុស\tមេគ្រួសារស្រី\tមេគ្រួសារសរុប`,
  ];

  for (const g of stats.groupStats) {
    lines.push([
      g.label,
      `${g.minAge}-${g.maxAge > 100 ? 'ឡើង' : g.maxAge}`,
      g.maleCount,
      `${g.maleRatio}%`,
      g.femaleCount,
      `${g.femaleRatio}%`,
      g.totalCount,
      `${g.totalRatio}%`,
      g.maleFamilyHeads,
      g.femaleFamilyHeads,
      g.totalFamilyHeads,
    ].join('\t'));
  }

  // Summary Row
  const totalMaleFamilyHeads = stats.groupStats.reduce((s, g) => s + g.maleFamilyHeads, 0);
  const totalFemaleFamilyHeads = stats.groupStats.reduce((s, g) => s + g.femaleFamilyHeads, 0);
  lines.push([
    `សរុបរួម`,
    `គ្រប់អាយុ`,
    stats.maleTotal,
    `${stats.malePercentage}%`,
    stats.femaleTotal,
    `${stats.femalePercentage}%`,
    stats.total,
    `100%`,
    totalMaleFamilyHeads,
    totalFemaleFamilyHeads,
    totalMaleFamilyHeads + totalFemaleFamilyHeads,
  ].join('\t'));

  lines.push(``);
  lines.push(`ស្ថិតិអាយុមធ្យម និងគម្លាតអាយុ`);
  lines.push(`អាយុមធ្យមរួម\t${stats.avgTotal} ឆ្នាំ`);
  lines.push(`អាយុមធ្យមបុរស\t${stats.avgMale} ឆ្នាំ`);
  lines.push(`អាយុមធ្យមស្ត្រី\t${stats.avgFemale} ឆ្នាំ`);
  if (stats.youngest) {
    lines.push(`ក្មេងជាងគេ\t${stats.youngest.fullName} (អាយុ ${stats.youngest.age} ឆ្នាំ, ភេទ ${stats.youngest.gender === 'ប' ? 'ប្រុស' : 'ស្រី'})`);
  }
  if (stats.oldest) {
    lines.push(`ចាស់ជាងគេ\t${stats.oldest.fullName} (អាយុ ${stats.oldest.age} ឆ្នាំ, ភេទ ${stats.oldest.gender === 'ប' ? 'ប្រុស' : 'ស្រី'})`);
  }

  return lines.join('\n');
}

/**
 * Copy Age Gender summary directly to clipboard for pasting in Google Sheets
 */
export async function copyAgeSummaryForSheets(records: MemberRecord[]): Promise<boolean> {
  const tsv = generateAgeSummaryTSV(records);
  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch (e) {
    console.error('Failed to copy Age Summary to clipboard', e);
    return false;
  }
}
