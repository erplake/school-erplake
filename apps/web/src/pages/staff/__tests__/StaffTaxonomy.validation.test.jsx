import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StaffManagement from '../StaffManagement.jsx';
import { RBACProvider } from '../../../context/RBACContext.jsx';
import { ToastProvider } from '../../../components/ToastProvider.jsx';

// Minimal mock for api
vi.mock('../../../api', () => ({
  api: {
    staffMeta: () => Promise.resolve({ roles: [{id:1,name:'Teacher',protected:true,active:true}], departments: [{id:1,name:'Mathematics',protected:true,active:true}] }),
    listStaffLeave: () => Promise.resolve([]),
    listStaffSettings: () => Promise.resolve({ leave_policy:{ carryover_limit_days:10, monthly_accrual_days:1, max_negative_balance:0 }, staff_code_rules:{ pattern:'{DEPT}-{SEQ:4}', sequence_start:1, zero_pad_width:4 } }),
    createStaffRole: () => Promise.reject(new Error('role name already exists'))
  }
}));

function Providers({ children }) {
  return (<RBACProvider><ToastProvider>{children}</ToastProvider></RBACProvider>);
}

describe('Staff taxonomy validation', () => {
  beforeEach(() => {
    localStorage.setItem('rbac.capabilities', JSON.stringify(['staff:taxonomy','staff:list','staff:create']));
  });
  it('shows validation error for empty role name', async () => {
    render(<Providers><StaffManagement /></Providers>);
    // Open settings tab to ensure meta loaded
    await screen.findByText(/Staff Management/i);
    // Open create role modal
  const settingsTab = screen.getByRole('button', { name: /Settings/i });
  fireEvent.click(settingsTab);
    const newRoleBtn = await screen.findByRole('button', { name: /New Role/i });
    fireEvent.click(newRoleBtn);
    const createBtn = await screen.findByRole('button', { name: /^Create$/i });
    fireEvent.click(createBtn);
    expect(await screen.findByText(/Name required/i)).toBeInTheDocument();
  });
});
