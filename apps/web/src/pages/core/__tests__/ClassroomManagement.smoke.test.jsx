import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassroomManagement from '../ClassroomManagement.jsx';

// Mock API with in-memory state for tasks & notes to better reflect persistence
vi.mock('../../../api', () => {
  const wings = [ { id: 1, academic_year: '2025-26', name: 'Primary', grade_start: '1', grade_end: '5' } ];
  const staff = [ { id: 10, name: 'Alice Teacher' } ];
  const heads = [ { id: 1, name: 'HM One' } ];
  const classes = [ { id: 11, wing_id: 1, grade: '3', section: 'A', teacher_staff_id: 10, teacher_name: null, total_students: 28, male: 14, female: 14 } ];
  const key = (g, s) => `${g}-${s}`;
  const tasksStore = new Map();
  const notesStore = new Map();
  return { api: {
    listWings: async () => wings,
    listSchoolClasses: async () => classes,
    listStaff: async () => staff,
    listHeadMistresses: async () => heads,
    listStudents: async () => [],
    bulkClassSettings: async () => ({ status: 'ok'}),
    createWing: async (payload) => ({ id: 2, ...payload }),
    updateWing: async () => ({ status: 'ok'}),
    deleteWing: async () => ({ status: 'ok'}),
    createSchoolClass: async (payload) => ({ id: 99, ...payload }),
    updateSchoolClass: async () => ({ status: 'ok'}),
    deleteSchoolClass: async () => ({ status: 'ok'}),
    assignStudentsToClass: async () => ({ status: 'ok'}),
    listClassTasks: async (grade, section) => tasksStore.get(key(grade, section)) || [],
    listClassNotes: async (grade, section) => notesStore.get(key(grade, section)) || [],
  createClassTask: async ({ grade, section, text }) => { await new Promise(r=> setTimeout(r,5)); const arr = tasksStore.get(key(grade, section)) || []; const task = { id: arr.length + 1, text: text || 'Task Demo', status: 'Open'}; tasksStore.set(key(grade, section), [task, ...arr]); return task; },
    updateClassTask: async (taskId, patch) => { for (const [k, arr] of tasksStore.entries()) { const i = arr.findIndex(t=>t.id===taskId); if(i!==-1){ arr[i] = { ...arr[i], ...patch }; tasksStore.set(k, arr); return arr[i]; } } return { id: taskId, text: patch.text||'Task Demo', status: patch.status||'Open'}; },
    deleteClassTask: async (taskId) => { for (const [k, arr] of tasksStore.entries()) { tasksStore.set(k, arr.filter(t=> t.id!==taskId)); } return { status:'ok'}; },
  createClassNote: async ({ grade, section, text }) => { await new Promise(r=> setTimeout(r,5)); const arr = notesStore.get(key(grade, section)) || []; const note = { id: arr.length + 1, text: text || 'Note Demo'}; notesStore.set(key(grade, section), [note, ...arr]); return note; },
    updateClassNote: async (noteId, { text }) => { for (const [k, arr] of notesStore.entries()) { const i = arr.findIndex(n=> n.id===noteId); if(i!==-1){ arr[i] = { ...arr[i], text }; notesStore.set(k, arr); return arr[i]; } } return { id: noteId, text }; },
    deleteClassNote: async (noteId) => { for (const [k, arr] of notesStore.entries()) { notesStore.set(k, arr.filter(n=> n.id!==noteId)); } return { status:'ok'}; }
  }};
});

// Basic smoke coverage

describe('ClassroomManagement smoke', () => {

  it('renders dashboard stats and class row', async () => {
    render(<ClassroomManagement />);
    expect(screen.getByText(/Classroom Management/i)).toBeInTheDocument();
    // Wait for loading state to resolve and row to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    }, { timeout: 10000 });
    // 'Primary' appears both in select option and table cell; ensure at least one occurrence
    expect(screen.getAllByText('Primary').length).toBeGreaterThan(0);
    // Student count '28' appears in summary tile and possibly other contexts
    expect(screen.getAllByText(/28/).length).toBeGreaterThan(0);
  }, 15000);

  it('opens settings and wing modal form', async () => {
    render(<ClassroomManagement />);
    const settingsTab = screen.getAllByRole('button', { name: 'Settings'})[0];
    fireEvent.click(settingsTab);
    // Wing section header
    await waitFor(() => expect(screen.getByText('Wings')).toBeInTheDocument(), { timeout: 10000 });
    fireEvent.click(screen.getByRole('button', { name: '+ Wing'}));
    // Modal title should read 'Add Wing'
    expect(await screen.findByText('Add Wing', {}, { timeout: 5000 })).toBeInTheDocument();
  }, 15000);

  it('switches academic year and reloads data', async () => {
    render(<ClassroomManagement />);
    await screen.findByRole('button', { name: '3' }); // initial class grade button
    // Academic year picker is the rounded-full select with value 2025-26
    const select = screen.getByDisplayValue('2025-26');
    // Change to prior year (mock still returns same data; we just assert loading indicator flicker and data persists)
    fireEvent.change(select, { target: { value: '2024-25' }});
    // Expect loading indicator to appear briefly
    await waitFor(() => expect(screen.getByText(/Loading…/)).toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument(), { timeout: 10000 });
  }, 15000);

  it('opens class drawer showing Notes and To-Dos sections', async () => {
    render(<ClassroomManagement />);
    const gradeBtn = await screen.findByRole('button', { name: '3' });
    fireEvent.click(gradeBtn);
    // Drawer title
    await screen.findByText('Classroom Details');
    // Sections inside drawer
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('To‑Dos')).toBeInTheDocument();
  }, 15000);

  it('adds and updates a note in class drawer', async () => {
    render(<ClassroomManagement />);
    fireEvent.click(await screen.findByRole('button', { name: '3' }));
    await screen.findByText('Classroom Details');
    const notesList = await screen.findByTestId('notes-list');
    const initialNotes = within(notesList).queryAllByTestId('note-item').length;
  const noteInput = await screen.findByTestId('add-note-input');
  await userEvent.type(noteInput, 'First note{enter}');
    // Wait for a new note-item to appear by using findAll which waits for at least one result
    let textarea;
    try {
      textarea = await screen.findByDisplayValue(/First note|Note Demo/);
    } catch {
      // fallback: check any note-item appeared
      await waitFor(()=> {
        const items = within(notesList).queryAllByTestId('note-item');
        expect(items.length).toBeGreaterThan(initialNotes);
      });
      textarea = within(notesList).getAllByTestId('note-text')[0];
    }
    // Update text
    fireEvent.change(textarea, { target: { value: 'Updated Note Text' }});
    fireEvent.blur(textarea);
    // Assert an element (possibly re-rendered) has the updated value
    await waitFor(() => {
      const textareas = screen.getAllByTestId('note-text');
      expect(textareas.some(t => t.value === 'Updated Note Text')).toBe(true);
    });
  }, 15000);

  it('adds a task and marks it done', async () => {
    render(<ClassroomManagement />);
    fireEvent.click(await screen.findByRole('button', { name: '3' }));
    await screen.findByText('Classroom Details');
    const tasksList = await screen.findByTestId('tasks-list');
    const initialTasks = within(tasksList).queryAllByTestId('task-item').length;
  const taskTextInput = await screen.findByTestId('add-task-input');
  await userEvent.type(taskTextInput, 'Follow-up task{enter}');
    let taskTextField;
    try {
      taskTextField = await screen.findByDisplayValue(/Follow-up task|Task Demo/);
    } catch {
      await waitFor(()=> {
        const items = within(tasksList).queryAllByTestId('task-item');
        expect(items.length).toBeGreaterThan(initialTasks);
      });
      taskTextField = within(tasksList).getAllByRole('textbox').find(el => el.value === 'Follow-up task' || el.value === 'Task Demo') || within(tasksList).getAllByRole('textbox')[0];
    }
    const checkbox = taskTextField.parentElement.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox);
    expect(await screen.findByText(/Done/)).toBeInTheDocument();
  }, 15000);
});
