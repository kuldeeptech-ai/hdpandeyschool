import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Student,
  SubjectConfig,
  SchoolSettings,
  GradeRule,
  StudentResultData,
} from './types';
import {
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_SUBJECTS,
  DEFAULT_STUDENTS,
} from './data/defaultData';
import {
  DEFAULT_GRADE_RULES,
  calculateStudentResult,
} from './utils/calculations';
import { PublicSearch } from './components/PublicSearch';
import { ResultViewer } from './components/ResultViewer';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  getGoogleSheetUrl,
  fetchAllFromGoogleSheet,
  searchStudentFromGoogleSheet,
  syncAllDataToGoogleSheet,
} from './utils/googleSheetSync';

type ViewMode = 'public_search' | 'result_view' | 'admin';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('public_search');

  // Admin authentication state (User ID: Kld75, Password: Kld@2314)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('school_admin_auth') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);

  // Persistence State
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('hd_pandey_students');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
  });

  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => {
    const saved = localStorage.getItem('hd_pandey_subjects');
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem('hd_pandey_settings');
    const initial = saved ? JSON.parse(saved) : DEFAULT_SCHOOL_SETTINGS;
    const detectedSheetUrl = getGoogleSheetUrl(initial);
    if (detectedSheetUrl && !initial.googleSheetWebAppUrl) {
      initial.googleSheetWebAppUrl = detectedSheetUrl;
    }
    return initial;
  });

  const [gradeRules, setGradeRules] = useState<GradeRule[]>(() => {
    const saved = localStorage.getItem('hd_pandey_grades');
    return saved ? JSON.parse(saved) : DEFAULT_GRADE_RULES;
  });

  const [activeResult, setActiveResult] = useState<StudentResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedStudentForAdminMarks, setSelectedStudentForAdminMarks] = useState<string | undefined>(undefined);

  // Sync with backend API or Google Sheet on initial mount
  useEffect(() => {
    // 1. Backend API (if running Express server)
    fetch('/api/admin/data')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data) {
          if (data.students?.length) setStudents(data.students);
          if (data.subjects?.length) setSubjects(data.subjects);
          if (data.schoolSettings) setSchoolSettings(data.schoolSettings);
          if (data.gradeRules?.length) setGradeRules(data.gradeRules);
        }
      })
      .catch(() => {});

    // 2. Live Google Sheet fetch (works on Vercel, GitHub Pages, or any host)
    const sheetUrl = getGoogleSheetUrl(schoolSettings);
    if (sheetUrl) {
      fetchAllFromGoogleSheet(sheetUrl).then((sheetData) => {
        if (sheetData) {
          if (sheetData.students && sheetData.students.length > 0) {
            setStudents(sheetData.students);
          }
          if (sheetData.subjects && sheetData.subjects.length > 0) {
            setSubjects(sheetData.subjects);
          }
          if (sheetData.settings && Object.keys(sheetData.settings).length > 0) {
            setSchoolSettings((prev) => ({ ...prev, ...sheetData.settings }));
          }
          if (sheetData.gradeRules && sheetData.gradeRules.length > 0) {
            setGradeRules(sheetData.gradeRules);
          }
        }
      }).catch(() => {});
    }
  }, []);

  // Save to localStorage whenever states change
  useEffect(() => {
    localStorage.setItem('hd_pandey_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('hd_pandey_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('hd_pandey_settings', JSON.stringify(schoolSettings));
  }, [schoolSettings]);

  useEffect(() => {
    localStorage.setItem('hd_pandey_grades', JSON.stringify(gradeRules));
  }, [gradeRules]);

  // Handle Search function
  const handleSearch = useCallback(
    async (query: string): Promise<boolean> => {
      setIsLoading(true);
      setErrorMessage(null);

      const cleanQuery = query.trim().toLowerCase();
      const sheetUrl = getGoogleSheetUrl(schoolSettings);

      // 1. If Google Sheet Web App URL is configured, query it first for live sheet data
      if (sheetUrl) {
        try {
          const liveStudent = await searchStudentFromGoogleSheet(sheetUrl, cleanQuery);
          if (liveStudent) {
            const result = calculateStudentResult(liveStudent, subjects, schoolSettings, gradeRules);
            setActiveResult(result);
            setViewMode('result_view');
            setIsLoading(false);
            const url = new URL(window.location.href);
            url.searchParams.set('roll', liveStudent.rollNo);
            window.history.pushState({}, '', url.toString());
            return true;
          }
        } catch (err) {
          console.warn('Google Sheet live query failed or offline, falling back to local database:', err);
        }
      }

      // 2. Try fetching from backend API to ensure server-side isolation
      try {
        const res = await fetch(`/api/result?roll=${encodeURIComponent(cleanQuery)}&admission=${encodeURIComponent(cleanQuery)}`);
        if (res.ok) {
          const resultData: StudentResultData = await res.json();
          setActiveResult(resultData);
          setViewMode('result_view');
          setIsLoading(false);
          const url = new URL(window.location.href);
          url.searchParams.set('roll', resultData.student.rollNo);
          window.history.pushState({}, '', url.toString());
          return true;
        }
      } catch (e) {
        // Fallback to local data evaluation
      }

      // Local fallback search
      const matched = students.find((s) => {
        const rollMatch = s.rollNo.trim().toLowerCase() === cleanQuery;
        const admMatch = s.admissionNo.trim().toLowerCase() === cleanQuery;
        const idMatch = s.id.toLowerCase() === cleanQuery;
        return rollMatch || admMatch || idMatch;
      });

      if (matched) {
        const result = calculateStudentResult(matched, subjects, schoolSettings, gradeRules);
        setActiveResult(result);
        setViewMode('result_view');
        setIsLoading(false);
        const url = new URL(window.location.href);
        url.searchParams.set('roll', matched.rollNo);
        window.history.pushState({}, '', url.toString());
        return true;
      } else {
        setErrorMessage('Please check your Roll Number / Admission Number or contact school administration.');
        setIsLoading(false);
        return false;
      }
    },
    [students, subjects, schoolSettings, gradeRules]
  );

  // Check URL parameters on mount (e.g. ?roll=17)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roll = params.get('roll');
    const admission = params.get('admission');
    const id = params.get('id');

    if (roll) {
      handleSearch(roll);
    } else if (admission) {
      handleSearch(admission);
    } else if (id) {
      handleSearch(id);
    }
  }, [handleSearch]);

  // Back to search
  const handleBackToSearch = () => {
    setViewMode('public_search');
    const url = new URL(window.location.href);
    url.searchParams.delete('roll');
    url.searchParams.delete('admission');
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  };

  // View specific student result from Admin
  const handleViewStudentResult = (studentId: string) => {
    const st = students.find((s) => s.id === studentId);
    if (st) {
      const res = calculateStudentResult(st, subjects, schoolSettings, gradeRules);
      setActiveResult(res);
      setViewMode('result_view');
    }
  };

  // Admin access gatekeeper
  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setViewMode('admin');
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowAdminLoginModal(false);
    setViewMode('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('school_admin_auth');
    sessionStorage.removeItem('school_admin_user');
    setViewMode('public_search');
  };

  // Jump from ResultViewer to Admin Marks
  const handleOpenAdminMarks = (studentId: string) => {
    setSelectedStudentForAdminMarks(studentId);
    if (isAdminAuthenticated) {
      setViewMode('admin');
    } else {
      setShowAdminLoginModal(true);
    }
  };

  // Save Handlers (Local state, LocalStorage, Express API, and Google Sheets Sync)
  const handleSaveStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    fetch('/api/admin/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudents),
    }).catch(() => {});

    const sheetUrl = getGoogleSheetUrl(schoolSettings);
    if (sheetUrl) {
      syncAllDataToGoogleSheet(sheetUrl, {
        schoolSettings,
        students: newStudents,
        subjects,
        gradeRules,
      }).catch(() => {});
    }
  };

  const handleSaveSubjects = (newSubjects: SubjectConfig[]) => {
    setSubjects(newSubjects);
    fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjects: newSubjects }),
    }).catch(() => {});

    const sheetUrl = getGoogleSheetUrl(schoolSettings);
    if (sheetUrl) {
      syncAllDataToGoogleSheet(sheetUrl, {
        schoolSettings,
        students,
        subjects: newSubjects,
        gradeRules,
      }).catch(() => {});
    }
  };

  const handleSaveSchoolSettings = (newSettings: SchoolSettings) => {
    setSchoolSettings(newSettings);
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch(() => {});

    const sheetUrl = getGoogleSheetUrl(newSettings);
    if (sheetUrl) {
      syncAllDataToGoogleSheet(sheetUrl, {
        schoolSettings: newSettings,
        students,
        subjects,
        gradeRules,
      }).catch(() => {});
    }
  };

  const handleSaveGradeRules = (newRules: GradeRule[]) => {
    setGradeRules(newRules);
    fetch('/api/admin/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeRules: newRules }),
    }).catch(() => {});

    const sheetUrl = getGoogleSheetUrl(schoolSettings);
    if (sheetUrl) {
      syncAllDataToGoogleSheet(sheetUrl, {
        schoolSettings,
        students,
        subjects,
        gradeRules: newRules,
      }).catch(() => {});
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 font-sans">
      {/* 1. Public Search View */}
      {viewMode === 'public_search' && (
        <PublicSearch
          schoolSettings={schoolSettings}
          onSearch={handleSearch}
          errorMessage={errorMessage}
          isLoading={isLoading}
          onSwitchToAdmin={handleOpenAdmin}
        />
      )}

      {/* 2. Official Academic Marksheet A4 Viewer */}
      {viewMode === 'result_view' && activeResult && (
        <ResultViewer
          resultData={activeResult}
          onBackToSearch={handleBackToSearch}
          onOpenAdminMarks={handleOpenAdminMarks}
        />
      )}

      {/* 3. School Admin Management Console (Secured: User ID: Kld75, Password: Kld@2314) */}
      {viewMode === 'admin' && isAdminAuthenticated && (
        <AdminPanel
          students={students}
          subjects={subjects}
          schoolSettings={schoolSettings}
          gradeRules={gradeRules}
          onSaveStudents={handleSaveStudents}
          onSaveSubjects={handleSaveSubjects}
          onSaveSchoolSettings={handleSaveSchoolSettings}
          onSaveGradeRules={handleSaveGradeRules}
          onViewStudentResult={handleViewStudentResult}
          onBackToPublic={handleBackToSearch}
          onLogout={handleAdminLogout}
          initialSelectedStudentId={selectedStudentForAdminMarks}
        />
      )}

      {/* 4. Secure Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={handleAdminLoginSuccess}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
