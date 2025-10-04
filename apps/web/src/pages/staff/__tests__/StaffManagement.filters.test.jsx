import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffManagement from '../StaffManagement.jsx';

// Stub recharts to avoid width/height warnings & act noise in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
}));

// Local mock state representing larger staff list to exercise pagination & filters
const mockState = {
  staff: Array.from({ length: 60 }).map((_, i) => ({
    id: i + 1,
    staff_code: `T${String(i+1).padStart(3,'0')}`,
    name: i % 5 === 0 ? `Leave Person ${i+1}` : `Teacher ${i+1}`,
    role: 'Teacher',
    department: i % 2 === 0 ? 'Mathematics' : 'Science',
    grade: `Grade ${ (i % 10) + 1}`,
    email: `t${i+1}@example.edu`,
    phone: `+9100${i+1}`,
    date_of_joining: '2022-01-01',
    status: 'Active',
    attendance_30: 80 + (i % 15),
    leaves_taken_ytd: 1,
    leave_balance: 10,
  })),
  leaves: [],
  failList: false,
};

// Provide some approved leave for first 3 matching 'Leave Person'
mockState.leaves = [1,6,11].map((id, idx) => ({
  id: idx + 1,
  staff_id: id,
  leave_type: 'Casual',
  date_from: new Date().toISOString().slice(0,10),
  date_to: new Date().toISOString().slice(0,10),
  days: 1,
  reason: 'Test',
  status: 'Approved',
}));

// IMPORTANT: mock the same module specifier used inside the component ('../../api')
// Mock api (path relative to THIS test file back to src/api.js is ../../../api)
vi.mock('../../../api', () => ({
  api: {
    listStaffLeave: async () => mockState.leaves,
    createStaff: async () => { throw new Error('not needed'); },
    updateStaff: async () => ({}),
    transitionStaffLeave: async () => ({})
  }
}));

beforeEach(() => {
  global.fetch = vi.fn(async (url) => {
    if (url.includes('/api/staff')) {
      if (mockState.failList) return { ok:false, status:500, headers:new Headers(), json: async () => ({}) };
      // Simulate server filtering for status & pagination (offset/limit)
      const u = new URL(url, 'http://localhost');
      const status = u.searchParams.get('status');
      const offset = Number(u.searchParams.get('offset')||0);
      const limit = Number(u.searchParams.get('limit')||mockState.staff.length);
      let rows = [...mockState.staff];
      if (status) rows = rows.filter(r => r.status === status);
      const paged = rows.slice(offset, offset + limit);
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Total-Count': String(rows.length) }),
        json: async () => paged,
      };
    }
    if (url.includes('/api/staff/leave')) {
      return { ok: true, status: 200, headers: new Headers(), json: async () => mockState.leaves };
    }
    return { ok: true, status: 200, headers: new Headers(), json: async () => ({}) };
  });
});

// Utility: flush pending microtasks (helps silence act warnings in async effects)
const flush = (t=0) => new Promise(r => setTimeout(r,t));

const renderPage = async () => {
  const utils = render(<StaffManagement />);
  await screen.findByTestId('staff-directory');
  await flush();
  return utils;
};

describe('StaffManagement filters & pagination', () => {
  it('search narrows results', async () => {
    await renderPage();
    const search = screen.getByPlaceholderText(/Search name/);
    fireEvent.change(search, { target: { value: 'Leave Person' }});
    await waitFor(() => {
      const rows = screen.getAllByTestId('staff-row');
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach(r => expect(r.textContent).toMatch(/Leave Person/));
    });
  });

  it('leave filter shows only on-leave today staff', async () => {
    await renderPage();
    // Wait specifically for at least one staff-row to ensure load complete
    await screen.findAllByTestId('staff-row');
    const leaveCheckbox = screen.getByLabelText(/On‑leave only/);
    fireEvent.click(leaveCheckbox);
    await flush();
    const rows = await screen.findAllByTestId('staff-row');
    // Expect at least 1 and at most 3 (pagination may limit) but all should be leave persons
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(r => expect(r.textContent).toMatch(/Leave Person/));
  });

  it('pagination controls update page indicator', async () => {
    await renderPage();
    // Change page size to 10
    const select = screen.getByDisplayValue(/25\/page/);
    fireEvent.change(select, { target: { value: '10' }});
    await waitFor(()=> expect(screen.getByText(/Page 1 · Showing/)).toBeInTheDocument());
    // Capture first page indicator text
    const firstIndicator = screen.getByText(/Page 1 · Showing/).textContent;
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(()=> expect(screen.getByText(/Page 2 · Showing/)).toBeInTheDocument());
    const secondIndicator = screen.getByText(/Page 2 · Showing/).textContent;
    expect(secondIndicator).not.toBe(firstIndicator);
  });

  it('status filter shows only resigned staff', async () => {
    await renderPage();
    // Mark first staff resigned before triggering status-filtered fetch
    mockState.staff[0].status = 'Resigned';
    // Enable include resigned so client-side filter does not exclude
    const includeResigned = screen.getByLabelText(/Include resigned/);
    fireEvent.click(includeResigned);
    // Find the specific status select (its parent container contains the mini label 'Status')
    const selects = Array.from(document.querySelectorAll('select'));
    const statusSelect = selects.find(sel => sel.parentElement && /Status/.test(sel.parentElement.textContent)) || selects[2];
    fireEvent.change(statusSelect, { target: { value: 'Resigned' }});
    await flush();
    const rows = await screen.findAllByTestId('staff-row');
    expect(rows.length).toBeGreaterThan(0);
    // All rows returned should show the Resigned badge
    rows.forEach(r => expect(r.textContent).toMatch(/Resigned/));
  });
});
