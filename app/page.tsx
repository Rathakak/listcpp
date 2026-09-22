'use client';

import React, { useState, useEffect } from 'react';
import { MemberRecord, VillageStats } from '@/lib/types';
import { initialMembers, initialVillageStats } from '@/lib/initialData';
import SpreadsheetView from '@/components/SpreadsheetView';
import MemberModal from '@/components/MemberModal';
import StatsPanel from '@/components/StatsPanel';
import AgeGenderSummary from '@/components/AgeGenderSummary';
import OfficialPrintView from '@/components/OfficialPrintView';
import { X, BarChart3, Users } from 'lucide-react';

const STORAGE_KEY_MEMBERS = 'party_members_list_v1';
const STORAGE_KEY_STATS = 'party_village_stats_v1';

export default function HomePage() {
  const [records, setRecords] = useState<MemberRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialMembers;
  });

  const [stats, setStats] = useState<VillageStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_STATS);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialVillageStats;
  });

  const isLoaded = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // View state: 'spreadsheet' | 'print'
  const [currentView, setCurrentView] = useState<'spreadsheet' | 'print'>('spreadsheet');

  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  // Save to localStorage when records change
  useEffect(() => {
    if (isLoaded && records.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(records));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }
  }, [records, isLoaded]);

  // Save stats to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
      } catch (e) {
        console.error('Failed to save stats to localStorage', e);
      }
    }
  }, [stats, isLoaded]);

  // Update a single member
  const handleUpdateRecord = (updated: MemberRecord) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  // Add new member
  const handleSaveMember = (newMember: MemberRecord) => {
    if (editingMember) {
      setRecords(prev => prev.map(r => r.id === newMember.id ? newMember : r));
    } else {
      setRecords(prev => [...prev, newMember]);
    }
    setEditingMember(null);
  };

  // Delete a member
  const handleDeleteRecord = (id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  // Delete multiple members
  const handleDeleteMultiple = (ids: number[]) => {
    setRecords(prev => prev.filter(r => !ids.includes(r.id)));
  };

  // Reset data to initial 265 members
  const handleResetData = () => {
    if (confirm('តើអ្នកពិតជាចង់កំណត់ទិន្នន័យឡើងវិញដូចក្នុងឯកសារដើម (265 នាក់) មែនទេ?')) {
      setRecords(initialMembers);
      setStats(initialVillageStats);
      localStorage.removeItem(STORAGE_KEY_MEMBERS);
      localStorage.removeItem(STORAGE_KEY_STATS);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 font-kantumruy">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">កំពុងដំណើរការទិន្នន័យ Google Sheets...</p>
        </div>
      </div>
    );
  }

  // If in Official Print view mode
  if (currentView === 'print') {
    return (
      <OfficialPrintView
        records={records}
        stats={stats}
        onBack={() => setCurrentView('spreadsheet')}
      />
    );
  }

  return (
    <main className="h-screen flex flex-col font-kantumruy overflow-hidden">
      {/* Google Sheets Primary Workspace */}
      <SpreadsheetView
        records={records}
        stats={stats}
        onUpdateRecord={handleUpdateRecord}
        onAddRecord={() => {
          setEditingMember(null);
          setIsMemberModalOpen(true);
        }}
        onDeleteRecord={handleDeleteRecord}
        onDeleteMultiple={handleDeleteMultiple}
        onResetData={handleResetData}
        onOpenStats={() => setIsStatsModalOpen(true)}
        onOpenPrint={() => setCurrentView('print')}
        onOpenAgeSummary={() => setIsAgeModalOpen(true)}
      />

      {/* Add / Edit Member Modal */}
      <MemberModal
        key={editingMember ? `edit-${editingMember.id}` : `new-${records.length}`}
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        initialData={editingMember}
        nextId={records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1}
      />

      {/* Age & Gender Breakdown Modal (សរុបស្រី-ប្រុសតាមអាយុ) */}
      {isAgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  តារាងសរុបសមាជិក ស្រី និង ប្រុស តាមក្រុមអាយុ
                </h3>
              </div>
              <button
                onClick={() => setIsAgeModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              <AgeGenderSummary records={records} />
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary Modal (Page 13) */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">
                  តារាងសង្ខេបស្ថិតិទិន្នន័យបក្ស និង គ.ជ.ប
                </h3>
              </div>
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <StatsPanel records={records} stats={stats} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
