import React, { useState } from 'react';
import {
  Student,
  SubjectConfig,
  SchoolSettings,
  GradeRule,
  StudentResultData,
} from '../types';
import {
  calculateStudentResult,
  validateMark,
} from '../utils/calculations';
import {
  DEFAULT_STUDENT_PHOTO_17,
  DEFAULT_STUDENT_PHOTO_18,
  DEFAULT_STUDENT_PHOTO_FALLBACK,
  DEFAULT_SCHOOL_LOGO,
} from '../data/defaultData';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  saveGoogleSheetUrl,
  testGoogleSheetConnection,
  syncAllDataToGoogleSheet,
  fetchAllFromGoogleSheet,
} from '../utils/googleSheetSync';
import {
  Users,
  BookOpen,
  Settings,
  Award,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Check,
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard,
  Save,
  RotateCcw,
  Sparkles,
  LogOut,
  Upload,
  Image,
  RefreshCw,
  FileText,
  Layers,
  Download,
  Shield,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  students: Student[];
  subjects: SubjectConfig[];
  schoolSettings: SchoolSettings;
  gradeRules: GradeRule[];
  onSaveStudents: (students: Student[]) => void;
  onSaveSubjects: (subjects: SubjectConfig[]) => void;
  onSaveSchoolSettings: (settings: SchoolSettings) => void;
  onSaveGradeRules: (rules: GradeRule[]) => void;
  onViewStudentResult: (studentId: string) => void;
  onBackToPublic: () => void;
  onLogout?: () => void;
  initialSelectedStudentId?: string;
}

type TabType = 'dashboard' | 'students' | 'marks' | 'subjects' | 'school' | 'grades' | 'sheets';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  students,
  subjects,
  schoolSettings,
  gradeRules,
  onSaveStudents,
  onSaveSubjects,
  onSaveSchoolSettings,
  onSaveGradeRules,
  onViewStudentResult,
  onBackToPublic,
  onLogout,
  initialSelectedStudentId,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialSelectedStudentId ? 'marks' : 'dashboard');
  const [selectedStudentIdForMarks, setSelectedStudentIdForMarks] = useState<string>(
    initialSelectedStudentId || students[0]?.id || ''
  );

  // Student Edit / Create Modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isNewStudent, setIsNewStudent] = useState<boolean>(false);

  // Marks editing state for selected student
  const currentStudent = students.find((s) => s.id === selectedStudentIdForMarks) || students[0];
  const [currentMarks, setCurrentMarks] = useState<Record<string, { halfObtained: number; annualObtained: number }>>(
    currentStudent?.marks || {}
  );
  const [currentRemark, setCurrentRemark] = useState<string>(currentStudent?.teacherRemark || '');
  const [marksValidationErrors, setMarksValidationErrors] = useState<Record<string, string>>({});
  const [marksSaveSuccess, setMarksSaveSuccess] = useState<boolean>(false);

  // When selected student changes in Marks tab
  const handleSelectStudentForMarks = (id: string) => {
    setSelectedStudentIdForMarks(id);
    const std = students.find((s) => s.id === id);
    if (std) {
      setCurrentMarks(std.marks || {});
      setCurrentRemark(std.teacherRemark || '');
      setMarksValidationErrors({});
      setMarksSaveSuccess(false);
    }
  };

  // Mark input change with validation
  const handleMarkChange = (subjectId: string, examType: 'half' | 'annual', valueStr: string) => {
    const val = Number(valueStr);
    const subj = subjects.find((s) => s.id === subjectId);
    const max = examType === 'half' ? (subj?.halfMax || 100) : (subj?.annualMax || 100);

    const validation = validateMark(val, max);
    const errKey = `${subjectId}_${examType}`;

    if (!validation.isValid) {
      setMarksValidationErrors((prev) => ({ ...prev, [errKey]: validation.error || 'Invalid marks' }));
    } else {
      setMarksValidationErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
    }

    setCurrentMarks((prev) => ({
      ...prev,
      [subjectId]: {
        halfObtained: examType === 'half' ? val : (prev[subjectId]?.halfObtained ?? 0),
        annualObtained: examType === 'annual' ? val : (prev[subjectId]?.annualObtained ?? 0),
      },
    }));
    setMarksSaveSuccess(false);
  };

  const handleSaveMarks = () => {
    if (Object.keys(marksValidationErrors).length > 0) {
      alert('Please fix marks validation errors before saving (Obtained cannot exceed Maximum marks).');
      return;
    }
    const updated = students.map((s) => {
      if (s.id === selectedStudentIdForMarks) {
        return {
          ...s,
          marks: currentMarks,
          teacherRemark: currentRemark,
        };
      }
      return s;
    });
    onSaveStudents(updated);
    setMarksSaveSuccess(true);
    setTimeout(() => setMarksSaveSuccess(false), 2500);
  };

  // Student CRUD
  const handleStartAddStudent = () => {
    setIsNewStudent(true);
    setEditingStudent({
      id: `std-${Date.now()}`,
      name: '',
      fatherName: '',
      motherName: '',
      dob: '01/01/2012',
      gender: 'FEMALE',
      className: '8th',
      section: 'A',
      rollNo: String(students.length + 1),
      admissionNo: `ADM-2024-${String(students.length + 1).padStart(4, '0')}`,
      session: schoolSettings.session,
      photoUrl: DEFAULT_STUDENT_PHOTO_FALLBACK,
      teacherRemark: 'Regular and disciplined student. Shows consistent academic progress.',
      marks: {},
    });
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!editingStudent.name || !editingStudent.rollNo) {
      alert('Student Name and Roll Number are required.');
      return;
    }

    if (isNewStudent) {
      onSaveStudents([...students, editingStudent]);
    } else {
      onSaveStudents(students.map((s) => (s.id === editingStudent.id ? editingStudent : s)));
    }
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      onSaveStudents(students.filter((s) => s.id !== id));
      if (selectedStudentIdForMarks === id) {
        setSelectedStudentIdForMarks(students.find((s) => s.id !== id)?.id || '');
      }
    }
  };

  // Subject management state
  const [editingSubjects, setEditingSubjects] = useState<SubjectConfig[]>([...subjects]);
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSubj: SubjectConfig = {
      id: `sub-${Date.now()}`,
      name: newSubjectName.trim(),
      displayOrder: editingSubjects.length + 1,
      halfMax: 100,
      annualMax: 100,
      passingMarks: 33,
      active: true,
    };
    const updated = [...editingSubjects, newSubj];
    setEditingSubjects(updated);
    onSaveSubjects(updated);
    setNewSubjectName('');
  };

  const handleSubjectChange = (id: string, field: keyof SubjectConfig, val: any) => {
    const updated = editingSubjects.map((s) => (s.id === id ? { ...s, [field]: val } : s));
    setEditingSubjects(updated);
    onSaveSubjects(updated);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm('Delete this subject from the examination list?')) {
      const updated = editingSubjects.filter((s) => s.id !== id);
      setEditingSubjects(updated);
      onSaveSubjects(updated);
    }
  };

  // School settings state
  const [settingsForm, setSettingsForm] = useState<SchoolSettings>({ ...schoolSettings });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Helper to convert uploaded image to Base64 data URL
  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert('Image file exceeds 2.5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSchoolSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Google Sheets state & helpers
  const [isTestingSheet, setIsTestingSheet] = useState(false);
  const [sheetTestStatus, setSheetTestStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncSuccess, setSheetSyncSuccess] = useState<string | null>(null);

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportStudentsCsv = () => {
    const headers = 'Student_ID,Student_Name,Father_Name,Mother_Name,Date_of_Birth,Gender,Class,Section,Roll_No,Admission_No,Photo_URL,Session\n';
    const rows = students.map((s) =>
      `"${s.id}","${s.name}","${s.fatherName}","${s.motherName}","${s.dob}","${s.gender}","${s.className}","${s.section}","${s.rollNo}","${s.admissionNo}","${s.photoUrl || ''}","${s.session}"`
    ).join('\n');
    downloadCsv('1_Students.csv', headers + rows);
  };

  const handleExportMarksCsv = () => {
    const headers = 'Student_ID,Subject,Half_Max,Half_Obtained,Annual_Max,Annual_Obtained\n';
    const rows: string[] = [];
    students.forEach((s) => {
      subjects.forEach((subj) => {
        const m = s.marks[subj.id] || { halfObtained: 0, annualObtained: 0 };
        rows.push(`"${s.id}","${subj.name}",${subj.halfMax},${m.halfObtained},${subj.annualMax},${m.annualObtained}`);
      });
    });
    downloadCsv('2_Marks.csv', headers + rows.join('\n'));
  };

  const handleExportSubjectsCsv = () => {
    const headers = 'Subject_ID,Subject_Name,Display_Order,Half_Max,Annual_Max,Passing_Marks,Active\n';
    const rows = subjects.map((sub) =>
      `"${sub.id}","${sub.name}",${sub.displayOrder},${sub.halfMax},${sub.annualMax},${sub.passingMarks},${sub.active ? 'TRUE' : 'FALSE'}`
    ).join('\n');
    downloadCsv('3_Subjects.csv', headers + rows);
  };

  const handleExportAllJson = () => {
    const fullData = {
      schoolSettings,
      students,
      subjects,
      gradeRules,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HD_Pandey_School_Data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetFetchSuccess, setSheetFetchSuccess] = useState<string | null>(null);
  const [urlSavedNotice, setUrlSavedNotice] = useState(false);
  const [codeCopiedNotice, setCodeCopiedNotice] = useState(false);

  const handleTestGoogleSheet = async () => {
    const url = settingsForm.googleSheetWebAppUrl?.trim();
    if (!url) {
      setSheetTestStatus({ success: false, message: 'कृपया पहले Google Apps Script Web App URL दर्ज करें!' });
      return;
    }
    setIsTestingSheet(true);
    setSheetTestStatus(null);
    const result = await testGoogleSheetConnection(url);
    setSheetTestStatus(result);
    setIsTestingSheet(false);
  };

  const handleSyncToGoogleSheet = async () => {
    const url = settingsForm.googleSheetWebAppUrl?.trim();
    if (!url) {
      setSheetTestStatus({ success: false, message: 'कृपया पहले Google Sheet Web App URL दर्ज करें!' });
      return;
    }
    setIsSyncingSheet(true);
    setSheetSyncSuccess(null);
    const res = await syncAllDataToGoogleSheet(url, {
      schoolSettings: settingsForm,
      students,
      subjects,
      gradeRules,
    });

    if (res.success) {
      setSheetSyncSuccess(res.message);
      setTimeout(() => setSheetSyncSuccess(null), 4000);
    } else {
      setSheetTestStatus({ success: false, message: res.message });
    }
    setIsSyncingSheet(false);
  };

  const handleFetchFromGoogleSheet = async () => {
    const url = settingsForm.googleSheetWebAppUrl?.trim();
    if (!url) {
      setSheetTestStatus({ success: false, message: 'कृपया पहले Google Sheet Web App URL दर्ज करें!' });
      return;
    }
    setIsFetchingSheet(true);
    setSheetFetchSuccess(null);
    try {
      const liveData = await fetchAllFromGoogleSheet(url);
      if (liveData) {
        if (liveData.students && liveData.students.length > 0) {
          onSaveStudents(liveData.students);
        }
        if (liveData.subjects && liveData.subjects.length > 0) {
          onSaveSubjects(liveData.subjects);
        }
        if (liveData.settings && Object.keys(liveData.settings).length > 0) {
          onSaveSchoolSettings({ ...settingsForm, ...liveData.settings });
          setSettingsForm((prev) => ({ ...prev, ...liveData.settings }));
        }
        if (liveData.gradeRules && liveData.gradeRules.length > 0) {
          onSaveGradeRules(liveData.gradeRules);
        }
        setSheetFetchSuccess('Google Sheet से सारा डाटा सफलता के साथ पोर्टल में लोड हो गया!');
        setTimeout(() => setSheetFetchSuccess(null), 4500);
      } else {
        setSheetTestStatus({
          success: false,
          message: 'Google Sheet से डाटा लोड नहीं हो सका। कृपया URL तथा New Deployment एक्सेस ("Anyone") की पुष्टि करें।',
        });
      }
    } catch (err: any) {
      setSheetTestStatus({ success: false, message: 'डाटा प्राप्त करने में एरर: ' + err.message });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Grade rules state
  const [rulesForm, setRulesForm] = useState<GradeRule[]>([...gradeRules]);
  const [gradesSaved, setGradesSaved] = useState(false);

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGradeRules(rulesForm);
    setGradesSaved(true);
    setTimeout(() => setGradesSaved(false), 2000);
  };

  // Calculate live preview for current student in marks tab
  const liveResult: StudentResultData | null = currentStudent
    ? calculateStudentResult(
        { ...currentStudent, marks: currentMarks, teacherRemark: currentRemark },
        subjects,
        schoolSettings,
        gradeRules
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0f2b48] text-white px-6 py-3 border-b-4 border-[#b8860b] shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPublic}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Portal</span>
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight uppercase">
              School Administration Console
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              {schoolSettings.schoolName} • Session {schoolSettings.session}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
            ● Logged in as: Kld75
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-700/80 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-rose-500/40"
              title="Logout from Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'dashboard'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'students'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('marks')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'marks'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit2 className="w-4 h-4" />
          <span>Marks Management</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'subjects'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('school')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'school'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>School Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'grades'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Grade Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'sheets'
              ? 'border-[#0f2b48] text-[#0f2b48]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets Sync & Export</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Students</span>
                <p className="text-3xl font-bold text-[#0f2b48] mt-1">{students.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Class VIII - All Sections</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Active Subjects</span>
                <p className="text-3xl font-bold text-[#1b4975] mt-1">{subjects.filter((s) => s.active).length}</p>
                <p className="text-[11px] text-slate-400 mt-1">Curriculum Assessment</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Examination Terms</span>
                <p className="text-3xl font-bold text-emerald-700 mt-1">2 Terms</p>
                <p className="text-[11px] text-slate-400 mt-1">Half-Yearly & Annual</p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Official Status</span>
                <p className="text-2xl font-bold text-[#b8860b] mt-1">Published</p>
                <p className="text-[11px] text-slate-400 mt-1">Session {schoolSettings.session}</p>
              </div>
            </div>

            {/* Quick Students Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#0f2b48] uppercase">
                    Student Performance Overview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click "View Result" to see the full printable A4 marksheet for any student
                  </p>
                </div>
                <button
                  onClick={handleStartAddStudent}
                  className="px-3 py-1.5 bg-[#0f2b48] hover:bg-[#1b4975] text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Student</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Roll</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4">Father Name</th>
                      <th className="py-2.5 px-4">Half %</th>
                      <th className="py-2.5 px-4">Annual %</th>
                      <th className="py-2.5 px-4">Final Grade</th>
                      <th className="py-2.5 px-4">Result</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {students.map((st) => {
                      const res = calculateStudentResult(st, subjects, schoolSettings, gradeRules);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-[#0f2b48]">{st.rollNo}</td>
                          <td className="py-2.5 px-4 font-bold uppercase">{st.name}</td>
                          <td className="py-2.5 px-4">{st.className}-{st.section}</td>
                          <td className="py-2.5 px-4 uppercase text-slate-600">{st.fatherName}</td>
                          <td className="py-2.5 px-4 font-bold">{res.halfYearly.percentage.toFixed(2)}%</td>
                          <td className="py-2.5 px-4 font-bold text-blue-900">{res.annual.percentage.toFixed(2)}%</td>
                          <td className="py-2.5 px-4 font-bold text-[#b8860b]">{res.combined.grade}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                res.combined.status === 'PASS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {res.combined.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-1">
                            <button
                              onClick={() => {
                                handleSelectStudentForMarks(st.id);
                                setActiveTab('marks');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold"
                              title="Edit Marks"
                            >
                              Marks
                            </button>
                            <button
                              onClick={() => onViewStudentResult(st.id)}
                              className="px-2 py-1 bg-[#0f2b48] hover:bg-[#1b4975] text-white rounded font-bold inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Marksheet</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS MANAGEMENT */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f2b48] uppercase">
                  Student Records Management
                </h2>
                <p className="text-xs text-slate-500">
                  Manage student profiles, registration details, photos, and academic sessions.
                </p>
              </div>
              <button
                onClick={handleStartAddStudent}
                className="px-4 py-2 bg-[#0f2b48] hover:bg-[#1b4975] text-white text-xs font-bold rounded shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Student</span>
              </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Photo</th>
                    <th className="py-3 px-4">Roll</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Father / Mother</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">DOB</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="w-8 h-10 border border-slate-300 rounded overflow-hidden bg-slate-100">
                          {st.photoUrl ? (
                            <img src={st.photoUrl} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-400">
                              N/A
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#0f2b48]">{st.rollNo}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-700">{st.admissionNo}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 uppercase">{st.name}</td>
                      <td className="py-2.5 px-4 text-slate-600 uppercase">
                        <div>F: {st.fatherName}</div>
                        <div className="text-[10px] text-slate-400">M: {st.motherName}</div>
                      </td>
                      <td className="py-2.5 px-4 font-semibold">{st.className} - {st.section}</td>
                      <td className="py-2.5 px-4 text-slate-600">{st.dob}</td>
                      <td className="py-2.5 px-4 font-medium">{st.gender}</td>
                      <td className="py-2.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => onViewStudentResult(st.id)}
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                          title="View Result Marksheet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsNewStudent(false);
                            setEditingStudent(st);
                          }}
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded"
                          title="Edit Student Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(st.id)}
                          className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Student Edit Modal */}
            {editingStudent && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-4 bg-[#0f2b48] text-white flex justify-between items-center">
                    <h3 className="font-bold text-sm uppercase">
                      {isNewStudent ? 'Add New Student' : `Edit Student: ${editingStudent.name}`}
                    </h3>
                    <button
                      onClick={() => setEditingStudent(null)}
                      className="text-slate-300 hover:text-white text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-xs font-semibold text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Student Name *</label>
                        <input
                          type="text"
                          required
                          value={editingStudent.name}
                          onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48] font-bold"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Roll Number *</label>
                        <input
                          type="text"
                          required
                          value={editingStudent.rollNo}
                          onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48] font-bold"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Admission Number *</label>
                        <input
                          type="text"
                          required
                          value={editingStudent.admissionNo}
                          onChange={(e) => setEditingStudent({ ...editingStudent, admissionNo: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Date of Birth (DD/MM/YYYY)</label>
                        <input
                          type="text"
                          value={editingStudent.dob}
                          onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Father's Name</label>
                        <input
                          type="text"
                          value={editingStudent.fatherName}
                          onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Mother's Name</label>
                        <input
                          type="text"
                          value={editingStudent.motherName}
                          onChange={(e) => setEditingStudent({ ...editingStudent, motherName: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Class</label>
                        <input
                          type="text"
                          value={editingStudent.className}
                          onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Section</label>
                        <input
                          type="text"
                          value={editingStudent.section}
                          onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Gender</label>
                        <select
                          value={editingStudent.gender}
                          onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as any })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        >
                          <option value="FEMALE">FEMALE</option>
                          <option value="MALE">MALE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-[11px] uppercase font-bold">Session</label>
                        <input
                          type="text"
                          value={editingStudent.session}
                          onChange={(e) => setEditingStudent({ ...editingStudent, session: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                        />
                      </div>
                    </div>

                    {/* Photo Selector */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block mb-1 text-[11px] uppercase font-bold">Student Photo Preset / URL</label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 border border-slate-300 rounded bg-slate-100 overflow-hidden shrink-0">
                          {editingStudent.photoUrl && (
                            <img src={editingStudent.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={editingStudent.photoUrl || ''}
                            onChange={(e) => setEditingStudent({ ...editingStudent, photoUrl: e.target.value })}
                            placeholder="Enter image URL or choose preset below"
                            className="w-full p-1.5 border border-slate-300 rounded text-xs"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingStudent({ ...editingStudent, photoUrl: DEFAULT_STUDENT_PHOTO_17 })}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300"
                            >
                              Photo 1 (Priya)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudent({ ...editingStudent, photoUrl: DEFAULT_STUDENT_PHOTO_18 })}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300"
                            >
                              Photo 2 (Aman)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudent({ ...editingStudent, photoUrl: DEFAULT_STUDENT_PHOTO_FALLBACK })}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300"
                            >
                              Generic Portrait
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-[11px] uppercase font-bold">Teacher's Remark</label>
                      <textarea
                        rows={2}
                        value={editingStudent.teacherRemark || ''}
                        onChange={(e) => setEditingStudent({ ...editingStudent, teacherRemark: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded focus:border-[#0f2b48]"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#0f2b48] hover:bg-[#1b4975] text-white rounded text-xs font-bold"
                      >
                        Save Student
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MARKS MANAGEMENT */}
        {activeTab === 'marks' && (
          <div className="space-y-6">
            {/* Student Picker Banner */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 uppercase">Select Student:</span>
                <select
                  value={selectedStudentIdForMarks}
                  onChange={(e) => handleSelectStudentForMarks(e.target.value)}
                  className="p-2 border-2 border-[#0f2b48] rounded text-xs font-bold text-[#0f2b48] bg-[#f8faff]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      Roll {s.rollNo}: {s.name} ({s.className}-{s.section})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewStudentResult(selectedStudentIdForMarks)}
                  className="px-3.5 py-2 bg-[#0f2b48] hover:bg-[#1b4975] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Marksheet</span>
                </button>

                <button
                  onClick={handleSaveMarks}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Marks</span>
                </button>
              </div>
            </div>

            {/* Validation Notice if any */}
            {Object.keys(marksValidationErrors).length > 0 && (
              <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Validation Error: {Object.values(marksValidationErrors)[0]}</span>
              </div>
            )}

            {marksSaveSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 rounded text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Marks and Teacher Remark saved successfully!</span>
              </div>
            )}

            {/* Marks Grid */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-[#0f2b48] uppercase">
                  Subject Marks Entry — {currentStudent?.name} (Roll: {currentStudent?.rollNo})
                </span>
                <span className="text-slate-500 font-medium">
                  Rule: Obtained Marks ≤ Maximum Marks
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">S.No.</th>
                    <th className="py-2.5 px-4">Subject Name</th>
                    <th className="py-2.5 px-4 text-center bg-blue-50/50">Half-Yearly Max</th>
                    <th className="py-2.5 px-4 text-center bg-blue-50">Half-Yearly Obtained</th>
                    <th className="py-2.5 px-4 text-center bg-emerald-50/50">Annual Max</th>
                    <th className="py-2.5 px-4 text-center bg-emerald-50">Annual Obtained</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.filter((s) => s.active).map((subj, idx) => {
                    const studentMark = currentMarks[subj.id] || { halfObtained: 0, annualObtained: 0 };
                    const halfErr = marksValidationErrors[`${subj.id}_half`];
                    const annualErr = marksValidationErrors[`${subj.id}_annual`];

                    return (
                      <tr key={subj.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-4 font-bold text-slate-900 uppercase">
                          {subj.name}
                        </td>
                        <td className="py-2 px-4 text-center font-bold text-slate-600 bg-blue-50/20">
                          {subj.halfMax}
                        </td>
                        <td className="py-2 px-4 text-center bg-blue-50/40">
                          <input
                            type="number"
                            min="0"
                            max={subj.halfMax}
                            value={studentMark.halfObtained}
                            onChange={(e) => handleMarkChange(subj.id, 'half', e.target.value)}
                            className={`w-20 text-center py-1 font-bold text-xs border rounded ${
                              halfErr ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200' : 'border-slate-300'
                            }`}
                          />
                          {halfErr && <span className="text-[9px] text-red-600 block mt-0.5">{halfErr}</span>}
                        </td>
                        <td className="py-2 px-4 text-center font-bold text-slate-600 bg-emerald-50/20">
                          {subj.annualMax}
                        </td>
                        <td className="py-2 px-4 text-center bg-emerald-50/40">
                          <input
                            type="number"
                            min="0"
                            max={subj.annualMax}
                            value={studentMark.annualObtained}
                            onChange={(e) => handleMarkChange(subj.id, 'annual', e.target.value)}
                            className={`w-20 text-center py-1 font-bold text-xs border rounded ${
                              annualErr ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200' : 'border-slate-300'
                            }`}
                          />
                          {annualErr && <span className="text-[9px] text-red-600 block mt-0.5">{annualErr}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Dynamic Live Totals & Percentage Summary */}
              {liveResult && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-3 rounded border border-blue-200 shadow-2xs">
                    <span className="font-bold text-blue-900 block uppercase">Half-Yearly (Term I)</span>
                    <p className="mt-1 text-slate-700">
                      Total: <strong className="text-[#0f2b48]">{liveResult.halfYearly.obtained}</strong> / {liveResult.halfYearly.maximum}
                    </p>
                    <p className="text-slate-700">
                      Percentage: <strong>{liveResult.halfYearly.percentage.toFixed(2)}%</strong>
                    </p>
                    <p className="text-slate-700">
                      Grade: <strong className="text-[#b8860b]">{liveResult.halfYearly.grade}</strong> ({liveResult.halfYearly.status})
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border border-emerald-200 shadow-2xs">
                    <span className="font-bold text-emerald-900 block uppercase">Annual (Term II)</span>
                    <p className="mt-1 text-slate-700">
                      Total: <strong className="text-[#0f2b48]">{liveResult.annual.obtained}</strong> / {liveResult.annual.maximum}
                    </p>
                    <p className="text-slate-700">
                      Percentage: <strong>{liveResult.annual.percentage.toFixed(2)}%</strong>
                    </p>
                    <p className="text-slate-700">
                      Grade: <strong className="text-[#b8860b]">{liveResult.annual.grade}</strong> ({liveResult.annual.status})
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border border-[#0f2b48]/30 bg-[#0f2b48]/5 shadow-2xs">
                    <span className="font-bold text-[#0f2b48] block uppercase">Final Combined Aggregate</span>
                    <p className="mt-1 text-slate-700">
                      Grand Total: <strong className="text-[#0f2b48]">{liveResult.combined.obtained}</strong> / {liveResult.combined.maximum}
                    </p>
                    <p className="text-slate-700">
                      Combined %: <strong className="text-amber-700">{liveResult.combined.percentage.toFixed(2)}%</strong>
                    </p>
                    <p className="text-slate-700">
                      Progress: <strong>{liveResult.progress > 0 ? `+${liveResult.progress.toFixed(2)}%` : `${liveResult.progress.toFixed(2)}%`}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Teacher Remark Section */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <label className="block text-xs font-bold text-[#0f2b48] uppercase mb-1">
                  Teacher's Remark for this Student:
                </label>
                <textarea
                  rows={2}
                  value={currentRemark}
                  onChange={(e) => setCurrentRemark(e.target.value)}
                  placeholder="e.g. Excellent academic performance! Very attentive and sincere."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs font-bold text-slate-800"
                />
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="text-slate-400 font-semibold">Quick Remarks:</span>
                  <button
                    type="button"
                    onClick={() => setCurrentRemark('Excellent academic performance! Attentive, disciplined and diligent. Keep it up!')}
                    className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                  >
                    Outstanding / A+
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRemark('Good effort in practical work. Needs improvement in Mathematics and English grammar. Focus on regular practice.')}
                    className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                  >
                    Needs Improvement
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRemark('Satisfactory academic progress. Regular homework submission and active classroom participation appreciated.')}
                    className="bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200"
                  >
                    Satisfactory
                  </button>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={handleSaveMarks}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUBJECTS MANAGEMENT */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#0f2b48] uppercase">
                  Curriculum Subjects Management
                </h2>
                <p className="text-xs text-slate-500">
                  Configure subjects, maximum marks for Half-Yearly & Annual terms, passing marks, and display order.
                </p>
              </div>

              {/* Add Subject Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New subject name..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                />
                <button
                  onClick={handleAddSubject}
                  className="px-3 py-1.5 bg-[#0f2b48] hover:bg-[#1b4975] text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-16">Order</th>
                    <th className="py-2.5 px-4">Subject Name</th>
                    <th className="py-2.5 px-4 text-center">Half-Yearly Max</th>
                    <th className="py-2.5 px-4 text-center">Annual Max</th>
                    <th className="py-2.5 px-4 text-center">Passing Marks</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editingSubjects.map((subj) => (
                    <tr key={subj.id} className="hover:bg-slate-50">
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          value={subj.displayOrder}
                          onChange={(e) => handleSubjectChange(subj.id, 'displayOrder', Number(e.target.value))}
                          className="w-12 text-center p-1 border rounded text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={subj.name}
                          onChange={(e) => handleSubjectChange(subj.id, 'name', e.target.value)}
                          className="p-1 border rounded text-xs font-bold w-48 uppercase"
                        />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <input
                          type="number"
                          value={subj.halfMax}
                          onChange={(e) => handleSubjectChange(subj.id, 'halfMax', Number(e.target.value))}
                          className="w-16 text-center p-1 border rounded text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <input
                          type="number"
                          value={subj.annualMax}
                          onChange={(e) => handleSubjectChange(subj.id, 'annualMax', Number(e.target.value))}
                          className="w-16 text-center p-1 border rounded text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <input
                          type="number"
                          value={subj.passingMarks}
                          onChange={(e) => handleSubjectChange(subj.id, 'passingMarks', Number(e.target.value))}
                          className="w-16 text-center p-1 border rounded text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSubjectChange(subj.id, 'active', !subj.active)}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            subj.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {subj.active ? 'ACTIVE' : 'DISABLED'}
                        </button>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSubject(subj.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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

        {/* TAB 5: SCHOOL SETTINGS */}
        {activeTab === 'school' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs max-w-4xl">
            <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#0f2b48] uppercase">
                  School Information, Logo & Seal Customization
                </h2>
                <p className="text-xs text-slate-500">
                  Manage school details, update official crest logo, seal/stamp preference, and default examination mode.
                </p>
              </div>
              {settingsSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Changes Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs font-semibold text-slate-700">
              {/* SECTION A: SCHOOL LOGO & OFFICIAL SEAL */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h3 className="text-xs font-bold text-[#0f2b48] uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Image className="w-4 h-4 text-[#0f2b48]" />
                  <span>1. Official School Logo & Crest (विद्यालय का लोगो)</span>
                </h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-lg border-2 border-slate-300 bg-white p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                    {settingsForm.logoUrl ? (
                      <img
                        src={settingsForm.logoUrl}
                        alt="School Logo"
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold text-center">No Logo</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 bg-[#0f2b48] hover:bg-[#1b4975] text-white text-xs font-bold rounded cursor-pointer flex items-center gap-1.5 transition-all shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageFileUpload(e, (url) => setSettingsForm({ ...settingsForm, logoUrl: url }))}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, logoUrl: DEFAULT_SCHOOL_LOGO })}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded flex items-center gap-1 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore Default Crest</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        या Logo URL दर्ज करें (Image Link):
                      </label>
                      <input
                        type="text"
                        value={settingsForm.logoUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                        placeholder="https://... or base64"
                        className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: SEAL / STAMP CUSTOMIZATION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h3 className="text-xs font-bold text-[#0f2b48] uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Shield className="w-4 h-4 text-[#0f2b48]" />
                  <span>2. Official Seal / Principal Stamp (विद्यालय की मुहर / सील)</span>
                </h3>

                {/* Stamp Preference Radio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      settingsForm.showDigitalStamp
                        ? 'border-[#0f2b48] bg-blue-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stampType"
                      checked={settingsForm.showDigitalStamp === true}
                      onChange={() => setSettingsForm({ ...settingsForm, showDigitalStamp: true, stampType: 'digital' })}
                      className="mt-0.5 text-[#0f2b48]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">डिजिटल मुहर (Uploaded Digital Seal)</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        अंकपत्र पर अपलोड की गई असली गोल मुहर छपेगी।
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      !settingsForm.showDigitalStamp
                        ? 'border-[#0f2b48] bg-blue-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stampType"
                      checked={settingsForm.showDigitalStamp === false}
                      onChange={() => setSettingsForm({ ...settingsForm, showDigitalStamp: false, stampType: 'physical' })}
                      className="mt-0.5 text-[#0f2b48]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">भौतिक रबर स्टैम्प (Physical Ink Stamping)</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        अंकपत्र पर खाली डॉटेड गोला छपेगा ताकि आप स्कूल की मूल स्याही वाली मुहर हाथ से लगा सकें।
                      </span>
                    </div>
                  </label>
                </div>

                {/* Digital Stamp Upload / Preview if enabled */}
                {settingsForm.showDigitalStamp && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t border-slate-200">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-400 bg-white p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                      {settingsForm.principalStampUrl ? (
                        <img
                          src={settingsForm.principalStampUrl}
                          alt="Official Seal"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-400 font-bold text-center">No Seal</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 bg-[#0f2b48] hover:bg-[#1b4975] text-white text-xs font-bold rounded cursor-pointer flex items-center gap-1.5 transition-all shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Original Seal Image (PNG/JPG)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageFileUpload(e, (url) =>
                                setSettingsForm({ ...settingsForm, principalStampUrl: url, showDigitalStamp: true })
                              )
                            }
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, principalStampUrl: '' })}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded border border-rose-200 transition-all"
                        >
                          मुहर हटाएं (Clear Stamp)
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          या Seal Image URL दर्ज करें:
                        </label>
                        <input
                          type="text"
                          value={settingsForm.principalStampUrl || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, principalStampUrl: e.target.value })}
                          placeholder="https://... or base64"
                          className="w-full p-2 border border-slate-300 rounded text-slate-900 bg-white font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: EXAM EVALUATION MODE (HALF-YEARLY VS COMBINED) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h3 className="text-xs font-bold text-[#0f2b48] uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Layers className="w-4 h-4 text-[#0f2b48]" />
                  <span>3. Examination Mode (परीक्षा अंकपत्र प्रकार)</span>
                </h3>

                <p className="text-[11px] text-slate-500">
                  चुनें कि छात्र पोर्टल और डिफॉल्ट अंकपत्र में केवल अर्धवार्षिक परीक्षा दिखानी है या दोनों:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      settingsForm.defaultExamMode === 'half_yearly_only'
                        ? 'border-[#0f2b48] bg-blue-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultExamMode"
                      checked={settingsForm.defaultExamMode === 'half_yearly_only'}
                      onChange={() => setSettingsForm({ ...settingsForm, defaultExamMode: 'half_yearly_only' })}
                      className="mt-0.5 text-[#0f2b48]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        केवल अर्धवार्षिक परीक्षा (Half-Yearly Only)
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        अंकपत्र पर केवल अर्धवार्षिक के अंक और ग्रेड प्रदर्शित होंगे। वार्षिक परीक्षा का कोई कॉलम नहीं आएगा।
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      settingsForm.defaultExamMode === 'combined'
                        ? 'border-[#0f2b48] bg-blue-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultExamMode"
                      checked={settingsForm.defaultExamMode === 'combined'}
                      onChange={() => setSettingsForm({ ...settingsForm, defaultExamMode: 'combined' })}
                      className="mt-0.5 text-[#0f2b48]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        संयुक्त परीक्षा परिणाम (Combined Half-Yearly + Annual)
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        अंकपत्र पर अर्धवार्षिक, वार्षिक एवं संयुक्त योग (Grand Total) तीनों कॉलम दिखेंगे।
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block mb-1 font-bold uppercase text-[11px]">
                      Half-Yearly Result Title (अर्धवार्षिक शीर्षक)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.resultTitleHalfYearly || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, resultTitleHalfYearly: e.target.value })}
                      placeholder="ACADEMIC RESULT — HALF-YEARLY EXAMINATION"
                      className="w-full p-2 border border-slate-300 rounded font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold uppercase text-[11px]">
                      Combined Result Title (संयुक्त शीर्षक)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.resultTitle}
                      onChange={(e) => setSettingsForm({ ...settingsForm, resultTitle: e.target.value })}
                      placeholder="ACADEMIC RESULT — HALF-YEARLY & ANNUAL"
                      className="w-full p-2 border border-slate-300 rounded font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: SCHOOL CONTACT & REGISTRATION DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold uppercase text-[11px]">School Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.schoolName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, schoolName: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold uppercase text-[11px]">School Address</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold uppercase text-[11px]">Managed By</label>
                  <input
                    type="text"
                    value={settingsForm.managedBy}
                    onChange={(e) => setSettingsForm({ ...settingsForm, managedBy: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold uppercase text-[11px]">Mobile Number</label>
                  <input
                    type="text"
                    value={settingsForm.mobile}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mobile: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold uppercase text-[11px]">School Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded text-slate-900"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold uppercase text-[11px]">Academic Session</label>
                  <input
                    type="text"
                    value={settingsForm.session}
                    onChange={(e) => setSettingsForm({ ...settingsForm, session: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-bold"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold uppercase text-[11px]">Header Badge Text</label>
                  <select
                    value={settingsForm.schoolBadgeType}
                    onChange={(e) => setSettingsForm({ ...settingsForm, schoolBadgeType: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded font-bold"
                  >
                    <option value="OFFICIAL RESULT">OFFICIAL RESULT</option>
                    <option value="ACADEMIC RESULT">ACADEMIC RESULT</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 font-bold uppercase text-[11px]">Footer Motivational Text</label>
                  <input
                    type="text"
                    value={settingsForm.footerText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, footerText: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* SECTION E: SIGNATURES */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h3 className="text-xs font-bold text-[#0f2b48] uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Edit2 className="w-4 h-4 text-[#0f2b48]" />
                  <span>4. Teacher & Principal Signatures (हस्ताक्षर)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Teacher Signature */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Class Teacher Signature (कक्षा अध्यापक हस्ताक्षर)
                    </label>
                    <div className="h-14 border border-slate-300 rounded bg-white p-1 flex items-center justify-center overflow-hidden">
                      {settingsForm.teacherSignatureUrl ? (
                        <img
                          src={settingsForm.teacherSignatureUrl}
                          alt="Teacher Signature"
                          className="h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">No Signature</span>
                      )}
                    </div>
                    <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Teacher Signature</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageFileUpload(e, (url) => setSettingsForm({ ...settingsForm, teacherSignatureUrl: url }))
                        }
                      />
                    </label>
                  </div>

                  {/* Principal Signature */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Principal Signature (प्रधानाचार्य हस्ताक्षर)
                    </label>
                    <div className="h-14 border border-slate-300 rounded bg-white p-1 flex items-center justify-center overflow-hidden">
                      {settingsForm.principalSignatureUrl ? (
                        <img
                          src={settingsForm.principalSignatureUrl}
                          alt="Principal Signature"
                          className="h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">No Signature</span>
                      )}
                    </div>
                    <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Principal Signature</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageFileUpload(e, (url) => setSettingsForm({ ...settingsForm, principalSignatureUrl: url }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0f2b48] hover:bg-[#1b4975] text-white rounded font-bold flex items-center gap-2 shadow cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All School Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: GRADE RULES */}
        {activeTab === 'grades' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs max-w-3xl">
            <div className="border-b border-slate-200 pb-3 mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#0f2b48] uppercase">
                  Academic Grade Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Grade boundaries used for Half-Yearly, Annual, and Combined percentage calculations.
                </p>
              </div>
              {gradesSaved && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveGrades} className="space-y-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Min %</th>
                    <th className="py-2.5 px-3">Max %</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {rulesForm.map((rule, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={rule.grade}
                          onChange={(e) => {
                            const updated = [...rulesForm];
                            updated[idx].grade = e.target.value;
                            setRulesForm(updated);
                          }}
                          className="w-16 p-1 border rounded text-center text-[#b8860b]"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={rule.minPercentage}
                          onChange={(e) => {
                            const updated = [...rulesForm];
                            updated[idx].minPercentage = Number(e.target.value);
                            setRulesForm(updated);
                          }}
                          className="w-20 p-1 border rounded text-center"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={rule.maxPercentage}
                          onChange={(e) => {
                            const updated = [...rulesForm];
                            updated[idx].maxPercentage = Number(e.target.value);
                            setRulesForm(updated);
                          }}
                          className="w-20 p-1 border rounded text-center"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={rule.description}
                          onChange={(e) => {
                            const updated = [...rulesForm];
                            updated[idx].description = e.target.value;
                            setRulesForm(updated);
                          }}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0f2b48] hover:bg-[#1b4975] text-white rounded font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Grade Rules</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: GOOGLE SHEETS SYNC & APPS SCRIPT CODE */}
        {activeTab === 'sheets' && (
          <div className="space-y-6 max-w-4xl">
            {/* 1. Google Sheets Live Integration Box */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <h2 className="text-base font-bold text-[#0f2b48] uppercase">
                  Google Sheets Live Integration (Google Apps Script)
                </h2>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                अपने स्कूल का पूरा डाटा Google Sheet में सुरक्षित रखने और लाइव फेच करने के लिए अपने Google Apps Script Web App का URL यहाँ जोड़ें। छात्र जब रोल नंबर या प्रवेश संख्या डालेंगे, तो पोर्टल सीधे आपके Google Sheet से नवीनतम अंक और जानकारी प्राप्त कर सकता है।
              </p>

              {/* Web App URL Input */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Google Apps Script Web App URL (Deploy as Web App URL)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={settingsForm.googleSheetWebAppUrl || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, googleSheetWebAppUrl: e.target.value })
                    }
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 p-2.5 border border-slate-300 rounded font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#0f2b48]"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSaveSchoolSettings(settingsForm);
                        saveGoogleSheetUrl(settingsForm.googleSheetWebAppUrl || '');
                        setUrlSavedNotice(true);
                        setTimeout(() => setUrlSavedNotice(false), 3000);
                      }}
                      className="px-4 py-2.5 bg-[#0f2b48] hover:bg-[#1b4975] text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save URL (सुरक्षित करें)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTestGoogleSheet}
                      disabled={isTestingSheet}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingSheet ? 'animate-spin' : ''}`} />
                      <span>{isTestingSheet ? 'Testing...' : 'Test Connection (कनेक्शन जांचें)'}</span>
                    </button>
                  </div>
                </div>

                {/* URL Saved Notice */}
                {urlSavedNotice && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Google Sheet Web App URL सुरक्षित कर दिया गया है!</span>
                  </div>
                )}

                {/* Connection Status Banner */}
                {sheetTestStatus && (
                  <div
                    className={`p-3 rounded text-xs font-semibold flex items-start gap-2 ${
                      sheetTestStatus.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {sheetTestStatus.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{sheetTestStatus.message}</span>
                  </div>
                )}

                {/* 2-Way Sync Actions */}
                <div className="pt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 mt-2">
                  <button
                    type="button"
                    onClick={handleSyncToGoogleSheet}
                    disabled={isSyncingSheet}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Website se sara data Google Sheet me bhejain"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isSyncingSheet ? 'Syncing...' : '1. Push All Data to Google Sheet (शीट में भेजें)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchFromGoogleSheet}
                    disabled={isFetchingSheet}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Google Sheet se sara data portal me load karein"
                  >
                    <Download className={`w-3.5 h-3.5 ${isFetchingSheet ? 'animate-bounce' : ''}`} />
                    <span>{isFetchingSheet ? 'Fetching...' : '2. Pull Live Data from Google Sheet (शीट से लाएं)'}</span>
                  </button>

                  {sheetSyncSuccess && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> {sheetSyncSuccess}
                    </span>
                  )}

                  {sheetFetchSuccess && (
                    <span className="text-xs text-purple-700 font-bold flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded border border-purple-200">
                      <Check className="w-3.5 h-3.5" /> {sheetFetchSuccess}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Download CSV Templates for 6 Sheets */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#0f2b48] uppercase flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download Ready CSV Sheets (Google Sheets Templates)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    इन CSV फाइल्स को डाउनलोड कर सीधे अपने Google Drive में SpreadSheet बना कर Import करें।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAllJson}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-300 flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full JSON Backup</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportStudentsCsv}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0f2b48] group-hover:text-emerald-800">
                      1. Students.csv
                    </span>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {students.length} छात्र रिकॉर्ड्स (Roll, Name, Class, DOB...)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMarksCsv}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0f2b48] group-hover:text-emerald-800">
                      2. Marks.csv
                    </span>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Half-Yearly एवं Annual प्राप्तांक तालिका
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportSubjectsCsv}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0f2b48] group-hover:text-emerald-800">
                      3. Subjects.csv
                    </span>
                    <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {subjects.length} विषय और पूर्णांक/उत्तीर्णांक सूची
                  </span>
                </button>
              </div>
            </div>

            {/* 3. 6-Sheets Structure Specs */}
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-[#0f2b48] uppercase mb-3">
                Google Sheets Official 6-Tab Architecture
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-6">
                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <span className="font-bold text-[#0f2b48] block">SHEET 1: Students</span>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    Student_ID, Student_Name, Father_Name, Mother_Name, Date_of_Birth, Gender, Class, Section, Roll_No, Admission_No, Photo_URL, Session
                  </p>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <span className="font-bold text-[#0f2b48] block">SHEET 2: Marks</span>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    Student_ID, Subject, Half_Max, Half_Obtained, Annual_Max, Annual_Obtained
                  </p>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <span className="font-bold text-[#0f2b48] block">SHEET 3: Subjects</span>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    Subject_ID, Subject_Name, Display_Order, Half_Max, Annual_Max, Passing_Marks, Active
                  </p>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <span className="font-bold text-[#0f2b48] block">SHEET 4: School_Settings</span>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    Setting, Value (school_name, address, managed_by, mobile, logo_url, tagline, session, defaultExamMode, etc.)
                  </p>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <span className="font-bold text-[#0f2b48] block">SHEET 5: Grade_Settings</span>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    Min_Percentage, Max_Percentage, Grade, Description
                  </p>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <span className="font-bold text-[#0f2b48] block">SHEET 6: Remarks</span>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    Remark_ID, Class, Performance_Level, Remark_Text
                  </p>
                </div>
              </div>

              {/* Ready Google Apps Script Code */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <div className="bg-[#0f2b48] text-white px-4 py-2 flex justify-between items-center text-xs font-bold">
                  <span>Google Apps Script Backend (Code.gs) - Ready to Copy & Paste</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
                      setCodeCopiedNotice(true);
                      setTimeout(() => setCodeCopiedNotice(false), 3500);
                    }}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    {codeCopiedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied to Clipboard! (कॉपी हो गया)</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Copy Complete Code.gs</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 leading-relaxed select-all">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
