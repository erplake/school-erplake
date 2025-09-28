import React from 'react';
export default function Login() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 border rounded-xl p-6 bg-card shadow-sm">
        <h1 className="text-lg font-semibold text-center">Login</h1>
        <form className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Phone / Email</label>
            <input className="w-full border rounded px-2 py-1.5 text-sm" placeholder="Enter identifier" />
          </div>
          <button type="button" className="w-full bg-primary text-primary-foreground rounded py-2 text-sm font-medium">Send OTP</button>
        </form>
      </div>
    </div>
  );
}
