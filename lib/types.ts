export interface MemberRecord {
  id: number; // ល.រ
  fullName: string; // នាមត្រកូល-នាមខ្លួន (មេគ្រួសារ)
  gender: 'ប' | 'ស'; // ភេទ (ប / ស)
  decimalAge: number; // អាយុលំអៀង
  age: number; // អាយុ
  dob: string; // ថ្ងៃខែឆ្នាំកំណើត
  idCardNo: string; // លេខអត្តសញ្ញាណប័ណ្ណ
  necOffice: string; // ឈ្មោះការិយាល័យ គជប
  communeCode: string; // កូដឃុំ
  officeNo: string; // លេខការិយាល័យ
  necOrderNo: string; // ល.រ គជប
  houseNo: string; // លេខផ្ទះ
  partyGroup: number; // ក្រុមបក្ស (1 - 21)
  partyRole: string; // តួនាទីក្នុងបក្ស
  occupation: string; // មុខរបរ
  remarks: string; // ផ្សេងៗ / ស្ថានភាព
}

export interface VillageStats {
  totalFamilies: number; // ចំនួនគ្រួសារ
  totalRoofs: number; // ចំនួនខ្នងផ្ទះ
  partyFamilyHeads: number; // មេគ្រួសារបក្ស
  youthCount: number; // យុវជន 18-35
  marriedLocal: number; // រៀបការមូលដ្ឋាន
  marriedMigrantDistrict: number; // រៀបការសំណាក់ស្រុក
  singleLocal: number; // នៅលីវក្នុងមូលដ្ឋាន
  singleMigrantDistrict: number; // នៅលីវសំណាក់ស្រុក
  marriedRelocated: number; // រៀបការផ្លាស់ទីលំនៅ
  elderlyOver65: number; // ចាស់ជរា 65 ឆ្នាំឡើង
  migrantThailand: number; // សំណាក់ស្រុក ថៃ
  notInNec: number; // គ្មានឈ្មោះក្នុង គជប
  votersList2025: number; // បញ្ជីឈ្មោះបោះឆ្នោត 2025
  votersFemale: number; // ស្រី (ក្នុងបញ្ជីបោះឆ្នោត)
  partyMembersTotal: number; // សមាជិកបក្ស
  partyMembersFemale: number; // ស្រី (សមាជិកបក្ស)
  percentage: number; // ភាគរយ (%)
  villageHead: string; // មេភូមិ
  teamLeader: string; // ប្រធានក្រុមការងារ
  reportDate: string; // ថ្ងៃខែឆ្នាំ
}

export type FilterGender = 'all' | 'ប' | 'ស';
export type FilterGroup = 'all' | number;
export type FilterRole = 'all' | string;
export type FilterRemark = 'all' | string;
export type FilterAgeBracket = 'all' | 'under18' | '18-35' | '36-50' | '51-64' | '65plus';

export interface AgeGroupStat {
  id: string;
  label: string;
  subLabel?: string;
  minAge: number;
  maxAge: number;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  maleRatio: number; // percentage within bracket
  femaleRatio: number; // percentage within bracket
  totalRatio: number; // percentage of grand total
  maleFamilyHeads: number;
  femaleFamilyHeads: number;
  totalFamilyHeads: number;
}

export interface SingleAgeStat {
  age: number;
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  maleNames: string[];
  femaleNames: string[];
  members: MemberRecord[];
}
