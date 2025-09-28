import React from 'react';
export default function NotificationsCenter() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <ul className="space-y-2 text-sm">
        {[1,2,3,4].map(i => (
          <li key={i} className="rounded border p-3 flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-primary mt-1" />
            <div>
              <p className="font-medium">Notification {i}</p>
              <p className="text-xs text-muted-foreground">Message body placeholder text.</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
