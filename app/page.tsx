'use client';

import React, { useState, useEffect } from 'react';
import { MemberRecord, VillageStats, VitalEventRecord, GeneralPopulationStats, OrgLeaderRecord } from '@/lib/types';
import { initialMembers, initialVillageStats } from '@/lib/initialData';
import { initialVitalEvents, initialGeneralPopulation } from '@/lib/vitalInitialData';
import { initialOrgLeaders } from '@/lib/orgInitialData';
import SpreadsheetView from '@/components/SpreadsheetView';
import MemberModal from '@/components/MemberModal';
import StatsPanel from '@/components/StatsPanel';
import AgeGenderSummary from '@/components/AgeGenderSummary';
import OfficialPrintView from '@/components/OfficialPrintView';
import DemographicVitalReport from '@/components/DemographicVitalReport';
import OrgStructureView from '@/components/OrgStructureView';
import { X, BarChart3, Users } from 'lucide-react';

const STORAGE_KEY_MEMBERS = 'party_members_list_v1';
const STORAGE_KEY_STATS = 'party_village_stats_v1';
const STORAGE_KEY_VITAL_EVENTS = 'party_village_vital_events_v1';
const STORAGE_KEY_GEN_POP = 'party_village_gen_pop_v1';
const STORAGE_KEY_ORG_LEADERS = 'party_banteay_stoung_org_leaders_v1';

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
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed.teamLeader || parsed.teamLeader === 'នូវ នុច' || parsed.teamLeader === 'ផូ វុជ') {
            parsed.teamLeader = 'ផូ វុធ';
          }
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialVillageStats;
  });

  const [vitalEvents, setVitalEvents] = useState<VitalEventRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_VITAL_EVENTS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialVitalEvents;
  });

  const [genPopStats, setGenPopStats] = useState<GeneralPopulationStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_GEN_POP);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.villageTotalPopulation) return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialGeneralPopulation;
  });

  const [orgLeaders, setOrgLeaders] = useState<OrgLeaderRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_ORG_LEADERS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migrate old placeholder villages to new official villages if present
            const villageMigration: Record<string, string> = {
              'ភូមិបឹងប្រិយ៍': 'ភូមិបេង',
              'ភូមិគោកព្រេច': 'ភូមិកុកគ្រោះ',
              'ភូមិត្រពាំងជ័រ': 'ភូមិស្រោមដែក',
              'ភូមិកំពង់ក្តី': 'ភូមិតាម៉ើ',
              'ភូមិព្រៃតាត្រាវ': 'ភូមិបវែង'
            };
            const migrated = parsed.map((item: OrgLeaderRecord) => {
              if (item.villageName && villageMigration[item.villageName]) {
                const oldV = item.villageName;
                const newV = villageMigration[oldV];
                return {
                  ...item,
                  villageName: newV,
                  role: item.role ? item.role.replace(oldV, newV) : item.role,
                  responsibilities: item.responsibilities ? item.responsibilities.replace(oldV, newV) : item.responsibilities
                };
              }
              return item;
            });

            // Also merge any newly introduced village leaders that aren't in localStorage yet
            const existingIds = new Set(migrated.map((m: OrgLeaderRecord) => m.id));
            const missingLeaders = initialOrgLeaders.filter(initL => !existingIds.has(initL.id));
            if (missingLeaders.length > 0) {
              return [...migrated, ...missingLeaders];
            }
            return migrated;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialOrgLeaders;
  });

  const isLoaded = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // View state: 'spreadsheet' | 'print' | 'vitalReport' | 'orgStructure'
  const [currentView, setCurrentView] = useState<'spreadsheet' | 'print' | 'vitalReport' | 'orgStructure'>('spreadsheet');

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

  // Save vitalEvents to localStorage
  useEffect(() => {
    if (isLoaded && vitalEvents.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_VITAL_EVENTS, JSON.stringify(vitalEvents));
      } catch (e) {
        console.error('Failed to save vital events to localStorage', e);
      }
    }
  }, [vitalEvents, isLoaded]);

  // Save genPopStats to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY_GEN_POP, JSON.stringify(genPopStats));
      } catch (e) {
        console.error('Failed to save general pop stats to localStorage', e);
      }
    }
  }, [genPopStats, isLoaded]);

  // Save orgLeaders to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY_ORG_LEADERS, JSON.stringify(orgLeaders));
      } catch (e) {
        console.error('Failed to save org leaders to localStorage', e);
      }
    }
  }, [orgLeaders, isLoaded]);

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
    setRecords(initialMembers);
    setStats(initialVillageStats);
    setVitalEvents(initialVitalEvents);
    setGenPopStats(initialGeneralPopulation);
    setOrgLeaders(initialOrgLeaders);
    localStorage.removeItem(STORAGE_KEY_MEMBERS);
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_VITAL_EVENTS);
    localStorage.removeItem(STORAGE_KEY_GEN_POP);
    localStorage.removeItem(STORAGE_KEY_ORG_LEADERS);
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

  // If in Organizational Structure mode (រចនាសម្ព័ន្ធបក្ស មានរូបថត)
  if (currentView === 'orgStructure') {
    return (
      <OrgStructureView
        leaders={orgLeaders}
        onUpdateLeaders={setOrgLeaders}
        onBack={() => setCurrentView('spreadsheet')}
      />
    );
  }

  // If in Demographic & Vital Report mode (សម្រាល - មរណៈ)
  if (currentView === 'vitalReport') {
    return (
      <DemographicVitalReport
        records={records}
        stats={stats}
        vitalEvents={vitalEvents}
        genPopStats={genPopStats}
        onUpdateVitalEvents={setVitalEvents}
        onUpdateGenPopStats={setGenPopStats}
        onBack={() => setCurrentView('spreadsheet')}
      />
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
        onOpenVitalReport={() => setCurrentView('vitalReport')}
        onOpenOrgStructure={() => setCurrentView('orgStructure')}
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
              <StatsPanel records={records} stats={stats} onUpdateStats={setStats} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
