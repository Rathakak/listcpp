'use client';

import React, { useState, useEffect } from 'react';
import { MemberRecord } from '@/lib/types';
import { X, Save, UserPlus, Calendar, IdCard, Home, Briefcase, FileText } from 'lucide-react';

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
  const [formData, setFormData] = useState<MemberRecord>(() => {
    if (initialData) return initialData;
    return {
      id: nextId,
      fullName: '',
      gender: 'ប',
      decimalAge: 30,
      age: 30,
      dob: '01/01/1995',
      idCardNo: '',
      necOffice: 'បឋមសិក្សាបឹងប្រិយ៍',
      communeCode: '69',
      officeNo: '0880',
      necOrderNo: '',
      houseNo: '0',
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
      let calculatedDecimal = prev.decimalAge;
      if (parts.length === 3) {
        const year = parseInt(parts[2].length === 4 ? parts[2] : parts[0], 10);
        if (!isNaN(year) && year > 1920 && year < 2026) {
          calculatedAge = 2026 - year;
          calculatedDecimal = parseFloat((calculatedAge + 0.3).toFixed(1));
        }
      }
      return {
        ...prev,
        dob: val,
        age: calculatedAge,
        decimalAge: calculatedDecimal,
      };
    });
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    onSave(formData);
    onClose();
  };

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
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                នាមត្រកូល-នាមខ្លួន (មេគ្រួសារ) *
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

            {/* Age & Decimal Age */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អាយុ
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  អាយុលំអៀង
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.decimalAge}
                  onChange={e => setFormData({ ...formData, decimalAge: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm"
                />
              </div>
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

            {/* Remarks / Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                ផ្សេងៗ / ស្ថានភាព
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

            {/* House No */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-slate-500" />
                លេខផ្ទះ
              </label>
              <input
                type="text"
                value={formData.houseNo}
                onChange={e => setFormData({ ...formData, houseNo: e.target.value })}
                placeholder="0"
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

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>រក្សាទុកទិន្នន័យ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
