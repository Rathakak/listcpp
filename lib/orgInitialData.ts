import { OrgLeaderRecord } from './types';

// Default SVG Avatars representing formal Cambodian official portraits
export const DEFAULT_AVATARS = {
  maleFormalBlue: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%231e3a8a"/>
        <stop offset="100%" stop-color="%230284c7"/>
      </linearGradient>
      <linearGradient id="suit" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="%230f172a"/>
        <stop offset="50%" stop-color="%231e293b"/>
        <stop offset="100%" stop-color="%230f172a"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23fbbf24"/>
        <stop offset="100%" stop-color="%23d97706"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(%23bg)"/>
    <circle cx="80" cy="56" r="30" fill="%23fbb086"/>
    <!-- Hair -->
    <path d="M48 54 C48 32, 60 22, 80 22 C100 22, 112 32, 112 54 C104 38, 92 34, 80 34 C68 34, 56 38, 48 54 Z" fill="%231c1917"/>
    <!-- Ears -->
    <circle cx="48" cy="58" r="6" fill="%23fbb086"/>
    <circle cx="112" cy="58" r="6" fill="%23fbb086"/>
    <!-- Face details -->
    <ellipse cx="68" cy="52" rx="3.5" ry="2" fill="%231c1917"/>
    <ellipse cx="92" cy="52" rx="3.5" ry="2" fill="%231c1917"/>
    <path d="M63 46 Q68 44 74 46" stroke="%231c1917" stroke-width="2.5" fill="none"/>
    <path d="M86 46 Q92 44 97 46" stroke="%231c1917" stroke-width="2.5" fill="none"/>
    <path d="M78 54 L80 62 L83 62" stroke="%23d97706" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M72 70 Q80 75 88 70" stroke="%239a3412" stroke-width="2" fill="none"/>
    <!-- Neck -->
    <rect x="71" y="80" width="18" height="18" fill="%23f09b6e"/>
    <!-- White Shirt Collar & Red Tie -->
    <polygon points="80,95 62,90 70,118 80,118" fill="%23ffffff"/>
    <polygon points="80,95 98,90 90,118 80,118" fill="%23ffffff"/>
    <polygon points="76,96 84,96 83,142 80,148 77,142" fill="%23dc2626"/>
    <!-- Formal Navy Suit -->
    <path d="M26 160 L26 128 C26 104, 50 94, 66 94 L80 128 L94 94 C110 94, 134 104, 134 128 L134 160 Z" fill="url(%23suit)"/>
    <!-- CPP Golden Pin on Lapel -->
    <circle cx="48" cy="118" r="6" fill="url(%23gold)"/>
    <circle cx="48" cy="118" r="4.5" fill="%23b45309"/>
    <circle cx="48" cy="118" r="2" fill="%23fef08a"/>
  </svg>`,

  femaleFormalNavy: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="fbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%231e3a8a"/>
        <stop offset="100%" stop-color="%2338bdf8"/>
      </linearGradient>
      <linearGradient id="fsuit" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="%231e1b4b"/>
        <stop offset="50%" stop-color="%23312e81"/>
        <stop offset="100%" stop-color="%231e1b4b"/>
      </linearGradient>
      <linearGradient id="fgold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23fbbf24"/>
        <stop offset="100%" stop-color="%23d97706"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(%23fbg)"/>
    <!-- Hair back -->
    <ellipse cx="80" cy="62" rx="36" ry="40" fill="%231c1917"/>
    <!-- Face -->
    <circle cx="80" cy="56" r="28" fill="%23ffc8a2"/>
    <!-- Front Hair -->
    <path d="M50 50 C52 26, 72 20, 80 20 C88 20, 108 26, 110 50 C100 32, 88 30, 80 32 C70 30, 60 32, 50 50 Z" fill="%231c1917"/>
    <!-- Ears & Gold Earrings -->
    <circle cx="50" cy="58" r="5" fill="%23ffc8a2"/>
    <circle cx="110" cy="58" r="5" fill="%23ffc8a2"/>
    <circle cx="49" cy="64" r="3" fill="url(%23fgold)"/>
    <circle cx="111" cy="64" r="3" fill="url(%23fgold)"/>
    <!-- Eyes & Brows -->
    <ellipse cx="69" cy="53" rx="3.5" ry="2" fill="%231c1917"/>
    <ellipse cx="91" cy="53" rx="3.5" ry="2" fill="%231c1917"/>
    <path d="M64 47 Q69 45 74 47" stroke="%231c1917" stroke-width="2" fill="none"/>
    <path d="M86 47 Q91 45 96 47" stroke="%231c1917" stroke-width="2" fill="none"/>
    <path d="M78 55 L80 61 L82 61" stroke="%23ea580c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M73 68 Q80 73 87 68" stroke="%23e11d48" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Neck & Golden Necklace -->
    <rect x="73" y="78" width="14" height="18" fill="%23fbb086"/>
    <path d="M71 88 Q80 96 89 88" stroke="url(%23fgold)" stroke-width="2.5" fill="none"/>
    <!-- Blouse & Suit -->
    <polygon points="80,102 64,96 72,122 80,122" fill="%23fef3c7"/>
    <polygon points="80,102 96,96 88,122 80,122" fill="%23fef3c7"/>
    <path d="M28 160 L28 130 C28 106, 52 96, 68 96 L80 126 L92 96 C108 96, 132 106, 132 130 L132 160 Z" fill="url(%23fsuit)"/>
    <!-- Golden Brooch / Party Pin -->
    <circle cx="50" cy="118" r="6" fill="url(%23fgold)"/>
    <circle cx="50" cy="118" r="2" fill="%23ffffff"/>
  </svg>`,

  maleWhitePartyShirt: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%230369a1"/>
        <stop offset="100%" stop-color="%2338bdf8"/>
      </linearGradient>
      <linearGradient id="pgold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23fbbf24"/>
        <stop offset="100%" stop-color="%23d97706"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(%23pbg)"/>
    <circle cx="80" cy="56" r="30" fill="%23fbb086"/>
    <path d="M48 54 C48 30, 62 22, 80 22 C98 22, 112 30, 112 54 C104 38, 92 34, 80 34 C68 34, 56 38, 48 54 Z" fill="%23292524"/>
    <circle cx="48" cy="58" r="6" fill="%23fbb086"/>
    <circle cx="112" cy="58" r="6" fill="%23fbb086"/>
    <ellipse cx="68" cy="52" rx="3.5" ry="2" fill="%231c1917"/>
    <ellipse cx="92" cy="52" rx="3.5" ry="2" fill="%231c1917"/>
    <path d="M63 46 Q68 44 74 46" stroke="%231c1917" stroke-width="2.5" fill="none"/>
    <path d="M86 46 Q92 44 97 46" stroke="%231c1917" stroke-width="2.5" fill="none"/>
    <path d="M78 54 L80 62 L83 62" stroke="%23d97706" stroke-width="1.8" fill="none"/>
    <path d="M72 70 Q80 75 88 70" stroke="%239a3412" stroke-width="2" fill="none"/>
    <rect x="71" y="80" width="18" height="18" fill="%23f09b6e"/>
    <!-- Official White Party Shirt with Collar and CPP Logo Badge on Chest -->
    <path d="M26 160 L26 128 C26 104, 50 94, 66 94 L80 106 L94 94 C110 94, 134 104, 134 128 L134 160 Z" fill="%23ffffff"/>
    <polygon points="62,94 80,108 80,94" fill="%23f1f5f9"/>
    <polygon points="98,94 80,108 80,94" fill="%23e2e8f0"/>
    <path d="M80 108 L80 160" stroke="%23cbd5e1" stroke-width="2"/>
    <circle cx="80" cy="120" r="2.5" fill="%2394a3b8"/>
    <circle cx="80" cy="138" r="2.5" fill="%2394a3b8"/>
    <circle cx="80" cy="154" r="2.5" fill="%2394a3b8"/>
    <!-- CPP Chest Badge on Left Pocket -->
    <rect x="46" y="116" width="18" height="14" rx="2" fill="%23f8fafc" stroke="%23cbd5e1"/>
    <circle cx="55" cy="123" r="5" fill="url(%23pgold)"/>
    <circle cx="55" cy="123" r="3" fill="%231e3a8a"/>
    <circle cx="55" cy="123" r="1.5" fill="%23fef08a"/>
  </svg>`,

  femaleWhitePartyShirt: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="wbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%230284c7"/>
        <stop offset="100%" stop-color="%2338bdf8"/>
      </linearGradient>
      <linearGradient id="wgold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23fbbf24"/>
        <stop offset="100%" stop-color="%23d97706"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(%23wbg)"/>
    <ellipse cx="80" cy="62" rx="36" ry="40" fill="%231c1917"/>
    <circle cx="80" cy="56" r="28" fill="%23ffc8a2"/>
    <path d="M50 50 C52 26, 72 20, 80 20 C88 20, 108 26, 110 50 C100 32, 88 30, 80 32 C70 30, 60 32, 50 50 Z" fill="%231c1917"/>
    <circle cx="50" cy="58" r="5" fill="%23ffc8a2"/>
    <circle cx="110" cy="58" r="5" fill="%23ffc8a2"/>
    <circle cx="49" cy="64" r="3" fill="url(%23wgold)"/>
    <circle cx="111" cy="64" r="3" fill="url(%23wgold)"/>
    <ellipse cx="69" cy="53" rx="3.5" ry="2" fill="%231c1917"/>
    <ellipse cx="91" cy="53" rx="3.5" ry="2" fill="%231c1917"/>
    <path d="M64 47 Q69 45 74 47" stroke="%231c1917" stroke-width="2" fill="none"/>
    <path d="M86 47 Q91 45 96 47" stroke="%231c1917" stroke-width="2" fill="none"/>
    <path d="M78 55 L80 61 L82 61" stroke="%23ea580c" stroke-width="1.6" fill="none"/>
    <path d="M73 68 Q80 73 87 68" stroke="%23e11d48" stroke-width="2.5" fill="none"/>
    <rect x="73" y="78" width="14" height="18" fill="%23fbb086"/>
    <!-- Official White Blouse with CPP Badge -->
    <path d="M28 160 L28 130 C28 106, 52 96, 68 96 L80 110 L92 96 C108 96, 132 106, 132 130 L132 160 Z" fill="%23ffffff"/>
    <path d="M80 110 L80 160" stroke="%23cbd5e1" stroke-width="1.8"/>
    <!-- CPP Badge on Left Chest -->
    <circle cx="54" cy="120" r="6" fill="url(%23wgold)"/>
    <circle cx="54" cy="120" r="4" fill="%231e3a8a"/>
    <circle cx="54" cy="120" r="2" fill="%23fef08a"/>
  </svg>`,

  maleSecurityUniform: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%231e293b"/>
        <stop offset="100%" stop-color="%23475569"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" fill="url(%23sbg)"/>
    <circle cx="80" cy="56" r="30" fill="%23fbb086"/>
    <path d="M50 52 C50 30, 62 22, 80 22 C98 22, 110 30, 110 52 Z" fill="%231c1917"/>
    <circle cx="48" cy="58" r="6" fill="%23fbb086"/>
    <circle cx="112" cy="58" r="6" fill="%23fbb086"/>
    <ellipse cx="68" cy="52" rx="3.5" ry="2" fill="%231c1917"/>
    <ellipse cx="92" cy="52" rx="3.5" ry="2" fill="%231c1917"/>
    <path d="M63 46 Q68 44 74 46" stroke="%231c1917" stroke-width="2.5" fill="none"/>
    <path d="M86 46 Q92 44 97 46" stroke="%231c1917" stroke-width="2.5" fill="none"/>
    <path d="M78 54 L80 62 L83 62" stroke="%23d97706" stroke-width="1.8" fill="none"/>
    <path d="M72 70 Q80 75 88 70" stroke="%239a3412" stroke-width="2" fill="none"/>
    <rect x="71" y="80" width="18" height="18" fill="%23f09b6e"/>
    <!-- Police / Security Khaki Uniform -->
    <path d="M26 160 L26 128 C26 104, 50 94, 66 94 L80 110 L94 94 C110 94, 134 104, 134 128 L134 160 Z" fill="%23a88b64"/>
    <!-- Epaulets / Shoulder Ranks -->
    <polygon points="32,100 48,94 44,110 28,114" fill="%2378350f"/>
    <polygon points="128,100 112,94 116,110 132,114" fill="%2378350f"/>
    <circle cx="38" cy="104" r="2" fill="%23fef08a"/>
    <circle cx="122" cy="104" r="2" fill="%23fef08a"/>
    <!-- Chest Badge -->
    <rect x="46" y="118" width="16" height="12" rx="2" fill="%23fef08a" stroke="%23d97706"/>
  </svg>`
};

export const initialOrgLeaders: OrgLeaderRecord[] = [
  // ==========================================
  // I. គណៈកម្មាធិការគណបក្សមូលដ្ឋានឃុំបន្ទាយស្ទោង (Commune Level)
  // ==========================================
  {
    id: 'commune-pres-1',
    name: 'ហ៊ុន ហឿង',
    gender: 'ប',
    level: 'commune',
    role: 'ប្រធានគណៈកម្មាធិការគណបក្សឃុំបន្ទាយស្ទោង',
    roleCategory: 'commune_president',
    rankOrder: 1,
    phoneNumber: '012 889 452',
    partyCardNo: 'CPP-KS-0880-001',
    idCardNo: '150600101',
    dob: '12/05/1968',
    age: 58,
    photoUrl: DEFAULT_AVATARS.maleFormalBlue,
    appointedDate: '05/06/2022',
    responsibilities: 'ដឹកនាំការងារទូទៅ សម្របសម្រួលកិច្ចការនយោបាយ និងកសាងបក្សឃុំ',
    status: 'active',
    remarks: 'មេឃុំបន្ទាយស្ទោង'
  },
  {
    id: 'commune-vp-1',
    name: 'ស៊្រុន គឹមសាន',
    gender: 'ស',
    level: 'commune',
    role: 'អនុប្រធានទី១ គណៈកម្មាធិការគណបក្សឃុំ',
    roleCategory: 'commune_vice_president',
    rankOrder: 2,
    phoneNumber: '097 788 1234',
    partyCardNo: 'CPP-KS-0880-002',
    idCardNo: '150600102',
    dob: '20/11/1972',
    age: 54,
    photoUrl: DEFAULT_AVATARS.femaleFormalNavy,
    appointedDate: '05/06/2022',
    responsibilities: 'ទទួលបន្ទុកការងាររដ្ឋបាល ចាត់តាំង និងត្រួតពិនិត្យគណបក្សឃុំ',
    status: 'active',
    remarks: 'ជំទប់ទី១ ឃុំបន្ទាយស្ទោង'
  },
  {
    id: 'commune-vp-2',
    name: 'ឃុត សុខន',
    gender: 'ប',
    level: 'commune',
    role: 'អនុប្រធានទី២ គណៈកម្មាធិការគណបក្សឃុំ',
    roleCategory: 'commune_vice_president',
    rankOrder: 3,
    phoneNumber: '088 678 9912',
    partyCardNo: 'CPP-KS-0880-003',
    idCardNo: '150600103',
    dob: '14/03/1975',
    age: 51,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '05/06/2022',
    responsibilities: 'ទទួលបន្ទុកសេដ្ឋកិច្ច ហិរញ្ញវត្ថុ និងជីវភាពរស់នៅរបស់ប្រជាជន',
    status: 'active',
    remarks: 'ជំទប់ទី២ ឃុំបន្ទាយស្ទោង'
  },
  {
    id: 'commune-perm-1',
    name: 'កែវ វ៉ាន់នី',
    gender: 'ប',
    level: 'commune',
    role: 'សមាជិកអចិន្ត្រៃយ៍ / ប្រធានផ្នែកឃោសនាអប់រំ',
    roleCategory: 'commune_permanent_member',
    rankOrder: 4,
    phoneNumber: '078 234 567',
    partyCardNo: 'CPP-KS-0880-004',
    dob: '08/09/1979',
    age: 47,
    photoUrl: DEFAULT_AVATARS.maleFormalBlue,
    appointedDate: '10/07/2022',
    responsibilities: 'ទទួលបន្ទុកការងារអប់រំសតិអារម្មណ៍ ផ្សព្វផ្សាយលក្ខន្តិកៈ និងកម្មវិធីនយោបាយបក្ស',
    status: 'active'
  },
  {
    id: 'commune-perm-2',
    name: 'ម៉ី សុខា',
    gender: 'ស',
    level: 'commune',
    role: 'សមាជិកអចិន្ត្រៃយ៍ / ប្រធានផ្នែកស្រ្តី និងកុមារ',
    roleCategory: 'commune_permanent_member',
    rankOrder: 5,
    phoneNumber: '096 456 7890',
    partyCardNo: 'CPP-KS-0880-005',
    dob: '16/08/1982',
    age: 44,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '10/07/2022',
    responsibilities: 'ដឹកនាំចលនាស្រ្តីបក្ស មាតា និងកុមារ និងសកម្មភាពសង្គមក្នុងឃុំ',
    status: 'active'
  },
  {
    id: 'commune-perm-3',
    name: 'លឹម សារ៉េត',
    gender: 'ប',
    level: 'commune',
    role: 'សមាជិកអចិន្ត្រៃយ៍ / ប្រធានផ្នែកយុវជនបក្សឃុំ (ស.ស.យ.ក)',
    roleCategory: 'commune_permanent_member',
    rankOrder: 6,
    phoneNumber: '089 901 234',
    partyCardNo: 'CPP-KS-0880-006',
    dob: '02/02/1988',
    age: 38,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '10/07/2022',
    responsibilities: 'ដឹកនាំចលនាយុវជនគណបក្ស កីឡា និងយុវជនស្ម័គ្រចិត្តឃុំបន្ទាយស្ទោង',
    status: 'active'
  },
  {
    id: 'commune-sec-1',
    name: 'អ៊ុំ សាវ៉ាត',
    gender: 'ប',
    level: 'commune',
    role: 'សមាជិកគណៈកម្មាធិការបក្សឃុំ / ទទួលបន្ទុកសន្តិសុខ-សណ្តាប់ធ្នាប់',
    roleCategory: 'commune_member',
    rankOrder: 7,
    phoneNumber: '011 556 677',
    partyCardNo: 'CPP-KS-0880-007',
    dob: '15/07/1974',
    age: 52,
    photoUrl: DEFAULT_AVATARS.maleSecurityUniform,
    appointedDate: '01/08/2022',
    responsibilities: 'ការពារសន្តិសុខ សណ្តាប់ធ្នាប់សាធារណៈ និងភូមិ-ឃុំមានសុវត្ថិភាព',
    status: 'active',
    remarks: 'នាយប៉ុស្តិ៍នគរបាលរដ្ឋបាលឃុំបន្ទាយស្ទោង'
  },

  // ==========================================
  // II. ក្រុមការងារគណបក្សចុះជួយមូលដ្ឋាន (Party Working Group)
  // ==========================================
  {
    id: 'wg-leader-1',
    name: 'ផូ វុធ',
    gender: 'ប',
    level: 'working_group',
    villageName: 'ភូមិរលួស',
    role: 'ប្រធានក្រុមការងារចុះជួយភូមិរលួស ឃុំបន្ទាយស្ទោង',
    roleCategory: 'team_leader',
    rankOrder: 10,
    phoneNumber: '012 334 556',
    partyCardNo: 'CPP-WG-0880-01',
    dob: '09/04/1971',
    age: 55,
    photoUrl: DEFAULT_AVATARS.maleFormalBlue,
    appointedDate: '15/01/2023',
    responsibilities: 'ដឹកនាំក្រុមការងារគណបក្សចុះជួយភូមិរលួស ដោះស្រាយបញ្ហាជីវភាពប្រជាជន និងពង្រឹងមូលដ្ឋានបក្ស',
    status: 'active',
    remarks: 'ថ្នាក់ដឹកនាំក្រុមការងារគណបក្សចុះជួយមូលដ្ឋាន'
  },
  {
    id: 'wg-member-1',
    name: 'ចាន់ ធីតា',
    gender: 'ស',
    level: 'working_group',
    villageName: 'ភូមិរលួស',
    role: 'អនុប្រធានក្រុមការងារចុះជួយភូមិរលួស',
    roleCategory: 'team_leader',
    rankOrder: 11,
    phoneNumber: '092 112 233',
    partyCardNo: 'CPP-WG-0880-02',
    dob: '25/08/1978',
    age: 48,
    photoUrl: DEFAULT_AVATARS.femaleFormalNavy,
    appointedDate: '15/01/2023',
    responsibilities: 'ជួយការងារប្រធានក្រុមការងារ ទទួលបន្ទុកការងារសប្បុរសធម៌ និងស្រ្តី',
    status: 'active'
  },

  // ==========================================
  // III. ថ្នាក់សាខាគណបក្សភូមិរលួស (Roluos Village Base Committee)
  // ==========================================
  {
    id: 'village-roluos-pres',
    name: 'ជា ជី',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'ប្រធានសាខាគណបក្សភូមិរលួស / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 20,
    phoneNumber: '088 991 2233',
    partyCardNo: '150667101',
    idCardNo: '150667101',
    dob: '04/05/1965',
    age: 61,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '10/05/2017',
    responsibilities: 'ដឹកនាំការងារបក្ស និងរដ្ឋបាលភូមិរលួសទាំងមូល គ្រប់គ្រងសមាជិកបក្ស ២៦៥ នាក់',
    partyGroupNo: 1,
    houseNo: '01',
    status: 'active',
    remarks: 'មេភូមិរលួស ឃុំបន្ទាយស្ទោង'
  },
  {
    id: 'village-roluos-vp',
    name: 'មាស គន្ធា',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'អនុប្រធានសាខាគណបក្សភូមិរលួស / អនុប្រធានភូមិ',
    roleCategory: 'village_vice_president',
    rankOrder: 21,
    phoneNumber: '097 554 4332',
    partyCardNo: '150667102',
    idCardNo: '150667102',
    dob: '12/10/1976',
    age: 50,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '10/05/2017',
    responsibilities: 'ជួយការងារមេភូមិ ទទួលបន្ទុកការងារស្រ្តី កុមារ និងសង្គមកិច្ចភូមិ',
    partyGroupNo: 2,
    houseNo: '14',
    status: 'active',
    remarks: 'អនុប្រធានភូមិរលួស'
  },
  {
    id: 'village-roluos-member-1',
    name: 'ជួន គង់',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'សមាជិកសាខាបក្សភូមិរលួស / ជំនួយការភូមិ',
    roleCategory: 'village_member',
    rankOrder: 22,
    phoneNumber: '012 778 899',
    partyCardNo: '150667103',
    dob: '03/01/1980',
    age: 46,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/01/2019',
    responsibilities: 'ទទួលបន្ទុកស្ថិតិ បញ្ជីឈ្មោះសមាជិក និងកត់ត្រាកំណើត-មរណភាពភូមិ',
    partyGroupNo: 5,
    houseNo: '28',
    status: 'active',
    remarks: 'ជំនួយការភូមិរលួស'
  },
  {
    id: 'village-roluos-grp-1',
    name: 'ជី ភា',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'សមាជិកសាខាបក្សភូមិ / ប្រធានក្រុមបក្សទី១',
    roleCategory: 'group_leader',
    rankOrder: 23,
    phoneNumber: '088 123 4501',
    partyCardNo: '150667157',
    dob: '10/08/1996',
    age: 30,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '15/06/2021',
    responsibilities: 'ដឹកនាំសមាជិកបក្សក្រុមទី១ គ្រប់គ្រងខ្នងផ្ទះ និងផ្សព្វផ្សាយព័ត៌មានបក្ស',
    partyGroupNo: 1,
    houseNo: '69',
    status: 'active'
  },
  {
    id: 'village-roluos-grp-2',
    name: 'បិន ណាំ',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'សមាជិកសាខាបក្សភូមិ / ប្រធានក្រុមបក្សទី២',
    roleCategory: 'group_leader',
    rankOrder: 24,
    phoneNumber: '097 234 5602',
    partyCardNo: '150667159',
    dob: '15/02/1963',
    age: 63,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '15/06/2021',
    responsibilities: 'ដឹកនាំសមាជិកបក្សក្រុមទី២ ផ្សព្វផ្សាយការងារអប់រំ និងចលនាសមាជិកនារី',
    partyGroupNo: 2,
    houseNo: '69',
    status: 'active'
  },
  {
    id: 'village-roluos-grp-12',
    name: 'ផៃ ស៊ីអូ',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'សមាជិកសាខាបក្សភូមិ / ប្រធានក្រុមបក្សទី១២',
    roleCategory: 'group_leader',
    rankOrder: 25,
    phoneNumber: '088 345 6712',
    partyCardNo: '150907668',
    dob: '15/04/1981',
    age: 45,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '15/06/2021',
    responsibilities: 'ដឹកនាំសមាជិកបក្សក្រុមទី១២ និងចុះសួរសុខទុក្ខគ្រួសារបក្ស',
    partyGroupNo: 12,
    houseNo: '69',
    status: 'active'
  },
  {
    id: 'village-roluos-grp-20',
    name: 'ផាន់ ក្រឹម',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិរលួស',
    role: 'សមាជិកសាខាបក្សភូមិ / ប្រធានក្រុមបក្សទី២០',
    roleCategory: 'group_leader',
    rankOrder: 26,
    phoneNumber: '088 456 7820',
    partyCardNo: '150667122',
    dob: '10/05/1973',
    age: 53,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '15/06/2021',
    responsibilities: 'ដឹកនាំសមាជិកបក្សក្រុមទី២០ និងសម្របសម្រួលការងារកសិកម្មក្នុងក្រុម',
    partyGroupNo: 20,
    houseNo: '69',
    status: 'active'
  },

  // ==========================================
  // IV. ថ្នាក់សាខាគណបក្សបណ្តាភូមិដទៃទៀត ក្នុងឃុំបន្ទាយស្ទោង
  // ==========================================
  // ១. ភូមិបន្ទាយស្ទោង
  {
    id: 'village-banteay-pres',
    name: 'សោម មុនី',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិបន្ទាយស្ទោង',
    role: 'ប្រធានសាខាគណបក្សភូមិបន្ទាយស្ទោង / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 30,
    phoneNumber: '012 900 111',
    partyCardNo: '150668001',
    dob: '18/09/1966',
    age: 60,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/06/2017',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិបន្ទាយស្ទោង',
    status: 'active',
    remarks: 'មេភូមិបន្ទាយស្ទោង'
  },
  {
    id: 'village-banteay-vp',
    name: 'ពេជ្រ សុផានី',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិបន្ទាយស្ទោង',
    role: 'អនុប្រធានសាខាគណបក្សភូមិបន្ទាយស្ទោង',
    roleCategory: 'village_vice_president',
    rankOrder: 31,
    phoneNumber: '097 888 222',
    partyCardNo: '150668002',
    dob: '22/04/1979',
    age: 47,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '01/06/2017',
    responsibilities: 'ជួយការងារប្រធានសាខា ទទួលបន្ទុកស្រ្តី និងសង្គមកិច្ចភូមិបន្ទាយស្ទោង',
    status: 'active'
  },

  // ២. ភូមិស្រោមដែក
  {
    id: 'village-sraomdaek-pres',
    name: 'ម៉ៅ សុផល',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិស្រោមដែក',
    role: 'ប្រធានសាខាគណបក្សភូមិស្រោមដែក / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 40,
    phoneNumber: '078 333 444',
    partyCardNo: '150669001',
    dob: '05/11/1970',
    age: 56,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '15/08/2018',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិស្រោមដែក',
    status: 'active',
    remarks: 'មេភូមិស្រោមដែក'
  },
  {
    id: 'village-sraomdaek-vp',
    name: 'គង់ សាវ៉ាន',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិស្រោមដែក',
    role: 'អនុប្រធានសាខាគណបក្សភូមិស្រោមដែក',
    roleCategory: 'village_vice_president',
    rankOrder: 41,
    phoneNumber: '096 777 666',
    partyCardNo: '150669002',
    dob: '14/02/1983',
    age: 43,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '15/08/2018',
    responsibilities: 'ជួយការងារសាខាបក្សភូមិស្រោមដែក ទទួលបន្ទុកសកម្មភាពសង្គម',
    status: 'active'
  },

  // ៣. ភូមិតាម៉ើ
  {
    id: 'village-tamaeu-pres',
    name: 'ទៀង វុឌ្ឍី',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិតាម៉ើ',
    role: 'ប្រធានសាខាគណបក្សភូមិតាម៉ើ / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 50,
    phoneNumber: '088 555 777',
    partyCardNo: '150670001',
    dob: '12/07/1969',
    age: 57,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/01/2019',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិតាម៉ើ',
    status: 'active',
    remarks: 'មេភូមិតាម៉ើ'
  },
  {
    id: 'village-tamaeu-vp',
    name: 'អ៊ុយ ផល្លី',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិតាម៉ើ',
    role: 'អនុប្រធានសាខាគណបក្សភូមិតាម៉ើ',
    roleCategory: 'village_vice_president',
    rankOrder: 51,
    phoneNumber: '017 444 333',
    partyCardNo: '150670002',
    dob: '30/08/1981',
    age: 45,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '01/01/2019',
    responsibilities: 'ជួយការងារប្រធានសាខាបក្សភូមិតាម៉ើ',
    status: 'active'
  },

  // ៤. ភូមិបវែង
  {
    id: 'village-baveang-pres',
    name: 'ឈន រដ្ឋា',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិបវែង',
    role: 'ប្រធានសាខាគណបក្សភូមិបវែង / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 60,
    phoneNumber: '097 999 000',
    partyCardNo: '150671001',
    dob: '01/12/1973',
    age: 53,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/03/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិបវែង',
    status: 'active',
    remarks: 'មេភូមិបវែង'
  },
  {
    id: 'village-baveang-vp',
    name: 'សាន គឹមហុង',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិបវែង',
    role: 'អនុប្រធានសាខាគណបក្សភូមិបវែង',
    roleCategory: 'village_vice_president',
    rankOrder: 61,
    phoneNumber: '089 222 111',
    partyCardNo: '150671002',
    dob: '18/06/1984',
    age: 42,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/03/2020',
    responsibilities: 'ជួយការងារប្រធានសាខាបក្សភូមិបវែង',
    status: 'active'
  },

  // ៥. ភូមិដូនប៉ុក
  {
    id: 'village-dounpok-pres',
    name: 'ឡុង សារ៉ាត់',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិដូនប៉ុក',
    role: 'ប្រធានសាខាគណបក្សភូមិដូនប៉ុក / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 70,
    phoneNumber: '012 345 601',
    partyCardNo: '150672001',
    dob: '05/04/1971',
    age: 55,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/02/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិដូនប៉ុក',
    status: 'active',
    remarks: 'មេភូមិដូនប៉ុក'
  },

  // ៦. ភូមិបេង
  {
    id: 'village-beng-pres',
    name: 'ហេង សុវណ្ណ',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិបេង',
    role: 'ប្រធានសាខាគណបក្សភូមិបេង / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 80,
    phoneNumber: '097 555 432',
    partyCardNo: '150673001',
    dob: '12/10/1975',
    age: 51,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/04/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិបេង',
    status: 'active',
    remarks: 'មេភូមិបេង'
  },

  // ៧. ភូមិពោធនិ៍
  {
    id: 'village-pou-pres',
    name: 'ង៉ែត វ៉ាន់នី',
    gender: 'ស',
    level: 'village',
    villageName: 'ភូមិពោធនិ៍',
    role: 'ប្រធានសាខាគណបក្សភូមិពោធនិ៍ / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 90,
    phoneNumber: '010 445 566',
    partyCardNo: '150674001',
    dob: '08/07/1978',
    age: 48,
    photoUrl: DEFAULT_AVATARS.femaleWhitePartyShirt,
    appointedDate: '01/05/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិពោធនិ៍',
    status: 'active',
    remarks: 'មេភូមិពោធនិ៍'
  },

  // ៨. ភូមិពន្លាជ័យ
  {
    id: 'village-ponleachey-pres',
    name: 'ចាន់ សុខឿន',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិពន្លាជ័យ',
    role: 'ប្រធានសាខាគណបក្សភូមិពន្លាជ័យ / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 100,
    phoneNumber: '088 223 344',
    partyCardNo: '150675001',
    dob: '16/09/1968',
    age: 58,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/01/2018',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិពន្លាជ័យ',
    status: 'active',
    remarks: 'មេភូមិពន្លាជ័យ'
  },

  // ៩. ភូមិចន្លុះ
  {
    id: 'village-chanloh-pres',
    name: 'ខៀវ ប៊ុនធឿន',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិចន្លុះ',
    role: 'ប្រធានសាខាគណបក្សភូមិចន្លុះ / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 110,
    phoneNumber: '077 889 900',
    partyCardNo: '150676001',
    dob: '20/03/1974',
    age: 52,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/06/2019',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិចន្លុះ',
    status: 'active',
    remarks: 'មេភូមិចន្លុះ'
  },

  // ១០. ភូមិស្លាករ
  {
    id: 'village-slakar-pres',
    name: 'ស៊ុយ សុខុន',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិស្លាករ',
    role: 'ប្រធានសាខាគណបក្សភូមិស្លាករ / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 120,
    phoneNumber: '092 112 233',
    partyCardNo: '150677001',
    dob: '11/11/1972',
    age: 54,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/08/2019',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិស្លាករ',
    status: 'active',
    remarks: 'មេភូមិស្លាករ'
  },

  // ១១. ភូមិឈើទាល
  {
    id: 'village-chheuteal-pres',
    name: 'ស៊ឹម សំអុន',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិឈើទាល',
    role: 'ប្រធានសាខាគណបក្សភូមិឈើទាល / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 130,
    phoneNumber: '015 667 788',
    partyCardNo: '150678001',
    dob: '02/02/1976',
    age: 50,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/10/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិឈើទាល',
    status: 'active',
    remarks: 'មេភូមិឈើទាល'
  },

  // ១២. ភូមិកុកគ្រោះ
  {
    id: 'village-kokkruos-pres',
    name: 'ប៉ុក វ៉ាន់ធី',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិកុកគ្រោះ',
    role: 'ប្រធានសាខាគណបក្សភូមិកុកគ្រោះ / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 140,
    phoneNumber: '089 998 877',
    partyCardNo: '150679001',
    dob: '14/05/1977',
    age: 49,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/11/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិកុកគ្រោះ',
    status: 'active',
    remarks: 'មេភូមិកុកគ្រោះ'
  },

  // ១៣. ភូមិចំបកបញ្ញា
  {
    id: 'village-chambak-pres',
    name: 'ប្រាក់ សារឿន',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិចំបកបញ្ញា',
    role: 'ប្រធានសាខាគណបក្សភូមិចំបកបញ្ញា / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 150,
    phoneNumber: '097 334 455',
    partyCardNo: '150680001',
    dob: '25/08/1973',
    age: 53,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/12/2020',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិចំបកបញ្ញា',
    status: 'active',
    remarks: 'មេភូមិចំបកបញ្ញា'
  },

  // ១៤. ភូមិគោកសណ្ដែក
  {
    id: 'village-kouksandaek-pres',
    name: 'ឌិត សារ៉ន',
    gender: 'ប',
    level: 'village',
    villageName: 'ភូមិគោកសណ្ដែក',
    role: 'ប្រធានសាខាគណបក្សភូមិគោកសណ្ដែក / មេភូមិ',
    roleCategory: 'village_president',
    rankOrder: 160,
    phoneNumber: '012 778 899',
    partyCardNo: '150681001',
    dob: '09/09/1979',
    age: 47,
    photoUrl: DEFAULT_AVATARS.maleWhitePartyShirt,
    appointedDate: '01/01/2021',
    responsibilities: 'ដឹកនាំការងារសាខាបក្ស និងរដ្ឋបាលភូមិគោកសណ្ដែក',
    status: 'active',
    remarks: 'មេភូមិគោកសណ្ដែក'
  }
];

export const BANTEAY_STOUNG_VILLAGES = [
  'ភូមិរលួស',
  'ភូមិស្រោមដែក',
  'ភូមិបន្ទាយស្ទោង',
  'ភូមិតាម៉ើ',
  'ភូមិបវែង',
  'ភូមិដូនប៉ុក',
  'ភូមិបេង',
  'ភូមិពោធនិ៍',
  'ភូមិពន្លាជ័យ',
  'ភូមិចន្លុះ',
  'ភូមិស្លាករ',
  'ភូមិឈើទាល',
  'ភូមិកុកគ្រោះ',
  'ភូមិចំបកបញ្ញា',
  'ភូមិគោកសណ្ដែក'
];
