import React from 'react';
import { StudentResultData } from '../types';

interface AcademicMarksheetProps {
  data: StudentResultData;
  id?: string;
  examMode?: 'half_yearly_only' | 'combined';
}

export const AcademicMarksheet: React.FC<AcademicMarksheetProps> = ({
  data,
  id = 'printable-marksheet',
  examMode = data.examMode || 'combined',
}) => {
  const { student, subjects, halfYearly, annual, combined, progress, teacherRemark, school, generatedAt, validationIssues } = data;

  const isOfficial = school.schoolBadgeType === 'OFFICIAL RESULT';
  const isHalfYearlyOnly = examMode === 'half_yearly_only';
  const displayTitle = isHalfYearlyOnly
    ? (school.resultTitleHalfYearly || 'ACADEMIC RESULT — HALF-YEARLY EXAMINATION')
    : (school.resultTitle || 'ACADEMIC RESULT — HALF-YEARLY & ANNUAL');

  return (
    <div
      id={id}
      className="marksheet-document marksheet-a4-page text-slate-900 select-none bg-white border border-slate-300 shadow-xl print:shadow-none print:border-0"
      style={{
        width: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '7mm 9mm 6mm 9mm',
      }}
    >
      {/* Outer Double Border for Classic School Certificate Elegance */}
      <div className="w-full h-full border-2 border-[#0f2b48] p-[3mm] flex flex-col justify-between relative bg-white">
        
        {/* Subtle Inner Border */}
        <div className="w-full h-full border border-[#0f2b48] p-[3.5mm] flex flex-col justify-between relative">
          
          {/* TOP HEADER SECTION */}
          <div>
            <div className="flex items-center justify-between gap-3 pb-2 border-b-2 border-[#0f2b48]">
              {/* Left: School Logo */}
              <div className="w-[72px] h-[72px] shrink-0 flex items-center justify-center">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={school.schoolName}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full border border-dashed border-[#0f2b48] flex items-center justify-center text-[9px] text-[#0f2b48]">
                    LOGO
                  </div>
                )}
              </div>

              {/* Center: School Branding */}
              <div className="flex-1 text-center px-1">
                <h1 className="text-[20px] leading-tight font-bold tracking-tight text-[#0f2b48] uppercase">
                  {school.schoolName}
                </h1>
                <p className="text-[11px] leading-tight font-bold text-slate-800 mt-0.5">
                  {school.address}
                </p>
                <p className="text-[10.5px] leading-tight font-bold text-slate-700 mt-0.5">
                  <span>Managed by: {school.managedBy}</span>
                  <span className="mx-2 font-bold text-slate-400">|</span>
                  <span>Mob.: {school.mobile}</span>
                </p>
                <div className="mt-1 inline-block px-3 py-0.5 bg-[#e8f0fe] rounded border border-[#b6d0fe]">
                  <p className="text-[10px] leading-none font-bold text-[#0f2b48] tracking-wide">
                    {school.tagline}
                  </p>
                </div>
              </div>

              {/* Right: Official Result Badge */}
              <div className="w-[72px] h-[72px] shrink-0 flex flex-col items-center justify-center border-2 border-[#0f2b48] rounded bg-[#f8faff] p-1 text-center shadow-xs">
                <span className="text-[9px] font-bold text-[#b8860b] uppercase tracking-wider">
                  {isOfficial ? '★ OFFICIAL ★' : '★ ACADEMIC ★'}
                </span>
                <span className="text-[12px] leading-tight font-bold text-[#0f2b48] tracking-tight uppercase">
                  RESULT
                </span>
                <span className="text-[7.5px] font-bold text-slate-500 mt-0.5 uppercase">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* RESULT TITLE & SESSION */}
            <div className="text-center py-1.5 border-b border-[#0f2b48] bg-[#f0f4f9] mt-1 flex items-center justify-between px-3">
              <div className="text-[10px] font-bold text-slate-700 uppercase">
                {isHalfYearlyOnly ? 'TERM I EVALUATION' : 'AFFILIATED TO STATE EDUCATION BOARD'}
              </div>
              <div className="text-center">
                <h2 className="text-[14px] font-bold text-[#0f2b48] tracking-wide uppercase leading-tight">
                  {displayTitle}
                </h2>
                <div className="text-[11px] font-bold text-blue-900 tracking-wider mt-0.5">
                  SESSION: <span className="text-[#b8860b] underline">{student.session || school.session}</span>
                  {isHalfYearlyOnly && (
                    <span className="ml-2 bg-[#0f2b48] text-[#ffd54f] px-1.5 py-0.2 text-[9.5px] rounded">
                      HALF-YEARLY ONLY
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-700 uppercase">
                CLASS: <span className="text-[#0f2b48]">{student.className}</span>
              </div>
            </div>

            {/* DATA INCONSISTENCY NOTICE IF ANY */}
            {validationIssues && validationIssues.length > 0 && (
              <div className="my-1 px-2 py-1 bg-amber-50 border border-amber-300 text-amber-900 text-[9.5px] font-bold">
                ⚠️ Result data requires verification: {validationIssues.join(' • ')}
              </div>
            )}

            {/* STUDENT INFORMATION SECTION */}
            <div className="mt-1.5 border border-[#0f2b48]">
              {/* Dark Brand Bar */}
              <div className="bg-[#0f2b48] text-white px-2 py-0.5 flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  STUDENT INFORMATION
                </span>
                <span className="text-[9.5px] font-bold text-slate-200">
                  ADM NO: {student.admissionNo || '—'}
                </span>
              </div>

              <div className="p-1.5 flex gap-2 items-stretch bg-white">
                {/* 2-Column Info Grid */}
                <div className="flex-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
                  <div className="flex items-baseline border-b border-slate-200 pb-0.5">
                    <span className="w-28 text-slate-600 font-bold uppercase shrink-0">Student Name:</span>
                    <span className="text-[#0f2b48] font-bold uppercase truncate">{student.name || '—'}</span>
                  </div>

                  <div className="flex items-baseline border-b border-slate-200 pb-0.5">
                    <span className="w-24 text-slate-600 font-bold uppercase shrink-0">Roll No.:</span>
                    <span className="text-[#0f2b48] font-bold text-[12px]">{student.rollNo || '—'}</span>
                  </div>

                  <div className="flex items-baseline border-b border-slate-200 pb-0.5">
                    <span className="w-28 text-slate-600 font-bold uppercase shrink-0">Father's Name:</span>
                    <span className="text-slate-900 font-bold uppercase truncate">{student.fatherName || '—'}</span>
                  </div>

                  <div className="flex items-baseline border-b border-slate-200 pb-0.5">
                    <span className="w-24 text-slate-600 font-bold uppercase shrink-0">Class & Sec:</span>
                    <span className="text-slate-900 font-bold">{student.className} - {student.section}</span>
                  </div>

                  <div className="flex items-baseline border-b border-slate-200 pb-0.5">
                    <span className="w-28 text-slate-600 font-bold uppercase shrink-0">Mother's Name:</span>
                    <span className="text-slate-900 font-bold uppercase truncate">{student.motherName || '—'}</span>
                  </div>

                  <div className="flex items-baseline border-b border-slate-200 pb-0.5">
                    <span className="w-24 text-slate-600 font-bold uppercase shrink-0">Date of Birth:</span>
                    <span className="text-slate-900 font-bold">{student.dob || '—'}</span>
                  </div>

                  <div className="flex items-baseline border-b border-slate-200 pb-0.5 col-span-2">
                    <div className="flex w-1/2">
                      <span className="w-28 text-slate-600 font-bold uppercase shrink-0">Admission No.:</span>
                      <span className="text-slate-900 font-bold">{student.admissionNo || '—'}</span>
                    </div>
                    <div className="flex w-1/2">
                      <span className="w-24 text-slate-600 font-bold uppercase shrink-0">Gender:</span>
                      <span className="text-slate-900 font-bold uppercase">{student.gender || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Fixed Student Portrait Photo */}
                <div className="w-[84px] h-[98px] shrink-0 border-2 border-[#0f2b48] bg-slate-100 p-0.5 flex flex-col items-center justify-center overflow-hidden relative shadow-xs">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-500 text-[8px] text-center p-1">
                      <span className="font-bold">PASSPORT</span>
                      <span>PHOTO</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACADEMIC PERFORMANCE TABLE */}
            <div className="mt-1.5">
              <div className="bg-[#0f2b48] text-white px-2 py-0.5 flex justify-between items-center border-t border-x border-[#0f2b48]">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {isHalfYearlyOnly ? 'HALF-YEARLY ACADEMIC EVALUATION' : 'ACADEMIC PERFORMANCE'}
                </span>
                <span className="text-[9.5px] font-bold text-slate-200">
                  {isHalfYearlyOnly ? 'TERM I ASSESSMENT (M.M. = MAXIMUM MARKS)' : 'ASSESSMENT CRITERIA: M.M. = MAXIMUM MARKS'}
                </span>
              </div>

              {isHalfYearlyOnly ? (
                /* HALF-YEARLY ONLY 4-COLUMN TABLE (NO ANNUAL COLUMNS) */
                <table className="academic-table w-full text-center">
                  <thead>
                    <tr className="bg-[#0f2b48] text-white text-[10.5px]">
                      <th className="w-[8%] py-1 font-bold text-center border-r border-white/20">S.No.</th>
                      <th className="w-[46%] py-1 font-bold text-left px-3 border-r border-white/20">SUBJECT</th>
                      <th className="w-[23%] py-1 font-bold bg-[#1a4773] border-r border-white/20">
                        MAXIMUM MARKS (M.M.)
                      </th>
                      <th className="w-[23%] py-1 font-bold bg-[#23588e]">
                        OBTAINED MARKS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] text-slate-900">
                    {subjects.map((row) => (
                      <tr
                        key={row.subjectId}
                        className="hover:bg-slate-50 transition-colors border-b border-[#0f2b48]"
                        style={{ height: '24px' }}
                      >
                        <td className="font-bold text-slate-700 py-0.5 border-r border-[#0f2b48]">{row.sNo}</td>
                        <td className="font-bold text-left px-3 text-slate-900 uppercase border-r border-[#0f2b48]">
                          {row.subjectName}
                          {row.validationError && (
                            <span className="text-[8px] text-red-600 block leading-none font-normal">
                              {row.validationError}
                            </span>
                          )}
                        </td>
                        <td className="font-bold text-slate-700 py-0.5 bg-blue-50/20 border-r border-[#0f2b48]">{row.halfMax}</td>
                        <td className="font-bold text-[#0f2b48] py-0.5 bg-blue-50/50 text-[12px]">{row.halfObtained}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* COMBINED 6-COLUMN TABLE (HALF-YEARLY + ANNUAL) */
                <table className="academic-table w-full text-center">
                  <thead>
                    <tr className="bg-[#f0f4f9] text-[#0f2b48] text-[10.5px]">
                      <th rowSpan={2} className="w-[6%] py-1 font-bold text-center">S.No.</th>
                      <th rowSpan={2} className="w-[36%] py-1 font-bold text-left px-2">SUBJECT</th>
                      <th colSpan={2} className="w-[29%] py-0.5 font-bold border-b border-[#0f2b48] bg-[#e8f0fe]">
                        HALF-YEARLY EXAMINATION
                      </th>
                      <th colSpan={2} className="w-[29%] py-0.5 font-bold border-b border-[#0f2b48] bg-[#f0fdf4]">
                        ANNUAL EXAMINATION
                      </th>
                    </tr>
                    <tr className="text-[10px] text-[#0f2b48]">
                      <th className="w-[14.5%] py-0.5 font-bold bg-[#e8f0fe]">M.M.</th>
                      <th className="w-[14.5%] py-0.5 font-bold bg-[#e8f0fe]">RESULT</th>
                      <th className="w-[14.5%] py-0.5 font-bold bg-[#f0fdf4]">M.M.</th>
                      <th className="w-[14.5%] py-0.5 font-bold bg-[#f0fdf4]">RESULT</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10.5px] text-slate-900">
                    {subjects.map((row) => (
                      <tr
                        key={row.subjectId}
                        className="hover:bg-slate-50 transition-colors border-b border-[#0f2b48]"
                        style={{ height: '22px' }}
                      >
                        <td className="font-bold text-slate-700 py-0.5">{row.sNo}</td>
                        <td className="font-bold text-left px-2 text-slate-900 uppercase">
                          {row.subjectName}
                          {row.validationError && (
                            <span className="text-[8px] text-red-600 block leading-none font-normal">
                              {row.validationError}
                            </span>
                          )}
                        </td>
                        <td className="font-bold text-slate-700 py-0.5 bg-blue-50/20">{row.halfMax}</td>
                        <td className="font-bold text-[#0f2b48] py-0.5 bg-blue-50/40 text-[11px]">{row.halfObtained}</td>
                        <td className="font-bold text-slate-700 py-0.5 bg-emerald-50/20">{row.annualMax}</td>
                        <td className="font-bold text-[#0f2b48] py-0.5 bg-emerald-50/40 text-[11px]">{row.annualObtained}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* DEDICATED SUMMARY SECTION */}
              <div className="border-x-2 border-b-2 border-[#0f2b48] text-[10.5px] leading-normal font-bold">
                {isHalfYearlyOnly ? (
                  /* HALF-YEARLY ONLY SUMMARY ROW */
                  <div className="flex bg-[#0f2b48] text-white">
                    <div className="w-[54%] px-3 py-2 bg-[#0f2b48] text-white font-bold border-r border-white/30 uppercase flex items-center justify-between">
                      <span className="text-[11.5px]">HALF-YEARLY EVALUATION SUMMARY</span>
                      <span className="text-[10px] text-amber-300">TERM I RESULT</span>
                    </div>
                    <div className="flex-1 grid grid-cols-4 divide-x divide-white/20 text-center items-center py-2">
                      <div>
                        <span className="text-slate-300 font-bold text-[9px] block">TOTAL M.M.</span>
                        <span className="text-white text-[12px]">{halfYearly.maximum}</span>
                      </div>
                      <div>
                        <span className="text-slate-300 font-bold text-[9px] block">TOTAL RESULT</span>
                        <span className="text-amber-300 font-bold text-[13px]">{halfYearly.obtained}</span>
                      </div>
                      <div>
                        <span className="text-slate-300 font-bold text-[9px] block">PERCENTAGE</span>
                        <span className="text-white text-[12px]">{halfYearly.percentage.toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-300 font-bold text-[9px] block">GRADE / STATUS</span>
                        <span className="text-amber-300 font-bold text-[12px]">
                          {halfYearly.grade} ({halfYearly.status})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 3-ROW SUMMARY: HALF-YEARLY, ANNUAL, COMBINED */
                  <>
                    {/* ROW 1: HALF-YEARLY */}
                    <div className="flex border-b border-[#0f2b48] bg-[#f8faff]">
                      <div className="w-[42%] px-2 py-1 bg-[#e8f0fe] text-[#0f2b48] font-bold border-r border-[#0f2b48] uppercase flex items-center justify-between">
                        <span>HALF-YEARLY SUMMARY</span>
                        <span className="text-[9.5px] text-slate-500">TERM I</span>
                      </div>
                      <div className="flex-1 grid grid-cols-5 divide-x divide-[#0f2b48] text-center items-center py-1">
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">M.M.</span><span className="text-slate-900">{halfYearly.maximum}</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">RESULT</span><span className="text-[#0f2b48] font-bold text-[11.5px]">{halfYearly.obtained}</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">PERCENTAGE</span><span className="text-[#0f2b48]">{halfYearly.percentage.toFixed(2)}%</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">GRADE</span><span className="text-[#b8860b] font-bold">{halfYearly.grade}</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">STATUS</span><span className={halfYearly.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>{halfYearly.status}</span></div>
                      </div>
                    </div>

                    {/* ROW 2: ANNUAL */}
                    <div className="flex border-b border-[#0f2b48] bg-[#fafffa]">
                      <div className="w-[42%] px-2 py-1 bg-[#e6f4ea] text-[#0f2b48] font-bold border-r border-[#0f2b48] uppercase flex items-center justify-between">
                        <span>ANNUAL SUMMARY</span>
                        <span className="text-[9.5px] text-slate-500">TERM II</span>
                      </div>
                      <div className="flex-1 grid grid-cols-5 divide-x divide-[#0f2b48] text-center items-center py-1">
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">M.M.</span><span className="text-slate-900">{annual.maximum}</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">RESULT</span><span className="text-[#0f2b48] font-bold text-[11.5px]">{annual.obtained}</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">PERCENTAGE</span><span className="text-[#0f2b48]">{annual.percentage.toFixed(2)}%</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">GRADE</span><span className="text-[#b8860b] font-bold">{annual.grade}</span></div>
                        <div><span className="text-slate-600 font-bold text-[9.5px] block">STATUS</span><span className={annual.status === 'PASS' ? 'text-emerald-700' : 'text-rose-700'}>{annual.status}</span></div>
                      </div>
                    </div>

                    {/* ROW 3: COMBINED TOTAL */}
                    <div className="flex bg-[#0f2b48] text-white">
                      <div className="w-[42%] px-2 py-1.5 bg-[#0f2b48] text-white font-bold border-r border-slate-300 uppercase flex items-center justify-between">
                        <span>HALF + ANNUAL TOTAL</span>
                        <span className="text-[9.5px] text-amber-300">FINAL AGGREGATE</span>
                      </div>
                      <div className="flex-1 grid grid-cols-5 divide-x divide-slate-400/40 text-center items-center py-1">
                        <div><span className="text-slate-300 font-bold text-[9px] block">TOTAL M.M.</span><span className="text-white text-[11px]">{combined.maximum}</span></div>
                        <div><span className="text-slate-300 font-bold text-[9px] block">TOTAL RESULT</span><span className="text-amber-300 font-bold text-[12px]">{combined.obtained}</span></div>
                        <div><span className="text-slate-300 font-bold text-[9px] block">COMBINED %</span><span className="text-white text-[11px]">{combined.percentage.toFixed(2)}%</span></div>
                        <div><span className="text-slate-300 font-bold text-[9px] block">FINAL GRADE</span><span className="text-amber-300 font-bold text-[11.5px]">{combined.grade}</span></div>
                        <div>
                          <span className="text-slate-300 font-bold text-[9px] block">PROGRESS</span>
                          <span className={`text-[10px] ${progress >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {progress > 0 ? `+${progress.toFixed(2)}%` : `${progress.toFixed(2)}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* TEACHER'S REMARK */}
            <div className="mt-1.5 border border-[#0f2b48] bg-[#fcfdff] p-1.5">
              <div className="flex items-start gap-1 text-[11px]">
                <span className="text-[#0f2b48] font-bold uppercase shrink-0 tracking-wide">
                  TEACHER'S REMARK:
                </span>
                <span className="text-slate-800 font-bold italic flex-1 break-words">
                  "{teacherRemark}"
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: SIGNATURES & FOOTER */}
          <div className="mt-2">
            {/* SIGNATURES SECTION */}
            <div className="flex justify-between items-end px-6 pt-3 pb-1">
              {/* Class Teacher Signature */}
              <div className="text-center w-40 flex flex-col items-center">
                <div className="h-10 flex items-end justify-center w-full mb-1">
                  {school.teacherSignatureUrl && (
                    <img
                      src={school.teacherSignatureUrl}
                      alt="Class Teacher Signature"
                      className="max-h-9 object-contain"
                    />
                  )}
                </div>
                <div className="w-full border-t border-[#0f2b48] pt-1">
                  <p className="text-[11px] font-bold text-[#0f2b48] uppercase tracking-wider">
                    CLASS TEACHER
                  </p>
                  <p className="text-[8.5px] font-bold text-slate-500">SIGNATURE & DATE</p>
                </div>
              </div>

              {/* Official Seal / Stamp */}
              <div className="w-20 h-20 flex items-center justify-center -mb-2">
                {school.showDigitalStamp !== false && school.principalStampUrl ? (
                  <img
                    src={school.principalStampUrl}
                    alt="School Seal"
                    className="max-w-full max-h-full object-contain opacity-90"
                  />
                ) : (
                  <div className="w-18 h-18 rounded-full border-2 border-dashed border-[#0f2b48]/40 flex flex-col items-center justify-center p-1 text-center bg-slate-50/50">
                    <span className="text-[7.5px] font-bold text-[#0f2b48]/70 uppercase tracking-tight leading-tight">
                      OFFICIAL SEAL
                    </span>
                    <span className="text-[6.5px] font-bold text-slate-400 uppercase leading-none mt-0.5">
                      AFFIX STAMP HERE
                    </span>
                  </div>
                )}
              </div>

              {/* Principal Signature */}
              <div className="text-center w-40 flex flex-col items-center">
                <div className="h-10 flex items-end justify-center w-full mb-1">
                  {school.principalSignatureUrl && (
                    <img
                      src={school.principalSignatureUrl}
                      alt="Principal Signature"
                      className="max-h-9 object-contain"
                    />
                  )}
                </div>
                <div className="w-full border-t border-[#0f2b48] pt-1">
                  <p className="text-[11px] font-bold text-[#0f2b48] uppercase tracking-wider">
                    PRINCIPAL
                  </p>
                  <p className="text-[8.5px] font-bold text-slate-500">SIGNATURE & SEAL</p>
                </div>
              </div>
            </div>

            {/* BOTTOM FOOTER BAR */}
            <div className="mt-1 pt-1 border-t border-[#0f2b48] flex justify-between items-center text-[8.5px] font-bold text-slate-700 px-1">
              <div>
                <span>Generated: </span>
                <span className="text-slate-900">{generatedAt}</span>
              </div>
              <div className="tracking-wide text-[#0f2b48]">
                {school.footerText || 'Keep Learning • Keep Growing • Keep Shining!'}
              </div>
              <div>
                <span>Session: </span>
                <span className="text-slate-900">{student.session || school.session}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
