'use client';

import React, { useState } from 'react';
import { MemberRecord, VillageStats } from '@/lib/types';
import { initialMembers, initialVillageStats } from '@/lib/initialData';
import OfficialPrintView from '@/components/OfficialPrintView';
import { useRouter } from 'next/navigation';

const STORAGE_KEY_MEMBERS = 'party_members_list_v1';
const STORAGE_KEY_STATS = 'party_village_stats_v1';

export default function PrintPage() {
  const router = useRouter();

  const [records] = useState<MemberRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
        if (savedMembers) {
          const parsed = JSON.parse(savedMembers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load members from localStorage', e);
      }
    }
    return initialMembers;
  });

  const [stats] = useState<VillageStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStats = localStorage.getItem(STORAGE_KEY_STATS);
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          if (parsed) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load stats from localStorage', e);
      }
    }
    return initialVillageStats;
  });

  const isClient = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 font-kantumruy">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm">កំពុងផ្ទុកឯកសារផ្លូវការ...</p>
        </div>
      </div>
    );
  }

  return (
    <OfficialPrintView
      records={records}
      stats={stats}
      onBack={() => router.push('/')}
    />
  );
}

