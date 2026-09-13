import { GradeRule, ProcessedSubjectRow, ExamSummary, CombinedSummary, Student, SubjectConfig, SchoolSettings, StudentResultData } from '../types';

export const DEFAULT_GRADE_RULES: GradeRule[] = [
  { minPercentage: 90, maxPercentage: 100, grade: 'A+', description: 'Outstanding Academic Performance' },
  { minPercentage: 80, maxPercentage: 89.99, grade: 'A', description: 'Excellent Academic Performance' },
  { minPercentage: 70, maxPercentage: 79.99, grade: 'B+', description: 'Very Good Academic Performance' },
  { minPercentage: 60, maxPercentage: 69.99, grade: 'B', description: 'Good Academic Performance' },
  { minPercentage: 50, maxPercentage: 59.99, grade: 'C+', description: 'Satisfactory Academic Performance' },
  { minPercentage: 40, maxPercentage: 49.99, grade: 'C', description: 'Pass - Scope for Improvement' },
  { minPercentage: 0, maxPercentage: 39.99, grade: 'D', description: 'Needs Improvement / Practice' },
];

export function getGradeForPercentage(percentage: number, rules: GradeRule[] = DEFAULT_GRADE_RULES): string {
  const cleanPercentage = Math.min(100, Math.max(0, percentage));
  for (const rule of rules) {
    if (cleanPercentage >= rule.minPercentage && cleanPercentage <= rule.maxPercentage) {
      return rule.grade;
    }
  }
  return percentage >= 40 ? 'C' : 'D';
}

export function validateMark(obtained: number, max: number): { isValid: boolean; error?: string } {
  if (isNaN(obtained) || isNaN(max)) {
    return { isValid: false, error: 'Invalid numeric value' };
  }
  if (obtained < 0) {
    return { isValid: false, error: 'Marks cannot be negative' };
  }
  if (max <= 0) {
    return { isValid: false, error: 'Maximum marks must be greater than 0' };
  }
  if (obtained > max) {
    return { isValid: false, error: `Obtained marks (${obtained}) cannot be greater than maximum marks (${max})` };
  }
  return { isValid: true };
}

export function formatDateTime(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function calculateStudentResult(
  student: Student,
  subjects: SubjectConfig[],
  school: SchoolSettings,
  gradeRules: GradeRule[] = DEFAULT_GRADE_RULES
): StudentResultData {
  const activeSubjects = subjects
    .filter((s) => s.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const processedRows: ProcessedSubjectRow[] = [];
  const validationIssues: string[] = [];

  let halfMaxSum = 0;
  let halfObtSum = 0;
  let annualMaxSum = 0;
  let annualObtSum = 0;

  let anyHalfFailed = false;
  let anyAnnualFailed = false;

  activeSubjects.forEach((subj, index) => {
    const studentMark = student.marks?.[subj.id] || { halfObtained: 0, annualObtained: 0 };
    const halfObt = Number(studentMark.halfObtained) || 0;
    const annualObt = Number(studentMark.annualObtained) || 0;
    const halfMax = Number(subj.halfMax) || 100;
    const annualMax = Number(subj.annualMax) || 100;

    const halfValidation = validateMark(halfObt, halfMax);
    const annualValidation = validateMark(annualObt, annualMax);

    let rowValid = true;
    let rowError = '';

    if (!halfValidation.isValid) {
      rowValid = false;
      rowError = `Half-Yearly: ${halfValidation.error}`;
      validationIssues.push(`${subj.name} (Half-Yearly): ${halfValidation.error}`);
    }
    if (!annualValidation.isValid) {
      rowValid = false;
      rowError = rowError ? `${rowError}; Annual: ${annualValidation.error}` : `Annual: ${annualValidation.error}`;
      validationIssues.push(`${subj.name} (Annual): ${annualValidation.error}`);
    }

    if (halfObt < subj.passingMarks) {
      anyHalfFailed = true;
    }
    if (annualObt < subj.passingMarks) {
      anyAnnualFailed = true;
    }

    halfMaxSum += halfMax;
    halfObtSum += halfObt;
    annualMaxSum += annualMax;
    annualObtSum += annualObt;

    processedRows.push({
      sNo: index + 1,
      subjectId: subj.id,
      subjectName: subj.name,
      halfMax,
      halfObtained: halfObt,
      annualMax,
      annualObtained: annualObt,
      isValid: rowValid,
      validationError: rowError || undefined,
    });
  });

  // Calculate Half-Yearly
  const halfPctRaw = halfMaxSum > 0 ? (halfObtSum / halfMaxSum) * 100 : 0;
  const halfPct = Math.min(100, Math.max(0, Number(halfPctRaw.toFixed(2))));
  const halfGrade = getGradeForPercentage(halfPct, gradeRules);
  const halfStatus: 'PASS' | 'FAIL' = halfPct >= 33 && !anyHalfFailed ? 'PASS' : 'FAIL';

  const halfYearly: ExamSummary = {
    maximum: halfMaxSum,
    obtained: halfObtSum,
    percentage: halfPct,
    grade: halfGrade,
    status: halfStatus,
  };

  // Calculate Annual
  const annualPctRaw = annualMaxSum > 0 ? (annualObtSum / annualMaxSum) * 100 : 0;
  const annualPct = Math.min(100, Math.max(0, Number(annualPctRaw.toFixed(2))));
  const annualGrade = getGradeForPercentage(annualPct, gradeRules);
  const annualStatus: 'PASS' | 'FAIL' = annualPct >= 33 && !anyAnnualFailed ? 'PASS' : 'FAIL';

  const annual: ExamSummary = {
    maximum: annualMaxSum,
    obtained: annualObtSum,
    percentage: annualPct,
    grade: annualGrade,
    status: annualStatus,
  };

  // Combined calculations
  const combinedMax = halfMaxSum + annualMaxSum;
  const combinedObt = halfObtSum + annualObtSum;
  const combinedPctRaw = combinedMax > 0 ? (combinedObt / combinedMax) * 100 : 0;
  const combinedPct = Math.min(100, Math.max(0, Number(combinedPctRaw.toFixed(2))));
  const combinedGrade = getGradeForPercentage(combinedPct, gradeRules);
  const combinedStatus: 'PASS' | 'FAIL' = annualStatus === 'PASS' && combinedPct >= 33 ? 'PASS' : 'FAIL';

  // Progress = Annual Percentage - Half-Yearly Percentage points
  const progressPoints = Number((annualPct - halfPct).toFixed(2));

  const combined: CombinedSummary = {
    maximum: combinedMax,
    obtained: combinedObt,
    percentage: combinedPct,
    grade: combinedGrade,
    status: combinedStatus,
    progressPoints,
  };

  return {
    student: {
      id: student.id,
      name: student.name,
      fatherName: student.fatherName,
      motherName: student.motherName,
      dob: student.dob,
      gender: student.gender,
      className: student.className,
      section: student.section,
      rollNo: student.rollNo,
      admissionNo: student.admissionNo,
      photoUrl: student.photoUrl,
      session: student.session || school.session,
    },
    subjects: processedRows,
    halfYearly,
    annual,
    combined,
    progress: progressPoints,
    teacherRemark: student.teacherRemark || 'Good effort. Keep practicing regularly to achieve academic excellence.',
    school,
    generatedAt: formatDateTime(),
    validationIssues: validationIssues.length > 0 ? validationIssues : undefined,
  };
}
