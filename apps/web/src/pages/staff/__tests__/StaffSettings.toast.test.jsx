import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffManagement from '../StaffManagement.jsx';
import { RBACProvider } from '../../../context/RBACContext.jsx';
import { ToastProvider } from '../../../components/ToastProvider.jsx';

const updateSpy = vi.fn().mockResolvedValue({ ok: true });

vi.mock('../../../api', () => ({
  api: {
    staffMeta: () => Promise.resolve({ roles: [], departments: [] }),
    listStaffLeave: () => Promise.resolve([]),
    listStaffSettings: () => Promise.resolve({ leave_policy:{ carryover_limit_days:10, monthly_accrual_days:1, max_negative_balance:0 }, staff_code_rules:{ pattern:'{DEPT}-{SEQ:4}', sequence_start:1, zero_pad_width:4 } }),
    updateStaffSetting: (...args) => updateSpy(...args),
  }
}));

function Providers({ children }) {
  return (<RBACProvider><ToastProvider>{children}</ToastProvider></RBACProvider>);
}

describe('Staff settings toast', () => {
  beforeEach(() => {
    localStorage.setItem('rbac.capabilities', JSON.stringify(['staff:taxonomy','staff:list','staff:create']));
    updateSpy.mockClear();
  });
  it('shows success toast after saving leave policy', async () => {
    render(<Providers><StaffManagement /></Providers>);
    // Wait for page
    await screen.findByText(/Staff Management/i);
    const settingsTab = screen.getByRole('button', { name: /Settings/i });
    fireEvent.click(settingsTab);
    const saveBtn = await screen.findByRole('button', { name: /Save Leave Policy/i });
    fireEvent.click(saveBtn);
    await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    // Expect a toast - look for success / updated message (implementation detail may vary)
    const toast = await screen.findByText(/saved/i, {}, { timeout: 1500 });
    expect(toast).toBeInTheDocument();
  });
});
