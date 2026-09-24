'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MemberRecord } from '@/lib/types';
import { 
  X, Save, UserPlus, Calendar, IdCard, Briefcase, FileText, 
  Camera, Upload, Trash2, Image as ImageIcon, Sliders, Check, Shield, Eye
} from 'lucide-react';
import { DEFAULT_AVATARS } from '@/lib/orgInitialData';
import PhotoEditorModal from './PhotoEditorModal';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: MemberRecord) => void;
  initialData?: MemberRecord | null;
  nextId: number;
}

export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  nextId,
}: MemberModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<MemberRecord>(() => {
    if (initialData) return initialData;
    return {
      id: nextId,
      fullName: '',
      gender: 'ប',
      photoUrl: undefined,
      age: 30,
      dob: '01/01/1995',
      idCardNo: '',
      partyCardNo: '',
      joinDate: '',
      necOffice: 'បឋមសិក្សាបឹងប្រិយ៍',
      communeCode: '69',
      officeNo: '0880',
      necOrderNo: '',
      partyGroup: 1,
      partyRole: 'សមាជិក',
      occupation: 'កសិករ',
      remarks: 'រៀបការ(មូលដ្ឋាន)',
    };
  });

  // Auto calculate age when DOB changes
  const handleDobChange = (val: string) => {
    setFormData(prev => {
      const parts = val.split(/[-/]/);
      let calculatedAge = prev.age;
      if (parts.length === 3) {
        const year = parseInt(parts[2].length === 4 ? parts[2] : parts[0], 10);
        if (!isNaN(year) && year > 1920 && year < 2026) {
          calculatedAge = 2026 - year;
        }
      }
      return {
        ...prev,
        dob: val,
        age: calculatedAge,
      };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)/i)) {
      setPhotoError('សូមជ្រើសរើសឯកសារប្រភេទរូបភាព (PNG, JPG ឬ WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('ទំហំរូបថតត្រូវតែតូចជាង 5MB');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, photoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropPhoto = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)/i)) {
      setPhotoError('សូមជ្រើសរើសឯកសារប្រភេទរូបភាព (PNG, JPG ឬ WEBP)');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, photoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const setPresetAvatar = () => {
    const defaultAvatar = formData.gender === 'ស'
      ? DEFAULT_AVATARS.femaleWhitePartyShirt
      : DEFAULT_AVATARS.maleWhitePartyShirt;
    setFormData(prev => ({ ...prev, photoUrl: defaultAvatar }));
    setPhotoError(null);
  };

  const clearPhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPhotoError(null);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    onSave(formData);
    onClose();
  };

  const activePhoto = formData.photoUrl || (formData.gender === 'ស' ? DEFAULT_AVATARS.femaleWhitePartyShirt : DEFAULT_AVATARS.maleWhitePartyShirt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div 
        id="member-form-modal"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <UserPlus className="w-5 h-5 text-emerald-200" />
            <h3 className="font-semibold text-lg">
              {initialData ? 'កែប្រែព័ត៌មានសមាជិក' : 'បន្ថែមសមាជិកបក្សថ្មី'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showPreview
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'bg-emerald-800 hover:bg-emerald-600 text-white border border-emerald-500'
              }`}
              title="មើលគំរូព័ត៌មានសមាជិក (Preview)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'ទម្រង់បញ្ចូល' : 'មើលគំរូ (Preview)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Member Card Preview (Active when showPreview is true) */}
          {showPreview ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-white rounded-xl p-5 border-2 border-amber-400 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                
                {/* Header of Party Card */}
                <div className="text-center pb-3 border-b border-amber-400/40 mb-4">
                  <div className="text-amber-300 font-moul text-sm sm:text-base leading-tight">
                    គណបក្សប្រជាជនកម្ពុជា
                  </div>
                  <div className="text-slate-300 text-xs font-medium">
                    សាខាបក្សភូមិរលួស ឃុំបន្ទាយស្ទោង ស្រុកស្ទោង
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Photo 3x4 */}
                  <div className="shrink-0 w-28 h-36 rounded-lg overflow-hidden border-2 border-amber-400 bg-white shadow-md relative">
                    <img
                      src={activePhoto}
                      alt={formData.fullName || 'រូបថត 3x4'}
                      className="w-full h-full object-cover object-top"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-amber-300 text-[9px] font-bold px-1 rounded">
                      3x4
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="flex-1 w-full grid grid-cols-2 gap-2 text-xs">
                    <div className="col-span-2 pb-1 border-b border-slate-700/60 flex items-center justify-between">
                      <span className="text-amber-300 font-bold text-base font-moul sm:text-lg">
                        {formData.fullName || '— (មិនទាន់មានឈ្មោះ)'}
                      </span>
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[11px] font-bold">
                        {formData.partyRole || 'សមាជិក'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">ភេទ: </span>
                      <strong className="text-white">{formData.gender === 'ស' ? 'ស្រី' : 'ប្រុស'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">អាយុ: </span>
                      <strong className="text-white">{formData.age} ឆ្នាំ</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">ថ្ងៃខែឆ្នាំកំណើត: </span>
                      <strong className="text-white font-mono">{formData.dob || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">ក្រុមបក្ស: </span>
                      <strong className="text-amber-300">ក្រុមទី {formData.partyGroup}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">លេខអត្តសញ្ញាណ: </span>
                      <strong className="text-white font-mono">{formData.idCardNo || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">លេខកាតបក្ស: </span>
                      <strong className="text-emerald-300 font-mono">{formData.partyCardNo || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">ថ្ងៃចូលបក្ស: </span>
                      <strong className="text-white font-mono">{formData.joinDate || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">មុខរបរ: </span>
                      <strong className="text-white">{formData.occupation || 'កសិករ'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">ស្ថានគ្រួសារ: </span>
                      <strong className="text-amber-200">{formData.remarks || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px]">កត់សម្គាល់: </span>
                      <strong className="text-slate-200">{formData.notes || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Table Row Preview */}
                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <div className="text-[11px] text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-300" />
                    <span>គំរូជួរដេកក្នុងតារាងបោះពុម្ព A4 ផ្លូវការ:</span>
                  </div>
                  <div className="overflow-x-auto bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-[10.5px]">
                    <div className="flex items-center gap-2 whitespace-nowrap text-slate-300">
                      <span className="text-amber-300 font-bold font-mono">#{formData.id}</span>
                      <span className="text-white font-bold">{formData.fullName || 'ឈ្មោះ'}</span>
                      <span>({formData.gender})</span>
                      <span>{formData.age} ឆ្នាំ</span>
                      <span className="font-mono text-slate-400">{formData.idCardNo || '—'}</span>
                      <span className="text-amber-300 font-bold">ក្រុម {formData.partyGroup}</span>
                      <span className="text-emerald-400">{formData.partyRole}</span>
                      <span className="text-sky-300">{formData.remarks}</span>
                      {formData.notes && <span className="text-purple-300">[{formData.notes}]</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <>
          {/* Top Section: Photo 3x4 & Identity */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* 3x4 Photo Container */}
            <div className="shrink-0 flex flex-col items-center">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropPhoto}
                className="relative w-28 h-37 sm:w-32 sm:h-42 rounded-lg border-2 border-dashed border-emerald-300 bg-white overflow-hidden shadow-xs flex items-center justify-center group"
              >
                <img
                  src={activePhoto}
                  alt="រូបថត 3x4"
                  className="w-full h-full object-cover object-top"
                />
                
                {/* 3x4 Badge */}
                <span className="absolute top-1 left-1 bg-black/70 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  រូបថត 3x4
                </span>

                {/* Hover overlay to change or edit */}
                <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1 text-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPhotoEditorOpen(true)}
                    className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>កែរូបថត 3x4</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3 h-3 text-amber-300" />
                    <span>ប្តូររូបថតថ្មី</span>
                  </button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Photo Action Controls & Guidance */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-sm text-slate-800">រូបថត (Portrait Photo)</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                អាចបង្ហោះរូបភាពប្រភេទ <strong>PNG</strong>, <strong>JPG</strong> ឬ <strong>JPEG</strong> សម្រាប់បោះពុម្ព និងបង្ហាញក្នុងបញ្ជីរាយនាម។
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>ជ្រើសរើសរូបថត</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPhotoEditorOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="កែសម្រួលរូបថត (ពង្រីក បង្វិល តម្រឹម 3x4 ឬកែពន្លឺ)"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>កែរូបថត</span>
                </button>

                <button
                  type="button"
                  onClick={setPresetAvatar}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-colors"
                  title="ប្រើប្រាស់រូបគំរូសម្លៀកបំពាក់បក្ស"
                >
                  រូបគំរូបក្ស
                </button>

                {formData.photoUrl && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>លុបរូប</span>
                  </button>
                )}
              </div>

              {photoError && (
                <p className="text-xs text-rose-600 font-semibold mt-1">{photoError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                នាមត្រកូល-នាមខ្លួន *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="ឧទាហរណ៍៖ ជា ជី"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ភេទ *
              </label>
              <div className="flex space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'ប'}
                    onChange={() => setFormData({ ...formData, gender: 'ប' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ប្រុស (ប)</span>
                </label>
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === 'ស'}
                    onChange={() => setFormData({ ...formData, gender: 'ស' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ស្រី (ស)</span>
                </label>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                ថ្ងៃខែឆ្នាំកំណើត (ថ្ងៃ/ខែ/ឆ្នាំ)
              </label>
              <input
                type="text"
                value={formData.dob}
                onChange={e => handleDobChange(e.target.value)}
                placeholder="10/08/1996"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
              />
            </div>

            {/* Age (Decimal Age removed) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                អាយុ
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm font-semibold"
              />
            </div>

            {/* National ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <IdCard className="w-3.5 h-3.5 text-slate-500" />
                លេខអត្តសញ្ញាណប័ណ្ណ
              </label>
              <input
                type="text"
                value={formData.idCardNo}
                onChange={e => setFormData({ ...formData, idCardNo: e.target.value })}
                placeholder="150667157 ឬ ឯអ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
              />
            </div>

            {/* Party Card ID (លេខអត្តបក្ស) */}
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                លេខអត្តបក្ស
              </label>
              <input
                type="text"
                value={formData.partyCardNo || ''}
                onChange={e => setFormData({ ...formData, partyCardNo: e.target.value })}
                placeholder="ឧទាហរណ៍៖ 0880-123..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm font-mono bg-emerald-50/20"
              />
            </div>

            {/* Date Joined Party (ថ្ងៃខែឆ្នាំចូលបក្ស) */}
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                ថ្ងៃខែឆ្នាំចូលបក្ស
              </label>
              <input
                type="text"
                value={formData.joinDate || ''}
                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                placeholder="ឧទាហរណ៍៖ 07/01/2015"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm bg-emerald-50/20"
              />
            </div>

            {/* Party Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ក្រុមបក្ស (១ - ២១)
              </label>
              <input
                type="number"
                min="1"
                max="21"
                value={formData.partyGroup}
                onChange={e => setFormData({ ...formData, partyGroup: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm font-semibold"
              />
            </div>

            {/* Party Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                តួនាទីក្នុងបក្ស
              </label>
              <select
                value={formData.partyRole}
                onChange={e => setFormData({ ...formData, partyRole: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm bg-white"
              >
                <option value="មេក្រុម">មេក្រុម</option>
                <option value="ប្រធានក្រុម">ប្រធានក្រុម</option>
                <option value="អនុទី១">អនុទី១</option>
                <option value="អនុទី២">អនុទី២</option>
                <option value="មេគ្រួសារ">មេគ្រួសារ</option>
                <option value="សមាជិក">សមាជិក</option>
                <option value="ប្រពន្ធ">ប្រពន្ធ</option>
              </select>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                មុខរបរ
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="កសិករ, មន្ត្រីរាជការ, ពាណិជ្ជករ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
              />
            </div>

            {/* Family Status (ស្ថានគ្រួសារ) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                ស្ថានគ្រួសារ
              </label>
              <select
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm bg-white"
              >
                <option value="រៀបការ(មូលដ្ឋាន)">រៀបការ(មូលដ្ឋាន)</option>
                <option value="រៀបការ(សំណាក់ស្រុក)">រៀបការ(សំណាក់ស្រុក)</option>
                <option value="នៅលីវ(មូលដ្ឋាន)">នៅលីវ(មូលដ្ឋាន)</option>
                <option value="នៅលីវ(សំណាក់ស្រុក)">នៅលីវ(សំណាក់ស្រុក)</option>
                <option value="ចាស់ជរា(មូលដ្ឋាន)">ចាស់ជរា(មូលដ្ឋាន)</option>
                <option value="រៀបការ(ផ្លាស់ទីលំនៅ)">រៀបការ(ផ្លាស់ទីលំនៅ)</option>
                <option value="ថៃ">ថៃ</option>
                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
              </select>
            </div>

            {/* Notes / Remarks (កត់សម្គាល់) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                កត់សម្គាល់
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ចំណាំ ឬកត់សម្គាល់បន្ថែម..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
              />
            </div>
          </div>

          {/* NEC គជប Section */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              ទិន្នន័យបញ្ជី គ.ជ.ប
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">ឈ្មោះការិយាល័យ</label>
                <input
                  type="text"
                  value={formData.necOffice}
                  onChange={e => setFormData({ ...formData, necOffice: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">កូដឃុំ</label>
                <input
                  type="text"
                  value={formData.communeCode}
                  onChange={e => setFormData({ ...formData, communeCode: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">លេខការិ</label>
                <input
                  type="text"
                  value={formData.officeNo}
                  onChange={e => setFormData({ ...formData, officeNo: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">ល.រ គជប</label>
                <input
                  type="text"
                  value={formData.necOrderNo}
                  onChange={e => setFormData({ ...formData, necOrderNo: e.target.value })}
                  placeholder="86"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                />
              </div>
            </div>
          </div>
          </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="មើលគំរូព័ត៌មាន (Preview)"
            >
              <Eye className="w-4 h-4 text-sky-700" />
              <span>{showPreview ? 'កែប្រែព័ត៌មាន' : 'មើលគំរូ (Preview)'}</span>
            </button>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{initialData ? 'រក្សាទុកការកែប្រែ' : 'រក្សាទុកទិន្នន័យ'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Photo Editor Modal */}
      <PhotoEditorModal
        isOpen={isPhotoEditorOpen}
        onClose={() => setIsPhotoEditorOpen(false)}
        imageSrc={activePhoto}
        onSave={(croppedDataUrl) => {
          setFormData((prev) => ({ ...prev, photoUrl: croppedDataUrl }));
        }}
      />
    </div>
  );
}
