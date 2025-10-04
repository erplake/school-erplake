import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffManagement from '../StaffManagement.jsx';
import { RBACProvider } from '../../../context/RBACContext.jsx';
import { ToastProvider } from '../../../components/ToastProvider.jsx';

vi.mock('../../../api', () => ({
  api: {
    staffMeta: () => Promise.resolve({ roles: [], departments: [] }),
    listStaffLeave: () => Promise.resolve([]),
    listStaffSettings: () => Promise.resolve({}),
  }
}));

function Providers({ children }) {
  return <RBACProvider><ToastProvider>{children}</ToastProvider></RBACProvider>;
}

describe('Notify Staff modal', () => {
  beforeEach(() => {
    localStorage.setItem('rbac.capabilities', JSON.stringify(['staff:notify','staff:list']));
    localStorage.removeItem('staff.notify.last');
  });
  it('opens notify modal and validates required fields', async () => {
    render(<Providers><StaffManagement /></Providers>);
    // Wait for page header
    await screen.findByText(/Staff Management/);
    // Open quick action
    const notifyBtn = await screen.findByRole('button', { name: /Notify Staff/i });
    fireEvent.click(notifyBtn);
    // Modal should appear
    await screen.findByText(/Send an announcement/i);
    const sendButton = screen.getByRole('button', { name: /^Send$/i });
    fireEvent.click(sendButton);
    // Expect a validation toast
    await screen.findByText(/Subject & message required/i);
    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/Staff Meeting/i), { target: { value: 'Meeting' } });
    fireEvent.change(screen.getByPlaceholderText(/Details of the announcement/i), { target: { value: 'Please assemble at 4 PM' } });
    fireEvent.click(sendButton);
    await waitFor(() => expect(screen.getByText(/Sending…/i)).toBeInTheDocument());
  });
});
