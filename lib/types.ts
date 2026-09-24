export interface MemberRecord {
  id: number; // ល.រ
  fullName: string; // នាមត្រកូល-នាមខ្លួន
  gender: 'ប' | 'ស'; // ភេទ (ប / ស)
  photoUrl?: string; // រូបថត
  decimalAge?: number; // អាយុលំអៀង (Legacy/Optional)
  age: number; // អាយុ
  dob: string; // ថ្ងៃខែឆ្នាំកំណើត
  idCardNo: string; // លេខអត្តសញ្ញាណប័ណ្ណ
  partyCardNo?: string; // លេខអត្តបក្ស
  joinDate?: string; // ថ្ងៃខែឆ្នាំចូលបក្ស
  necOffice: string; // ឈ្មោះការិយាល័យ គជប
  communeCode: string; // កូដឃុំ
  officeNo: string; // លេខការិយាល័យ
  necOrderNo: string; // ល.រ គជប
  houseNo?: string; // លេខផ្ទះ (Legacy/Optional)
  partyGroup: number; // ក្រុមបក្ស (1 - 21)
  partyRole: string; // តួនាទីក្នុងបក្ស
  occupation: string; // មុខរបរ
  remarks: string; // ស្ថានគ្រួសារ
  notes?: string; // កត់សម្គាល់ / ផ្សេងៗ
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

export interface VitalEventRecord {
  id: number;
  type: 'birth' | 'death'; // 'birth' = សម្រាល / កើត, 'death' = មរណៈ / មរណភាព
  personName: string; // ឈ្មោះកុមារ ឬ ឈ្មោះសព
  gender: 'ប' | 'ស'; // ភេទ
  eventDate: string; // ថ្ងៃខែឆ្នាំសម្រាល ឬ មរណៈ (DD/MM/YYYY)
  age?: number; // អាយុពេលមរណភាព (សម្រាលមិនបាច់ដាក់ ឬ 0)
  category: 'party' | 'general'; // 'party' = គ្រួសារបក្ស, 'general' = ប្រជាជនទូទៅ
  fatherName?: string; // ឈ្មោះឪពុក
  motherName?: string; // ឈ្មោះម្តាយ
  causeOfDeath?: string; // មូលហេតុនៃការស្លាប់
  groupNo: number; // ក្រុមទី
  houseNo?: string; // លេខផ្ទះ
  remarks?: string; // ផ្សេងៗ / សម្គាល់
}

export interface GeneralPopulationStats {
  villageTotalPopulation: number; // ប្រជាជនទូទៅសរុប
  villageFemalePopulation: number; // ស្រី
  villageMalePopulation: number; // ប្រុស
  villageTotalFamilies: number; // គ្រួសារសរុប
  villageTotalRoofs: number; // ខ្នងផ្ទះសរុប
  votingAgePopulation: number; // អាយុ ១៨ ឆ្នាំឡើង (ក្នុងបញ្ជីបោះឆ្នោត)
  votingAgeFemale: number; // ស្រី (ក្នុងបញ្ជីបោះឆ្នោត)
}

export type OrgRoleCategory = 
  | 'commune_president' 
  | 'commune_vice_president' 
  | 'commune_permanent_member' 
  | 'commune_member' 
  | 'team_leader' 
  | 'village_president' 
  | 'village_vice_president' 
  | 'village_member' 
  | 'group_leader';

export interface OrgLeaderRecord {
  id: string;
  name: string; // នាម និង គោត្តនាម
  gender: 'ប' | 'ស'; // ភេទ
  level: 'commune' | 'village' | 'working_group'; // កម្រិត៖ គណៈកម្មាធិការបក្សឃុំ, សាខាបក្សភូមិ, ក្រុមការងារចុះជួយ
  villageName?: string; // ឈ្មោះភូមិ (សម្រាប់ថ្នាក់ភូមិ ឧ. ភូមិរលួស, ភូមិបន្ទាយស្ទោង, ភូមិបឹងប្រិយ៍...)
  role: string; // តួនាទី ឧ. ប្រធានគណៈកម្មាធិការគណបក្សឃុំ, អនុប្រធាន, សមាជិកអចិន្ត្រៃយ៍, ប្រធានសាខាបក្សភូមិ...
  roleCategory: OrgRoleCategory;
  rankOrder: number; // លំដាប់ថ្នាក់រៀបចំ
  phoneNumber?: string; // លេខទូរស័ព្ទទំនាក់ទំនង
  partyCardNo?: string; // លេខប័ណ្ណសមាជិកបក្ស
  idCardNo?: string; // លេខអត្តសញ្ញាណប័ណ្ណ
  dob?: string; // ថ្ងៃខែឆ្នាំកំណើត
  age?: number; // អាយុ
  photoUrl?: string; // រូបថត (Data URI ឬ URL)
  appointedDate?: string; // ថ្ងៃខែឆ្នាំតែងតាំង / កាន់តំណែង
  responsibilities?: string; // ភារកិច្ចទទួលបន្ទុក
  partyGroupNo?: number; // ក្រុមបក្សទី (សម្រាប់ថ្នាក់ភូមិ)
  houseNo?: string; // លេខផ្ទះ
  status: 'active' | 'leave' | 'standby'; // ស្ថានភាពការងារ
  remarks?: string; // ផ្សេងៗ
}

