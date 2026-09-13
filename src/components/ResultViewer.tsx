import React, { useState } from 'react';
import { StudentResultData } from '../types';
import { AcademicMarksheet } from './AcademicMarksheet';
import { downloadMarksheetPdf, downloadMarksheetImage, printMarksheet } from '../utils/pdfGenerator';
import { Printer, Download, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Edit3, CheckCircle2, Image, Layers } from 'lucide-react';

interface ResultViewerProps {
  resultData: StudentResultData;
  onBackToSearch: () => void;
  onOpenAdminMarks?: (studentId: string) => void;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  resultData,
  onBackToSearch,
  onOpenAdminMarks,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeExamMode, setActiveExamMode] = useState<'half_yearly_only' | 'combined'>(
    resultData.examMode || resultData.school.examMode || 'combined'
  );

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportProgress('Starting PDF generation...');

    try {
      const modePrefix = activeExamMode === 'half_yearly_only' ? 'HalfYearly' : 'Final';
      const cleanStudentName = (resultData.student.name || 'Student').replace(/\s+/g, '_');
      const fileName = `${cleanStudentName}_${modePrefix}_Result_Roll_${resultData.student.rollNo}`;

      const success = await downloadMarksheetPdf('printable-marksheet', {
        fileName,
        onProgress: (status) => setExportProgress(status),
      });

      if (success) {
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(null);
        }, 1200);
      } else {
        setIsExporting(false);
        setExportProgress(null);
        setErrorMessage('PDF generate नहीं हो सका। कृपया "PRINT" बटन दबाकर "Save as PDF" चुनें।');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('PDF error in viewer:', err);
      setIsExporting(false);
      setExportProgress(null);
      setErrorMessage(err?.message || 'PDF export में त्रुटि आई। कृपया "PRINT" बटन का उपयोग करें।');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleDownloadImage = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportProgress('Generating HD Image (PNG)...');

    try {
      const modePrefix = activeExamMode === 'half_yearly_only' ? 'HalfYearly' : 'Final';
      const cleanStudentName = (resultData.student.name || 'Student').replace(/\s+/g, '_');
      const fileName = `${cleanStudentName}_${modePrefix}_Roll_${resultData.student.rollNo}`;

      const success = await downloadMarksheetImage('printable-marksheet', {
        fileName,
        onProgress: (status) => setExportProgress(status),
      });

      if (success) {
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(null);
        }, 1000);
      } else {
        setIsExporting(false);
        setExportProgress(null);
        setErrorMessage('Image download नहीं हो सका। कृपया PRINT या PDF विकल्प का उपयोग करें।');
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (err: any) {
      console.error('Image error in viewer:', err);
      setIsExporting(false);
      setExportProgress(null);
      setErrorMessage(err?.message || 'Image download में त्रुटि आई। कृपया "PRINT" बटन का उपयोग करें।');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handlePrint = () => {
    printMarksheet('printable-marksheet');
  };

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col">
      {/* Top Floating Action Bar (Hidden on Print) */}
      <nav className="no-print sticky top-0 z-30 bg-[#0f2b48] text-white px-3 py-2 shadow-md flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-[#b8860b]">
        {/* Left: Back Button & Student Info */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSearch}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK</span>
          </button>
          <div className="hidden sm:block text-xs font-bold text-slate-300 border-l border-white/20 pl-3">
            <span>Student: </span>
            <span className="text-white uppercase">{resultData.student.name}</span>
            <span className="ml-2 text-[#ffd54f]">Roll: {resultData.student.rollNo}</span>
          </div>
        </div>

        {/* Center: Result Exam Mode Switcher (Half-Yearly Only vs Combined) */}
        <div className="flex items-center bg-black/30 p-1 rounded-lg border border-white/15">
          <button
            onClick={() => setActiveExamMode('half_yearly_only')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeExamMode === 'half_yearly_only'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Show only Half-Yearly marksheet (no annual data)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Half-Yearly Only (अर्धवार्षिक)</span>
          </button>
          <button
            onClick={() => setActiveExamMode('combined')}
            className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeExamMode === 'combined'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Show combined Half-Yearly + Annual marksheet"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combined (Half + Annual)</span>
          </button>
        </div>

        {/* Right: Actions (Zoom, Print, Download PDF, Download PNG) */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden xl:flex items-center gap-1 bg-black/20 px-2 py-1 rounded border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
              className="p-1 hover:bg-white/10 rounded text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center text-xs font-bold text-amber-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(1))))}
              className="p-1 hover:bg-white/10 rounded text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {onOpenAdminMarks && (
            <button
              onClick={() => onOpenAdminMarks(resultData.student.id)}
              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Edit marks in Admin Panel"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#0f2b48] rounded text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Print directly or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#0f2b48]" />
            <span>PRINT</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-400 text-white rounded text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Download HD Image file (PNG)"
          >
            <Image className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">IMAGE</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-[#b8860b] hover:bg-[#996515] disabled:bg-slate-400 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Download formatted A4 PDF"
          >
            {isExporting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>DOWNLOADING...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD PDF</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Export progress toast if active */}
      {exportProgress && (
        <div className="no-print fixed bottom-4 right-4 z-50 bg-[#0f2b48] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl border border-amber-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{exportProgress}</span>
        </div>
      )}

      {/* Error message toast if active */}
      {errorMessage && (
        <div className="no-print fixed bottom-4 right-4 z-50 bg-rose-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl border border-rose-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Container - Scalable A4 Preview Canvas */}
      <div className="flex-1 overflow-auto py-6 px-2 sm:px-4 flex justify-center items-start">
        <div
          className="transition-transform duration-150 origin-top shadow-2xl"
          style={{
            transform: `scale(${zoomLevel})`,
            marginBottom: `${(zoomLevel - 1) * 320}px`,
          }}
        >
          <AcademicMarksheet
            data={resultData}
            id="printable-marksheet"
            examMode={activeExamMode}
          />
        </div>
      </div>
    </div>
  );
};
