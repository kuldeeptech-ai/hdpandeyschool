import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_SCHOOL_SETTINGS,
  DEFAULT_SUBJECTS,
  DEFAULT_STUDENTS,
} from './src/data/defaultData';
import {
  DEFAULT_GRADE_RULES,
  calculateStudentResult,
} from './src/utils/calculations';

const DATA_FILE = path.join(process.cwd(), 'data-store.json');

// In-memory data store
let store = {
  schoolSettings: { ...DEFAULT_SCHOOL_SETTINGS },
  subjects: [...DEFAULT_SUBJECTS],
  students: [...DEFAULT_STUDENTS],
  gradeRules: [...DEFAULT_GRADE_RULES],
};

// Try loading persisted data
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.schoolSettings) store.schoolSettings = parsed.schoolSettings;
    if (parsed.subjects) store.subjects = parsed.subjects;
    if (parsed.students) store.students = parsed.students;
    if (parsed.gradeRules) store.gradeRules = parsed.gradeRules;
  }
} catch (e) {
  console.warn('Failed to load data-store.json, using defaults', e);
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data-store.json', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Public School Settings
  app.get('/api/settings', (req, res) => {
    res.json(store.schoolSettings);
  });

  // Public Result Search
  // Searches by Roll No or Admission No or ID
  // Prompt Section 31: "Backend must return only the matching student's data. Never send all students' records to the browser."
  app.get('/api/result', (req, res) => {
    const roll = (req.query.roll as string)?.trim().toLowerCase();
    const admission = (req.query.admission as string)?.trim().toLowerCase();
    const studentId = (req.query.id as string)?.trim().toLowerCase();

    if (!roll && !admission && !studentId) {
      return res.status(400).json({ error: 'Please enter Roll Number or Admission Number.' });
    }

    const matched = store.students.find((s) => {
      if (roll && s.rollNo.trim().toLowerCase() === roll) return true;
      if (admission && s.admissionNo.trim().toLowerCase() === admission) return true;
      if (studentId && s.id.trim().toLowerCase() === studentId) return true;
      return false;
    });

    if (!matched) {
      return res.status(404).json({
        error: 'RESULT NOT FOUND',
        message: 'Please check your Roll Number / Admission Number or contact school administration.',
      });
    }

    const result = calculateStudentResult(
      matched,
      store.subjects,
      store.schoolSettings,
      store.gradeRules
    );

    res.json(result);
  });

  // Admin APIs
  app.get('/api/admin/data', (req, res) => {
    res.json(store);
  });

  app.post('/api/admin/student', (req, res) => {
    const studentData = req.body;
    if (!studentData.name || !studentData.rollNo) {
      return res.status(400).json({ error: 'Student Name and Roll Number are required.' });
    }

    const existingIndex = store.students.findIndex((s) => s.id === studentData.id);
    if (existingIndex >= 0) {
      store.students[existingIndex] = { ...store.students[existingIndex], ...studentData };
    } else {
      const newId = studentData.id || `std-${Date.now()}`;
      store.students.push({ ...studentData, id: newId });
    }
    saveStore();
    res.json({ success: true, students: store.students });
  });

  app.delete('/api/admin/student/:id', (req, res) => {
    const { id } = req.params;
    store.students = store.students.filter((s) => s.id !== id);
    saveStore();
    res.json({ success: true, students: store.students });
  });

  app.post('/api/admin/marks', (req, res) => {
    const { studentId, marks, teacherRemark } = req.body;
    const student = store.students.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }
    if (marks) student.marks = marks;
    if (teacherRemark !== undefined) student.teacherRemark = teacherRemark;
    saveStore();
    res.json({ success: true, student });
  });

  app.post('/api/admin/subjects', (req, res) => {
    const { subjects } = req.body;
    if (Array.isArray(subjects)) {
      store.subjects = subjects;
      saveStore();
      res.json({ success: true, subjects: store.subjects });
    } else {
      res.status(400).json({ error: 'Invalid subjects array' });
    }
  });

  app.post('/api/admin/settings', (req, res) => {
    const newSettings = req.body;
    store.schoolSettings = { ...store.schoolSettings, ...newSettings };
    saveStore();
    res.json({ success: true, schoolSettings: store.schoolSettings });
  });

  app.post('/api/admin/grades', (req, res) => {
    const { gradeRules } = req.body;
    if (Array.isArray(gradeRules)) {
      store.gradeRules = gradeRules;
      saveStore();
      res.json({ success: true, gradeRules: store.gradeRules });
    } else {
      res.status(400).json({ error: 'Invalid gradeRules array' });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Result Portal server running on http://localhost:${PORT}`);
  });
}

startServer();
