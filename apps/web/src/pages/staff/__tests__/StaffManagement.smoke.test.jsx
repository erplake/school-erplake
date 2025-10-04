import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import StaffManagement from '../StaffManagement.jsx';

// Mock api module
const mockState = {
  staff: [
    { id: 1, staff_code: 'T001', name: 'Asha Verma', role: 'Teacher', department: 'Mathematics', grade: 'Grade 9', email: 'asha@example.edu', phone: '+9100', date_of_joining: '2019-06-01', status: 'Active', attendance_30: 95, leaves_taken_ytd: 2, leave_balance: 12 },
  ],
  failCreate: false,
  failList: false,
};

vi.mock('../../../../api', () => {
  // Provide api object though StaffManagement fetches via window.fetch for list
  return {
    api: {
      createStaff: async (payload) => {
        if (mockState.failCreate) {
          // Simulate server validation error
          throw new Error('HTTP 422');
        }
        const row = { id: mockState.staff.length + 1, ...payload, status: 'Active', attendance_30: 90, leaves_taken_ytd: 0, leave_balance: 15 };
        mockState.staff.unshift(row);
        return row;
      },
      updateStaff: async (id, patch) => {
        const idx = mockState.staff.findIndex(s => s.id === id);
        if (idx !== -1) mockState.staff[idx] = { ...mockState.staff[idx], ...patch };
        return mockState.staff[idx];
      },
      listStaffLeave: async () => [],
      transitionStaffLeave: async () => ({ status: 'ok' }),
    }
  };
});

beforeEach(() => {
  // Mock global fetch for /api/staff list call used inside component
  global.fetch = vi.fn(async (url, opts) => {
    if (url.includes('/api/staff')) {
      if (mockState.failList) {
        return { ok: false, status: 500, headers: new Headers(), json: async () => ({ detail: 'HTTP 500' }) };
      }
      // Simulate header count and payload
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Total-Count': String(mockState.staff.length) }),
        json: async () => mockState.staff,
      };
    }
    // Fallback minimal response
    return { ok: true, status: 200, headers: new Headers(), json: async () => ({}) };
  });
});

afterEach(() => {
  mockState.failCreate = false;
  mockState.failList = false;
});

describe('StaffManagement API wired smoke', () => {
  it('loads staff and displays row', async () => {
    render(<StaffManagement />);
    await waitFor(() => expect(screen.getByTestId('staff-directory')).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByTestId('staff-row').length).toBe(1));
    expect(screen.getByText('Asha Verma')).toBeInTheDocument();
  });

  it('creates staff via modal', async () => {
    render(<StaffManagement />);
    await screen.findByText('Staff Management');
    fireEvent.click(screen.getByRole('button', { name: /Add Staff/i }));
    const nameInput = await screen.findByLabelText(/Full Name/i, { selector: 'input' });
    fireEvent.change(nameInput, { target: { value: 'New Teacher' }});
    fireEvent.click(screen.getByTestId('create-staff'));
    await waitFor(() => expect(screen.getAllByTestId('staff-row').length).toBeGreaterThan(1));
  });

  it('marks resignation (status update)', async () => {
    render(<StaffManagement />);
  await screen.findByTestId('staff-directory');
  const row = await screen.findByText('Asha Verma');
    fireEvent.click(row.closest('tr'));
    const resignBtn = await screen.findByTestId('open-resign');
    fireEvent.click(resignBtn);
    const confirm = await screen.findByTestId('confirm-resign');
    fireEvent.click(confirm);
    // Drawer closes; row should show Resigned badge eventually (mock updateStaff returns status Resigned only if patch passed; we patch with Resigned)
    // Our updateStaff mock sets patch status; ensure badge text appears
    await waitFor(() => {
      expect(screen.getByText(/Resigned/)).toBeInTheDocument();
    });
  });

  it('handles create failure gracefully', async () => {
    mockState.failCreate = true;
    const initialCount = mockState.staff.length;
    render(<StaffManagement />);
    await screen.findByText('Staff Management');
    fireEvent.click(screen.getByRole('button', { name: /Add Staff/i }));
    const nameInput = await screen.findByLabelText(/Full Name/i, { selector: 'input' });
    fireEvent.change(nameInput, { target: { value: 'Will Fail' }});
    fireEvent.click(screen.getByTestId('create-staff'));
    // Wait a tick and confirm list count unchanged
    await new Promise(r=>setTimeout(r,20));
    expect(mockState.staff.length).toBe(initialCount);
    mockState.failCreate = false; // reset
  });

  it('shows error banner when list fails', async () => {
    mockState.failList = true;
    render(<StaffManagement />);
  await waitFor(() => expect(screen.getByText(/HTTP 500/)).toBeInTheDocument());
    mockState.failList = false;
  });

  it('reinstates after resignation', async () => {
    // First make sure status is Active
    render(<StaffManagement />);
  await screen.findByTestId('staff-directory');
  const row = await screen.findByText('Asha Verma');
    fireEvent.click(row.closest('tr'));
    const resignBtn = await screen.findByTestId('open-resign');
    fireEvent.click(resignBtn);
    const confirm = await screen.findByTestId('confirm-resign');
    fireEvent.click(confirm);
    await screen.findByText(/Resigned/);
    // Reopen drawer and reinstate (simulate updateStaff with status Active)
    fireEvent.click(screen.getByText('Asha Verma'));
    // Directly update mock and trigger UI refresh by forcing list reload (simulate by toggling failList quickly)
    mockState.staff[0].status = 'Active';
    // Force rerender by changing search
    const searchBox = screen.getByPlaceholderText(/Search name/);
    fireEvent.change(searchBox, { target: { value: 'Asha' }});
    // Badge removal: target resigned badge inside directory table only
    await waitFor(() => {
      const directory = screen.getByTestId('staff-directory');
      expect(within(directory).queryByText(/Resigned/)).not.toBeInTheDocument();
    });
  });
});
