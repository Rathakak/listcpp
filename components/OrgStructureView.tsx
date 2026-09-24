'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  OrgLeaderRecord, 
  OrgRoleCategory 
} from '@/lib/types';
import { 
  DEFAULT_AVATARS, 
  BANTEAY_STOUNG_VILLAGES 
} from '@/lib/orgInitialData';
import TacteingDivider from './TacteingDivider';
import { exportOrgLeadersToExcel } from '@/lib/spreadsheetHelpers';
import { 
  Users, UserCheck, ArrowLeft, Printer, Download, Plus, 
  Edit3, Trash2, Camera, Search, Filter, Phone, 
  ShieldCheck, Award, Building2, MapPin, ChevronRight,
  Layers, LayoutGrid, Table, Check, X, Upload, Sparkles,
  Calendar, RotateCcw, AlertTriangle
} from 'lucide-react';

interface OrgStructureViewProps {
  leaders: OrgLeaderRecord[];
  onUpdateLeaders: (leaders: OrgLeaderRecord[]) => void;
  onBack: () => void;
}

export default function OrgStructureView({
  leaders,
  onUpdateLeaders,
  onBack
}: OrgStructureViewProps) {
  // Views: 'tree' | 'cards' | 'table' | 'print'
  const [activeView, setActiveView] = useState<'tree' | 'cards' | 'table' | 'print'>('tree');
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'commune' | 'village' | 'working_group'>('all');
  const [villageFilter, setVillageFilter] = useState<string>('all');

  // Modals
  const [editingLeader, setEditingLeader] = useState<OrgLeaderRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [photoModalLeader, setPhotoModalLeader] = useState<OrgLeaderRecord | null>(null);

  // File Input Ref for photo uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khmer Date Helper
  const khmerMonths = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  const toKhmerNum = (num: number | string): string => {
    return String(num).split('').map(char => {
      const d = parseInt(char, 10);
      return !isNaN(d) ? khmerDigits[d] : char;
    }).join('');
  };

  const currentDate = new Date();
  const currentKhmerMonth = khmerMonths[currentDate.getMonth()] || 'កញ្ញា';
  const currentKhmerYear = toKhmerNum(currentDate.getFullYear());

  // Filtered Leaders
  const filteredLeaders = useMemo(() => {
    return leaders.filter(leader => {
      const matchesSearch = 
        leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leader.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (leader.villageName && leader.villageName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (leader.phoneNumber && leader.phoneNumber.includes(searchTerm)) ||
        (leader.partyCardNo && leader.partyCardNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLevel = levelFilter === 'all' || leader.level === levelFilter;
      const matchesVillage = villageFilter === 'all' || leader.villageName === villageFilter;

      return matchesSearch && matchesLevel && matchesVillage;
    });
  }, [leaders, searchTerm, levelFilter, villageFilter]);

  // Hierarchical groups for Tree view
  const communePresident = leaders.find(l => l.roleCategory === 'commune_president');
  const communeVicePresidents = leaders.filter(l => l.roleCategory === 'commune_vice_president');
  const communePermanentMembers = leaders.filter(l => l.roleCategory === 'commune_permanent_member');
  const communeMembers = leaders.filter(l => l.roleCategory === 'commune_member');
  const workingGroupLeaders = leaders.filter(l => l.level === 'working_group');
  
  // Village groups
  const roluosLeaders = leaders.filter(l => l.villageName === 'ភូមិរលួស');
  const otherVillagesLeaders = leaders.filter(l => l.level === 'village' && l.villageName !== 'ភូមិរលួស');

  // Delete Confirmation State & Toast Notifications (Iframe-safe, no browser blocking)
  const [leaderToDelete, setLeaderToDelete] = useState<OrgLeaderRecord | null>(null);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoModalLeader) return;

    if (file.size > 3 * 1024 * 1024) {
      setPhotoUploadError('សូមជ្រើសរើសរូបថតដែលមានទំហំតូចជាង 3MB');
      setTimeout(() => setPhotoUploadError(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateLeaderPhoto(photoModalLeader.id, result);
        setPhotoModalLeader(null);
        setDeleteSuccessToast(`បានប្តូររូបថតរបស់ «${photoModalLeader.name}» ដោយជោគជ័យ!`);
        setTimeout(() => setDeleteSuccessToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateLeaderPhoto = (leaderId: string, newPhotoUrl: string) => {
    const updated = leaders.map(l => l.id === leaderId ? { ...l, photoUrl: newPhotoUrl } : l);
    onUpdateLeaders(updated);
  };

  // Handle Save (Add or Edit)
  const handleSaveLeader = (formData: Partial<OrgLeaderRecord>) => {
    if (editingLeader) {
      // Edit
      const updated = leaders.map(l => l.id === editingLeader.id ? { ...l, ...formData } as OrgLeaderRecord : l);
      onUpdateLeaders(updated);
      setEditingLeader(null);
      setDeleteSuccessToast(`បានកែប្រែព័ត៌មាន «${formData.name || editingLeader.name}» រួចរាល់!`);
      setTimeout(() => setDeleteSuccessToast(null), 3000);
    } else {
      // Add
      const newLeader: OrgLeaderRecord = {
        id: `leader-${Date.now()}`,
        name: formData.name || 'សមាជិកថ្មី',
        gender: formData.gender || 'ប',
        level: formData.level || 'village',
        villageName: formData.villageName || 'ភូមិរលួស',
        role: formData.role || 'សមាជិកសាខាបក្ស',
        roleCategory: formData.roleCategory || 'village_member',
        rankOrder: leaders.length + 1,
        phoneNumber: formData.phoneNumber || '',
        partyCardNo: formData.partyCardNo || '',
        dob: formData.dob || '',
        age: formData.age || undefined,
        photoUrl: formData.photoUrl || (formData.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt),
        appointedDate: formData.appointedDate || '',
        responsibilities: formData.responsibilities || '',
        status: formData.status || 'active',
        remarks: formData.remarks || ''
      };
      onUpdateLeaders([...leaders, newLeader]);
      setIsAddModalOpen(false);
      setDeleteSuccessToast(`បានបន្ថែម «${newLeader.name}» ទៅក្នុងរចនាសម្ព័ន្ធដោយជោគជ័យ!`);
      setTimeout(() => setDeleteSuccessToast(null), 3000);
    }
  };

  // Safe Delete Request (Opens in-app confirmation modal)
  const requestDeleteLeader = (leader: OrgLeaderRecord) => {
    setLeaderToDelete(leader);
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (!leaderToDelete) return;
    const deletedName = leaderToDelete.name;
    const targetId = leaderToDelete.id;
    onUpdateLeaders(leaders.filter(l => l.id !== targetId));
    if (editingLeader?.id === targetId) setEditingLeader(null);
    setLeaderToDelete(null);

    setDeleteSuccessToast(`បានលុបទិន្នន័យ «${deletedName}» ចេញពីរចនាសម្ព័ន្ធដោយជោគជ័យ!`);
    setTimeout(() => {
      setDeleteSuccessToast(null);
    }, 3500);
  };

  const handleCancelDelete = () => {
    setLeaderToDelete(null);
  };

  // Listen to Escape key for confirmation modal
  useEffect(() => {
    if (!leaderToDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLeaderToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leaderToDelete]);

  // Quick Photo Change Modal
  const openPhotoModal = (leader: OrgLeaderRecord) => {
    setPhotoModalLeader(leader);
  };

  return (
    <div id="org-structure-container" className="min-h-screen bg-slate-100 flex flex-col font-content text-slate-800">
      
      {/* Hidden File Input for Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Top Header & Navigation Bar (Hidden during print) */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white shadow-md border-b-2 border-amber-400 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Back Button & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="ត្រឡប់ទៅតារាងសមាជិកបក្សវិញ"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ត្រឡប់ក្រោយ</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-amber-300 shadow-sm bg-white shrink-0">
                <Image
                  src="/cpp-logo.png"
                  alt="CPP Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="font-moul text-xs sm:text-sm text-amber-300 tracking-wide flex items-center gap-2">
                  <span>រចនាសម្ព័ន្ធគណបក្សមូលដ្ឋានឃុំបន្ទាយស្ទោង (មានរូបថត)</span>
                  <span className="text-[10px] bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full font-bold font-sans">
                    {leaders.length} ថ្នាក់ដឹកនាំ
                  </span>
                </h1>
                <p className="text-[11px] text-blue-100 flex items-center gap-2">
                  <span>គណៈកម្មាធិការបក្សឃុំ & សាខាបក្សភូមិ • ស្រុកស្ទោង ខេត្តកំពង់ធំ</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: View Selectors & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* View Switcher */}
            <div className="bg-blue-950/60 p-1 rounded-lg border border-blue-700/50 flex items-center space-x-1">
              <button
                onClick={() => setActiveView('tree')}
                className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                  activeView === 'tree' ? 'bg-amber-400 text-blue-950 shadow-sm' : 'text-blue-200 hover:text-white'
                }`}
                title="ទម្រង់ដ្យាក្រាមរចនាសម្ព័ន្ធ"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ដ្យាក្រាមរចនាសម្ព័ន្ធ</span>
              </button>

              <button
                onClick={() => setActiveView('cards')}
                className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                  activeView === 'cards' ? 'bg-amber-400 text-blue-950 shadow-sm' : 'text-blue-200 hover:text-white'
                }`}
                title="ទម្រង់កាតផ្លូវការមានរូបថត"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">កាតមានរូបថត</span>
              </button>

              <button
                onClick={() => setActiveView('table')}
                className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                  activeView === 'table' ? 'bg-amber-400 text-blue-950 shadow-sm' : 'text-blue-200 hover:text-white'
                }`}
                title="តារាងលម្អិតរដ្ឋបាល"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">តារាងរដ្ឋបាល</span>
              </button>

              <button
                onClick={() => setActiveView('print')}
                className={`px-2.5 py-1.5 rounded flex items-center gap-1 font-semibold transition-all cursor-pointer ${
                  activeView === 'print' ? 'bg-amber-400 text-blue-950 shadow-sm' : 'text-blue-200 hover:text-white'
                }`}
                title="ទម្រង់បោះពុម្ព A4 ផ្លូវការ"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">បោះពុម្ព A4</span>
              </button>
            </div>

            {/* Add Leader Button */}
            <button
              onClick={() => { setEditingLeader(null); setIsAddModalOpen(true); }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>បន្ថែមថ្នាក់ដឹកនាំ</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={() => exportOrgLeadersToExcel(leaders)}
              className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 border border-white/20 transition-colors cursor-pointer"
              title="ទាញយកជា Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">Excel</span>
            </button>

            {/* Quick Print Button */}
            <button
              onClick={() => window.print()}
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="បោះពុម្ពឯកសារផ្លូវការ"
            >
              <Printer className="w-4 h-4" />
              <span>បោះពុម្ព</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-blue-950/80 px-4 py-2 border-t border-blue-800/60">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ, តួនាទី, ភូមិ, លេខទូរស័ព្ទ..."
                className="w-full pl-8 pr-3 py-1 rounded bg-blue-900/60 border border-blue-700/80 text-white placeholder-blue-300/60 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-blue-200 text-[11px]">កម្រិត ៖</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                  className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-white text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all">កម្រិតទាំងអស់ ({leaders.length})</option>
                  <option value="commune">ថ្នាក់ឃុំបន្ទាយស្ទោង ({leaders.filter(l => l.level === 'commune').length})</option>
                  <option value="working_group">ក្រុមការងារចុះជួយ ({leaders.filter(l => l.level === 'working_group').length})</option>
                  <option value="village">ថ្នាក់សាខាបក្សភូមិ ({leaders.filter(l => l.level === 'village').length})</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-blue-200 text-[11px]">ភូមិ ៖</span>
                <select
                  value={villageFilter}
                  onChange={(e) => setVillageFilter(e.target.value)}
                  className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-white text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all">ភូមិទាំងអស់</option>
                  {BANTEAY_STOUNG_VILLAGES.map(v => (
                    <option key={v} value={v}>
                      {v} ({leaders.filter(l => l.villageName === v).length})
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm || levelFilter !== 'all' || villageFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setLevelFilter('all'); setVillageFilter('all'); }}
                  className="text-amber-300 hover:text-amber-200 flex items-center gap-1 text-[11px] underline ml-2"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>សម្អាតចម្រាញ់</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 print:p-0 print:max-w-none">

        {/* ==================================================== */}
        {/* VIEW 1: ORGANIZATIONAL TREE DIAGRAM (ដ្យាក្រាមរចនាសម្ព័ន្ធ) */}
        {/* ==================================================== */}
        {activeView === 'tree' && (
          <div className="space-y-8 print:hidden animate-fade-in">

            {/* Tree Section I: Commune Base Committee Leader */}
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-5 py-1.5 rounded-full text-xs font-moul shadow-md border border-amber-400 mb-4">
                <Building2 className="w-4 h-4 text-amber-300" />
                <span>គណៈកម្មាធិការគណបក្សមូលដ្ឋានឃុំបន្ទាយស្ទោង</span>
              </div>

              {communePresident && (
                <div className="relative group">
                  <div className="w-72 sm:w-80 bg-white rounded-xl shadow-lg border-2 border-amber-400 overflow-hidden text-center transition-transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-2 px-3 flex items-center justify-between">
                      <span className="font-moul text-[11px] text-amber-300">ប្រធានគណបក្សឃុំ (មេឃុំ)</span>
                      <span className="text-[10px] bg-amber-400 text-blue-950 font-bold px-1.5 py-0.5 rounded">ថ្នាក់ទី១</span>
                    </div>

                    <div className="p-4 flex flex-col items-center">
                      <div className="relative w-24 h-28 rounded-lg overflow-hidden border-2 border-blue-900 shadow-md mb-2 bg-slate-100 group/avatar">
                        <img
                          src={communePresident.photoUrl || DEFAULT_AVATARS.maleFormalBlue}
                          alt={communePresident.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <button
                          onClick={() => openPhotoModal(communePresident)}
                          className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[10px]"
                          title="ចុចដើម្បីប្តូររូបថត"
                        >
                          <Camera className="w-5 h-5 mb-1 text-amber-300" />
                          <span>ប្តូររូប</span>
                        </button>
                      </div>

                      <h3 className="font-moul text-base text-blue-950 mb-0.5">
                        លោក {communePresident.name}
                      </h3>
                      <p className="text-xs font-semibold text-rose-700 mb-1">
                        {communePresident.role}
                      </p>
                      
                      <div className="text-[11px] text-slate-600 space-y-0.5 w-full pt-2 border-t border-slate-100">
                        {communePresident.phoneNumber && (
                          <p className="flex items-center justify-center gap-1 font-sans text-slate-700">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{communePresident.phoneNumber}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 italic line-clamp-2">
                          {communePresident.responsibilities}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 w-full justify-center">
                        <button
                          onClick={() => setEditingLeader(communePresident)}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>កែប្រែ</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => openPhotoModal(communePresident)}
                          className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>រូបថត</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vertical connector line */}
              <div className="w-0.5 h-8 bg-blue-400"></div>

              {/* Level 2: Commune Vice Presidents */}
              <div className="relative flex flex-wrap justify-center gap-6 sm:gap-10">
                {communeVicePresidents.map(vp => (
                  <div key={vp.id} className="w-64 sm:w-72 bg-white rounded-xl shadow-md border border-blue-300 overflow-hidden text-center transition-transform hover:-translate-y-1">
                    <div className="bg-blue-800 text-white py-1.5 px-3 flex items-center justify-between text-[11px]">
                      <span className="font-moul text-amber-300">{vp.role.includes('១') ? 'អនុប្រធានទី១' : 'អនុប្រធានទី២'}</span>
                      <span className="text-[10px] bg-blue-950 px-1.5 py-0.5 rounded text-blue-200">ឃុំ</span>
                    </div>

                    <div className="p-3 flex flex-col items-center">
                      <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-blue-800 shadow-sm mb-2 bg-slate-100 group/avatar">
                        <img
                          src={vp.photoUrl || (vp.gender === 'ស' ? DEFAULT_AVATARS.femaleFormalNavy : DEFAULT_AVATARS.maleWhitePartyShirt)}
                          alt={vp.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <button
                          onClick={() => openPhotoModal(vp)}
                          className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[10px]"
                        >
                          <Camera className="w-4 h-4 mb-0.5 text-amber-300" />
                          <span>ប្តូររូប</span>
                        </button>
                      </div>

                      <h4 className="font-moul text-sm text-blue-900">
                        {vp.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {vp.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-700 mb-1">{vp.role}</p>
                      
                      {vp.phoneNumber && (
                        <p className="text-[10px] font-sans text-slate-600 flex items-center gap-1 mb-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{vp.phoneNumber}</span>
                        </p>
                      )}

                      <p className="text-[10px] text-slate-500 line-clamp-2 px-1 mb-2">
                        {vp.responsibilities}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 w-full justify-center text-[10px]">
                        <button
                          onClick={() => setEditingLeader(vp)}
                          className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>កែប្រែ</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => openPhotoModal(vp)}
                          className="text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>រូបថត</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => requestDeleteLeader(vp)}
                          className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>លុប</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connector line */}
              <div className="w-0.5 h-8 bg-blue-300"></div>

              {/* Level 3: Commune Permanent Committee Members */}
              <div className="bg-slate-200/80 p-4 rounded-2xl border border-slate-300 w-full max-w-5xl">
                <div className="text-center mb-3">
                  <span className="text-xs font-moul text-blue-900 bg-white px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
                    សមាជិកអចិន្ត្រៃយ៍ និងគណៈកម្មាធិការបក្សឃុំបន្ទាយស្ទោង
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[...communePermanentMembers, ...communeMembers].map(member => (
                    <div key={member.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs flex items-center space-x-3 hover:shadow-md transition-shadow">
                      <div className="relative w-14 h-16 rounded overflow-hidden border border-slate-300 shrink-0 bg-slate-100 group/avatar">
                        <img
                          src={member.photoUrl || (member.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                          alt={member.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <button
                          onClick={() => openPhotoModal(member)}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                          title="ប្តូររូបថត"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h5 className="font-moul text-xs text-blue-900 truncate">
                          {member.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {member.name}
                        </h5>
                        <p className="text-[10px] text-slate-700 font-semibold line-clamp-1">{member.role}</p>
                        {member.phoneNumber && (
                          <p className="text-[10px] font-sans text-slate-500 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{member.phoneNumber}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                          <button
                            onClick={() => setEditingLeader(member)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            កែប្រែ
                          </button>
                          <span className="text-slate-300 text-[9px]">•</span>
                          <button
                            onClick={() => openPhotoModal(member)}
                            className="text-amber-600 hover:underline cursor-pointer"
                          >
                            រូបថត
                          </button>
                          <span className="text-slate-300 text-[9px]">•</span>
                          <button
                            onClick={() => requestDeleteLeader(member)}
                            className="text-rose-600 hover:underline cursor-pointer"
                          >
                            លុប
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Tree Section II: Working Group (ក្រុមការងារចុះជួយភូមិរលួស - ឃុំបន្ទាយស្ទោង) */}
            {workingGroupLeaders.length > 0 && (
              <div className="pt-4 border-t-2 border-dashed border-amber-300">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white px-4 py-1.5 rounded-full text-xs font-moul shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-200" />
                    <span>ក្រុមការងារគណបក្សចុះជួយមូលដ្ឋានភូមិរលួស (ឃុំបន្ទាយស្ទោង)</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                  {workingGroupLeaders.map(wg => (
                    <div key={wg.id} className="w-72 bg-amber-50/80 rounded-xl p-4 border border-amber-300 shadow-sm flex items-center space-x-3.5 hover:shadow-md transition-shadow">
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-amber-500 shrink-0 bg-white group/avatar">
                        <img
                          src={wg.photoUrl || (wg.gender === 'ស' ? DEFAULT_AVATARS.femaleFormalNavy : DEFAULT_AVATARS.maleFormalBlue)}
                          alt={wg.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <button
                          onClick={() => openPhotoModal(wg)}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-amber-300" />
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">ក្រុមការងារ</span>
                        <h4 className="font-moul text-xs text-amber-950 mt-1 truncate">
                          {wg.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {wg.name}
                        </h4>
                        <p className="text-[11px] font-semibold text-rose-800 line-clamp-1">{wg.role}</p>
                        {wg.phoneNumber && (
                          <p className="text-[10px] font-sans text-slate-700 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{wg.phoneNumber}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                          <button onClick={() => setEditingLeader(wg)} className="text-blue-700 hover:underline cursor-pointer">
                            កែប្រែ
                          </button>
                          <span className="text-slate-300">•</span>
                          <button onClick={() => openPhotoModal(wg)} className="text-amber-700 hover:underline cursor-pointer">
                            ប្តូររូបថត
                          </button>
                          <span className="text-slate-300">•</span>
                          <button onClick={() => requestDeleteLeader(wg)} className="text-rose-600 hover:underline cursor-pointer">
                            លុប
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tree Section III: Village Party Branches (សាខាបក្សភូមិ ពិសេសភូមិរលួស) */}
            <div className="pt-6 border-t-2 border-blue-200">
              
              {/* Special Spotlight: ភូមិរលួស (Our Base Village) */}
              <div className="bg-white rounded-2xl p-5 border-2 border-blue-500 shadow-md mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-blue-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h3 className="font-moul text-sm text-blue-900">
                      សាខាគណបក្សភូមិរលួស (រចនាសម្ព័ន្ធមូលដ្ឋានភូមិរលួស)
                    </h3>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full">
                    សមាជិកបក្ស ២៦៥ នាក់ • មេភូមិ លោក ជា ជី
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roluosLeaders.map(leader => (
                    <div 
                      key={leader.id} 
                      className={`p-3.5 rounded-xl border transition-all ${
                        leader.roleCategory === 'village_president' 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-400 shadow-sm'
                          : leader.roleCategory === 'village_vice_president'
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white shadow-2xs group/avatar">
                          <img
                            src={leader.photoUrl || (leader.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                            alt={leader.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <button
                            onClick={() => openPhotoModal(leader)}
                            className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-[9px]"
                            title="ប្តូររូបថត"
                          >
                            <Camera className="w-3.5 h-3.5 mb-0.5 text-amber-300" />
                            <span>ប្តូររូប</span>
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              leader.roleCategory === 'village_president'
                                ? 'bg-blue-600 text-white'
                                : leader.roleCategory === 'village_vice_president'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {leader.roleCategory === 'village_president' ? 'មេភូមិ / ប្រធានសាខា' : leader.roleCategory === 'village_vice_president' ? 'អនុប្រធាន' : 'សមាជិក'}
                            </span>
                            {leader.partyGroupNo && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                ក្រុមទី{toKhmerNum(leader.partyGroupNo)}
                              </span>
                            )}
                          </div>

                          <h4 className="font-moul text-xs text-slate-900 mt-1 truncate">
                            {leader.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leader.name}
                          </h4>
                          <p className="text-[11px] font-semibold text-blue-900 line-clamp-1">{leader.role}</p>

                          {leader.phoneNumber && (
                            <p className="text-[10px] font-sans text-slate-600 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{leader.phoneNumber}</span>
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-slate-200/60 text-[10px]">
                            <button onClick={() => setEditingLeader(leader)} className="text-blue-700 hover:underline flex items-center gap-1 cursor-pointer">
                              <Edit3 className="w-3 h-3" />
                              <span>កែប្រែ</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button onClick={() => openPhotoModal(leader)} className="text-amber-700 hover:underline flex items-center gap-1 cursor-pointer">
                              <Camera className="w-3 h-3" />
                              <span>រូបថត</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button onClick={() => requestDeleteLeader(leader)} className="text-rose-600 hover:underline cursor-pointer flex items-center gap-0.5">
                              <Trash2 className="w-3 h-3" />
                              <span>លុប</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Villages in Banteay Stoung Commune */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  <h3 className="font-moul text-xs sm:text-sm text-slate-900">
                    សាខាគណបក្សបណ្តាភូមិដទៃទៀត ក្នុងឃុំបន្ទាយស្ទោង
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {otherVillagesLeaders.map(leader => (
                    <div key={leader.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-3">
                        <div className="relative w-14 h-18 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-100 group/avatar">
                          <img
                            src={leader.photoUrl || (leader.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                            alt={leader.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <button
                            onClick={() => openPhotoModal(leader)}
                            className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                            title="ប្តូររូបថត"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300" />
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] bg-slate-100 text-blue-800 px-1.5 py-0.5 rounded font-bold border border-slate-200">
                            {leader.villageName}
                          </span>
                          <h5 className="font-moul text-xs text-slate-900 mt-1 truncate">
                            {leader.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leader.name}
                          </h5>
                          <p className="text-[10px] text-slate-600 font-semibold line-clamp-1">{leader.role}</p>
                          
                          {leader.phoneNumber && (
                            <p className="text-[10px] font-sans text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{leader.phoneNumber}</span>
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <button onClick={() => setEditingLeader(leader)} className="text-blue-700 hover:underline cursor-pointer">
                              កែប្រែ
                            </button>
                            <span className="text-slate-300">•</span>
                            <button onClick={() => openPhotoModal(leader)} className="text-amber-700 hover:underline cursor-pointer">
                              រូបថត
                            </button>
                            <span className="text-slate-300">•</span>
                            <button onClick={() => requestDeleteLeader(leader)} className="text-rose-600 hover:underline cursor-pointer">
                              លុប
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: OFFICIAL BADGES / CARDS GRID (កាតផ្លូវការមានរូបថត) */}
        {/* ==================================================== */}
        {activeView === 'cards' && (
          <div className="space-y-6 print:hidden animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-moul text-sm text-blue-950 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-700" />
                <span>បញ្ជីកាតផ្លូវការថ្នាក់ដឹកនាំគណបក្ស ({filteredLeaders.length} រូប)</span>
              </h2>
              <span className="text-xs text-slate-500">
                ចុចលើរូបថតដើម្បីប្តូរ ឬបញ្ចូលរូបថតផ្ទាល់ខ្លួន
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredLeaders.map(leader => (
                <div 
                  key={leader.id}
                  className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col group"
                >
                  {/* Card Header with CPP Ribbon */}
                  <div className={`p-2.5 text-white flex items-center justify-between text-xs ${
                    leader.level === 'commune' 
                      ? 'bg-gradient-to-r from-blue-900 to-indigo-900' 
                      : leader.level === 'working_group'
                      ? 'bg-gradient-to-r from-amber-700 to-amber-900'
                      : 'bg-gradient-to-r from-slate-800 to-blue-900'
                  }`}>
                    <span className="font-moul text-[10px] text-amber-300 truncate">
                      {leader.villageName || 'ឃុំបន្ទាយស្ទោង'}
                    </span>
                    <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                      {leader.level === 'commune' ? 'ថ្នាក់ឃុំ' : leader.level === 'working_group' ? 'ក្រុមការងារ' : 'ថ្នាក់ភូមិ'}
                    </span>
                  </div>

                  {/* Card Body with Portrait Photo */}
                  <div className="p-4 flex-1 flex flex-col items-center text-center">
                    
                    {/* Portrait Photo Container with Camera Hover Action */}
                    <div className="relative w-28 h-32 rounded-xl overflow-hidden border-2 border-blue-900 shadow-md mb-3 bg-slate-100 group/avatar">
                      <img
                        src={leader.photoUrl || (leader.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                        alt={leader.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <button
                        onClick={() => openPhotoModal(leader)}
                        className="absolute inset-0 bg-blue-950/70 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-xs font-semibold"
                        title="ចុចដើម្បីប្តូររូបថត"
                      >
                        <Camera className="w-5 h-5 mb-1 text-amber-300" />
                        <span>ប្តូររូបថត</span>
                      </button>

                      {/* Small CPP Gold Pin overlay on bottom corner */}
                      <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full overflow-hidden border border-amber-300 shadow-xs bg-white">
                        <Image
                          src="/cpp-logo.png"
                          alt="CPP Pin"
                          fill
                          sizes="20px"
                          className="object-contain"
                        />
                      </div>
                    </div>

                    {/* Official Name */}
                    <h3 className="font-moul text-sm text-blue-950 mb-0.5">
                      {leader.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leader.name}
                    </h3>
                    
                    {/* Official Role */}
                    <div className="bg-blue-50 text-blue-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200 mb-2 max-w-full truncate">
                      {leader.role}
                    </div>

                    {/* Contact & ID Info */}
                    <div className="w-full text-left text-[11px] space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                      {leader.phoneNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ទូរស័ព្ទ ៖</span>
                          <span className="font-sans font-semibold text-slate-800 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {leader.phoneNumber}
                          </span>
                        </div>
                      )}

                      {leader.partyCardNo && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">ប័ណ្ណបក្ស ៖</span>
                          <span className="font-sans text-slate-700">{leader.partyCardNo}</span>
                        </div>
                      )}

                      {leader.age && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">អាយុ ៖</span>
                          <span>{toKhmerNum(leader.age)} ឆ្នាំ</span>
                        </div>
                      )}

                      {leader.responsibilities && (
                        <p className="text-[10px] text-slate-500 italic line-clamp-2 pt-1">
                          {leader.responsibilities}
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Card Footer Actions */}
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setEditingLeader(leader)}
                      className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>កែប្រែ</span>
                    </button>

                    <button
                      onClick={() => openPhotoModal(leader)}
                      className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>រូបថត</span>
                    </button>

                    <button
                      onClick={() => requestDeleteLeader(leader)}
                      className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-100 rounded cursor-pointer transition-colors"
                      title="លុប"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 3: ADMINISTRATIVE SPREADSHEET TABLE (តារាងរដ្ឋបាល) */}
        {/* ==================================================== */}
        {activeView === 'table' && (
          <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden print:hidden animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-moul text-sm text-blue-950 flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-700" />
                <span>តារាងរដ្ឋបាលរចនាសម្ព័ន្ធថ្នាក់ដឹកនាំ ({filteredLeaders.length} នាក់)</span>
              </h2>
              <button
                onClick={() => exportOrgLeadersToExcel(filteredLeaders)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-blue-950 text-white sticky top-0 z-20 font-moul text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 text-center border-r border-blue-900 w-12">ល.រ</th>
                    <th className="py-2.5 px-3 text-center border-r border-blue-900 w-16">រូបថត</th>
                    <th className="py-2.5 px-3 border-r border-blue-900 min-w-[140px]">នាម និងគោត្តនាម</th>
                    <th className="py-2.5 px-3 text-center border-r border-blue-900 w-14">ភេទ</th>
                    <th className="py-2.5 px-3 text-center border-r border-blue-900 w-14">អាយុ</th>
                    <th className="py-2.5 px-3 border-r border-blue-900 min-w-[160px]">តួនាទីក្នុងបក្ស</th>
                    <th className="py-2.5 px-3 border-r border-blue-900 min-w-[130px]">អង្គភាព / ភូមិ</th>
                    <th className="py-2.5 px-3 border-r border-blue-900 min-w-[120px]">លេខទូរស័ព្ទ</th>
                    <th className="py-2.5 px-3 border-r border-blue-900 min-w-[130px]">លេខប័ណ្ណបក្ស</th>
                    <th className="py-2.5 px-3 border-r border-blue-900 min-w-[180px]">ភារកិច្ចទទួលបន្ទុក</th>
                    <th className="py-2.5 px-3 text-center w-24">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLeaders.map((leader, idx) => (
                    <tr key={leader.id} className="hover:bg-blue-50/60 transition-colors">
                      <td className="py-2 px-3 text-center font-sans font-bold text-slate-600 border-r border-slate-200">
                        {toKhmerNum(idx + 1)}
                      </td>
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        <div 
                          onClick={() => openPhotoModal(leader)}
                          className="relative w-10 h-12 mx-auto rounded overflow-hidden border border-slate-300 shadow-2xs cursor-pointer group bg-slate-100"
                          title="ចុចដើម្បីប្តូររូបថត"
                        >
                          <img
                            src={leader.photoUrl || (leader.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                            alt={leader.name}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Camera className="w-3 h-3 text-amber-300" />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-moul text-blue-950">
                        {leader.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leader.name}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-semibold">
                        {leader.gender === 'ស' ? 'ស្រី' : 'ប្រុស'}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-200 font-sans">
                        {leader.age ? toKhmerNum(leader.age) : '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-800">
                        {leader.role}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {leader.villageName || 'ឃុំបន្ទាយស្ទោង'}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-sans font-medium text-emerald-700">
                        {leader.phoneNumber || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-sans text-slate-600">
                        {leader.partyCardNo || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                        {leader.responsibilities || '-'}
                      </td>
                      <td className="py-2 px-3 text-center space-x-1">
                        <button
                          onClick={() => setEditingLeader(leader)}
                          className="p-1 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
                          title="កែប្រែ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openPhotoModal(leader)}
                          className="p-1 hover:bg-amber-100 text-amber-700 rounded cursor-pointer"
                          title="ប្តូររូបថត"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => requestDeleteLeader(leader)}
                          className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer transition-colors"
                          title="លុប"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 4: OFFICIAL A4 PRINT VIEW (ទម្រង់បោះពុម្ព A4 ផ្លូវការ) */}
        {/* ==================================================== */}
        {(activeView === 'print' || typeof window !== 'undefined') && (
          <div className={`${activeView === 'print' ? 'block' : 'hidden print:block'} bg-white max-w-[210mm] mx-auto p-8 rounded-lg shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0`}>
            
            {/* Official Print Header */}
            <div className="flex justify-between items-start mb-4 border-b pb-4 border-slate-300">
              {/* Left: Party Heading with Logo */}
              <div className="flex items-center space-x-3">
                <div className="relative w-14 h-14 shrink-0">
                  <Image
                    src="/cpp-logo.png"
                    alt="CPP Logo"
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-moul text-sm text-blue-950">គណបក្សប្រជាជនកម្ពុជា</h2>
                  <p className="font-moul text-[11px] text-blue-900">គណៈកម្មាធិការគណបក្សមូលដ្ឋានឃុំបន្ទាយស្ទោង</p>
                  <p className="text-[10px] text-slate-700">ស្រុកស្ទោង ខេត្តកំពង់ធំ</p>
                </div>
              </div>

              {/* Right: Party Motto */}
              <div className="text-center">
                <h3 className="font-moul text-xs text-slate-900 leading-tight">ឯករាជ្យ សន្តិភាព សេរីភាព ប្រជាធិបតេយ្យ</h3>
                <h4 className="font-moul text-[11px] text-slate-900 leading-tight mt-0.5">អព្យាក្រឹត្យ និងវឌ្ឍនភាពសង្គម</h4>
                <TacteingDivider className="w-24 sm:w-28 h-2 text-slate-900 mx-auto mt-1" />
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6">
              <h1 className="font-moul text-base text-blue-950 leading-relaxed">
                តារាងរចនាសម្ព័ន្ធថ្នាក់ដឹកនាំគណបក្សមូលដ្ឋានឃុំ និងភូមិ
              </h1>
              <p className="font-moul text-xs text-slate-800">
                ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង ខេត្តកំពង់ធំ
              </p>
              <p className="text-xs text-slate-600 mt-1">
                ប្រចាំ ខែ{currentKhmerMonth} ឆ្នាំ{currentKhmerYear}
              </p>
            </div>

            {/* Printable Table with Official Photos */}
            <div className="mb-6">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-moul text-[10px] text-slate-900">
                    <th className="py-2 px-2 text-center border border-slate-400 w-8">ល.រ</th>
                    <th className="py-2 px-2 text-center border border-slate-400 w-14">រូបថត</th>
                    <th className="py-2 px-3 border border-slate-400">នាម និងគោត្តនាម</th>
                    <th className="py-2 px-2 text-center border border-slate-400 w-10">ភេទ</th>
                    <th className="py-2 px-3 border border-slate-400">តួនាទីក្នុងបក្ស</th>
                    <th className="py-2 px-3 border border-slate-400">អង្គភាព / ភូមិ</th>
                    <th className="py-2 px-3 border border-slate-400">លេខទូរស័ព្ទ</th>
                    <th className="py-2 px-3 border border-slate-400">ភារកិច្ចទទួលបន្ទុក</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaders.map((leader, i) => (
                    <tr key={leader.id} className="border border-slate-400">
                      <td className="py-1.5 px-2 text-center font-sans font-bold border border-slate-400">
                        {toKhmerNum(i + 1)}
                      </td>
                      <td className="py-1 px-1 text-center border border-slate-400">
                        <div className="w-9 h-11 mx-auto rounded overflow-hidden border border-slate-300">
                          <img
                            src={leader.photoUrl || (leader.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                            alt={leader.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-400 font-moul text-slate-900">
                        {leader.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leader.name}
                      </td>
                      <td className="py-1.5 px-2 text-center border border-slate-400">
                        {leader.gender === 'ស' ? 'ស្រី' : 'ប្រុស'}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-400 font-semibold text-slate-800">
                        {leader.role}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-400">
                        {leader.villageName || 'ឃុំបន្ទាយស្ទោង'}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-400 font-sans">
                        {leader.phoneNumber || '-'}
                      </td>
                      <td className="py-1.5 px-3 border border-slate-400 text-[10px] text-slate-700">
                        {leader.responsibilities || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Section */}
            <div className="mt-8 pt-4 grid grid-cols-3 gap-4 text-center text-xs">
              {/* Working Group Leader */}
              <div>
                <p className="font-moul text-[11px] text-slate-900">ប្រធានក្រុមការងារចុះជួយភូមិ</p>
                <p className="font-semibold text-slate-700 text-[10px]">ក្រុមការងារគណបក្ស</p>
                <div className="h-16"></div>
                <p className="font-moul text-xs text-blue-950">លោក ផូ វុធ</p>
              </div>

              {/* Village Chief */}
              <div>
                <p className="font-moul text-[11px] text-slate-900">ប្រធានសាខាបក្សភូមិរលួស</p>
                <p className="font-semibold text-slate-700 text-[10px]">មេភូមិ</p>
                <div className="h-16"></div>
                <p className="font-moul text-xs text-blue-950">លោក ជា ជី</p>
              </div>

              {/* Commune Party President / Chief */}
              <div>
                <p className="font-moul text-[11px] text-slate-900">ប្រធានគណៈកម្មាធិការបក្សឃុំ</p>
                <p className="font-semibold text-slate-700 text-[10px]">មេឃុំបន្ទាយស្ទោង</p>
                <div className="h-16"></div>
                <p className="font-moul text-xs text-blue-950">
                  {communePresident?.name ? `លោក ${communePresident.name}` : 'លោក ហ៊ុន ហឿង'}
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT LEADER MODAL */}
      {/* ==================================================== */}
      {(isAddModalOpen || editingLeader) && (
        <LeaderEditModal
          leader={editingLeader}
          onClose={() => { setEditingLeader(null); setIsAddModalOpen(false); }}
          onSave={handleSaveLeader}
          onDelete={editingLeader ? () => {
            const target = editingLeader;
            setEditingLeader(null);
            requestDeleteLeader(target);
          } : undefined}
          onOpenPhotoModal={editingLeader ? () => openPhotoModal(editingLeader) : undefined}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL 2: PHOTO PICKER & UPLOAD MODAL (មានរូបថត) */}
      {/* ==================================================== */}
      {photoModalLeader && (
        <PhotoManagerModal
          leader={photoModalLeader}
          onClose={() => setPhotoModalLeader(null)}
          onSelectPreset={(presetUrl) => {
            updateLeaderPhoto(photoModalLeader.id, presetUrl);
            setPhotoModalLeader(null);
            setDeleteSuccessToast(`បានប្តូររូបថតរបស់ «${photoModalLeader.name}» ដោយជោគជ័យ!`);
            setTimeout(() => setDeleteSuccessToast(null), 3000);
          }}
          onTriggerUpload={() => fileInputRef.current?.click()}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL 3: CUSTOM CONFIRMATION MODAL FOR DELETING LEADER */}
      {/* (100% Reliable in iframe preview, replaces window.confirm) */}
      {/* ==================================================== */}
      {leaderToDelete && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-content animate-fade-in"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all animate-scale-up"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-rose-50 border-b border-rose-100 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-moul text-rose-950 leading-snug">
                  បញ្ជាក់ការលុបថ្នាក់ដឹកនាំ
                </h3>
                <p className="text-[11px] text-rose-700">រចនាសម្ព័ន្ធគណបក្សមូលដ្ឋានឃុំបន្ទាយស្ទោង</p>
              </div>
            </div>

            {/* Target Card Preview */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-15 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0">
                  <img
                    src={leaderToDelete.photoUrl || (leaderToDelete.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt)}
                    alt={leaderToDelete.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-moul text-xs text-slate-900 truncate">
                    {leaderToDelete.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leaderToDelete.name}
                  </h4>
                  <p className="text-[11px] font-semibold text-blue-900 line-clamp-1">{leaderToDelete.role}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {leaderToDelete.villageName || 'ឃុំបន្ទាយស្ទោង'} {leaderToDelete.phoneNumber ? `• ${leaderToDelete.phoneNumber}` : ''}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                តើលោកអ្នកពិតជាចង់លុបទិន្នន័យលោក/លោកស្រី <strong className="text-slate-900 font-bold">«{leaderToDelete.name}»</strong> នេះចេញពីរចនាសម្ព័ន្ធគណបក្សមែនឬទេ? ទិន្នន័យដែលបានលុបនឹងមិនអាចត្រឡប់វិញបានឡើយ។
              </p>
            </div>

            {/* Buttons */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors"
              >
                បោះបង់
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>យល់ព្រមលុប</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Success */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-70 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in font-content">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">{deleteSuccessToast}</span>
          <button 
            onClick={() => setDeleteSuccessToast(null)} 
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Notification for Error */}
      {photoUploadError && (
        <div className="fixed bottom-6 right-6 z-70 bg-rose-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-rose-700 flex items-center gap-3 animate-fade-in font-content">
          <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">{photoUploadError}</span>
          <button 
            onClick={() => setPhotoUploadError(null)} 
            className="text-white/80 hover:text-white p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}

// ====================================================
// SUB-COMPONENT: PHOTO MANAGER MODAL (មានរូបថត)
// ====================================================
interface PhotoManagerModalProps {
  leader: OrgLeaderRecord;
  onClose: () => void;
  onSelectPreset: (url: string) => void;
  onTriggerUpload: () => void;
}

function PhotoManagerModal({
  leader,
  onClose,
  onSelectPreset,
  onTriggerUpload
}: PhotoManagerModalProps) {
  const [customUrl, setCustomUrl] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-content">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border-2 border-amber-400">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-amber-300" />
            <h3 className="font-moul text-sm text-amber-300">
              គ្រប់គ្រងរូបថតថ្នាក់ដឹកនាំ
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          
          {/* Current Photo Preview */}
          <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-blue-900 shadow-sm shrink-0 bg-white">
              <img
                src={leader.photoUrl || DEFAULT_AVATARS.maleFormalBlue}
                alt={leader.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <h4 className="font-moul text-sm text-blue-950">
                {leader.gender === 'ស' ? 'លោកស្រី' : 'លោក'} {leader.name}
              </h4>
              <p className="text-xs font-semibold text-rose-700">{leader.role}</p>
              <p className="text-[11px] text-slate-500">{leader.villageName || 'ឃុំបន្ទាយស្ទោង'}</p>
            </div>
          </div>

          {/* Option 1: Upload from Computer / Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ១. ផ្ទុករូបថតឡើងពីទូរស័ព្ទ ឬកុំព្យូទ័រ (Upload Photo) ៖
            </label>
            <button
              type="button"
              onClick={onTriggerUpload}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/60 hover:bg-blue-100/60 text-blue-800 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Upload className="w-5 h-5 text-blue-600" />
              <span>ជ្រើសរើសឯកសាររូបថត (JPG, PNG, WebP)</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-1">
              * រូបថតត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិក្នុងកម្មវិធី និងបង្ហាញភ្លាមៗ។
            </p>
          </div>

          {/* Option 2: Choose Presets with Formal CPP Badges */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              ២. ជ្រើសរើសរូបតំណាងផ្លូវការ (Official Portrait Presets) ៖
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              
              <button
                type="button"
                onClick={() => onSelectPreset(DEFAULT_AVATARS.maleFormalBlue)}
                className="flex flex-col items-center p-1.5 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-14 rounded overflow-hidden border border-slate-300 mb-1">
                  <img src={DEFAULT_AVATARS.maleFormalBlue} alt="ឈុតធំប្រុស" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-semibold text-slate-700 group-hover:text-blue-700">ឈុតធំប្រុស</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset(DEFAULT_AVATARS.femaleFormalNavy)}
                className="flex flex-col items-center p-1.5 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-14 rounded overflow-hidden border border-slate-300 mb-1">
                  <img src={DEFAULT_AVATARS.femaleFormalNavy} alt="ឈុតធំស្រ្តី" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-semibold text-slate-700 group-hover:text-blue-700">ឈុតធំស្រ្តី</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset(DEFAULT_AVATARS.maleWhitePartyShirt)}
                className="flex flex-col items-center p-1.5 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-14 rounded overflow-hidden border border-slate-300 mb-1">
                  <img src={DEFAULT_AVATARS.maleWhitePartyShirt} alt="អាវបក្សប្រុស" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-semibold text-slate-700 group-hover:text-blue-700">អាវបក្សប្រុស</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset(DEFAULT_AVATARS.femaleWhitePartyShirt)}
                className="flex flex-col items-center p-1.5 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-14 rounded overflow-hidden border border-slate-300 mb-1">
                  <img src={DEFAULT_AVATARS.femaleWhitePartyShirt} alt="អាវបក្សស្រ្តី" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-semibold text-slate-700 group-hover:text-blue-700">អាវបក្សស្រ្តី</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectPreset(DEFAULT_AVATARS.maleSecurityUniform)}
                className="flex flex-col items-center p-1.5 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="w-12 h-14 rounded overflow-hidden border border-slate-300 mb-1">
                  <img src={DEFAULT_AVATARS.maleSecurityUniform} alt="នគរបាល" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-semibold text-slate-700 group-hover:text-blue-700">សន្តិសុខ</span>
              </button>

            </div>
          </div>

          {/* Option 3: Direct URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ៣. ឬបញ្ចូលតំណភ្ជាប់រូបថត (Image URL) ៖
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 font-sans"
              />
              <button
                type="button"
                disabled={!customUrl.trim()}
                onClick={() => {
                  if (customUrl.trim()) onSelectPreset(customUrl.trim());
                }}
                className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                អនុវត្ត
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
          >
            បិទ
          </button>
        </div>

      </div>
    </div>
  );
}

// ====================================================
// SUB-COMPONENT: LEADER ADD / EDIT MODAL
// ====================================================
interface LeaderEditModalProps {
  leader: OrgLeaderRecord | null;
  onClose: () => void;
  onSave: (data: Partial<OrgLeaderRecord>) => void;
  onDelete?: () => void;
  onOpenPhotoModal?: () => void;
}

function LeaderEditModal({
  leader,
  onClose,
  onSave,
  onDelete,
  onOpenPhotoModal
}: LeaderEditModalProps) {
  const [formData, setFormData] = useState<Partial<OrgLeaderRecord>>({
    name: leader?.name || '',
    gender: leader?.gender || 'ប',
    level: leader?.level || 'village',
    villageName: leader?.villageName || 'ភូមិរលួស',
    role: leader?.role || 'សមាជិកសាខាបក្ស',
    roleCategory: leader?.roleCategory || 'village_member',
    phoneNumber: leader?.phoneNumber || '',
    partyCardNo: leader?.partyCardNo || '',
    idCardNo: leader?.idCardNo || '',
    dob: leader?.dob || '',
    age: leader?.age || undefined,
    responsibilities: leader?.responsibilities || '',
    partyGroupNo: leader?.partyGroupNo || undefined,
    status: leader?.status || 'active',
    remarks: leader?.remarks || '',
    photoUrl: leader?.photoUrl || DEFAULT_AVATARS.maleWhitePartyShirt
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setValidationError('សូមបញ្ចូលឈ្មោះថ្នាក់ដឹកនាំ');
      return;
    }
    if (!formData.role?.trim()) {
      setValidationError('សូមបញ្ចូលតួនាទីក្នុងបក្ស');
      return;
    }
    setValidationError(null);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-content">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border-2 border-blue-900 my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-5 h-5 text-amber-300" />
            <h3 className="font-moul text-sm text-amber-300">
              {leader ? `កែប្រែព័ត៌មាន ៖ ${leader.name}` : 'បន្ថែមថ្នាក់ដឹកនាំគណបក្សថ្មី'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2.5 shadow-xs animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Top Row: Photo Preview & Basic Info */}
          <div className="flex items-start space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="relative w-20 h-24 rounded-lg overflow-hidden border-2 border-blue-900 shadow-sm shrink-0 bg-white">
              <img
                src={formData.photoUrl || DEFAULT_AVATARS.maleWhitePartyShirt}
                alt="Preview"
                className="w-full h-full object-cover object-top"
              />
              {onOpenPhotoModal && (
                <button
                  type="button"
                  onClick={onOpenPhotoModal}
                  className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-[10px]"
                >
                  <Camera className="w-4 h-4 mb-0.5 text-amber-300" />
                  <span>ប្តូររូប</span>
                </button>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  នាម និងគោត្តនាម (ឈ្មោះពេញ) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ឧ. ជា ជី"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ភេទ</label>
                  <select
                    value={formData.gender || 'ប'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'ប' | 'ស' })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="ប">ប្រុស</option>
                    <option value="ស">ស្រី</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">អាយុ (ឆ្នាំ)</label>
                  <input
                    type="number"
                    value={formData.age || ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    placeholder="ឧ. 55"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-sans focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hierarchy Level & Village */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                កម្រិតរចនាសម្ព័ន្ធ <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.level || 'village'}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold focus:outline-hidden"
              >
                <option value="commune">គណៈកម្មាធិការគណបក្សឃុំបន្ទាយស្ទោង</option>
                <option value="working_group">ក្រុមការងារគណបក្សចុះជួយមូលដ្ឋាន</option>
                <option value="village">សាខាគណបក្សភូមិ (ថ្នាក់ភូមិ)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                អង្គភាព / ភូមិ <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.villageName || 'ភូមិរលួស'}
                onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold focus:outline-hidden"
              >
                <option value="ឃុំបន្ទាយស្ទោង">ឃុំបន្ទាយស្ទោង (ថ្នាក់ឃុំ)</option>
                {BANTEAY_STOUNG_VILLAGES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Role & Role Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                តួនាទីក្នុងបក្ស <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="ឧ. ប្រធានសាខាគណបក្សភូមិរលួស / មេភូមិ"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                ចំណាត់ថ្នាក់តួនាទី (សម្រាប់ដ្យាក្រាម)
              </label>
              <select
                value={formData.roleCategory || 'village_member'}
                onChange={(e) => setFormData({ ...formData, roleCategory: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
              >
                <option value="commune_president">ប្រធានបក្សឃុំ (Commune President)</option>
                <option value="commune_vice_president">អនុប្រធានបក្សឃុំ (Vice President)</option>
                <option value="commune_permanent_member">សមាជិកអចិន្ត្រៃយ៍បក្សឃុំ</option>
                <option value="commune_member">សមាជិកគណៈកម្មាធិការបក្សឃុំ</option>
                <option value="team_leader">ប្រធាន/សមាជិកក្រុមការងារចុះជួយ</option>
                <option value="village_president">ប្រធានសាខាបក្សភូមិ / មេភូមិ</option>
                <option value="village_vice_president">អនុប្រធានសាខាបក្សភូមិ</option>
                <option value="village_member">សមាជិកសាខាបក្សភូមិ</option>
                <option value="group_leader">ប្រធានក្រុមបក្សភូមិ</option>
              </select>
            </div>
          </div>

          {/* Phone & Party Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">លេខទូរស័ព្ទ</label>
              <input
                type="text"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="ឧ. 088 991 2233"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">លេខប័ណ្ណបក្ស</label>
              <input
                type="text"
                value={formData.partyCardNo || ''}
                onChange={(e) => setFormData({ ...formData, partyCardNo: e.target.value })}
                placeholder="ឧ. 150667101"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">ក្រុមបក្សទី (បើមាន)</label>
              <input
                type="number"
                value={formData.partyGroupNo || ''}
                onChange={(e) => setFormData({ ...formData, partyGroupNo: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                placeholder="ឧ. 1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans focus:outline-hidden"
              />
            </div>
          </div>

          {/* Responsibilities */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              ភារកិច្ចទទួលបន្ទុក
            </label>
            <textarea
              rows={2}
              value={formData.responsibilities || ''}
              onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              placeholder="ឧ. ដឹកនាំការងារទូទៅ សម្របសម្រួលកិច្ចការនយោបាយ និងកសាងបក្ស..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              សម្គាល់ផ្សេងៗ
            </label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="ឧ. មេភូមិរលួស / ជំទប់ទី១"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>លុបថ្នាក់ដឹកនាំនេះ</span>
              </button>
            ) : <div></div>}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                បោះបង់
              </button>

              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>រក្សាទុកទិន្នន័យ</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
