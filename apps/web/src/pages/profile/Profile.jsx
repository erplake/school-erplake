import React from 'react';
export default function Profile() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">User Profile</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-lg border p-4 space-y-2">
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div>
            <div className="font-medium">Jane Doe</div>
            <div className="text-xs text-muted-foreground">Administrator</div>
          </div>
          <button className="text-xs text-primary hover:underline">Edit Profile</button>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-medium mb-2">Contact Info</h2>
            <div className="text-xs text-muted-foreground">Placeholder for contact details.</div>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-medium mb-2">Preferences</h2>
            <div className="text-xs text-muted-foreground">Theme, language, notification settings...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
