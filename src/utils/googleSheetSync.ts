import { Student, SubjectConfig, SchoolSettings, GradeRule } from '../types';

/**
 * Returns the effective Google Sheet Web App URL from all potential sources:
 * 1. School Settings stored in app/database
 * 2. localStorage ('google_sheet_webapp_url')
 * 3. Vite environment variable (VITE_GOOGLE_SHEET_URL) configured in Vercel or GitHub
 */
export function getGoogleSheetUrl(settings?: SchoolSettings): string {
  if (settings?.googleSheetWebAppUrl && settings.googleSheetWebAppUrl.trim().startsWith('http')) {
    return settings.googleSheetWebAppUrl.trim();
  }
  const fromLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('google_sheet_webapp_url') : null;
  if (fromLocal && fromLocal.trim().startsWith('http')) {
    return fromLocal.trim();
  }
  const fromEnv = (import.meta as any).env?.VITE_GOOGLE_SHEET_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().startsWith('http')) {
    return fromEnv.trim();
  }
  return '';
}

export function saveGoogleSheetUrl(url: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('google_sheet_webapp_url', url.trim());
  }
}

/**
 * Test connectivity with Google Apps Script Web App
 */
export async function testGoogleSheetConnection(url: string): Promise<{ success: boolean; message: string; data?: any }> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { success: false, message: 'कृपया पहले Google Sheet Web App URL दर्ज करें!' };
  }

  try {
    const res = await fetch(`${cleanUrl}?action=settings`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return {
        success: false,
        message: `कनेक्शन स्टेटस: HTTP ${res.status}. सुनिश्चित करें कि Google Apps Script में "Who has access: Anyone" चुना गया है।`,
      };
    }

    const data = await res.json().catch(() => null);
    return {
      success: true,
      message: 'सफलतापूर्वक Google Sheet से कनेक्ट हो गया! (Google Sheet Live Connection Active)',
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `कनेक्शन एरर: ${err.message || 'नेटवर्क या CORS की समस्या'}. कृपया सुनिश्चित करें कि आपने Google Apps Script में "New Deployment" बनाया है।`,
    };
  }
}

/**
 * Fetch all students, subjects, settings, and grade rules from Google Sheet
 */
export async function fetchAllFromGoogleSheet(url: string): Promise<{
  students?: Student[];
  subjects?: SubjectConfig[];
  settings?: Partial<SchoolSettings>;
  gradeRules?: GradeRule[];
} | null> {
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  try {
    const res = await fetch(`${cleanUrl}?action=allData`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (!json) return null;

    return {
      students: Array.isArray(json.students) ? json.students : undefined,
      subjects: Array.isArray(json.subjects) ? json.subjects : undefined,
      settings: json.settings && typeof json.settings === 'object' ? json.settings : undefined,
      gradeRules: Array.isArray(json.gradeRules) ? json.gradeRules : undefined,
    };
  } catch (err) {
    console.warn('Could not fetch allData from Google Sheet:', err);
    return null;
  }
}

/**
 * Search single student result from Google Sheet by Roll No or Admission No
 */
export async function searchStudentFromGoogleSheet(url: string, query: string): Promise<Student | null> {
  const cleanUrl = url.trim();
  const cleanQuery = query.trim();
  if (!cleanUrl || !cleanQuery) return null;

  try {
    const res = await fetch(
      `${cleanUrl}?roll=${encodeURIComponent(cleanQuery)}&admission=${encodeURIComponent(cleanQuery)}`,
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );

    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.student) {
      return json.student as Student;
    }
    return null;
  } catch (err) {
    console.warn('Google Sheet student query failed:', err);
    return null;
  }
}

/**
 * Push all local data (Students, Marks, Subjects, School Settings, Grade Rules)
 * directly into Google Sheets.
 */
export async function syncAllDataToGoogleSheet(
  url: string,
  payload: {
    schoolSettings: SchoolSettings;
    students: Student[];
    subjects: SubjectConfig[];
    gradeRules: GradeRule[];
  }
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { success: false, message: 'Google Sheet Web App URL सेट नहीं है!' };
  }

  const syncData = {
    action: 'syncAll',
    schoolSettings: payload.schoolSettings,
    students: payload.students,
    subjects: payload.subjects,
    gradeRules: payload.gradeRules,
    timestamp: new Date().toISOString(),
  };

  try {
    // Send as POST payload
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors', // Essential for Google Apps Script Web App redirects
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncData),
    });

    return {
      success: true,
      message: 'डाटा Google Sheet में सफलतापूर्वक भेज दिया गया है! (Synchronized to Google Sheet)',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Google Sheet में सिंक करने में त्रुटि: ${err.message}`,
    };
  }
}

/**
 * The Complete, Production-Ready Google Apps Script Backend Code
 * for Google Sheets deployment.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `// ============================================================================
// Google Apps Script Backend for H.D. Pandey Public Junior High School Result Portal
// ============================================================================

function doGet(e) {
  var roll = e.parameter ? e.parameter.roll : null;
  var admission = e.parameter ? e.parameter.admission : null;
  var action = e.parameter ? e.parameter.action : null;

  // 1. Return School Settings
  if (action === "settings") {
    return ContentService.createTextOutput(JSON.stringify(getSchoolSettings()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Return All Students, Marks, Subjects & Settings for Full Portal Sync
  if (action === "allData") {
    var fullData = {
      students: getAllStudentsWithMarks(),
      subjects: getAllSubjects(),
      settings: getSchoolSettings(),
      gradeRules: getGradeSettings()
    };
    return ContentService.createTextOutput(JSON.stringify(fullData))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Search and Calculate Result by Roll or Admission No
  if (roll || admission) {
    var studentResult = calculateResult(roll, admission);
    return ContentService.createTextOutput(JSON.stringify(studentResult))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    app: "H.D. Pandey Public Junior High School Portal",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    if (data.action === "syncAll") {
      saveAllDataToSheets(data);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "All data successfully synchronized to Google Sheets"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ignored" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ----------------------------------------------------------------------------
// DATA READING FUNCTIONS
// ----------------------------------------------------------------------------

function getOrCreateSheet(name, defaultHeaders) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold").setBackground("#e2e8f0");
    }
  }
  return sheet;
}

function getSchoolSettings() {
  var sheet = getOrCreateSheet("School_Settings", ["Setting", "Value"]);
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    if (key) {
      settings[key] = val;
    }
  }
  return settings;
}

function getAllSubjects() {
  var sheet = getOrCreateSheet("Subjects", [
    "Subject_ID", "Subject_Name", "Display_Order", "Half_Max", "Annual_Max", "Passing_Marks", "Active"
  ]);
  var data = sheet.getDataRange().getValues();
  var subjects = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      subjects.push({
        id: String(data[i][0]),
        name: String(data[i][1]),
        displayOrder: Number(data[i][2]) || (i),
        halfMax: Number(data[i][3]) || 100,
        annualMax: Number(data[i][4]) || 100,
        passingMarks: Number(data[i][5]) || 33,
        active: data[i][6] === true || String(data[i][6]).toUpperCase() === "TRUE"
      });
    }
  }
  return subjects;
}

function getGradeSettings() {
  var sheet = getOrCreateSheet("Grade_Settings", ["Min_Percentage", "Max_Percentage", "Grade", "Description"]);
  var data = sheet.getDataRange().getValues();
  var rules = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][2]) {
      rules.push({
        minPercentage: Number(data[i][0]) || 0,
        maxPercentage: Number(data[i][1]) || 100,
        grade: String(data[i][2]),
        description: String(data[i][3] || "")
      });
    }
  }
  return rules;
}

function getAllStudentsWithMarks() {
  var studentsSheet = getOrCreateSheet("Students", [
    "Student_ID", "Student_Name", "Father_Name", "Mother_Name", "Date_of_Birth", "Gender",
    "Class", "Section", "Roll_No", "Admission_No", "Photo_URL", "Session", "Teacher_Remark"
  ]);
  var marksSheet = getOrCreateSheet("Marks", [
    "Student_ID", "Subject_ID", "Subject_Name", "Half_Max", "Half_Obtained", "Annual_Max", "Annual_Obtained"
  ]);

  var sData = studentsSheet.getDataRange().getValues();
  var mData = marksSheet.getDataRange().getValues();

  // Index marks by Student_ID -> Subject_ID
  var marksMap = {};
  for (var m = 1; m < mData.length; m++) {
    var sId = String(mData[m][0]);
    var subId = String(mData[m][1]);
    if (!marksMap[sId]) marksMap[sId] = {};
    marksMap[sId][subId] = {
      halfObtained: Number(mData[m][4]) || 0,
      annualObtained: Number(mData[m][6]) || 0
    };
  }

  var students = [];
  for (var i = 1; i < sData.length; i++) {
    var id = String(sData[i][0]);
    if (id) {
      students.push({
        id: id,
        name: String(sData[i][1] || ""),
        fatherName: String(sData[i][2] || ""),
        motherName: String(sData[i][3] || ""),
        dob: String(sData[i][4] || ""),
        gender: String(sData[i][5] || "MALE"),
        className: String(sData[i][6] || ""),
        section: String(sData[i][7] || "A"),
        rollNo: String(sData[i][8] || ""),
        admissionNo: String(sData[i][9] || ""),
        photoUrl: String(sData[i][10] || ""),
        session: String(sData[i][11] || "2025–2026"),
        teacherRemark: String(sData[i][12] || ""),
        marks: marksMap[id] || {}
      });
    }
  }
  return students;
}

function calculateResult(rollNo, admissionNo) {
  var students = getAllStudentsWithMarks();
  var matched = null;
  for (var i = 0; i < students.length; i++) {
    if (rollNo && String(students[i].rollNo).trim() == String(rollNo).trim()) {
      matched = students[i];
      break;
    }
    if (admissionNo && String(students[i].admissionNo).trim() == String(admissionNo).trim()) {
      matched = students[i];
      break;
    }
  }

  if (!matched) {
    return { status: "not_found", message: "Student record not found" };
  }

  return {
    status: "found",
    student: matched,
    subjects: getAllSubjects(),
    school: getSchoolSettings()
  };
}

// ----------------------------------------------------------------------------
// DATA WRITING FUNCTIONS (CALLED BY syncAll)
// ----------------------------------------------------------------------------

function saveAllDataToSheets(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Save Students
  if (payload.students && payload.students.length > 0) {
    var sSheet = getOrCreateSheet("Students", [
      "Student_ID", "Student_Name", "Father_Name", "Mother_Name", "Date_of_Birth", "Gender",
      "Class", "Section", "Roll_No", "Admission_No", "Photo_URL", "Session", "Teacher_Remark"
    ]);
    // Clear existing data rows
    var lastRow = sSheet.getLastRow();
    if (lastRow > 1) {
      sSheet.getRange(2, 1, lastRow - 1, sSheet.getLastColumn()).clearContent();
    }
    var sRows = [];
    for (var i = 0; i < payload.students.length; i++) {
      var s = payload.students[i];
      sRows.push([
        s.id, s.name, s.fatherName, s.motherName, s.dob, s.gender,
        s.className, s.section, s.rollNo, s.admissionNo, s.photoUrl || "", s.session || "", s.teacherRemark || ""
      ]);
    }
    if (sRows.length > 0) {
      sSheet.getRange(2, 1, sRows.length, sRows[0].length).setValues(sRows);
    }
  }

  // 2. Save Marks
  if (payload.students && payload.subjects) {
    var mSheet = getOrCreateSheet("Marks", [
      "Student_ID", "Subject_ID", "Subject_Name", "Half_Max", "Half_Obtained", "Annual_Max", "Annual_Obtained"
    ]);
    var mLastRow = mSheet.getLastRow();
    if (mLastRow > 1) {
      mSheet.getRange(2, 1, mLastRow - 1, mSheet.getLastColumn()).clearContent();
    }

    var mRows = [];
    for (var j = 0; j < payload.students.length; j++) {
      var st = payload.students[j];
      for (var k = 0; k < payload.subjects.length; k++) {
        var sub = payload.subjects[k];
        var marks = (st.marks && st.marks[sub.id]) ? st.marks[sub.id] : { halfObtained: 0, annualObtained: 0 };
        mRows.push([
          st.id, sub.id, sub.name, sub.halfMax, marks.halfObtained, sub.annualMax, marks.annualObtained
        ]);
      }
    }
    if (mRows.length > 0) {
      mSheet.getRange(2, 1, mRows.length, mRows[0].length).setValues(mRows);
    }
  }

  // 3. Save Subjects
  if (payload.subjects && payload.subjects.length > 0) {
    var subSheet = getOrCreateSheet("Subjects", [
      "Subject_ID", "Subject_Name", "Display_Order", "Half_Max", "Annual_Max", "Passing_Marks", "Active"
    ]);
    var subLastRow = subSheet.getLastRow();
    if (subLastRow > 1) {
      subSheet.getRange(2, 1, subLastRow - 1, subSheet.getLastColumn()).clearContent();
    }
    var subRows = [];
    for (var l = 0; l < payload.subjects.length; l++) {
      var sb = payload.subjects[l];
      subRows.push([
        sb.id, sb.name, sb.displayOrder, sb.halfMax, sb.annualMax, sb.passingMarks, sb.active ? "TRUE" : "FALSE"
      ]);
    }
    if (subRows.length > 0) {
      subSheet.getRange(2, 1, subRows.length, subRows[0].length).setValues(subRows);
    }
  }

  // 4. Save School Settings
  if (payload.schoolSettings) {
    var setSheet = getOrCreateSheet("School_Settings", ["Setting", "Value"]);
    var setLastRow = setSheet.getLastRow();
    if (setLastRow > 1) {
      setSheet.getRange(2, 1, setLastRow - 1, setSheet.getLastColumn()).clearContent();
    }
    var setRows = [];
    var keys = Object.keys(payload.schoolSettings);
    for (var mKey = 0; mKey < keys.length; mKey++) {
      var kName = keys[mKey];
      var kVal = payload.schoolSettings[kName];
      if (typeof kVal !== "undefined" && kVal !== null) {
        setRows.push([kName, String(kVal)]);
      }
    }
    if (setRows.length > 0) {
      setSheet.getRange(2, 1, setRows.length, 2).setValues(setRows);
    }
  }

  // 5. Save Grade Rules
  if (payload.gradeRules && payload.gradeRules.length > 0) {
    var gSheet = getOrCreateSheet("Grade_Settings", ["Min_Percentage", "Max_Percentage", "Grade", "Description"]);
    var gLastRow = gSheet.getLastRow();
    if (gLastRow > 1) {
      gSheet.getRange(2, 1, gLastRow - 1, gSheet.getLastColumn()).clearContent();
    }
    var gRows = [];
    for (var g = 0; g < payload.gradeRules.length; g++) {
      var gr = payload.gradeRules[g];
      gRows.push([gr.minPercentage, gr.maxPercentage, gr.grade, gr.description || ""]);
    }
    if (gRows.length > 0) {
      gSheet.getRange(2, 1, gRows.length, 4).setValues(gRows);
    }
  }
}
`;
