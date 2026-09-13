export interface SubjectConfig {
  id: string;
  name: string;
  displayOrder: number;
  halfMax: number;
  annualMax: number;
  passingMarks: number;
  active: boolean;
}

export interface StudentMarkItem {
  subjectId: string;
  subjectName: string;
  halfMax: number;
  halfObtained: number;
  annualMax: number;
  annualObtained: number;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  className: string;
  section: string;
  rollNo: string;
  admissionNo: string;
  photoUrl?: string;
  session: string;
  teacherRemark?: string;
  marks: Record<string, {
    halfObtained: number;
    annualObtained: number;
  }>;
}

export interface SchoolSettings {
  schoolName: string;
  address: string;
  managedBy: string;
  mobile: string;
  tagline: string;
  logoUrl?: string;
  schoolBadgeType: 'OFFICIAL RESULT' | 'ACADEMIC RESULT';
  resultTitle: string;
  resultTitleHalfYearly?: string;
  session: string;
  footerText: string;
  teacherSignatureUrl?: string;
  principalSignatureUrl?: string;
  principalStampUrl?: string;
  showDigitalStamp?: boolean;
  stampType?: 'digital' | 'physical';
  defaultExamMode?: 'half_yearly_only' | 'combined';
  googleSheetWebAppUrl?: string;
}

export interface GradeRule {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  description: string;
}

export interface ExamSummary {
  maximum: number;
  obtained: number;
  percentage: number;
  grade: string;
  status: 'PASS' | 'FAIL';
}

export interface CombinedSummary {
  maximum: number;
  obtained: number;
  percentage: number;
  grade: string;
  status: 'PASS' | 'FAIL';
  progressPoints: number; // Annual % - Half %
}

export interface ProcessedSubjectRow {
  sNo: number;
  subjectId: string;
  subjectName: string;
  halfMax: number;
  halfObtained: number;
  annualMax: number;
  annualObtained: number;
  isValid: boolean;
  validationError?: string;
}

export interface StudentResultData {
  student: {
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    dob: string;
    gender: string;
    className: string;
    section: string;
    rollNo: string;
    admissionNo: string;
    photoUrl?: string;
    session: string;
  };
  subjects: ProcessedSubjectRow[];
  halfYearly: ExamSummary;
  annual: ExamSummary;
  combined: CombinedSummary;
  progress: number;
  teacherRemark: string;
  school: SchoolSettings;
  generatedAt: string;
  validationIssues?: string[];
  examMode?: 'half_yearly_only' | 'combined';
}
