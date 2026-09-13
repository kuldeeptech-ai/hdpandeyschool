import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { Search, GraduationCap, ShieldCheck, Award, FileText, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface PublicSearchProps {
  schoolSettings: SchoolSettings;
  onSearch: (rollOrAdmission: string) => Promise<boolean>;
  errorMessage: string | null;
  isLoading: boolean;
  onSwitchToAdmin: () => void;
}

export const PublicSearch: React.FC<PublicSearchProps> = ({
  schoolSettings,
  onSearch,
  errorMessage,
  isLoading,
  onSwitchToAdmin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    onSearch(searchTerm.trim());
  };

  const handleQuickSelect = (roll: string) => {
    setSearchTerm(roll);
    onSearch(roll);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2b48]/5 via-slate-50 to-slate-100 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="bg-[#0f2b48] text-white py-3 px-4 sm:px-8 border-b-4 border-[#b8860b] shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {schoolSettings.logoUrl && (
              <div className="w-12 h-12 bg-white rounded-full p-1 flex items-center justify-center shadow-inner">
                <img
                  src={schoolSettings.logoUrl}
                  alt={schoolSettings.schoolName}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight leading-none uppercase">
                {schoolSettings.schoolName}
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {schoolSettings.address}
              </p>
            </div>
          </div>

          <button
            onClick={onSwitchToAdmin}
            className="text-xs font-semibold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-all flex items-center gap-1.5"
            title="School Staff / Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#fcd34d]" />
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      {/* Main Search Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        
        {/* Verification Card */}
        <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#0f2b48] to-[#1b4975] text-white p-6 sm:p-8 text-center relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-xs mb-3 border border-white/20">
              <GraduationCap className="w-8 h-8 text-[#ffd54f]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
              ONLINE RESULT PORTAL
            </h2>
            <p className="text-slate-200 text-sm mt-1 max-w-md mx-auto">
              Official academic performance marksheets for Session {schoolSettings.session}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs text-amber-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Half-Yearly & Annual Examination Results Published</span>
            </div>
          </div>

          {/* Search Form */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
              <div>
                <label
                  htmlFor="search-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Enter Roll Number or Admission Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    id="search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="e.g. 17 or ADM-2024-0017"
                    className="w-full pl-10 pr-36 py-3 text-base font-bold text-slate-900 border-2 border-slate-300 rounded-lg focus:border-[#0f2b48] focus:ring-2 focus:ring-[#0f2b48]/20 transition-all outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !searchTerm.trim()}
                    className="absolute right-1.5 px-5 py-2 bg-[#0f2b48] hover:bg-[#1b4975] disabled:bg-slate-300 text-white text-sm font-bold rounded-md shadow transition-all flex items-center gap-1.5"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>CHECK RESULT</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded text-red-800 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">RESULT NOT FOUND: </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Quick Demo Selector for Examiners & Testing */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-semibold mb-2">
                  Quick Demo Students (Click to test instantly):
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('17')}
                    className="px-2.5 py-1 text-xs font-bold bg-[#e8f0fe] hover:bg-blue-100 text-[#0f2b48] rounded border border-blue-200 transition-colors flex items-center gap-1"
                  >
                    <span>★ Roll No. 17 (Priya Sharma - Top Rank)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('18')}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 transition-colors"
                  >
                    Roll No. 18 (Aman Verma)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('21')}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 transition-colors"
                  >
                    Roll No. 21 (Sneha Gupta)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect('25')}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-200 transition-colors"
                  >
                    Roll No. 25 (Mohammad Tariq)
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Features / Notice Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#b8860b]" />
              <span className="font-semibold">Official Academic Gradebook</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <span className="font-semibold">Standard A4 Printable PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold">Digitally Signed & Verified</span>
            </div>
          </div>
        </div>

        {/* School Management Details */}
        <div className="mt-8 text-center text-xs text-slate-500 font-medium">
          <p>{schoolSettings.schoolName}</p>
          <p className="mt-0.5">{schoolSettings.address}</p>
          <p className="mt-0.5">Managed by: {schoolSettings.managedBy} | Helpline: +91-{schoolSettings.mobile}</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          {schoolSettings.tagline}
        </p>
        <p className="mt-1">
          Academic Session {schoolSettings.session} • All Rights Reserved
        </p>
      </footer>
    </div>
  );
};
