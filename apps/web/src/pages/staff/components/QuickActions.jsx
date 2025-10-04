import React from 'react';
import { QA, Card } from './primitives';
import { UserCog, CalendarDays, Megaphone, Download } from 'lucide-react';

export function QuickActions({ onAssignDuty, onPlanSubs, onNotify, onExport }) {
  return (
    <Card title="Quick Actions" subtitle="Do more in one click">
      <div className="grid grid-cols-2 gap-2">
        <QA icon={<UserCog size={16}/>} label="Assign Duty" onClick={onAssignDuty} />
        <QA icon={<CalendarDays size={16}/>} label="Plan Substitutions" onClick={onPlanSubs} />
        <QA icon={<Megaphone size={16}/>} label="Notify Staff" onClick={onNotify} />
        <QA icon={<Download size={16}/>} label="Export CSV" onClick={onExport} />
      </div>
    </Card>
  );
}
